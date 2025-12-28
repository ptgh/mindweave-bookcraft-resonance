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

// Admin/internal authorization check
async function requireAdminOrInternal(req: Request): Promise<{ ok: true; userId: string | null } | { ok: false; error: Response }> {
  // Check for internal secret first (for server-to-server calls)
  const internalSecret = req.headers.get('x-internal-secret');
  const expectedSecret = Deno.env.get('INTERNAL_EDGE_SECRET');
  
  if (internalSecret && expectedSecret && internalSecret === expectedSecret) {
    return { ok: true, userId: null };
  }
  
  // Check for admin user via JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, error: json(401, { success: false, error: 'Missing authorization header' }) };
  }
  
  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, error: json(401, { success: false, error: 'Invalid token' }) };
  }
  
  // Check if user is admin
  const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
  if (!isAdmin) {
    return { ok: false, error: json(403, { success: false, error: 'Admin access required' }) };
  }
  
  return { ok: true, userId: user.id };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require admin or internal access
    const auth = await requireAdminOrInternal(req);
    if (!auth.ok) {
      return auth.error;
    }

    // Parse request body
    const body = await req.json();
    const { filmId, providers, region } = body;

    // Validate required fields
    if (!filmId || typeof filmId !== 'string') {
      return json(400, { success: false, error: 'filmId is required' });
    }
    if (providers === undefined) {
      return json(400, { success: false, error: 'providers is required' });
    }
    if (!region || typeof region !== 'string') {
      return json(400, { success: false, error: 'region is required' });
    }

    console.log(`[cache-watch-providers] Caching providers for film ${filmId}, region ${region}`);

    // Use service role to update the film
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Update the film row with cached providers
    const { data, error } = await supabase
      .from('sf_film_adaptations')
      .update({
        watch_providers: providers,
        watch_providers_region: region,
        watch_providers_updated_at: new Date().toISOString(),
      })
      .eq('id', filmId)
      .select('id, film_title')
      .single();

    if (error) {
      console.error('[cache-watch-providers] Update error:', error);
      return json(500, { success: false, error: error.message });
    }

    console.log(`[cache-watch-providers] Successfully cached providers for: ${data?.film_title}`);

    return json(200, {
      success: true,
      filmId,
      filmTitle: data?.film_title,
      region,
      providersCount: Array.isArray(providers) ? providers.length : Object.keys(providers || {}).length,
      cachedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[cache-watch-providers] Error:', err);
    return json(500, { success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
