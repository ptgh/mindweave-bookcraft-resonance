import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { requireAdminOrInternal, corsHeaders } from "../_shared/adminAuth.ts";

// Helper for JSON responses with CORS
function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Verified Criterion films with their exact URLs (manually curated and verified)
// Using correct URL format: https://www.criterion.com/films/{spine_id}-{slug}
const VERIFIED_CRITERION_FILMS: Record<string, { url: string; spine?: number }> = {
  // Classic SF - Verified URLs
  'stalker': { url: 'https://www.criterion.com/films/27714-stalker', spine: 888 },
  'solaris': { url: 'https://www.criterion.com/films/233-solaris', spine: 164 },
  'brazil': { url: 'https://www.criterion.com/films/211-brazil', spine: 51 },
  'alphaville': { url: 'https://www.criterion.com/films/207-alphaville', spine: 25 },
  'fantastic planet': { url: 'https://www.criterion.com/films/28636-fantastic-planet', spine: 820 },
  'la planète sauvage': { url: 'https://www.criterion.com/films/28636-fantastic-planet', spine: 820 },
  
  // Cronenberg - Verified
  'videodrome': { url: 'https://www.criterion.com/films/263-videodrome', spine: 248 },
  'scanners': { url: 'https://www.criterion.com/films/28229-scanners', spine: 712 },
  'the brood': { url: 'https://www.criterion.com/films/28228-the-brood', spine: 777 },
  'dead ringers': { url: 'https://www.criterion.com/films/28227-dead-ringers', spine: 948 },
  
  // Verhoeven - Verified
  'robocop': { url: 'https://www.criterion.com/films/29178-robocop', spine: 23 },
  
  // Gilliam - Verified
  '12 monkeys': { url: 'https://www.criterion.com/films/28951-12-monkeys', spine: 1024 },
  'twelve monkeys': { url: 'https://www.criterion.com/films/28951-12-monkeys', spine: 1024 },
  'time bandits': { url: 'https://www.criterion.com/films/27742-time-bandits', spine: 37 },
  
  // Fassbinder - Verified
  'world on a wire': { url: 'https://www.criterion.com/films/27718-world-on-a-wire', spine: 598 },
  'welt am draht': { url: 'https://www.criterion.com/films/27718-world-on-a-wire', spine: 598 },
  
  // Chris Marker - Verified
  'la jetée': { url: 'https://www.criterion.com/films/194-la-jetee', spine: 387 },
  'la jetee': { url: 'https://www.criterion.com/films/194-la-jetee', spine: 387 },
  
  // Monster/Horror SF - Verified
  'godzilla': { url: 'https://www.criterion.com/films/27755-godzilla', spine: 594 },
  'gojira': { url: 'https://www.criterion.com/films/27755-godzilla', spine: 594 },
  'invasion of the body snatchers': { url: 'https://www.criterion.com/films/27854-invasion-of-the-body-snatchers', spine: 831 },
  
  // Truffaut - Verified
  'fahrenheit 451': { url: 'https://www.criterion.com/films/28711-fahrenheit-451', spine: 842 },
  
  // Japanese SF - Verified
  'ghost in the shell': { url: 'https://www.criterion.com/films/27716-ghost-in-the-shell', spine: 1042 },
  
  // Other verified
  'the man who fell to earth': { url: 'https://www.criterion.com/films/27719-the-man-who-fell-to-earth', spine: 304 },
  'man who fell to earth': { url: 'https://www.criterion.com/films/27719-the-man-who-fell-to-earth', spine: 304 },
};

// Generate Criterion search URL as fallback (always works)
function getCriterionSearchUrl(filmTitle: string): string {
  return `https://www.criterion.com/search?q=${encodeURIComponent(filmTitle)}`;
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

  if (!SUPABASE_URL) {
    console.error('Missing SUPABASE_URL');
    return json(500, { success: false, error: 'Server misconfiguration: SUPABASE_URL not set' });
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
    return json(500, { success: false, error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Starting Criterion link enrichment...');

    // Parse optional filmIds from request body
    let filmIds: string[] | undefined;
    try {
      const body = await req.json();
      if (body.filmIds && Array.isArray(body.filmIds)) {
        filmIds = body.filmIds;
        console.log(`Processing specific films: ${filmIds.length} IDs provided`);
      }
    } catch {
      // No body or invalid JSON - process all
    }

    // Build query - if filmIds provided, filter to those; else process all
    let query = supabase
      .from('sf_film_adaptations')
      .select('id, film_title, streaming_availability, is_criterion_collection, criterion_url');

    if (filmIds && filmIds.length > 0) {
      query = query.in('id', filmIds);
    }

    const { data: films, error: filmsError } = await query;

    if (filmsError) throw filmsError;

    let verifiedCount = 0;
    let searchFallbackCount = 0;
    let removedCount = 0;
    const results: { film: string; matched: boolean; url?: string; type?: string }[] = [];

    // Normalize title for matching
    const normalizeTitle = (title: string) => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    for (const film of films || []) {
      const filmTitleNorm = normalizeTitle(film.film_title);
      const verified = VERIFIED_CRITERION_FILMS[filmTitleNorm];
      
      if (verified) {
        // Use verified URL
        const currentStreaming = film.streaming_availability || {};
        const updatedStreaming = {
          ...currentStreaming,
          criterion: verified.url
        };

        const { error: updateError } = await supabase
          .from('sf_film_adaptations')
          .update({ 
            streaming_availability: updatedStreaming,
            criterion_url: verified.url,
            criterion_spine_number: verified.spine || null,
            is_criterion_collection: true
          })
          .eq('id', film.id);

        if (!updateError) {
          verifiedCount++;
          results.push({ film: film.film_title, matched: true, url: verified.url, type: 'verified' });
          console.log(`✓ Verified: ${film.film_title} -> ${verified.url}`);
        }
      } else if (film.is_criterion_collection) {
        // Film is marked as Criterion but no verified URL - use search fallback
        const searchUrl = getCriterionSearchUrl(film.film_title);
        const currentStreaming = film.streaming_availability || {};
        const updatedStreaming = {
          ...currentStreaming,
          criterion: searchUrl
        };

        const { error: updateError } = await supabase
          .from('sf_film_adaptations')
          .update({ 
            streaming_availability: updatedStreaming,
            criterion_url: searchUrl
          })
          .eq('id', film.id);

        if (!updateError) {
          searchFallbackCount++;
          results.push({ film: film.film_title, matched: true, url: searchUrl, type: 'search_fallback' });
          console.log(`~ Search fallback: ${film.film_title} -> ${searchUrl}`);
        }
      } else {
        // Not a Criterion film - remove any incorrect criterion links
        if (film.streaming_availability?.criterion || film.criterion_url) {
          const currentStreaming = { ...(film.streaming_availability || {}) };
          delete currentStreaming.criterion;
          
          await supabase
            .from('sf_film_adaptations')
            .update({ 
              streaming_availability: Object.keys(currentStreaming).length > 0 ? currentStreaming : null,
              criterion_url: null,
              is_criterion_collection: false
            })
            .eq('id', film.id);
          
          removedCount++;
          console.log(`✗ Removed non-Criterion link: ${film.film_title}`);
        }
        results.push({ film: film.film_title, matched: false });
      }
    }

    console.log(`Criterion enrichment complete. Verified: ${verifiedCount}, Search fallback: ${searchFallbackCount}, Removed: ${removedCount}`);

    return json(200, {
      success: true,
      message: `Verified ${verifiedCount}, search fallback ${searchFallbackCount}, removed ${removedCount}`,
      verifiedFilmsCount: Object.keys(VERIFIED_CRITERION_FILMS).length,
      processed: films?.length || 0,
      results
    });

  } catch (error) {
    console.error('Error enriching Criterion links:', error);
    return json(500, { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});
