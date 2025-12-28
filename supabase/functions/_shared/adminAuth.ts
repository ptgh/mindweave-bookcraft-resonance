import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-internal-secret, x-client-info, apikey, content-type",
};

/**
 * Helper to create a JSON Response with corsHeaders
 */
export const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Require a valid logged-in user (Bearer token).
 * Uses SUPABASE_ANON_KEY (not service role) so RLS applies.
 * 
 * @returns Either { userId: string, token: string } on success, or a Response object on failure
 */
export async function requireUser(
  req: Request
): Promise<{ userId: string; token: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("❌ [Auth] Missing or invalid Authorization header");
    return json(401, { error: "Missing Authorization bearer token" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    console.log("❌ [Auth] Invalid or expired token:", userErr?.message);
    return json(401, { error: "Invalid or expired token" });
  }

  console.log("✅ [Auth] User authorized:", userData.user.id);
  return { userId: userData.user.id, token };
}

/**
 * Check if a user is an admin using multiple methods for robustness.
 * 
 * Tries in order:
 * 1. has_role(_user_id, 'admin') RPC
 * 2. is_admin() RPC (from migration 20251228110503)
 * 3. Direct query to admins table (fallback)
 * 
 * Returns true if ANY method confirms admin status.
 */
async function checkIsAdmin(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<boolean> {
  // Method 1: Try has_role RPC
  try {
    const { data: hasRoleResult, error: hasRoleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!hasRoleErr && hasRoleResult === true) {
      console.log("✅ [AdminAuth] Admin confirmed via has_role() RPC");
      return true;
    }
    if (hasRoleErr) {
      console.log("⚠️ [AdminAuth] has_role() RPC failed:", hasRoleErr.message);
    }
  } catch (e) {
    console.log("⚠️ [AdminAuth] has_role() RPC exception:", e);
  }

  // Method 2: Try is_admin() RPC
  try {
    const { data: isAdminResult, error: isAdminErr } = await supabase.rpc("is_admin", {
      _user_id: userId,
    });

    if (!isAdminErr && isAdminResult === true) {
      console.log("✅ [AdminAuth] Admin confirmed via is_admin() RPC");
      return true;
    }
    if (isAdminErr) {
      console.log("⚠️ [AdminAuth] is_admin() RPC failed:", isAdminErr.message);
    }
  } catch (e) {
    console.log("⚠️ [AdminAuth] is_admin() RPC exception:", e);
  }

  // Method 3: Direct query to admins table (fallback)
  try {
    const { data: adminRow, error: adminErr } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!adminErr && adminRow) {
      console.log("✅ [AdminAuth] Admin confirmed via admins table query");
      return true;
    }
    if (adminErr) {
      console.log("⚠️ [AdminAuth] admins table query failed:", adminErr.message);
    }
  } catch (e) {
    console.log("⚠️ [AdminAuth] admins table query exception:", e);
  }

  return false;
}

/**
 * Middleware to require admin authorization OR internal function-to-function calls.
 * 
 * MODE A: Internal calls - If x-internal-secret header matches INTERNAL_EDGE_SECRET env var,
 *         the call is trusted (used for function-to-function calls).
 * 
 * MODE B: External calls - Requires a valid JWT token from an authenticated admin user.
 *         Uses multiple methods to check admin status for robustness:
 *         1. has_role() database function
 *         2. is_admin() database function  
 *         3. Direct admins table query (fallback)
 * 
 * @returns Either { userId: string | null } on success, or a Response object on failure
 */
export async function requireAdminOrInternal(
  req: Request
): Promise<{ userId: string | null } | Response> {
  // MODE A: internal function-to-function calls via shared secret header
  const internalHeader = req.headers.get("x-internal-secret");
  const internalSecret = Deno.env.get("INTERNAL_EDGE_SECRET");

  if (internalSecret && internalHeader && internalHeader === internalSecret) {
    console.log("✅ [AdminAuth] Internal call authorized via x-internal-secret");
    return { userId: null }; // internal call - no specific user
  }

  // MODE B: external call -> require authenticated admin user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("❌ [AdminAuth] Missing or invalid Authorization header");
    return json(401, { error: "Missing Authorization bearer token" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    console.log("❌ [AdminAuth] Invalid or expired token:", userErr?.message);
    return json(401, { error: "Invalid or expired token" });
  }

  // Use robust multi-method admin check
  const isAdmin = await checkIsAdmin(supabase, userData.user.id);
  
  if (!isAdmin) {
    console.log("❌ [AdminAuth] User is not an admin:", userData.user.id);
    return json(403, { error: "Admin access required" });
  }

  console.log("✅ [AdminAuth] Admin user authorized:", userData.user.id);
  return { userId: userData.user.id };
}

/**
 * Helper to create a Supabase client with service role for database operations
 * after authorization has been verified.
 */
export function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * Helper to create a Supabase client with the user's token for RLS-protected operations.
 */
export function createUserClient(token: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
