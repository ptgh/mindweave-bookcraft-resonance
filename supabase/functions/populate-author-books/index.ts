import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAdminOrInternal, corsHeaders, json } from "../_shared/adminAuth.ts";

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const RATE_LIMIT_DELAY = 500; // ms between Google Books requests

interface AuthorRecord {
  id: string;
  name: string;
}

interface BookInsert {
  author_id: string;
  title: string;
  description: string | null;
  published_date: string | null;
  page_count: number | null;
  categories: string[] | null;
  cover_url: string | null;
  google_books_id: string;
  rating: number | null;
  ratings_count: number | null;
  preview_link: string | null;
  info_link: string | null;
  subtitle: string | null;
}

// Words that indicate non-SF content
const EXCLUDE_KEYWORDS = [
  'tarot', 'angel', 'prayer', 'cookbook', 'coloring book', 'activity book',
  'self-help', 'diet', 'yoga', 'meditation', 'bible', 'devotional',
  'workbook', 'textbook', 'study guide', 'exam prep', 'manga',
];

function isSFRelevant(title: string, categories: string[]): boolean {
  const lowerTitle = title.toLowerCase();
  if (EXCLUDE_KEYWORDS.some(kw => lowerTitle.includes(kw))) return false;
  
  const allCats = categories.join(' ').toLowerCase();
  // Accept if categories mention fiction/sf/fantasy, or if no categories (give benefit of doubt)
  if (categories.length === 0) return true;
  if (allCats.includes('fiction') || allCats.includes('science') || allCats.includes('fantasy') || allCats.includes('literary')) return true;
  
  return false;
}

async function fetchBooksForAuthor(
  authorName: string,
  apiKey: string,
  maxResults: number
): Promise<any[]> {
  const query = `inauthor:"${authorName}" subject:fiction`;
  const params = new URLSearchParams({
    q: query,
    maxResults: String(Math.min(maxResults, 40)),
    printType: 'books',
    langRestrict: 'en',
    orderBy: 'relevance',
    key: apiKey,
  });

  const resp = await fetch(`${GOOGLE_BOOKS_API}?${params}`);
  if (!resp.ok) {
    console.warn(`Google Books API error for "${authorName}": ${resp.status}`);
    return [];
  }

  const data = await resp.json();
  return data.items || [];
}

function getBestCover(imageLinks: any): string | null {
  if (!imageLinks) return null;
  const url = imageLinks.large || imageLinks.medium || imageLinks.small || imageLinks.thumbnail || imageLinks.smallThumbnail;
  return url ? url.replace('http://', 'https://') : null;
}

function getISBN(identifiers: any[]): string | null {
  if (!identifiers) return null;
  const isbn13 = identifiers.find((i: any) => i.type === 'ISBN_13');
  const isbn10 = identifiers.find((i: any) => i.type === 'ISBN_10');
  return isbn13?.identifier || isbn10?.identifier || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireAdminOrInternal(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const {
      authorNames = [] as string[],
      booksPerAuthor = 8,
      fillEmpty = false,
    } = body;

    const apiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY');
    if (!apiKey) {
      return json(500, { error: 'GOOGLE_BOOKS_API_KEY not configured' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Determine which authors to process
    let authorsToProcess: AuthorRecord[] = [];

    if (fillEmpty) {
      // Find authors with 0 books in author_books
      const { data: allAuthors } = await supabase
        .from('scifi_authors')
        .select('id, name')
        .order('name');

      if (allAuthors) {
        const { data: authorBookCounts } = await supabase
          .from('author_books')
          .select('author_id');

        const authorIdsWithBooks = new Set(
          (authorBookCounts || []).map((ab: any) => ab.author_id)
        );

        authorsToProcess = allAuthors.filter(
          (a: AuthorRecord) => !authorIdsWithBooks.has(a.id)
        );
      }
    } else if (authorNames.length > 0) {
      for (const name of authorNames) {
        const { data } = await supabase
          .from('scifi_authors')
          .select('id, name')
          .ilike('name', name)
          .limit(1);
        if (data && data.length > 0) {
          authorsToProcess.push(data[0]);
        }
      }
    }

    console.log(`[populate-author-books] Processing ${authorsToProcess.length} authors (${booksPerAuthor} books each)`);

    let totalBooksAdded = 0;
    let authorsProcessed = 0;
    let authorsSkipped = 0;

    for (const author of authorsToProcess) {
      try {
        // Check if author already has books
        const { count } = await supabase
          .from('author_books')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', author.id);

        if (count && count > 0) {
          authorsSkipped++;
          continue;
        }

        // Fetch from Google Books
        const items = await fetchBooksForAuthor(author.name, apiKey, booksPerAuthor + 5);
        
        if (items.length === 0) {
          console.log(`[populate-author-books] No results for "${author.name}"`);
          authorsSkipped++;
          continue;
        }

        // Filter and deduplicate
        const seenTitles = new Set<string>();
        const booksToInsert: BookInsert[] = [];

        for (const item of items) {
          if (booksToInsert.length >= booksPerAuthor) break;

          const vol = item.volumeInfo;
          if (!vol?.title) continue;

          const normalizedTitle = vol.title.toLowerCase().trim();
          if (seenTitles.has(normalizedTitle)) continue;

          const categories = vol.categories || [];
          if (!isSFRelevant(vol.title, categories)) continue;

          seenTitles.add(normalizedTitle);
          booksToInsert.push({
            author_id: author.id,
            title: vol.title,
            subtitle: vol.subtitle || null,
            description: vol.description?.substring(0, 2000) || null,
            published_date: vol.publishedDate || null,
            page_count: vol.pageCount || null,
            categories,
            cover_url: getBestCover(vol.imageLinks),
            google_books_id: item.id,
            rating: vol.averageRating || null,
            ratings_count: vol.ratingsCount || null,
            preview_link: vol.previewLink || null,
            info_link: vol.infoLink || null,
          });
        }

        if (booksToInsert.length > 0) {
          // Check for existing google_books_ids to prevent duplicates
          const googleIds = booksToInsert.map(b => b.google_books_id);
          const { data: existing } = await supabase
            .from('author_books')
            .select('google_books_id')
            .in('google_books_id', googleIds);

          const existingIds = new Set((existing || []).map((e: any) => e.google_books_id));
          const newBooks = booksToInsert.filter(b => !existingIds.has(b.google_books_id));

          if (newBooks.length > 0) {
            const { error } = await supabase
              .from('author_books')
              .insert(newBooks);

            if (error) {
              console.error(`[populate-author-books] Insert error for "${author.name}":`, error.message);
            } else {
              totalBooksAdded += newBooks.length;
              console.log(`[populate-author-books] Added ${newBooks.length} books for "${author.name}"`);
            }
          }
        }

        authorsProcessed++;

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));

      } catch (err) {
        console.error(`[populate-author-books] Error for "${author.name}":`, err);
      }
    }

    console.log(`[populate-author-books] Done: ${authorsProcessed} processed, ${totalBooksAdded} books added, ${authorsSkipped} skipped`);

    return json(200, {
      success: true,
      processed: authorsProcessed,
      booksAdded: totalBooksAdded,
      skipped: authorsSkipped,
      totalAuthors: authorsToProcess.length,
    });

  } catch (error) {
    console.error('[populate-author-books] Error:', error);
    return json(500, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
