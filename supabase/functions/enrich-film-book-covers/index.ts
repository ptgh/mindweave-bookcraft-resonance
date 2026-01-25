import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { requireAdminOrInternal, corsHeaders } from "../_shared/adminAuth.ts";

const BUCKET_NAME = 'book-covers';

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

// Generate a hash from URL for filename
async function generateHash(url: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get file extension from content type
function getExtension(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return map[contentType] || '.jpg';
}

// Cache image to Supabase storage
async function cacheImageToStorage(
  supabase: ReturnType<typeof createClient>,
  originalUrl: string,
  type: string = 'book'
): Promise<string | null> {
  try {
    // Check if already cached
    const { data: existing } = await supabase
      .from('cached_images')
      .select('cached_url')
      .eq('original_url', originalUrl)
      .maybeSingle();

    if (existing?.cached_url) {
      console.log(`[Cache] Already cached: ${originalUrl}`);
      return existing.cached_url;
    }

    // Fetch the original image
    console.log(`[Cache] Fetching: ${originalUrl}`);
    
    let fetchUrl = originalUrl;
    
    // For Google Books, use zoom=1 for reliability
    if (originalUrl.includes('books.google') || originalUrl.includes('googleusercontent.com')) {
      fetchUrl = originalUrl.replace(/zoom=\d+/, 'zoom=1');
      if (!fetchUrl.includes('zoom=')) {
        fetchUrl = `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}zoom=1`;
      }
    }

    const imageResponse = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Leafnode/1.0 (Image Cache)',
      }
    });

    if (!imageResponse.ok) {
      console.error(`[Cache] Failed to fetch: ${imageResponse.status}`);
      return null;
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Verify it's actually an image
    if (!contentType.includes('image')) {
      console.error(`[Cache] Not an image: ${contentType}`);
      return null;
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const fileSize = imageBuffer.byteLength;

    // Skip very small images (likely error placeholders)
    if (fileSize < 1000) {
      console.error(`[Cache] Image too small (${fileSize} bytes), likely placeholder`);
      return null;
    }

    // Generate unique filename based on URL hash
    const urlHash = await generateHash(originalUrl);
    const extension = getExtension(contentType);
    const fileName = `${type}/${urlHash}${extension}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, imageBuffer, {
        contentType,
        upsert: true,
        cacheControl: '31536000' // Cache for 1 year
      });

    if (uploadError) {
      console.error('[Cache] Upload error:', uploadError);
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const cachedUrl = publicUrlData.publicUrl;

    // Store in database for lookup
    await supabase
      .from('cached_images')
      .upsert({
        original_url: originalUrl,
        cached_path: fileName,
        cached_url: cachedUrl,
        image_type: type,
        file_size: fileSize,
        last_accessed: new Date().toISOString()
      }, { onConflict: 'original_url' });

    console.log(`[Cache] Cached: ${originalUrl} -> ${cachedUrl}`);
    return cachedUrl;

  } catch (error) {
    console.error('[Cache] Error:', error);
    return null;
  }
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
      // Prefer larger images, use zoom=1 for reliability
      let coverUrl = imageLinks?.large || imageLinks?.medium || imageLinks?.thumbnail || imageLinks?.smallThumbnail;
      if (coverUrl) {
        coverUrl = coverUrl.replace('http:', 'https:');
        // Ensure zoom=1 for content endpoint (more reliable)
        coverUrl = coverUrl.replace(/zoom=\d+/, 'zoom=1');
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

    console.log('Starting film book cover enrichment with Supabase caching...');

    // Get film adaptations without book covers OR with external URLs (not cached yet)
    // Limit per run to avoid timeouts, but process more than before
    const { data: filmsWithoutCovers, error: fetchError } = await supabase
      .from('sf_film_adaptations')
      .select('id, book_title, book_author, book_isbn, book_cover_url')
      .or('book_cover_url.is.null,book_cover_url.eq.')
      .not('adaptation_type', 'eq', 'original') // Skip original screenplays
      .limit(50);

    if (fetchError) {
      console.error('Error fetching films:', fetchError);
      throw fetchError;
    }

    // Also get films with external URLs that need caching
    const { data: filmsNeedingCache } = await supabase
      .from('sf_film_adaptations')
      .select('id, book_title, book_author, book_cover_url')
      .not('book_cover_url', 'is', null)
      .not('book_cover_url', 'ilike', '%supabase.co/storage%') // Not already cached
      .not('adaptation_type', 'eq', 'original')
      .limit(50);

    const allFilms = [
      ...(filmsWithoutCovers || []),
      ...(filmsNeedingCache || [])
    ];

    // Deduplicate by id
    const uniqueFilms = Array.from(
      new Map(allFilms.map(f => [f.id, f])).values()
    );

    if (uniqueFilms.length === 0) {
      console.log('No films need book cover enrichment or caching');
      return new Response(
        JSON.stringify({ message: 'No films need enrichment', processed: 0, updated: 0, cached: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${uniqueFilms.length} films to process (missing covers or need caching)`);

    let successful = 0;
    let failed = 0;
    let cached = 0;
    const results: Array<{ title: string; status: string; cover?: string }> = [];

    for (const film of uniqueFilms) {
      try {
        let coverUrl: string | null = film.book_cover_url;
        const title = film.book_title;
        const author = film.book_author;

        // If no cover URL, search for one
        if (!coverUrl) {
          // Try Google Books first (better quality covers)
          console.log(`[${title}] Searching Google Books...`);
          coverUrl = await searchGoogleBooks(title, author);

          // Fallback to Open Library
          if (!coverUrl) {
            console.log(`[${title}] Trying Open Library...`);
            coverUrl = await searchOpenLibrary(title, author);
          }
        }

        if (!coverUrl) {
          console.log(`✗ No cover found for: ${title}`);
          failed++;
          results.push({ title, status: 'not_found' });
          continue;
        }

        // Cache the image to Supabase storage
        let cachedUrl: string | null = null;
        
        // Skip if already a Supabase URL
        if (coverUrl.includes('supabase.co/storage')) {
          cachedUrl = coverUrl;
          console.log(`[${title}] Already cached in Supabase`);
        } else {
          console.log(`[${title}] Caching to Supabase storage...`);
          cachedUrl = await cacheImageToStorage(supabase, coverUrl, 'book');
        }

        // Use cached URL if available, otherwise keep external URL
        const finalUrl = cachedUrl || coverUrl;

        const { error: updateError } = await supabase
          .from('sf_film_adaptations')
          .update({ book_cover_url: finalUrl })
          .eq('id', film.id);

        if (updateError) {
          console.error(`Failed to update cover for ${title}:`, updateError);
          failed++;
          results.push({ title, status: 'update_failed' });
        } else {
          console.log(`✓ Updated cover for: ${title} (cached: ${!!cachedUrl})`);
          successful++;
          if (cachedUrl && cachedUrl !== coverUrl) cached++;
          results.push({ title, status: cachedUrl ? 'cached' : 'external', cover: finalUrl });
        }

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 300));

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
      cached,
      failed,
      results,
    };

    console.log('Enrichment complete:', { processed: result.processed, updated: successful, cached, failed });

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
