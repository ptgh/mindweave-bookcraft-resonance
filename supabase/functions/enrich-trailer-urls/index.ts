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
  trailer_url: string | null;
}

// Search YouTube for official trailer
async function searchYouTubeTrailer(filmTitle: string, year: number | null, apiKey: string): Promise<string | null> {
  try {
    // Build search query with year and "official trailer"
    const yearStr = year ? ` ${year}` : '';
    const query = encodeURIComponent(`${filmTitle}${yearStr} official trailer`);
    
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=5&key=${apiKey}`;
    
    console.log(`Searching YouTube for: ${filmTitle}${yearStr} official trailer`);
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error(`YouTube search failed: ${response.status}`);
      // Check if quota exceeded
      const errorData = await response.json();
      if (errorData?.error?.errors?.[0]?.reason === 'quotaExceeded') {
        console.error('YouTube API quota exceeded');
        throw new Error('YouTube API quota exceeded');
      }
      return null;
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      // Filter for likely official trailers
      for (const item of data.items) {
        const title = item.snippet?.title?.toLowerCase() || '';
        const channelTitle = item.snippet?.channelTitle?.toLowerCase() || '';
        
        // Prefer official channels and trailers
        const isLikelyOfficial = 
          title.includes('official') || 
          title.includes('trailer') ||
          channelTitle.includes('pictures') ||
          channelTitle.includes('studios') ||
          channelTitle.includes('entertainment') ||
          channelTitle.includes('warner') ||
          channelTitle.includes('sony') ||
          channelTitle.includes('paramount') ||
          channelTitle.includes('universal') ||
          channelTitle.includes('disney') ||
          channelTitle.includes('mgm') ||
          channelTitle.includes('lionsgate') ||
          channelTitle.includes('20th century') ||
          channelTitle.includes('columbia');
        
        // Skip clips, reviews, reaction videos
        const isUnwanted = 
          title.includes('review') ||
          title.includes('reaction') ||
          title.includes('clip') ||
          title.includes('scene') ||
          title.includes('explained') ||
          title.includes('breakdown');
        
        if (isLikelyOfficial && !isUnwanted) {
          const videoId = item.id?.videoId;
          if (videoId) {
            const trailerUrl = `https://www.youtube.com/watch?v=${videoId}`;
            console.log(`Found official trailer: ${trailerUrl} (${item.snippet.title})`);
            return trailerUrl;
          }
        }
      }
      
      // Fallback to first result if no "official" found
      const firstResult = data.items[0];
      if (firstResult?.id?.videoId) {
        const trailerUrl = `https://www.youtube.com/watch?v=${firstResult.id.videoId}`;
        console.log(`Using first result: ${trailerUrl}`);
        return trailerUrl;
      }
    }
    
    console.log(`No trailer found for: ${filmTitle}`);
    return null;
  } catch (error) {
    console.error(`YouTube search error for ${filmTitle}:`, error);
    throw error; // Re-throw to handle quota exceeded
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
  const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');

  if (!SUPABASE_URL) {
    console.error('Missing SUPABASE_URL');
    return json(500, { success: false, error: 'Server misconfiguration: SUPABASE_URL not set' });
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
    return json(500, { success: false, error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' });
  }
  if (!YOUTUBE_API_KEY) {
    console.error('Missing YOUTUBE_API_KEY');
    return json(500, { success: false, error: 'Server misconfiguration: YOUTUBE_API_KEY not set' });
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

    // Build query - if filmIds provided, filter to those; else get missing trailers
    let query = supabase
      .from('sf_film_adaptations')
      .select('id, film_title, film_year, trailer_url');

    if (filmIds && filmIds.length > 0) {
      // Process specific films (even if they have trailers, we might want to refresh)
      query = query.in('id', filmIds).is('trailer_url', null);
    } else {
      // Batch mode: get films missing trailers
      query = query.is('trailer_url', null).limit(10);
    }

    const { data: films, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    if (!films || films.length === 0) {
      console.log('No films to process');
      return json(200, { success: true, message: 'No films to process', updated: 0 });
    }

    console.log(`Processing ${films.length} films for trailer enrichment`);

    let trailersAdded = 0;
    const errors: string[] = [];
    let quotaExceeded = false;

    for (const film of films) {
      if (quotaExceeded) break;
      
      try {
        const trailerUrl = await searchYouTubeTrailer(film.film_title, film.film_year, YOUTUBE_API_KEY);
        
        if (trailerUrl) {
          const { error: updateError } = await supabase
            .from('sf_film_adaptations')
            .update({ trailer_url: trailerUrl })
            .eq('id', film.id);
          
          if (updateError) {
            errors.push(`Failed to update ${film.film_title}: ${updateError.message}`);
          } else {
            console.log(`Added trailer for ${film.film_title}: ${trailerUrl}`);
            trailersAdded++;
          }
        }
        
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        if (errMsg.includes('quota')) {
          quotaExceeded = true;
          errors.push('YouTube API quota exceeded - stopping');
        } else {
          errors.push(`Error for ${film.film_title}: ${errMsg}`);
        }
      }
    }

    const message = quotaExceeded 
      ? `Added ${trailersAdded} trailers before quota exceeded`
      : `Added ${trailersAdded} trailers`;
    
    console.log(message);

    return json(200, { 
      success: true, 
      message,
      trailersAdded,
      processed: films.length,
      quotaExceeded,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Trailer enrichment error:', error);
    return json(500, { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
