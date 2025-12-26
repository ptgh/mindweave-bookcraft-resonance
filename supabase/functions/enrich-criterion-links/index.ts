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

    console.log('Starting Criterion link enrichment...');

    // Fetch the Criterion SF browse page to get all films
    const browseUrl = 'https://www.criterion.com/shop/browse?genre=science-fiction';
    console.log('Scraping Criterion browse page:', browseUrl);

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: browseUrl,
        formats: ['html', 'links'],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl scrape error:', errorText);
      throw new Error(`Firecrawl error: ${scrapeResponse.status}`);
    }

    const scrapeData = await scrapeResponse.json();
    const links = scrapeData.data?.links || scrapeData.links || [];
    
    console.log(`Found ${links.length} links on Criterion page`);

    // Extract film URLs (format: /films/XXXXX-film-title)
    const filmLinks: { url: string; title: string }[] = [];
    for (const link of links) {
      const match = link.match(/\/films\/(\d+)-(.+)$/);
      if (match) {
        const filmSlug = match[2].replace(/-/g, ' ');
        filmLinks.push({
          url: `https://www.criterion.com${link.startsWith('/') ? link : '/' + link}`,
          title: filmSlug
        });
      }
    }

    console.log(`Extracted ${filmLinks.length} Criterion film URLs`);

    // Get all our film adaptations
    const { data: films, error: filmsError } = await supabase
      .from('sf_film_adaptations')
      .select('id, film_title, streaming_availability');

    if (filmsError) throw filmsError;

    let updatedCount = 0;
    const results: { film: string; matched: boolean; url?: string }[] = [];

    // Match our films with Criterion films
    for (const film of films || []) {
      const filmTitleLower = film.film_title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      
      const match = filmLinks.find(cf => {
        const criterionTitle = cf.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        return criterionTitle.includes(filmTitleLower) || filmTitleLower.includes(criterionTitle);
      });

      if (match) {
        const currentStreaming = film.streaming_availability || {};
        const updatedStreaming = {
          ...currentStreaming,
          criterion: match.url
        };

        const { error: updateError } = await supabase
          .from('sf_film_adaptations')
          .update({ streaming_availability: updatedStreaming })
          .eq('id', film.id);

        if (!updateError) {
          updatedCount++;
          results.push({ film: film.film_title, matched: true, url: match.url });
          console.log(`✓ Matched: ${film.film_title} -> ${match.url}`);
        }
      } else {
        // Remove false criterion links
        if (film.streaming_availability?.criterion) {
          const currentStreaming = { ...film.streaming_availability };
          delete currentStreaming.criterion;
          
          await supabase
            .from('sf_film_adaptations')
            .update({ streaming_availability: Object.keys(currentStreaming).length > 0 ? currentStreaming : null })
            .eq('id', film.id);
          
          console.log(`✗ Removed fake Criterion link for: ${film.film_title}`);
        }
        results.push({ film: film.film_title, matched: false });
      }
    }

    console.log(`Criterion enrichment complete. Updated ${updatedCount} films.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updatedCount} Criterion links`,
        criterionFilmsFound: filmLinks.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error enriching Criterion links:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
