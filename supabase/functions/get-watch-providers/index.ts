import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

interface WatchProviderResult {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filmTitle, filmYear, region = 'US' } = await req.json();

    if (!filmTitle) {
      return new Response(
        JSON.stringify({ error: 'filmTitle is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!TMDB_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'TMDB_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching for "${filmTitle}" (${filmYear || 'any year'}) in region ${region}`);

    // Step 1: Search for the movie to get TMDB ID
    const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(filmTitle)}${filmYear ? `&year=${filmYear}` : ''}`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`TMDB search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.results || searchData.results.length === 0) {
      console.log(`No movies found for "${filmTitle}"`);
      return new Response(
        JSON.stringify({ 
          success: true,
          found: false,
          providers: null,
          message: 'No movie found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the first result (most relevant)
    const movie = searchData.results[0];
    console.log(`Found movie: ${movie.title} (${movie.release_date}) - ID: ${movie.id}`);

    // Step 2: Get watch providers for this movie
    const providersUrl = `${TMDB_BASE_URL}/movie/${movie.id}/watch/providers?api_key=${TMDB_API_KEY}`;
    
    const providersResponse = await fetch(providersUrl);
    if (!providersResponse.ok) {
      throw new Error(`TMDB providers failed: ${providersResponse.status}`);
    }

    const providersData = await providersResponse.json();
    
    // Get providers for the requested region
    const regionProviders: WatchProviderResult = providersData.results?.[region] || {};
    
    // Format the response
    const formatProviders = (providers: WatchProvider[] = []) => 
      providers.map(p => ({
        id: p.provider_id,
        name: p.provider_name,
        logo: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
        priority: p.display_priority,
      }));

    const result = {
      success: true,
      found: true,
      movie: {
        id: movie.id,
        title: movie.title,
        year: movie.release_date?.substring(0, 4),
        poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      },
      providers: {
        link: regionProviders.link || null,
        streaming: formatProviders(regionProviders.flatrate),
        rent: formatProviders(regionProviders.rent),
        buy: formatProviders(regionProviders.buy),
      },
      region,
    };

    console.log(`Found ${result.providers.streaming.length} streaming, ${result.providers.rent.length} rent, ${result.providers.buy.length} buy options`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching watch providers:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
