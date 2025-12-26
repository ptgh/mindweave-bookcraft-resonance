import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Starting Apple TV link enrichment...');

    // Get all film adaptations
    const { data: films, error: filmsError } = await supabase
      .from('sf_film_adaptations')
      .select('id, film_title, film_year, streaming_availability');

    if (filmsError) throw filmsError;

    let updatedCount = 0;
    let removedCount = 0;
    const results: { film: string; found: boolean; url?: string }[] = [];

    // Process each film
    for (const film of films || []) {
      try {
        // Search Apple TV for this film
        const searchQuery = `${film.film_title} ${film.film_year || ''} movie`;
        const searchUrl = `https://tv.apple.com/search?term=${encodeURIComponent(searchQuery)}`;
        
        console.log(`Searching Apple TV for: ${film.film_title}`);

        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: searchUrl,
            formats: ['links', 'html'],
            onlyMainContent: false,
            waitFor: 2000,
          }),
        });

        if (!scrapeResponse.ok) {
          console.log(`Firecrawl error for ${film.film_title}: ${scrapeResponse.status}`);
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const links = scrapeData.data?.links || scrapeData.links || [];
        const html = scrapeData.data?.html || scrapeData.html || '';
        
        // Look for movie links in format: /movie/umc.cmc.XXXXX
        let appleUrl: string | null = null;
        
        for (const link of links) {
          if (link.includes('/movie/') && link.includes('umc.cmc.')) {
            // Verify this is likely our film by checking if title appears near link
            const filmTitleLower = film.film_title.toLowerCase();
            const htmlLower = html.toLowerCase();
            
            // Simple heuristic: if the film title appears in the page, use the first movie link
            if (htmlLower.includes(filmTitleLower)) {
              appleUrl = link.startsWith('http') ? link : `https://tv.apple.com${link}`;
              break;
            }
          }
        }

        const currentStreaming = film.streaming_availability || {};

        if (appleUrl) {
          const updatedStreaming = {
            ...currentStreaming,
            apple: appleUrl
          };

          const { error: updateError } = await supabase
            .from('sf_film_adaptations')
            .update({ streaming_availability: updatedStreaming })
            .eq('id', film.id);

          if (!updateError) {
            updatedCount++;
            results.push({ film: film.film_title, found: true, url: appleUrl });
            console.log(`✓ Found Apple TV: ${film.film_title} -> ${appleUrl}`);
          }
        } else {
          // Remove fake Apple TV links
          if (currentStreaming.apple) {
            const updatedStreaming = { ...currentStreaming };
            delete updatedStreaming.apple;

            await supabase
              .from('sf_film_adaptations')
              .update({ 
                streaming_availability: Object.keys(updatedStreaming).length > 0 ? updatedStreaming : null 
              })
              .eq('id', film.id);

            removedCount++;
            console.log(`✗ Removed fake Apple TV link for: ${film.film_title}`);
          }
          results.push({ film: film.film_title, found: false });
        }

        // Rate limit - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (filmError) {
        console.error(`Error processing ${film.film_title}:`, filmError);
        results.push({ film: film.film_title, found: false });
      }
    }

    console.log(`Apple TV enrichment complete. Updated ${updatedCount}, removed ${removedCount} fake links.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updatedCount} Apple TV links, removed ${removedCount} fake links`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error enriching Apple TV links:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
