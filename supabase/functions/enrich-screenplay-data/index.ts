import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Normalize title for URL matching
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

interface ScreenplayInfo {
  writers: string[];
  director: string | null;
  isOriginalScreenplay: boolean;
  scriptUrl: string | null;
  confidence: number;
}

interface TMDBCrewMember {
  job: string;
  name: string;
  department: string;
}

// Fetch screenwriters from TMDB credits API
async function fetchTMDBScreenwriters(tmdbId: number): Promise<string[]> {
  const tmdbApiKey = Deno.env.get('TMDB_API_KEY');
  
  if (!tmdbApiKey || !tmdbId) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${tmdbApiKey}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      console.log(`TMDB credits API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const crew = data.crew as TMDBCrewMember[] || [];
    
    // Filter for screenplay-related jobs
    const screenplayJobs = ['Screenplay', 'Writer', 'Screenwriter', 'Original Story', 'Story'];
    const writers = crew
      .filter(member => screenplayJobs.includes(member.job))
      .map(member => member.name);
    
    // Remove duplicates
    return [...new Set(writers)];
  } catch (err) {
    console.error('TMDB credits fetch failed:', err);
    return [];
  }
}

// Try to find script URL from ScriptSlug
async function fetchScriptSlugUrl(title: string, year: number | null): Promise<string | null> {
  const normalized = normalizeTitle(title);
  const variants = year 
    ? [`${normalized}-${year}`, normalized]
    : [normalized];
  
  for (const variant of variants) {
    const url = `https://www.scriptslug.com/script/${variant}`;
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeafNode/1.0)' }
      });
      
      if (response.ok) {
        console.log(`Found ScriptSlug script at: ${url}`);
        return url;
      }
    } catch {
      // Continue to next variant
    }
  }
  
  return null;
}

// Try to find script URL from IMSDb
async function fetchIMSDbScriptUrl(title: string): Promise<string | null> {
  const urlVariants = [
    title.replace(/\s+/g, '-'),
    title.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, ''),
    title.split(':')[0].trim().replace(/\s+/g, '-'),
  ];
  
  for (const variant of urlVariants) {
    const url = `https://imsdb.com/scripts/${variant}.html`;
    try {
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeafNode/1.0)' }
      });
      
      if (response.ok) {
        const text = await response.text();
        // Check if it's actually a script page (not 404 page)
        if (text.includes('Written by') || text.includes('Screenplay by') || text.includes('scrtext')) {
          console.log(`Found IMSDb script at: ${url}`);
          return url;
        }
      }
    } catch {
      // Continue to next variant
    }
  }
  
  return null;
}

// Fallback: Use AI to determine screenwriters
async function analyzeScreenplayWithAI(
  filmTitle: string, 
  filmYear: number | null,
  director: string | null
): Promise<ScreenplayInfo> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    console.error('LOVABLE_API_KEY not configured');
    return {
      writers: director ? [director] : [],
      director,
      isOriginalScreenplay: true,
      scriptUrl: null,
      confidence: 0.3
    };
  }

  const prompt = `Who wrote the screenplay for the science fiction film "${filmTitle}" (${filmYear || 'unknown year'})? Director: ${director || 'Unknown'}

Return ONLY valid JSON in this format:
{
  "writers": ["Writer Name 1", "Writer Name 2"],
  "confidence": 0.9
}

List the actual screenwriter names. Do not include the director unless they also wrote the screenplay.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a film research expert. Provide accurate screenwriter information. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status, await response.text());
      return {
        writers: director ? [director] : [],
        director,
        isOriginalScreenplay: true,
        scriptUrl: null,
        confidence: 0.3
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        writers: parsed.writers || [],
        director,
        isOriginalScreenplay: true,
        scriptUrl: null,
        confidence: parsed.confidence || 0.7
      };
    }
  } catch (err) {
    console.error('AI analysis failed:', err);
  }

  return {
    writers: director ? [director] : [],
    director,
    isOriginalScreenplay: true,
    scriptUrl: null,
    confidence: 0.3
  };
}

async function requireAdminOrInternal(req: Request): Promise<{ authorized: boolean; userId: string | null; errorResponse?: Response }> {
  // Check for internal secret first
  const internalSecret = req.headers.get('x-internal-secret');
  const expectedSecret = Deno.env.get('INTERNAL_EDGE_SECRET');
  
  if (internalSecret && expectedSecret && internalSecret === expectedSecret) {
    console.log('Authorized via internal secret');
    return { authorized: true, userId: null };
  }
  
  // Check for admin user
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { 
      authorized: false, 
      userId: null,
      errorResponse: json(401, { error: 'Missing authorization' })
    };
  }
  
  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { 
      authorized: false, 
      userId: null,
      errorResponse: json(401, { error: 'Invalid token' })
    };
  }
  
  // Check admin status
  const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
  if (!isAdmin) {
    return { 
      authorized: false, 
      userId: user.id,
      errorResponse: json(403, { error: 'Admin access required' })
    };
  }
  
  return { authorized: true, userId: user.id };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAdminOrInternal(req);
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      return json(500, { error: 'Server configuration error' });
    }

    // Parse optional filmIds from request
    let filmIds: string[] | null = null;
    
    try {
      const body = await req.json();
      if (body.filmIds && Array.isArray(body.filmIds)) {
        filmIds = body.filmIds;
      }
    } catch {
      // No body - process all original screenplays
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch films needing screenplay data enrichment
    let query = supabase
      .from('sf_film_adaptations')
      .select('id, film_title, film_year, director, book_title, book_author, adaptation_type, script_url, tmdb_id');

    if (filmIds && filmIds.length > 0) {
      query = query.in('id', filmIds);
    } else {
      // Only process original screenplays that need enrichment
      query = query
        .eq('adaptation_type', 'original')
        .or('book_author.is.null,book_author.eq.Unknown Screenwriter');
    }

    const { data: films, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching films:', fetchError);
      return json(500, { error: 'Failed to fetch films' });
    }

    if (!films || films.length === 0) {
      return json(200, { 
        message: 'No films to process',
        stats: { processed: 0, enriched: 0, failed: 0 }
      });
    }

    console.log(`Processing ${films.length} films for screenplay data enrichment`);

    let enriched = 0;
    let failed = 0;
    const results: Array<{ id: string; title: string; writers: string[]; status: string }> = [];

    for (const film of films) {
      try {
        let writers: string[] = [];
        let scriptUrl: string | null = film.script_url;

        // Step 1: Try TMDB credits first (most reliable)
        if (film.tmdb_id) {
          writers = await fetchTMDBScreenwriters(film.tmdb_id);
          console.log(`TMDB credits for ${film.film_title}: ${writers.join(', ') || 'none found'}`);
        }

        // Step 2: If no TMDB writers, use AI fallback
        if (writers.length === 0) {
          const screenplayInfo = await analyzeScreenplayWithAI(
            film.film_title,
            film.film_year,
            film.director
          );
          writers = screenplayInfo.writers;
          console.log(`AI analysis for ${film.film_title}: ${writers.join(', ')}`);
        }

        // Step 3: Find script URL (IMSDb first, then ScriptSlug)
        if (!scriptUrl) {
          scriptUrl = await fetchIMSDbScriptUrl(film.film_title);
          
          if (!scriptUrl) {
            scriptUrl = await fetchScriptSlugUrl(film.film_title, film.film_year);
          }
        }

        // Format writer string with " & " separator
        const writerString = writers.length > 0 
          ? writers.join(' & ')
          : film.director || 'Unknown Screenwriter';

        // Ensure book_title has "(original screenplay)" suffix
        const correctBookTitle = film.book_title?.includes('(original screenplay)')
          ? film.book_title
          : `${film.film_title} (original screenplay)`;

        // Prepare update
        const updateData: Record<string, any> = {
          book_author: writerString,
          book_title: correctBookTitle,
          book_publication_year: film.film_year,
          script_last_checked: new Date().toISOString(),
        };

        if (scriptUrl) {
          updateData.script_url = scriptUrl;
          updateData.script_source = scriptUrl.includes('imsdb') ? 'imsdb' : 'scriptslug';
        }

        const { error: updateError } = await supabase
          .from('sf_film_adaptations')
          .update(updateData)
          .eq('id', film.id);

        if (updateError) {
          console.error(`Failed to update ${film.film_title}:`, updateError);
          failed++;
          results.push({ id: film.id, title: film.film_title, writers: [], status: 'failed' });
        } else {
          enriched++;
          console.log(`Enriched: ${film.film_title} - Writers: ${writerString}`);
          results.push({ id: film.id, title: film.film_title, writers, status: 'enriched' });
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 500));
        
      } catch (err) {
        console.error(`Error processing ${film.film_title}:`, err);
        failed++;
        results.push({ id: film.id, title: film.film_title, writers: [], status: 'error' });
      }
    }

    console.log(`Screenplay enrichment complete: ${enriched} enriched, ${failed} failed`);

    return json(200, {
      message: 'Screenplay data enrichment complete',
      stats: {
        processed: films.length,
        enriched,
        failed
      },
      results
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return json(500, { error: 'Internal server error' });
  }
});
