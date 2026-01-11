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

// Provider search URL templates - {title} will be replaced with encoded movie title
// These use search pages that actually work to find the movie
const providerSearchTemplates: Record<number, (title: string, year?: string) => string> = {
  8: (title, year) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`, // Netflix
  9: (title, year) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`, // Apple TV+
  337: (title, year) => `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`, // Disney+
  1899: (title, year) => `https://www.max.com/search?q=${encodeURIComponent(title)}`, // Max
  15: (title, year) => `https://www.hulu.com/search?q=${encodeURIComponent(title)}`, // Hulu
  119: (title, year) => `https://www.amazon.co.uk/s?k=${encodeURIComponent(title + (year ? ` ${year}` : ''))}&i=instant-video`, // Prime Video UK
  384: (title, year) => `https://www.max.com/search?q=${encodeURIComponent(title)}`, // HBO Max (now Max)
  386: (title, year) => `https://www.peacocktv.com/search?q=${encodeURIComponent(title)}`, // Peacock
  531: (title, year) => `https://www.paramountplus.com/search/?q=${encodeURIComponent(title)}`, // Paramount+
  257: (title, year) => `https://www.fubo.tv/search?q=${encodeURIComponent(title)}`, // fuboTV
  283: (title, year) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`, // Crunchyroll
  526: (title, year) => `https://www.amc.com/search?q=${encodeURIComponent(title)}`, // AMC+
  350: (title, year) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`, // Apple TV
  2: (title, year) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`, // Apple iTunes
  3: (title, year) => `https://play.google.com/store/search?q=${encodeURIComponent(title)}&c=movies`, // Google Play Movies
  192: (title, year) => `https://www.youtube.com/results?search_query=${encodeURIComponent(title + (year ? ` ${year}` : '') + ' full movie')}`, // YouTube
  10: (title, year) => `https://www.amazon.co.uk/s?k=${encodeURIComponent(title + (year ? ` ${year}` : ''))}&i=instant-video`, // Amazon Video UK
  // UK-specific providers
  103: (title, year) => `https://www.nowtv.com/search?q=${encodeURIComponent(title)}`, // NOW TV
  29: (title, year) => `https://www.sky.com/watch/search?q=${encodeURIComponent(title)}`, // Sky Go
  38: (title, year) => `https://www.britbox.co.uk/search?q=${encodeURIComponent(title)}`, // BritBox
  39: (title, year) => `https://www.itv.com/watch/search/${encodeURIComponent(title)}`, // ITVX (was ITV Hub)
  41: (title, year) => `https://www.channel4.com/search?q=${encodeURIComponent(title)}`, // All 4
};

// Fallback: Google search for provider + movie
const getGoogleSearchLink = (providerName: string, title: string, year?: string): string => {
  return `https://www.google.com/search?q=${encodeURIComponent(`watch ${title} ${year || ''} ${providerName}`.trim())}`
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
    
    // Movie info for constructing search URLs
    const movieTitle = movie.title;
    const movieYear = movie.release_date?.substring(0, 4);
    
    // Format providers with movie-specific search links
    const formatProviders = (providers: WatchProvider[] = []) => 
      providers.map(p => {
        // Try provider-specific search template first
        const searchTemplate = providerSearchTemplates[p.provider_id];
        let deepLink: string;
        
        if (searchTemplate) {
          deepLink = searchTemplate(movieTitle, movieYear);
        } else {
          // Fallback to Google search for this provider + movie
          deepLink = getGoogleSearchLink(p.provider_name, movieTitle, movieYear);
        }
        
        return {
          id: p.provider_id,
          name: p.provider_name,
          logo: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
          priority: p.display_priority,
          deepLink,
        };
      });

    // TMDB watch page as primary link (most reliable)
    const tmdbWatchLink = `https://www.themoviedb.org/movie/${movie.id}/watch?locale=${region}`;

    const result = {
      success: true,
      found: true,
      movie: {
        id: movie.id,
        title: movie.title,
        year: movieYear,
      },
      providers: {
        link: tmdbWatchLink, // Use TMDB's watch page as primary link
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
