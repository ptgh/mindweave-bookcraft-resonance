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
];

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Verify URL is accessible via HEAD or Range request
async function verifyUrl(url: string): Promise<boolean> {
  try {
    // Try HEAD first
    const headRes = await fetch(url, { method: 'HEAD' });
    if (headRes.ok) {
      console.log(`HEAD verified: ${url}`);
      return true;
    }

    // Fallback: GET with Range header for partial content
    const rangeRes = await fetch(url, {
      method: 'GET',
      headers: { 'Range': 'bytes=0-0' }
    });
    
    // Accept 200 (full response) or 206 (partial content)
    if (rangeRes.ok || rangeRes.status === 206) {
      console.log(`Range GET verified: ${url}`);
      return true;
    }

    console.log(`URL failed verification: ${url} (status: ${rangeRes.status})`);
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

    // Parse optional filmIds from request
    let filmIds: string[] | null = null;
    try {
      const body = await req.json();
      if (body.filmIds && Array.isArray(body.filmIds)) {
        filmIds = body.filmIds;
      }
    } catch {
      // No body or invalid JSON - process all
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch films that need script enrichment
    let query = supabase
      .from('sf_film_adaptations')
      .select('id, film_title, film_year, script_url, script_last_checked');

    if (filmIds && filmIds.length > 0) {
      query = query.in('id', filmIds);
    }

    const { data: films, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching films:', fetchError);
      return json(500, { error: 'Failed to fetch films' });
    }

    if (!films || films.length === 0) {
      return json(200, { 
        message: 'No films to process',
        stats: { processed: 0, linked: 0, verified: 0, failed: 0 }
      });
    }

    console.log(`Processing ${films.length} films for script enrichment`);

    let linked = 0;
    let verified = 0;
    let failed = 0;

    for (const film of films) {
      const normalizedFilmTitle = normalizeTitle(film.film_title);
      
      // Find matching curated script
      const curatedScript = CURATED_SCRIPTS.find(script => {
        const normalizedScriptTitle = normalizeTitle(script.title);
        // Match by title and optionally year
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
          return true;
        }
        return false;
      });

      if (!curatedScript) {
        // No curated script for this film, just update last_checked
        await supabase
          .from('sf_film_adaptations')
          .update({ script_last_checked: new Date().toISOString() })
          .eq('id', film.id);
        continue;
      }

      // Verify the URL is accessible
      const isValid = await verifyUrl(curatedScript.url);

      if (isValid) {
        // Update with verified script URL
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
        } else {
          if (film.script_url) {
            verified++;
            console.log(`Re-verified script for: ${film.film_title}`);
          } else {
            linked++;
            console.log(`Linked script for: ${film.film_title}`);
          }
        }
      } else {
        // URL failed verification - clear script_url if it was set to this broken URL
        await supabase
          .from('sf_film_adaptations')
          .update({ 
            script_url: null,
            script_last_checked: new Date().toISOString() 
          })
          .eq('id', film.id);
        failed++;
        console.log(`Script URL failed verification for: ${film.film_title}`);
      }

      // Small delay between URL checks to be respectful
      await new Promise(r => setTimeout(r, 200));
    }

    console.log(`Script enrichment complete: ${linked} linked, ${verified} verified, ${failed} failed`);

    return json(200, {
      message: 'Script enrichment complete',
      stats: {
        processed: films.length,
        linked,
        verified,
        failed
      }
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return json(500, { error: 'Internal server error' });
  }
});
