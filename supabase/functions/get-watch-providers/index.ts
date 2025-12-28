/**
 * Get Watch Providers Edge Function
 * 
 * Fetches streaming/rent/buy providers for a film from TMDB.
 * PROVIDERS-ONLY: Does NOT return trailer data.
 * 
 * Inputs: { title: string, year?: number, region?: string }
 * Output: { success: true, providers: {...}, region: string, updated_at: string }
 */

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

// Provider deep link URLs (direct to service where possible)
const providerDeepLinks: Record<number, string> = {
  8: 'https://www.netflix.com', // Netflix
  9: 'https://tv.apple.com', // Apple TV+
  337: 'https://www.disneyplus.com', // Disney+
  1899: 'https://www.max.com', // Max
  15: 'https://www.hulu.com', // Hulu
  119: 'https://www.amazon.com/gp/video', // Prime Video
  384: 'https://www.hbomax.com', // HBO Max
  386: 'https://www.peacocktv.com', // Peacock
  531: 'https://www.paramountplus.com', // Paramount+
  257: 'https://www.fubo.tv', // fuboTV
  283: 'https://www.crunchyroll.com', // Crunchyroll
  526: 'https://www.amc.com', // AMC+
  350: 'https://tv.apple.com', // Apple TV
  2: 'https://tv.apple.com', // Apple iTunes
  3: 'https://play.google.com/store/movies', // Google Play Movies
  192: 'https://www.youtube.com', // YouTube
  10: 'https://www.amazon.com/gp/video', // Amazon Video
  // UK-specific providers
  103: 'https://www.nowtv.com', // NOW TV
  29: 'https://www.sky.com/watch', // Sky Go
  38: 'https://www.britbox.co.uk', // BritBox
  39: 'https://www.itv.com/hub', // ITV Hub
  41: 'https://www.channel4.com', // All 4
  531: 'https://www.paramountplus.com', // Paramount+
};

function json(data: unknown, options: { status?: number } = {}): Response {
  return new Response(JSON.stringify(data), {
    status: options.status || 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const title = body.title || body.filmTitle; // Support both formats
    const year = body.year || body.filmYear;
    const region = body.region || 'GB'; // Default to UK

    if (!title) {
      return json({ error: 'title is required' }, { status: 400 });
    }

    if (!TMDB_API_KEY) {
      return json({ error: 'TMDB_API_KEY not configured' }, { status: 500 });
    }

    console.log(`[get-watch-providers] Searching for "${title}" (${year || 'any year'}) in region ${region}`);

    // Step 1: Search for the movie to get TMDB ID
    const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`TMDB search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.results || searchData.results.length === 0) {
      console.log(`[get-watch-providers] No movies found for "${title}"`);
      return json({ 
        success: true,
        found: false,
        providers: null,
        region,
        updated_at: new Date().toISOString(),
        message: 'No movie found' 
      });
    }

    // Get the first result (most relevant)
    const movie = searchData.results[0];
    console.log(`[get-watch-providers] Found movie: ${movie.title} (${movie.release_date}) - ID: ${movie.id}`);

    // Step 2: Fetch watch providers only
    const providersResponse = await fetch(
      `${TMDB_BASE_URL}/movie/${movie.id}/watch/providers?api_key=${TMDB_API_KEY}`
    );

    if (!providersResponse.ok) {
      throw new Error(`TMDB providers failed: ${providersResponse.status}`);
    }

    const providersData = await providersResponse.json();
    
    // Get providers for the requested region, fallback to US if not available
    let regionProviders: WatchProviderResult = providersData.results?.[region];
    let usedRegion = region;
    
    if (!regionProviders || (!regionProviders.flatrate?.length && !regionProviders.rent?.length && !regionProviders.buy?.length)) {
      // Try US as fallback
      if (providersData.results?.['US']) {
        regionProviders = providersData.results['US'];
        usedRegion = 'US';
      } else {
        regionProviders = {};
      }
    }
    
    // Format providers with deep links
    const formatProviders = (providers: WatchProvider[] = []) => 
      providers.map(p => ({
        id: p.provider_id,
        name: p.provider_name,
        logo: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
        priority: p.display_priority,
        deepLink: providerDeepLinks[p.provider_id] || null,
      }));

    const result = {
      success: true,
      found: true,
      movie: {
        id: movie.id,
        title: movie.title,
        year: movie.release_date?.substring(0, 4),
      },
      providers: {
        link: regionProviders.link || null,
        streaming: formatProviders(regionProviders.flatrate),
        rent: formatProviders(regionProviders.rent),
        buy: formatProviders(regionProviders.buy),
      },
      region: usedRegion,
      updated_at: new Date().toISOString(),
    };

    console.log(`[get-watch-providers] Found ${result.providers.streaming.length} streaming, ${result.providers.rent.length} rent, ${result.providers.buy.length} buy options for ${usedRegion}`);

    return json(result);

  } catch (error) {
    console.error('[get-watch-providers] Error:', error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
});
