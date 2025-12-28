import { requireAdminOrInternal, corsHeaders, json } from "../_shared/adminAuth.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[admin-whoami] Incoming request");

  try {
    const authResult = await requireAdminOrInternal(req);
    
    if (!authResult.ok) {
      console.log("[admin-whoami] Auth failed, returning error response");
      return authResult.error!;
    }

    const mode = authResult.userId ? "admin" : "internal";
    
    console.log(`[admin-whoami] Success - userId: ${authResult.userId}, mode: ${mode}`);

    return json({
      ok: true,
      userId: authResult.userId || null,
      mode,
    });
  } catch (error) {
    console.error("[admin-whoami] Unexpected error:", error);
    return json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: corsHeaders }
    );
  }
});
