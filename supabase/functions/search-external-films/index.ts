import { corsHeaders, json, requireUser, createServiceClient } from "../_shared/adminAuth.ts";

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');

interface TMDBResult {
  tmdb_id: number;
  title: string;
  year: number | null;
  overview: string;
  poster_url: string | null;
  rating: number;
  in_collection?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated user (not admin-only)
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  if (!TMDB_API_KEY) {
    console.error('[search-external-films] TMDB_API_KEY not configured');
    return json(500, { error: 'TMDB_API_KEY not configured' });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.length < 2) {
      return json(400, { error: 'Query must be at least 2 characters' });
    }

    console.log(`[search-external-films] Searching TMDB for SF films: "${query}"`);

    // Search TMDB with Science Fiction genre filter (genre_id 878)
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`;
    
    // Also get genre list to filter results
    const SF_GENRE_ID = 878; // TMDB Science Fiction genre ID
    
    const tmdbRes = await fetch(searchUrl);
    if (!tmdbRes.ok) {
      console.error(`[search-external-films] TMDB API error: ${tmdbRes.status}`);
      throw new Error(`TMDB API error: ${tmdbRes.status}`);
    }
    
    const tmdbData = await tmdbRes.json();
    
    // Filter to only Science Fiction films (genre_id 878)
    const sfFilms = tmdbData.results.filter((film: any) => 
      film.genre_ids?.includes(SF_GENRE_ID)
    );
    
    console.log(`[search-external-films] Found ${tmdbData.results.length} total, ${sfFilms.length} are SF`);
    
    // Format results - only SF films
    const results: TMDBResult[] = sfFilms
      .slice(0, 10)
      .map((film: any) => ({
        tmdb_id: film.id,
        title: film.title,
        year: film.release_date ? parseInt(film.release_date.substring(0, 4)) : null,
        overview: film.overview,
        poster_url: film.poster_path 
          ? `https://image.tmdb.org/t/p/w300${film.poster_path}` 
          : null,
        rating: film.vote_average || 0,
      }));

    // Check which are already in collection
    const supabase = createServiceClient();
    const tmdbIds = results.map(r => r.tmdb_id);
    const titles = results.map(r => r.title.toLowerCase());
    
    const { data: existingByTmdb } = await supabase
      .from('sf_film_adaptations')
      .select('tmdb_id')
      .in('tmdb_id', tmdbIds);

    const { data: existingByTitle } = await supabase
      .from('sf_film_adaptations')
      .select('film_title')
      .ilike('film_title', `%${query}%`);

    const existingTmdbIds = new Set(existingByTmdb?.map(e => e.tmdb_id) || []);
    const existingTitles = new Set(
      existingByTitle?.map(e => e.film_title.toLowerCase()) || []
    );

    const resultsWithStatus = results.map(r => ({
      ...r,
      in_collection: existingTmdbIds.has(r.tmdb_id) || existingTitles.has(r.title.toLowerCase()),
    }));

    console.log(`[search-external-films] Found ${results.length} results, ${resultsWithStatus.filter(r => r.in_collection).length} already in collection`);

    return json(200, { 
      results: resultsWithStatus,
      query,
      total: tmdbData.total_results 
    });

  } catch (err) {
    console.error('[search-external-films] Error:', err);
    return json(500, { error: err instanceof Error ? err.message : 'Search failed' });
  }
});
