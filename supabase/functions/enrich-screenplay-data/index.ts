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
  scriptUrl: string | null;
  scriptPdfUrl: string | null;
  source: 'scriptslug' | 'imsdb' | 'tmdb' | 'ai' | null;
}

interface TMDBCrewMember {
  job: string;
  name: string;
  department: string;
}

// Firecrawl to scrape ScriptSlug for writer info and PDF link
async function scrapeScriptSlugWithFirecrawl(title: string, year: number | null): Promise<ScreenplayInfo | null> {
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlApiKey) {
    console.log('FIRECRAWL_API_KEY not configured, skipping ScriptSlug scrape');
    return null;
  }

  const normalized = normalizeTitle(title);
  const variants = year 
    ? [`${normalized}-${year}`, normalized]
    : [normalized];

  for (const variant of variants) {
    const pageUrl = `https://www.scriptslug.com/script/${variant}`;
    const pdfUrl = `https://assets.scriptslug.com/live/pdf/scripts/${variant}.pdf`;
    
    console.log(`Scraping ScriptSlug: ${pageUrl}`);
    
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: pageUrl,
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 2000,
        }),
      });

      if (!response.ok) {
        console.log(`ScriptSlug page not found: ${pageUrl}`);
        continue;
      }

      const data = await response.json();
      const markdown = data.data?.markdown || data.markdown || '';
      
      if (!markdown || markdown.length < 100) {
        console.log(`No content found at ${pageUrl}`);
        continue;
      }

      // Parse writers from markdown
      // ScriptSlug format: "Written by Writer Name" or "Screenplay by Writer Name"
      const writers: string[] = [];
      
      // Look for "Written by" pattern
      const writtenByMatch = markdown.match(/(?:Written|Screenplay|Script)\s+by[:\s]+([^\n]+)/i);
      if (writtenByMatch) {
        const writerStr = writtenByMatch[1].trim();
        // Split by &, and, or comma
        const parsedWriters = writerStr
          .split(/\s*[&,]\s*|\s+and\s+/i)
          .map((w: string) => w.trim())
          .filter((w: string) => w.length > 0 && w.length < 50);
        writers.push(...parsedWriters);
      }

      // Also look for explicit writer names in common patterns
      const writerPatterns = [
        /Writer[s]?[:\s]+([^\n]+)/i,
        /Screenwriter[s]?[:\s]+([^\n]+)/i,
      ];

      for (const pattern of writerPatterns) {
        const match = markdown.match(pattern);
        if (match && writers.length === 0) {
          const parsed = match[1]
            .split(/\s*[&,]\s*|\s+and\s+/i)
            .map((w: string) => w.trim())
            .filter((w: string) => w.length > 0 && w.length < 50);
          writers.push(...parsed);
        }
      }

      // Verify PDF exists
      let verifiedPdfUrl: string | null = null;
      try {
        const pdfCheck = await fetch(pdfUrl, { method: 'HEAD' });
        if (pdfCheck.ok) {
          verifiedPdfUrl = pdfUrl;
          console.log(`Verified PDF at: ${pdfUrl}`);
        }
      } catch {
        console.log(`PDF not accessible at: ${pdfUrl}`);
      }

      if (writers.length > 0 || verifiedPdfUrl) {
        console.log(`ScriptSlug found: Writers: ${writers.join(', ')}, PDF: ${verifiedPdfUrl || 'not found'}`);
        return {
          writers: [...new Set(writers)], // Remove duplicates
          scriptUrl: verifiedPdfUrl || pageUrl,
          scriptPdfUrl: verifiedPdfUrl,
          source: 'scriptslug',
        };
      }
    } catch (err) {
      console.error(`Error scraping ${pageUrl}:`, err);
    }
  }

  return null;
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

// Try to find script URL from IMSDb (fallback)
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
): Promise<string[]> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    console.error('LOVABLE_API_KEY not configured');
    return [];
  }

  const prompt = `Who wrote the screenplay for the science fiction film "${filmTitle}" (${filmYear || 'unknown year'})? Director: ${director || 'Unknown'}

Return ONLY valid JSON in this format:
{
  "writers": ["Writer Name 1", "Writer Name 2"]
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
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.writers || [];
    }
  } catch (err) {
    console.error('AI analysis failed:', err);
  }

  return [];
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
        .or('book_author.is.null,book_author.eq.Unknown Screenwriter,script_url.is.null');
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
    const results: Array<{ id: string; title: string; writers: string[]; scriptUrl: string | null; status: string }> = [];

    for (const film of films) {
      try {
        let writers: string[] = [];
        let scriptUrl: string | null = film.script_url;
        let scriptSource: string | null = null;

        // Step 1: PRIMARY - Try ScriptSlug with Firecrawl (best for both writers + PDF)
        const scriptSlugData = await scrapeScriptSlugWithFirecrawl(film.film_title, film.film_year);
        
        if (scriptSlugData) {
          if (scriptSlugData.writers.length > 0) {
            writers = scriptSlugData.writers;
          }
          if (scriptSlugData.scriptUrl) {
            scriptUrl = scriptSlugData.scriptUrl;
            scriptSource = 'scriptslug';
          }
          console.log(`ScriptSlug result for ${film.film_title}: Writers=${writers.join(', ')}, URL=${scriptUrl}`);
        }

        // Step 2: If no writers from ScriptSlug, try TMDB credits
        if (writers.length === 0 && film.tmdb_id) {
          writers = await fetchTMDBScreenwriters(film.tmdb_id);
          console.log(`TMDB credits for ${film.film_title}: ${writers.join(', ') || 'none found'}`);
        }

        // Step 3: If still no writers, use AI as last resort
        if (writers.length === 0) {
          writers = await analyzeScreenplayWithAI(film.film_title, film.film_year, film.director);
          console.log(`AI analysis for ${film.film_title}: ${writers.join(', ') || 'none'}`);
        }

        // Step 4: SECONDARY - If no script URL yet, try IMSDb
        if (!scriptUrl) {
          const imsdbUrl = await fetchIMSDbScriptUrl(film.film_title);
          if (imsdbUrl) {
            scriptUrl = imsdbUrl;
            scriptSource = 'imsdb';
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
          updateData.script_source = scriptSource || (scriptUrl.includes('imsdb') ? 'imsdb' : 'scriptslug');
        }

        const { error: updateError } = await supabase
          .from('sf_film_adaptations')
          .update(updateData)
          .eq('id', film.id);

        if (updateError) {
          console.error(`Failed to update ${film.film_title}:`, updateError);
          failed++;
          results.push({ id: film.id, title: film.film_title, writers: [], scriptUrl: null, status: 'failed' });
        } else {
          enriched++;
          console.log(`Enriched: ${film.film_title} - Writers: ${writerString}, Script: ${scriptUrl || 'none'}`);
          results.push({ id: film.id, title: film.film_title, writers, scriptUrl, status: 'enriched' });
        }

        // Rate limiting - be gentle with ScriptSlug
        await new Promise(r => setTimeout(r, 1000));
        
      } catch (err) {
        console.error(`Error processing ${film.film_title}:`, err);
        failed++;
        results.push({ id: film.id, title: film.film_title, writers: [], scriptUrl: null, status: 'error' });
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
