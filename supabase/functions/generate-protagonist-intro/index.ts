import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { bookTitle, bookAuthor, protagonistName, transmissionId } = await req.json();

    if (!bookTitle || !bookAuthor || !protagonistName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating protagonist intro for: ${protagonistName} in "${bookTitle}" by ${bookAuthor}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a literary expert who writes evocative, immersive one-sentence descriptions of science fiction worlds through the eyes of their protagonists. Your descriptions should make readers feel the atmosphere of the world and want to step into it. Focus on the specific world, setting, and stakes — not plot summaries. Keep it to 1-2 sentences max, under 40 words. Do not use quotation marks. Do not mention the book title or author.`,
          },
          {
            role: "user",
            content: `Write a one-sentence evocative world description for ${protagonistName}, the protagonist of "${bookTitle}" by ${bookAuthor}. Describe their world and what drives them, making a reader want to step into that world and speak to them.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const intro = data.choices?.[0]?.message?.content?.trim();

    if (!intro) {
      throw new Error("No intro generated");
    }

    console.log(`Generated intro: ${intro}`);

    // Store in database if transmissionId provided
    if (transmissionId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { error: updateError } = await supabase
        .from("transmissions")
        .update({ protagonist_intro: intro })
        .eq("id", transmissionId);

      if (updateError) {
        console.error("Error storing intro:", updateError);
      } else {
        console.log(`Stored intro for transmission ${transmissionId}`);
      }
    }

    return new Response(JSON.stringify({ intro }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-protagonist-intro error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
