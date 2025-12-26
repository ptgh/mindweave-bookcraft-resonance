import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Note: Apple TV URLs can't be easily scraped as they require JavaScript rendering
// These are placeholder entries - the admin can manually add verified URLs via the UI
// or we can use a proper API integration in the future
// For now, we'll just clean up any bad links and mark films as needing manual verification

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Starting Apple TV link cleanup...');

    // Get all film adaptations with apple links
    const { data: films, error: filmsError } = await supabase
      .from('sf_film_adaptations')
      .select('id, film_title, streaming_availability')
      .not('streaming_availability', 'is', null);

    if (filmsError) throw filmsError;

    let cleanedCount = 0;
    const results: { film: string; action: string }[] = [];

    // Clean up any apple links that have clearly wrong content IDs
    for (const film of films || []) {
      const streaming = film.streaming_availability as Record<string, string> | null;
      
      if (streaming?.apple) {
        // Check if the apple link looks fake (wrong movie title in URL)
        const appleUrl = streaming.apple;
        const filmTitleSlug = film.film_title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        // If the URL doesn't contain any part of the film title, it's likely wrong
        const urlLower = appleUrl.toLowerCase();
        const titleWords = film.film_title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const hasMatchingWord = titleWords.some(word => urlLower.includes(word));
        
        // Also check for known bad patterns
        const isBadUrl = urlLower.includes('for-auld-lang-syne') || 
                         urlLower.includes('family-plan') ||
                         !hasMatchingWord;
        
        if (isBadUrl) {
          const updatedStreaming = { ...streaming };
          delete updatedStreaming.apple;
          
          await supabase
            .from('sf_film_adaptations')
            .update({ 
              streaming_availability: Object.keys(updatedStreaming).length > 0 ? updatedStreaming : null 
            })
            .eq('id', film.id);
          
          cleanedCount++;
          results.push({ film: film.film_title, action: 'removed bad link' });
          console.log(`✗ Removed bad Apple TV link for: ${film.film_title}`);
        } else {
          results.push({ film: film.film_title, action: 'kept valid link' });
        }
      }
    }

    console.log(`Apple TV cleanup complete. Cleaned ${cleanedCount} bad links.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleaned ${cleanedCount} bad Apple TV links. Note: Apple TV requires manual verification - use the admin UI to add verified URLs.`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error cleaning Apple TV links:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
