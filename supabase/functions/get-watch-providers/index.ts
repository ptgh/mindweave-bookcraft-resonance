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

interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
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
          trailer: null,
          message: 'No movie found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the first result (most relevant)
    const movie = searchData.results[0];
    console.log(`Found movie: ${movie.title} (${movie.release_date}) - ID: ${movie.id}`);

    // Step 2: Fetch watch providers and videos in parallel
    const [providersResponse, videosResponse] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/movie/${movie.id}/watch/providers?api_key=${TMDB_API_KEY}`),
      fetch(`${TMDB_BASE_URL}/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}`)
    ]);

    if (!providersResponse.ok) {
      throw new Error(`TMDB providers failed: ${providersResponse.status}`);
    }

    const providersData = await providersResponse.json();
    const videosData = videosResponse.ok ? await videosResponse.json() : { results: [] };
    
    // Find the best trailer from videos
    const videos: TMDBVideo[] = videosData.results || [];
    
    // Priority: Official YouTube Trailers > Official YouTube Teasers > Any YouTube Trailer
    const findBestTrailer = (): { url: string; name: string; key: string } | null => {
      // First: Official trailers
      const officialTrailer = videos.find(v => 
        v.site === 'YouTube' && v.type === 'Trailer' && v.official === true
      );
      if (officialTrailer) {
        return { url: `https://www.youtube.com/watch?v=${officialTrailer.key}`, name: officialTrailer.name, key: officialTrailer.key };
      }
      
      // Second: Any trailer
      const anyTrailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer');
      if (anyTrailer) {
        return { url: `https://www.youtube.com/watch?v=${anyTrailer.key}`, name: anyTrailer.name, key: anyTrailer.key };
      }
      
      // Third: Official teaser
      const teaser = videos.find(v => 
        v.site === 'YouTube' && v.type === 'Teaser' && v.official === true
      );
      if (teaser) {
        return { url: `https://www.youtube.com/watch?v=${teaser.key}`, name: teaser.name, key: teaser.key };
      }
      
      // Fourth: Any YouTube video
      const anyVideo = videos.find(v => v.site === 'YouTube');
      if (anyVideo) {
        return { url: `https://www.youtube.com/watch?v=${anyVideo.key}`, name: anyVideo.name, key: anyVideo.key };
      }
      
      return null;
    };
    
    const bestTrailer = findBestTrailer();
    console.log(`Found trailer: ${bestTrailer ? bestTrailer.name : 'none'}`);
    
    // Get providers for the requested region, fallback to US if not available
    let regionProviders: WatchProviderResult = providersData.results?.[region];
    let usedRegion = region;
    
    if (!regionProviders || (!regionProviders.flatrate?.length && !regionProviders.rent?.length && !regionProviders.buy?.length)) {
      regionProviders = providersData.results?.['US'] || {};
      usedRegion = 'US';
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
    };
    
    // Format the response with deep links
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
        poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      },
      providers: {
        link: regionProviders.link || null,
        streaming: formatProviders(regionProviders.flatrate),
        rent: formatProviders(regionProviders.rent),
        buy: formatProviders(regionProviders.buy),
      },
      trailer: bestTrailer,
      region: usedRegion,
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
