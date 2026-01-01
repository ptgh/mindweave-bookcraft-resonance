import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

// Curated list of verified IMSDB scripts for SF films
// All URLs have been verified to be accurate IMSDB pages
const CURATED_SCRIPTS: Array<{ title: string; year: number; url: string }> = [
  // Classic Sci-Fi
  { title: "2001: A Space Odyssey", year: 1968, url: "https://imsdb.com/scripts/2001-A-Space-Odyssey.html" },
  { title: "Blade Runner", year: 1982, url: "https://imsdb.com/scripts/Blade-Runner.html" },
  { title: "Alien", year: 1979, url: "https://imsdb.com/scripts/Alien.html" },
  { title: "Aliens", year: 1986, url: "https://imsdb.com/scripts/Aliens.html" },
  { title: "The Terminator", year: 1984, url: "https://imsdb.com/scripts/Terminator.html" },
  { title: "Terminator 2: Judgment Day", year: 1991, url: "https://imsdb.com/scripts/Terminator-2-Judgment-Day.html" },
  { title: "Back to the Future", year: 1985, url: "https://imsdb.com/scripts/Back-to-the-Future.html" },
  { title: "E.T. the Extra-Terrestrial", year: 1982, url: "https://imsdb.com/scripts/E.T.-the-Extra-Terrestrial.html" },
  { title: "Close Encounters of the Third Kind", year: 1977, url: "https://imsdb.com/scripts/Close-Encounters-of-the-Third-Kind.html" },
  
  // 1990s Sci-Fi
  { title: "The Matrix", year: 1999, url: "https://imsdb.com/scripts/Matrix,-The.html" },
  { title: "Jurassic Park", year: 1993, url: "https://imsdb.com/scripts/Jurassic-Park.html" },
  { title: "The Fifth Element", year: 1997, url: "https://imsdb.com/scripts/Fifth-Element,-The.html" },
  { title: "Total Recall", year: 1990, url: "https://imsdb.com/scripts/Total-Recall.html" },
  { title: "Starship Troopers", year: 1997, url: "https://imsdb.com/scripts/Starship-Troopers.html" },
  { title: "12 Monkeys", year: 1995, url: "https://imsdb.com/scripts/Twelve-Monkeys.html" },
  { title: "Gattaca", year: 1997, url: "https://imsdb.com/scripts/Gattaca.html" },
  { title: "Contact", year: 1997, url: "https://imsdb.com/scripts/Contact.html" },
  { title: "Men in Black", year: 1997, url: "https://imsdb.com/scripts/Men-in-Black.html" },
  { title: "Independence Day", year: 1996, url: "https://imsdb.com/scripts/Independence-Day.html" },
  
  // 2000s Sci-Fi
  { title: "Minority Report", year: 2002, url: "https://imsdb.com/scripts/Minority-Report.html" },
  { title: "A.I. Artificial Intelligence", year: 2001, url: "https://imsdb.com/scripts/A.I..html" },
  { title: "I, Robot", year: 2004, url: "https://imsdb.com/scripts/I,-Robot.html" },
  { title: "War of the Worlds", year: 2005, url: "https://imsdb.com/scripts/War-of-the-Worlds.html" },
  { title: "Children of Men", year: 2006, url: "https://imsdb.com/scripts/Children-of-Men.html" },
  { title: "The Island", year: 2005, url: "https://imsdb.com/scripts/Island,-The.html" },
  { title: "Serenity", year: 2005, url: "https://imsdb.com/scripts/Serenity.html" },
  
  // 2010s Sci-Fi
  { title: "Inception", year: 2010, url: "https://imsdb.com/scripts/Inception.html" },
  { title: "Interstellar", year: 2014, url: "https://imsdb.com/scripts/Interstellar.html" },
  { title: "Gravity", year: 2013, url: "https://imsdb.com/scripts/Gravity.html" },
  { title: "Ex Machina", year: 2014, url: "https://imsdb.com/scripts/Ex-Machina.html" },
  { title: "Arrival", year: 2016, url: "https://imsdb.com/scripts/Arrival.html" },
  { title: "The Martian", year: 2015, url: "https://imsdb.com/scripts/Martian,-The.html" },
  { title: "Looper", year: 2012, url: "https://imsdb.com/scripts/Looper.html" },
  { title: "Her", year: 2013, url: "https://imsdb.com/scripts/Her.html" },
  { title: "Edge of Tomorrow", year: 2014, url: "https://imsdb.com/scripts/Edge-of-Tomorrow.html" },
  { title: "Oblivion", year: 2013, url: "https://imsdb.com/scripts/Oblivion.html" },
  { title: "District 9", year: 2009, url: "https://imsdb.com/scripts/District-9.html" },
  { title: "Moon", year: 2009, url: "https://imsdb.com/scripts/Moon.html" },
  { title: "Avatar", year: 2009, url: "https://imsdb.com/scripts/Avatar.html" },
  
  // Adaptation-specific
  { title: "Blade Runner 2049", year: 2017, url: "https://imsdb.com/scripts/Blade-Runner-2049.html" },
  { title: "Annihilation", year: 2018, url: "https://imsdb.com/scripts/Annihilation.html" },
  { title: "Dune", year: 2021, url: "https://imsdb.com/scripts/Dune.html" },
  { title: "A Clockwork Orange", year: 1971, url: "https://imsdb.com/scripts/Clockwork-Orange,-A.html" },
  { title: "Solaris", year: 1972, url: "https://imsdb.com/scripts/Solaris.html" },
  { title: "Planet of the Apes", year: 1968, url: "https://imsdb.com/scripts/Planet-of-the-Apes.html" },
  { title: "The Thing", year: 1982, url: "https://imsdb.com/scripts/Thing,-The.html" },
  { title: "RoboCop", year: 1987, url: "https://imsdb.com/scripts/Robocop.html" },
  { title: "The Fly", year: 1986, url: "https://imsdb.com/scripts/Fly,-The.html" },
  
  // Predator franchise
  { title: "Predator", year: 1987, url: "https://imsdb.com/scripts/Predator.html" },
  { title: "Predator 2", year: 1990, url: "https://imsdb.com/scripts/Predator-2.html" },
  
  // Additional classics
  { title: "Badlands", year: 1973, url: "https://imsdb.com/scripts/Badlands.html" },
  { title: "THX 1138", year: 1971, url: "https://imsdb.com/scripts/THX-1138.html" },
  { title: "Logan's Run", year: 1976, url: "https://imsdb.com/scripts/Logans-Run.html" },
  { title: "Westworld", year: 1973, url: "https://imsdb.com/scripts/Westworld.html" },
  { title: "Silent Running", year: 1972, url: "https://imsdb.com/scripts/Silent-Running.html" },
];

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Verify URL is accessible via HEAD or GET request
// Also check that the page actually contains script content (not a 404 page)
async function verifyUrl(url: string): Promise<boolean> {
  try {
    // Use GET to actually check page content
    const res = await fetch(url, { 
      method: 'GET',
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; ScriptEnricher/1.0)'
      }
    });
    
    if (!res.ok) {
      console.log(`URL failed: ${url} (status: ${res.status})`);
      return false;
    }

    // Check if the page contains actual script content
    const text = await res.text();
    
    // IMSDb script pages contain "<pre>" tags with the actual script
    // or specific markers that indicate it's a valid script page
    const hasScriptContent = text.includes('<pre>') || 
                            text.includes('FADE IN') || 
                            text.includes('INT.') ||
                            text.includes('EXT.') ||
                            text.includes('Final Draft') ||
                            text.includes('Dialogue and Continuity');
    
    if (hasScriptContent) {
      console.log(`Verified script content at: ${url}`);
      return true;
    }
    
    // Check if it's at least a valid IMSDb movie page (might link to script)
    if (text.includes('Read "') && text.includes('Script"')) {
      console.log(`Found IMSDb movie page (no direct script): ${url}`);
      return true;
    }

    console.log(`URL accessible but no script content: ${url}`);
    return false;
  } catch (err) {
    console.error(`URL verification error for ${url}:`, err);
    return false;
  }
}

// Normalize title for matching
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate possible IMSDb URL patterns for a film title
function generateImsdbUrlPatterns(title: string): string[] {
  const patterns: string[] = [];
  
  // Clean the title
  let cleanTitle = title
    .replace(/['']/g, "'")  // Normalize quotes
    .replace(/[""]/g, '"')  // Normalize quotes
    .trim();
  
  // Pattern 1: Simple hyphenation (e.g., "Ex Machina" -> "Ex-Machina")
  const hyphenated = cleanTitle
    .replace(/[^a-zA-Z0-9\s]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')            // Spaces to hyphens
    .replace(/-+/g, '-');             // Clean multiple hyphens
  patterns.push(`https://imsdb.com/scripts/${hyphenated}.html`);
  
  // Pattern 2: "The X" -> "X,-The" pattern (common for movies starting with "The")
  if (cleanTitle.toLowerCase().startsWith('the ')) {
    const withoutThe = cleanTitle.substring(4);
    const thePattern = withoutThe
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    patterns.push(`https://imsdb.com/scripts/${thePattern},-The.html`);
  }
  
  // Pattern 3: "A X" -> "X,-A" pattern
  if (cleanTitle.toLowerCase().startsWith('a ')) {
    const withoutA = cleanTitle.substring(2);
    const aPattern = withoutA
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    patterns.push(`https://imsdb.com/scripts/${aPattern},-A.html`);
  }
  
  // Pattern 4: Remove "The" entirely
  if (cleanTitle.toLowerCase().startsWith('the ')) {
    const withoutThe = cleanTitle.substring(4)
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    patterns.push(`https://imsdb.com/scripts/${withoutThe}.html`);
  }
  
  // Pattern 5: First word only (for single-word titles or when full title fails)
  const firstWord = cleanTitle.split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, '');
  if (firstWord.length > 3 && firstWord !== hyphenated) {
    patterns.push(`https://imsdb.com/scripts/${firstWord}.html`);
  }
  
  // Pattern 6: Numbers spelled out (e.g., "2001" -> might need different handling)
  const numberMappings: Record<string, string> = {
    '12': 'Twelve',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
    '10': 'Ten',
  };
  
  for (const [num, word] of Object.entries(numberMappings)) {
    if (cleanTitle.includes(num)) {
      const numberedPattern = cleanTitle
        .replace(num, word)
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      patterns.push(`https://imsdb.com/scripts/${numberedPattern}.html`);
    }
  }
  
  // Pattern 7: Colon handling - "Title: Subtitle" -> "Title---Subtitle" or "Title-Subtitle"
  if (cleanTitle.includes(':')) {
    const colonVariant = cleanTitle
      .replace(/:\s*/g, '-')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    if (!patterns.includes(`https://imsdb.com/scripts/${colonVariant}.html`)) {
      patterns.push(`https://imsdb.com/scripts/${colonVariant}.html`);
    }
  }
  
  // Deduplicate patterns
  return [...new Set(patterns)];
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
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin or internal access
    const auth = await requireAdminOrInternal(req);
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    // Env var checks
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing env vars');
      return json(500, { error: 'Server configuration error' });
    }

    // Parse optional filmIds and options from request
    let filmIds: string[] | null = null;
    let onlyMissing = false;
    let limit = 50; // Default limit per run
    
    try {
      const body = await req.json();
      if (body.filmIds && Array.isArray(body.filmIds)) {
        filmIds = body.filmIds;
      }
      if (body.onlyMissing === true) {
        onlyMissing = true;
      }
      if (body.limit && typeof body.limit === 'number') {
        limit = Math.min(body.limit, 100); // Cap at 100
      }
    } catch {
      // No body or invalid JSON - process with defaults
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch films that need script enrichment
    let query = supabase
      .from('sf_film_adaptations')
      .select('id, film_title, film_year, script_url, script_source, script_last_checked');

    if (filmIds && filmIds.length > 0) {
      query = query.in('id', filmIds);
    } else if (onlyMissing) {
      // Only process films without script_url
      query = query.is('script_url', null);
    }
    
    query = query.limit(limit);

    const { data: films, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching films:', fetchError);
      return json(500, { error: 'Failed to fetch films' });
    }

    if (!films || films.length === 0) {
      return json(200, { 
        message: 'No films to process',
        stats: { processed: 0, linked: 0, verified: 0, failed: 0, discovered: 0 }
      });
    }

    console.log(`Processing ${films.length} films for IMSDb script enrichment`);

    let linked = 0;
    let verified = 0;
    let failed = 0;
    let discovered = 0; // New scripts found via URL pattern generation
    const results: Array<{ title: string; status: string; url?: string }> = [];

    for (const film of films) {
      const normalizedFilmTitle = normalizeTitle(film.film_title);
      
      // Step 1: Check curated list first (most reliable)
      const curatedScript = CURATED_SCRIPTS.find(script => {
        const normalizedScriptTitle = normalizeTitle(script.title);
        // Match by title
        if (normalizedFilmTitle === normalizedScriptTitle) {
          // If we have year info, verify it matches (with some tolerance)
          if (film.film_year && script.year) {
            return Math.abs(film.film_year - script.year) <= 1;
          }
          return true;
        }
        // Also check if film title contains script title or vice versa
        if (normalizedFilmTitle.includes(normalizedScriptTitle) || 
            normalizedScriptTitle.includes(normalizedFilmTitle)) {
          if (film.film_year && script.year) {
            return Math.abs(film.film_year - script.year) <= 1;
          }
          return true;
        }
        return false;
      });

      if (curatedScript) {
        // Verify the curated URL
        const isValid = await verifyUrl(curatedScript.url);

        if (isValid) {
          const { error: updateError } = await supabase
            .from('sf_film_adaptations')
            .update({
              script_url: curatedScript.url,
              script_source: 'imsdb',
              script_last_checked: new Date().toISOString()
            })
            .eq('id', film.id);

          if (updateError) {
            console.error(`Failed to update script for ${film.film_title}:`, updateError);
            failed++;
            results.push({ title: film.film_title, status: 'update_error' });
          } else {
            if (film.script_url) {
              verified++;
              results.push({ title: film.film_title, status: 'verified', url: curatedScript.url });
            } else {
              linked++;
              results.push({ title: film.film_title, status: 'linked', url: curatedScript.url });
            }
            console.log(`✅ Curated script linked for: ${film.film_title}`);
          }
        } else {
          failed++;
          results.push({ title: film.film_title, status: 'curated_url_failed' });
          console.log(`❌ Curated URL failed for: ${film.film_title}`);
        }
        
        await new Promise(r => setTimeout(r, 300));
        continue;
      }

      // Step 2: No curated script - try to discover via URL patterns
      if (!film.script_url) {
        console.log(`🔍 Attempting URL discovery for: ${film.film_title}`);
        
        const urlPatterns = generateImsdbUrlPatterns(film.film_title);
        let foundUrl: string | null = null;
        
        for (const url of urlPatterns) {
          console.log(`  Trying: ${url}`);
          const isValid = await verifyUrl(url);
          
          if (isValid) {
            foundUrl = url;
            break;
          }
          
          // Small delay between attempts
          await new Promise(r => setTimeout(r, 500));
        }
        
        if (foundUrl) {
          const { error: updateError } = await supabase
            .from('sf_film_adaptations')
            .update({
              script_url: foundUrl,
              script_source: 'imsdb',
              script_last_checked: new Date().toISOString()
            })
            .eq('id', film.id);

          if (updateError) {
            console.error(`Failed to update discovered script for ${film.film_title}:`, updateError);
            failed++;
            results.push({ title: film.film_title, status: 'update_error' });
          } else {
            discovered++;
            results.push({ title: film.film_title, status: 'discovered', url: foundUrl });
            console.log(`🎉 Discovered script for: ${film.film_title} -> ${foundUrl}`);
          }
        } else {
          // No script found - update last_checked
          await supabase
            .from('sf_film_adaptations')
            .update({ script_last_checked: new Date().toISOString() })
            .eq('id', film.id);
          
          results.push({ title: film.film_title, status: 'not_found' });
          console.log(`⚪ No script found for: ${film.film_title}`);
        }
      } else {
        // Already has a script URL - just update last_checked
        await supabase
          .from('sf_film_adaptations')
          .update({ script_last_checked: new Date().toISOString() })
          .eq('id', film.id);
        
        results.push({ title: film.film_title, status: 'already_has_script' });
      }

      // Delay between films to be respectful to IMSDb
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`Script enrichment complete: ${linked} linked, ${discovered} discovered, ${verified} verified, ${failed} failed`);

    return json(200, {
      message: 'IMSDb script enrichment complete',
      stats: {
        processed: films.length,
        linked,      // From curated list
        discovered,  // Found via URL patterns
        verified,    // Re-verified existing
        failed
      },
      results
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return json(500, { error: 'Internal server error' });
  }
});
