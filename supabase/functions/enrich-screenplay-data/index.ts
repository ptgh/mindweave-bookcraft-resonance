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

// Normalize title for matching
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface ScreenplayInfo {
  writers: string[];
  director: string | null;
  isOriginalScreenplay: boolean;
  scriptUrl: string | null;
  confidence: number;
}

async function fetchIMSDbScriptInfo(title: string, year: number | null): Promise<{ scriptUrl: string | null; pageContent: string | null }> {
  // Try common URL patterns for IMSDb
  const urlVariants = [
    title.replace(/\s+/g, '-'),
    title.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, ''),
    title.split(':')[0].trim().replace(/\s+/g, '-'),
    `${title.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`,
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
          return { scriptUrl: url, pageContent: text };
        }
      }
    } catch (err) {
      console.log(`Failed to fetch ${url}:`, err);
    }
  }
  
  return { scriptUrl: null, pageContent: null };
}

async function analyzeScreenplayWithAI(
  filmTitle: string, 
  filmYear: number | null,
  director: string | null,
  imsdbContent: string | null
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

  const prompt = `Analyze this science fiction film and determine its screenplay writer(s):

Film: "${filmTitle}" (${filmYear || 'unknown year'})
Director: ${director || 'Unknown'}
${imsdbContent ? `\nIMSDb script page excerpt (first 2000 chars):\n${imsdbContent.substring(0, 2000)}` : ''}

Based on your knowledge and any provided IMSDb content, determine:
1. Who wrote the screenplay? (List actual screenwriter names, not the director unless they also wrote it)
2. Is this film based on a book/story or an original screenplay?
3. If based on a source, what is the original work?

Respond with ONLY valid JSON in this exact format:
{
  "writers": ["Writer Name 1", "Writer Name 2"],
  "isOriginalScreenplay": true,
  "sourceWork": null,
  "sourceAuthor": null,
  "confidence": 0.9
}

For original screenplays, set isOriginalScreenplay to true and sourceWork/sourceAuthor to null.
For adaptations, set isOriginalScreenplay to false and provide sourceWork and sourceAuthor.
Confidence should be 0.5-1.0 based on how certain you are.`;

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
          { role: 'system', content: 'You are a film research expert. Provide accurate information about screenplay writers. Respond only with valid JSON.' },
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
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        writers: parsed.writers || [],
        director,
        isOriginalScreenplay: parsed.isOriginalScreenplay ?? true,
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
    let fixOriginalScreenplays = false;
    
    try {
      const body = await req.json();
      if (body.filmIds && Array.isArray(body.filmIds)) {
        filmIds = body.filmIds;
      }
      fixOriginalScreenplays = body.fixOriginalScreenplays === true;
    } catch {
      // No body - process all original screenplays
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch films needing screenplay data enrichment
    let query = supabase
      .from('sf_film_adaptations')
      .select('id, film_title, film_year, director, book_title, book_author, adaptation_type, script_url');

    if (filmIds && filmIds.length > 0) {
      query = query.in('id', filmIds);
    } else {
      // Only process original screenplays or those with "original screenplay" in book_title
      query = query.or('adaptation_type.eq.original,book_title.ilike.%original screenplay%,book_title.ilike.%original%,book_author.eq.Original screenplay');
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
        // Try to find IMSDb script
        const { scriptUrl, pageContent } = await fetchIMSDbScriptInfo(film.film_title, film.film_year);
        
        // Use AI to analyze screenplay credits
        const screenplayInfo = await analyzeScreenplayWithAI(
          film.film_title,
          film.film_year,
          film.director,
          pageContent
        );

        // Format writer string
        const writerString = screenplayInfo.writers.length > 0 
          ? screenplayInfo.writers.join(', ')
          : film.director || 'Unknown';

        // Prepare update - clean book_title for original screenplays
        const updateData: Record<string, any> = {
          book_author: writerString,
          script_source: scriptUrl ? 'imsdb' : 'ai_analyzed',
          script_last_checked: new Date().toISOString(),
        };

        // If it's an original screenplay, clean up the book_title
        if (screenplayInfo.isOriginalScreenplay || film.adaptation_type === 'original') {
          updateData.adaptation_type = 'original';
          // Set book_title to just the film title (remove "original screenplay" suffix)
          updateData.book_title = film.film_title;
        }

        if (scriptUrl) {
          updateData.script_url = scriptUrl;
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
          results.push({ id: film.id, title: film.film_title, writers: screenplayInfo.writers, status: 'enriched' });
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
