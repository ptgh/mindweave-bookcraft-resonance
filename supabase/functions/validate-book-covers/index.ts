import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { requireAdminOrInternal, corsHeaders } from "../_shared/adminAuth.ts";

interface Film {
  id: string;
  film_title: string;
  book_title: string;
  book_author: string;
  book_cover_url: string | null;
  book_isbn: string | null;
  adaptation_type: string | null;
}

// Validate that a URL actually returns a valid image
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return false;
    const contentType = response.headers.get('content-type') || '';
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    // Reject if not an image or suspiciously small (< 1KB = likely placeholder/error)
    if (!contentType.startsWith('image/')) return false;
    if (contentLength > 0 && contentLength < 1000) return false;
    return true;
  } catch {
    return false;
  }
}

// Search Google Books for a cover
async function searchGoogleBooksCover(title: string, author: string, isbn: string | null, apiKey: string | null): Promise<string | null> {
  try {
    let query = isbn ? `isbn:${isbn}` : encodeURIComponent(`${title} ${author}`);
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=3${keyParam}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.items?.length) return null;
    for (const item of data.items) {
      const links = item.volumeInfo?.imageLinks;
      const url = links?.extraLarge || links?.large || links?.medium || links?.thumbnail;
      if (url) return url.replace('http:', 'https:').replace('&edge=curl', '');
    }
    return null;
  } catch { return null; }
}

// Search OpenLibrary for a cover
async function searchOpenLibraryCover(title: string, author: string, isbn: string | null): Promise<string | null> {
  try {
    // Try ISBN directly
    if (isbn) {
      const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
      const valid = await validateImageUrl(url);
      if (valid) return url;
    }
    // Search by title
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=1&fields=cover_i,isbn`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.docs?.[0]?.cover_i) {
      return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
    }
    return null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireAdminOrInternal(req);
  if (auth instanceof Response) return auth;

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const GOOGLE_BOOKS_API_KEY = Deno.env.get('GOOGLE_BOOKS_API_KEY') || null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Parse optional params
    let batchSize = 20;
    let dryRun = false;
    try {
      const body = await req.json();
      if (body.batchSize) batchSize = Math.min(body.batchSize, 50);
      if (body.dryRun) dryRun = true;
    } catch { /* no body */ }

    // Get all films with cached Supabase storage URLs (most likely to be broken)
    const { data: films, error } = await supabase
      .from('sf_film_adaptations')
      .select('id, film_title, book_title, book_author, book_cover_url, book_isbn, adaptation_type')
      .like('book_cover_url', '%supabase.co/storage%')
      .limit(batchSize);

    if (error) throw error;
    if (!films?.length) {
      return new Response(JSON.stringify({ message: 'No cached covers to validate', validated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Validating ${films.length} cached book cover URLs...`);

    let valid = 0;
    let broken = 0;
    let fixed = 0;
    let unfixable = 0;
    const details: { title: string; status: string; newUrl?: string }[] = [];

    for (const film of films) {
      const isOriginal = film.adaptation_type === 'original';
      
      // Validate the cached URL
      const isValid = await validateImageUrl(film.book_cover_url!);
      
      if (isValid) {
        valid++;
        continue;
      }

      broken++;
      console.log(`✗ Broken cover: ${film.book_title} (${film.film_title})`);

      if (dryRun) {
        details.push({ title: film.book_title, status: 'broken' });
        continue;
      }

      // Skip re-fetching for original screenplays - just clear the broken URL
      if (isOriginal) {
        await supabase.from('sf_film_adaptations').update({ book_cover_url: null }).eq('id', film.id);
        details.push({ title: film.book_title, status: 'cleared (original screenplay)' });
        unfixable++;
        continue;
      }

      // Try to find a new cover
      let newCoverUrl: string | null = null;

      // 1. Google Books
      newCoverUrl = await searchGoogleBooksCover(film.book_title, film.book_author, film.book_isbn, GOOGLE_BOOKS_API_KEY);

      // 2. OpenLibrary fallback
      if (!newCoverUrl) {
        newCoverUrl = await searchOpenLibraryCover(film.book_title, film.book_author, film.book_isbn);
      }

      if (newCoverUrl) {
        // Validate the new URL before saving
        const newValid = await validateImageUrl(newCoverUrl);
        if (newValid) {
          await supabase.from('sf_film_adaptations').update({ book_cover_url: newCoverUrl }).eq('id', film.id);
          console.log(`✓ Fixed: ${film.book_title} → ${newCoverUrl}`);
          details.push({ title: film.book_title, status: 'fixed', newUrl: newCoverUrl });
          fixed++;
        } else {
          // Clear broken URL so frontend fallback chain can try live
          await supabase.from('sf_film_adaptations').update({ book_cover_url: null }).eq('id', film.id);
          details.push({ title: film.book_title, status: 'cleared (new URL also invalid)' });
          unfixable++;
        }
      } else {
        // Clear broken URL
        await supabase.from('sf_film_adaptations').update({ book_cover_url: null }).eq('id', film.id);
        details.push({ title: film.book_title, status: 'cleared (no source found)' });
        unfixable++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const result = {
      message: `Validated ${films.length} covers: ${valid} valid, ${broken} broken, ${fixed} fixed, ${unfixable} cleared`,
      validated: films.length,
      valid,
      broken,
      fixed,
      unfixable,
      details: details.length > 0 ? details : undefined,
    };

    console.log('Validation complete:', result.message);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Validate book covers error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
