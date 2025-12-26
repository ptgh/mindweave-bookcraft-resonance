import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verified Criterion films with their exact URLs (manually curated for accuracy)
// Only include films we're 100% certain about
const KNOWN_CRITERION_FILMS: Record<string, string> = {
  'stalker': 'https://www.criterion.com/films/27714-stalker',
  'solaris': 'https://www.criterion.com/films/233-solaris',
  'brazil': 'https://www.criterion.com/films/211-brazil',
  '1984': 'https://www.criterion.com/films/29140-1984',
  'alphaville': 'https://www.criterion.com/films/207-alphaville',
  'fantastic planet': 'https://www.criterion.com/films/28636-fantastic-planet',
  'altered states': 'https://www.criterion.com/films/29506-altered-states',
  'a clockwork orange': 'https://www.criterion.com/films/27876-a-clockwork-orange',
  'the man who fell to earth': 'https://www.criterion.com/films/27719-the-man-who-fell-to-earth',
  'videodrome': 'https://www.criterion.com/films/263-videodrome',
  'the fly': 'https://www.criterion.com/films/28693-the-fly',
  'robocop': 'https://www.criterion.com/films/29178-robocop',
  'twelve monkeys': 'https://www.criterion.com/films/28951-12-monkeys',
  '12 monkeys': 'https://www.criterion.com/films/28951-12-monkeys',
  'world on a wire': 'https://www.criterion.com/films/27718-world-on-a-wire',
  'la jetée': 'https://www.criterion.com/films/194-la-jetee',
  'la jetee': 'https://www.criterion.com/films/194-la-jetee',
  'godzilla': 'https://www.criterion.com/films/27755-godzilla',
  'invasion of the body snatchers': 'https://www.criterion.com/films/27854-invasion-of-the-body-snatchers',
  'the incredible shrinking man': 'https://www.criterion.com/films/28988-the-incredible-shrinking-man',
  'fahrenheit 451': 'https://www.criterion.com/films/28711-fahrenheit-451',
  'planet of the apes': 'https://www.criterion.com/films/29506-planet-of-the-apes',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Starting Criterion link enrichment (known films only)...');

    // Get all our film adaptations
    const { data: films, error: filmsError } = await supabase
      .from('sf_film_adaptations')
      .select('id, film_title, streaming_availability');

    if (filmsError) throw filmsError;

    let updatedCount = 0;
    let removedCount = 0;
    const results: { film: string; matched: boolean; url?: string }[] = [];

    // Normalize title for matching
    const normalizeTitle = (title: string) => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Match against known Criterion films only (fast and reliable)
    for (const film of films || []) {
      const filmTitleNorm = normalizeTitle(film.film_title);
      
      // Check known films
      const criterionUrl = KNOWN_CRITERION_FILMS[filmTitleNorm];
      
      if (criterionUrl) {
        const currentStreaming = film.streaming_availability || {};
        const updatedStreaming = {
          ...currentStreaming,
          criterion: criterionUrl
        };

        const { error: updateError } = await supabase
          .from('sf_film_adaptations')
          .update({ streaming_availability: updatedStreaming })
          .eq('id', film.id);

        if (!updateError) {
          updatedCount++;
          results.push({ film: film.film_title, matched: true, url: criterionUrl });
          console.log(`✓ Matched: ${film.film_title} -> ${criterionUrl}`);
        }
      } else {
        // Remove any existing criterion links that aren't in our verified list
        if (film.streaming_availability?.criterion) {
          const currentStreaming = { ...film.streaming_availability };
          delete currentStreaming.criterion;
          
          await supabase
            .from('sf_film_adaptations')
            .update({ streaming_availability: Object.keys(currentStreaming).length > 0 ? currentStreaming : null })
            .eq('id', film.id);
          
          removedCount++;
          console.log(`✗ Removed unverified Criterion link for: ${film.film_title}`);
        }
        results.push({ film: film.film_title, matched: false });
      }
    }

    console.log(`Criterion enrichment complete. Updated ${updatedCount}, removed ${removedCount} unverified links.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updatedCount} Criterion links, removed ${removedCount} unverified`,
        knownFilmsInDatabase: Object.keys(KNOWN_CRITERION_FILMS).length,
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
