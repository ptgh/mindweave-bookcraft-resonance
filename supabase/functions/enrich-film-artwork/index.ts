import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAdminOrInternal, corsHeaders } from "../_shared/adminAuth.ts";

// Helper for JSON responses with CORS
function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface Film {
  id: string;
  film_title: string;
  film_year: number | null;
  book_title: string;
  book_author: string;
  poster_url: string | null;
  book_cover_url: string | null;
  book_isbn: string | null;
  imdb_rating: number | null;
}

interface TMDBResult {
  poster_path: string | null;
  vote_average: number;
}

// Validate that an image URL actually returns a valid image (not a 404 page)
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) return false;
    const contentType = response.headers.get('content-type') || '';
    return contentType.startsWith('image/');
  } catch {
    return false;
  }
}

// Fetch poster and rating from TMDB (with validation)
async function fetchTMDBData(filmTitle: string, year: number | null, apiKey: string): Promise<{ posterUrl: string | null; rating: number | null }> {
  try {
    const query = encodeURIComponent(filmTitle);
    const yearParam = year ? `&year=${year}` : '';
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}${yearParam}`;
    
    console.log(`Searching TMDB for: ${filmTitle} (${year || 'any year'})`);
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error(`TMDB search failed: ${response.status}`);
      return { posterUrl: null, rating: null };
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const movie: TMDBResult = data.results[0];
      let posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
      const rating = movie.vote_average > 0 ? Math.round(movie.vote_average * 10) / 10 : null;
      
      // Validate TMDB poster URL actually returns an image
      if (posterUrl) {
        const isValid = await validateImageUrl(posterUrl);
        if (!isValid) {
          console.warn(`TMDB poster URL invalid (not an image): ${posterUrl}`);
          posterUrl = null;
        }
      }
      
      console.log(`Found TMDB data: poster=${posterUrl ? 'yes' : 'no'}, rating=${rating}`);
      return { posterUrl, rating };
    }
    
    console.log(`No TMDB data found for: ${filmTitle}`);
    return { posterUrl: null, rating: null };
  } catch (error) {
    console.error(`TMDB fetch error for ${filmTitle}:`, error);
    return { posterUrl: null, rating: null };
  }
}

// Fallback: fetch poster from OMDB (Amazon/IMDb images - very reliable)
async function fetchOMDBPoster(filmTitle: string, year: number | null): Promise<string | null> {
  try {
    const query = encodeURIComponent(filmTitle);
    const yearParam = year ? `&y=${year}` : '';
    const url = `https://www.omdbapi.com/?t=${query}${yearParam}&apikey=trilogy`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.Response === 'True' && data.Poster && data.Poster !== 'N/A') {
      console.log(`Found OMDB poster: ${data.Poster}`);
      return data.Poster;
    }
    return null;
  } catch (error) {
    console.error(`OMDB fetch error for ${filmTitle}:`, error);
    return null;
  }
}

// Fetch book cover from Google Books
async function fetchGoogleBooksCover(title: string, author: string, isbn: string | null, apiKey: string | null): Promise<string | null> {
  try {
    let query = '';
    
    // Try ISBN first if available
    if (isbn) {
      query = `isbn:${isbn}`;
    } else {
      // Clean up author name for search
      const cleanAuthor = author
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .slice(0, 2)
        .join(' ');
      query = encodeURIComponent(`${title} ${cleanAuthor}`);
    }
    
    // Add API key if available for higher rate limits
    const apiKeyParam = apiKey ? `&key=${apiKey}` : '';
    const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1${apiKeyParam}`;
    
    console.log(`Searching Google Books for: ${title} by ${author}`);
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error(`Google Books search failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const book = data.items[0];
      const imageLinks = book.volumeInfo?.imageLinks;
      
      if (imageLinks) {
        // Prefer larger images
        const coverUrl = imageLinks.extraLarge || imageLinks.large || imageLinks.medium || imageLinks.thumbnail;
        if (coverUrl) {
          // Convert to HTTPS and remove zoom parameter for better quality
          const httpsUrl = coverUrl.replace('http://', 'https://').replace('&edge=curl', '');
          console.log(`Found Google Books cover: ${httpsUrl}`);
          return httpsUrl;
        }
      }
    }
    
    console.log(`No book cover found for: ${title}`);
    return null;
  } catch (error) {
    console.error(`Google Books fetch error for ${title}:`, error);
    return null;
  }
}

// Fallback: OpenLibrary covers
async function fetchOpenLibraryCover(title: string, author: string, isbn: string | null): Promise<string | null> {
  try {
    if (isbn) {
      const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
      // Check if cover exists
      const response = await fetch(coverUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`Found OpenLibrary cover by ISBN: ${coverUrl}`);
        return coverUrl;
      }
    }
    
    // Search by title and author
    const query = encodeURIComponent(`${title} ${author}`);
    const searchUrl = `https://openlibrary.org/search.json?q=${query}&limit=1`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.docs && data.docs.length > 0) {
      const book = data.docs[0];
      if (book.cover_i) {
        const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
        console.log(`Found OpenLibrary cover: ${coverUrl}`);
        return coverUrl;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`OpenLibrary fetch error:`, error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin authorization check
  const auth = await requireAdminOrInternal(req);
  if (auth instanceof Response) return auth;

  // === ENV VAR NULL CHECKS ===
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
  const GOOGLE_BOOKS_API_KEY = Deno.env.get('GOOGLE_BOOKS_API_KEY');

  if (!SUPABASE_URL) {
    console.error('Missing SUPABASE_URL');
    return json(500, { success: false, error: 'Server misconfiguration: SUPABASE_URL not set' });
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
    return json(500, { success: false, error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' });
  }
  if (!TMDB_API_KEY) {
    console.error('Missing TMDB_API_KEY');
    return json(500, { success: false, error: 'Server misconfiguration: TMDB_API_KEY not set' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse optional filmIds from request body
    let filmIds: string[] | undefined;
    try {
      const body = await req.json();
      if (body.filmIds && Array.isArray(body.filmIds)) {
        filmIds = body.filmIds;
        console.log(`Processing specific films: ${filmIds.length} IDs provided`);
      }
    } catch {
      // No body or invalid JSON - process batch
    }

    // Build query - if filmIds provided, filter to those; else get missing artwork
    let query = supabase
      .from('sf_film_adaptations')
      .select('id, film_title, film_year, book_title, book_author, poster_url, book_cover_url, book_isbn, imdb_rating');

    if (filmIds && filmIds.length > 0) {
      // Process specific films
      query = query.in('id', filmIds);
    } else {
      // Batch mode: get films missing artwork
      query = query.or('poster_url.is.null,book_cover_url.is.null,imdb_rating.is.null').limit(15);
    }

    const { data: films, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    if (!films || films.length === 0) {
      console.log('No films to process');
      return json(200, { success: true, message: 'No films to process', updated: 0 });
    }

    console.log(`Processing ${films.length} films for artwork enrichment`);

    let postersAdded = 0;
    let bookCoversAdded = 0;
    let ratingsAdded = 0;
    const errors: string[] = [];

    for (const film of films) {
      const updates: Partial<Film> = {};
      
      // Fetch poster and/or rating if missing
      if (!film.poster_url || !film.imdb_rating) {
        const tmdbData = await fetchTMDBData(film.film_title, film.film_year, TMDB_API_KEY);
        if (!film.poster_url && tmdbData.posterUrl) {
          updates.poster_url = tmdbData.posterUrl;
          postersAdded++;
        }
        if (!film.imdb_rating && tmdbData.rating) {
          updates.imdb_rating = tmdbData.rating;
          ratingsAdded++;
        }
        
        // Fallback: try OMDB for poster if TMDB didn't find one
        if (!film.poster_url && !updates.poster_url) {
          const omdbPoster = await fetchOMDBPoster(film.film_title, film.film_year);
          if (omdbPoster) {
            updates.poster_url = omdbPoster;
            postersAdded++;
          }
        }
      }
      
      // Fetch book cover if missing
      if (!film.book_cover_url) {
        let coverUrl = await fetchGoogleBooksCover(film.book_title, film.book_author, film.book_isbn, GOOGLE_BOOKS_API_KEY || null);
        
        // Fallback to OpenLibrary
        if (!coverUrl) {
          coverUrl = await fetchOpenLibraryCover(film.book_title, film.book_author, film.book_isbn);
        }
        
        if (coverUrl) {
          updates.book_cover_url = coverUrl;
          bookCoversAdded++;
        }
      }
      
      // Update database if we found any images
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('sf_film_adaptations')
          .update(updates)
          .eq('id', film.id);
        
        if (updateError) {
          errors.push(`Failed to update ${film.film_title}: ${updateError.message}`);
        } else {
          console.log(`Updated ${film.film_title}: ${JSON.stringify(updates)}`);
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const message = `Added ${postersAdded} posters, ${bookCoversAdded} book covers, and ${ratingsAdded} ratings`;
    console.log(message);

    return json(200, { 
      success: true, 
      message,
      postersAdded,
      bookCoversAdded,
      ratingsAdded,
      processed: films.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Film artwork enrichment error:', error);
    return json(500, { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
