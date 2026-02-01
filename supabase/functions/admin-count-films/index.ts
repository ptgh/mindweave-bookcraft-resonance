import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json, requireAdminOrInternal, createServiceClient, createUserClient } from "../_shared/adminAuth.ts";

/**
 * Admin diagnostic function to compare counts between service role and user JWT
 * Detects RLS "illusion" issues where service role sees data but users don't
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require admin or internal call
  const authResult = await requireAdminOrInternal(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const userId = authResult.userId;

  console.log("🔍 [AdminCountFilms] Starting diagnostic check...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("❌ Missing required env vars");
      return json(500, { error: "Server configuration error" });
    }

    // Service role client (bypasses RLS)
    const serviceClient = createServiceClient();

    // Get user token from request for user client
    const authHeader = req.headers.get("Authorization");
    const userToken = authHeader?.replace("Bearer ", "");

    const results: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      userId: userId || "internal",
      env: {
        supabaseUrl: supabaseUrl.substring(0, 30) + "...",
        hasServiceRoleKey: !!serviceRoleKey,
        hasAnonKey: !!anonKey,
      },
      serviceRoleCounts: {},
      userCounts: {},
      rlsDiscrepancies: [],
    };

    // Tables to check
    const tables = [
      "sf_film_adaptations",
      "publisher_books",
      "publisher_series",
      "transmissions",
      "scifi_authors",
    ];

    // Get service role counts
    for (const table of tables) {
      const { count, error } = await serviceClient
        .from(table)
        .select("*", { count: "exact", head: true });

      (results.serviceRoleCounts as Record<string, unknown>)[table] = error
        ? { error: error.message }
        : { count };
    }

    // Get user counts (if we have a token)
    if (userToken) {
      const userClient = createUserClient(userToken);

      for (const table of tables) {
        const { count, error } = await userClient
          .from(table)
          .select("*", { count: "exact", head: true });

        (results.userCounts as Record<string, unknown>)[table] = error
          ? { error: error.message }
          : { count };
      }

      // Check for discrepancies
      for (const table of tables) {
        const serviceCount = (results.serviceRoleCounts as Record<string, { count?: number }>)[table]?.count;
        const userCount = (results.userCounts as Record<string, { count?: number }>)[table]?.count;

        if (serviceCount !== undefined && userCount !== undefined && serviceCount !== userCount) {
          (results.rlsDiscrepancies as Array<unknown>).push({
            table,
            serviceRoleCount: serviceCount,
            userCount: userCount,
            difference: serviceCount - userCount,
            issue: userCount === 0 ? "USER_SEES_NOTHING" : "PARTIAL_VISIBILITY",
          });
        }
      }
    } else {
      results.userCounts = { note: "No user token provided - internal call" };
    }

    // Additional diagnostics: check specific data health
    const { data: filmHealth } = await serviceClient
      .from("sf_film_adaptations")
      .select("id, book_id, poster_url, trailer_url, book_cover_url")
      .limit(1000);

    results.dataHealth = {
      totalFilms: filmHealth?.length || 0,
      withBookId: filmHealth?.filter((f) => f.book_id).length || 0,
      withPoster: filmHealth?.filter((f) => f.poster_url).length || 0,
      withTrailer: filmHealth?.filter((f) => f.trailer_url).length || 0,
      withBookCover: filmHealth?.filter((f) => f.book_cover_url).length || 0,
    };

    console.log("✅ [AdminCountFilms] Diagnostic complete:", JSON.stringify(results, null, 2));

    return json(200, {
      success: true,
      diagnostics: results,
    });
  } catch (err) {
    console.error("❌ [AdminCountFilms] Error:", err);
    return json(500, { error: "Diagnostic failed", details: String(err) });
  }
});
