import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { requireAdminOrInternal, corsHeaders } from "../_shared/adminAuth.ts";

interface GoogleBooksItem {
  volumeInfo: {
    title?: string;
    authors?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
      medium?: string;
      large?: string;
    };
  };
}

interface OpenLibraryDoc {
  title?: string;
  author_name?: string[];
  cover_i?: number;
  isbn?: string[];
}

// Calculate string similarity (Dice coefficient)
function calculateSimilarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const str2 = s2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (str1 === str2) return 100;
  if (str1.length < 2 || str2.length < 2) return 0;
  
  const bigrams1 = new Set<string>();
  for (let i = 0; i < str1.length - 1; i++) bigrams1.add(str1.slice(i, i + 2));
  
  let matches = 0;
  for (let i = 0; i < str2.length - 1; i++) {
    if (bigrams1.has(str2.slice(i, i + 2))) matches++;
  }
  
  return (2 * matches * 100) / (str1.length + str2.length - 2);
}

function getLastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1]?.toLowerCase() || '';
}

// Search Google Books with strict validation (80% title similarity + author last name)
async function searchGoogleBooks(title: string, author: string): Promise<string | null> {
  try {
    const GOOGLE_BOOKS_API_KEY = Deno.env.get('GOOGLE_BOOKS_API_KEY');
    const apiKeyParam = GOOGLE_BOOKS_API_KEY ? `&key=${GOOGLE_BOOKS_API_KEY}` : '';
    
    const query = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`;
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=5${apiKeyParam}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const items = data.items as GoogleBooksItem[];
    
    if (!items || items.length === 0) return null;
    
    const authorLastName = getLastName(author);
    
    for (const item of items) {
      const bookTitle = item.volumeInfo?.title || '';
      const bookAuthors = item.volumeInfo?.authors || [];
      
      // Strict title matching (80% similarity)
      const titleSimilarity = calculateSimilarity(title, bookTitle);
      if (titleSimilarity < 80) continue;
      
      // Author last name must match
      const authorMatch = bookAuthors.some(a => getLastName(a) === authorLastName);
      if (!authorMatch) continue;
      
      const imageLinks = item.volumeInfo?.imageLinks;
      // Prefer larger images, keep zoom=1 for reliability
      let coverUrl = imageLinks?.large || imageLinks?.medium || imageLinks?.thumbnail || imageLinks?.smallThumbnail;
      if (coverUrl) {
        coverUrl = coverUrl.replace('http:', 'https:');
        // Ensure zoom=1 for content endpoint
        if (coverUrl.includes('books/content') && !coverUrl.includes('zoom=')) {
          coverUrl += '&zoom=1';
        }
        return coverUrl;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Google Books search error:', error);
    return null;
  }
}

// Search Open Library with strict validation (80% title similarity + author last name)
async function searchOpenLibrary(title: string, author: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${query}&limit=5&fields=title,author_name,cover_i`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const docs = data.docs as OpenLibraryDoc[];
    
    if (!docs || docs.length === 0) return null;
    
    const authorLastName = getLastName(author);
    
    for (const doc of docs) {
      const docTitle = doc.title || '';
      const bookAuthors = doc.author_name || [];
      
      // Strict title matching (80% similarity)
      const titleSimilarity = calculateSimilarity(title, docTitle);
      if (titleSimilarity < 80) continue;
      
      // Author last name must match
      const authorMatch = bookAuthors.some(a => getLastName(a) === authorLastName);
      if (!authorMatch) continue;
      
      if (doc.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Open Library search error:', error);
    return null;
  }
}

// Validate that a cover URL actually returns an image
async function validateCoverUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    return response.ok && contentType.includes('image');
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin authorization check
  const auth = await requireAdminOrInternal(req);
  if (auth instanceof Response) return auth;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting film book cover enrichment...');

    // Get film adaptations without book covers (limit per run to avoid timeouts)
    const { data: filmsWithoutCovers, error: fetchError } = await supabase
      .from('sf_film_adaptations')
      .select('id, book_title, book_author, book_isbn, book_cover_url')
      .or('book_cover_url.is.null,book_cover_url.eq.')
      .not('adaptation_type', 'eq', 'original') // Skip original screenplays
      .limit(25);

    if (fetchError) {
      console.error('Error fetching films:', fetchError);
      throw fetchError;
    }

    if (!filmsWithoutCovers || filmsWithoutCovers.length === 0) {
      console.log('No films need book cover enrichment');
      return new Response(
        JSON.stringify({ message: 'No films need enrichment', processed: 0, updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${filmsWithoutCovers.length} films without book covers`);

    let successful = 0;
    let failed = 0;
    const results: Array<{ title: string; status: string; cover?: string }> = [];

    for (const film of filmsWithoutCovers) {
      try {
        let coverUrl: string | null = null;
        const title = film.book_title;
        const author = film.book_author;

        // Try Google Books first (better quality covers)
        console.log(`[${title}] Searching Google Books...`);
        coverUrl = await searchGoogleBooks(title, author);

        // Fallback to Open Library
        if (!coverUrl) {
          console.log(`[${title}] Trying Open Library...`);
          coverUrl = await searchOpenLibrary(title, author);
        }

        // Validate the cover URL actually works
        if (coverUrl) {
          const isValid = await validateCoverUrl(coverUrl);
          if (!isValid) {
            console.log(`[${title}] Cover URL failed validation, discarding`);
            coverUrl = null;
          }
        }

        if (coverUrl) {
          const { error: updateError } = await supabase
            .from('sf_film_adaptations')
            .update({ book_cover_url: coverUrl })
            .eq('id', film.id);

          if (updateError) {
            console.error(`Failed to update cover for ${title}:`, updateError);
            failed++;
            results.push({ title, status: 'update_failed' });
          } else {
            console.log(`✓ Updated cover for: ${title}`);
            successful++;
            results.push({ title, status: 'success', cover: coverUrl });
          }
        } else {
          console.log(`✗ No valid cover found for: ${title}`);
          failed++;
          results.push({ title, status: 'not_found' });
        }

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error processing ${film.book_title}:`, error);
        failed++;
        results.push({ title: film.book_title, status: 'error' });
      }
    }

    const result = {
      message: 'Film book cover enrichment completed',
      processed: successful + failed,
      updated: successful,
      failed,
      results,
    };

    console.log('Enrichment complete:', { processed: result.processed, updated: successful, failed });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
