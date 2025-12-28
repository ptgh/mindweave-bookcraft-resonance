import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-internal-secret, x-client-info, apikey, content-type",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Middleware to require admin authorization OR internal function-to-function calls.
 * 
 * MODE A: Internal calls - If x-internal-secret header matches INTERNAL_EDGE_SECRET env var,
 *         the call is trusted (used for function-to-function calls).
 * 
 * MODE B: External calls - Requires a valid JWT token from an authenticated admin user.
 *         Uses the existing has_role() database function to check admin status.
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

  // Use the existing has_role() database function to check admin status
  const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });

  if (roleErr) {
    console.log("❌ [AdminAuth] Role check failed:", roleErr.message);
    return json(500, { error: "Role check failed", details: roleErr.message });
  }
  
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
