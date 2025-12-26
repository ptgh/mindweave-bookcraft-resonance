import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Film {
  id: string;
  film_title: string;
  film_year: number | null;
  book_title: string;
  book_author: string;
  poster_url: string | null;
  book_cover_url: string | null;
  book_isbn: string | null;
}

// Fetch poster from TMDB
async function fetchTMDBPoster(filmTitle: string, year: number | null): Promise<string | null> {
  if (!TMDB_API_KEY) {
    console.log('TMDB_API_KEY not configured');
    return null;
  }

  try {
    const query = encodeURIComponent(filmTitle);
    const yearParam = year ? `&year=${year}` : '';
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}${yearParam}`;
    
    console.log(`Searching TMDB for: ${filmTitle} (${year || 'any year'})`);
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error(`TMDB search failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const movie = data.results[0];
      if (movie.poster_path) {
        const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        console.log(`Found TMDB poster: ${posterUrl}`);
        return posterUrl;
      }
    }
    
    console.log(`No poster found for: ${filmTitle}`);
    return null;
  } catch (error) {
    console.error(`TMDB fetch error for ${filmTitle}:`, error);
    return null;
  }
}

// Fetch book cover from Google Books
async function fetchGoogleBooksCover(title: string, author: string, isbn: string | null): Promise<string | null> {
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
    
    const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`;
    
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch films missing posters or book covers (limit 15 per run)
    const { data: films, error: fetchError } = await supabase
      .from('sf_film_adaptations')
      .select('id, film_title, film_year, book_title, book_author, poster_url, book_cover_url, book_isbn')
      .or('poster_url.is.null,book_cover_url.is.null')
      .limit(15);

    if (fetchError) throw fetchError;

    if (!films || films.length === 0) {
      console.log('All films have artwork!');
      return new Response(
        JSON.stringify({ success: true, message: 'All films already have artwork', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${films.length} films for artwork enrichment`);

    let postersAdded = 0;
    let bookCoversAdded = 0;
    const errors: string[] = [];

    for (const film of films) {
      const updates: Partial<Film> = {};
      
      // Fetch poster if missing
      if (!film.poster_url) {
        const posterUrl = await fetchTMDBPoster(film.film_title, film.film_year);
        if (posterUrl) {
          updates.poster_url = posterUrl;
          postersAdded++;
        }
      }
      
      // Fetch book cover if missing
      if (!film.book_cover_url) {
        let coverUrl = await fetchGoogleBooksCover(film.book_title, film.book_author, film.book_isbn);
        
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

    const message = `Added ${postersAdded} posters and ${bookCoversAdded} book covers`;
    console.log(message);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        postersAdded,
        bookCoversAdded,
        processed: films.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Film artwork enrichment error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
