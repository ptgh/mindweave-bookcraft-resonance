import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authorName, authorId, bio, nationality, birthYear, deathYear } = await req.json();

    if (!authorName || !authorId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if portrait already exists
    const { data: existing } = await supabase
      .from("scifi_authors")
      .select("portrait_url")
      .eq("id", authorId)
      .maybeSingle();

    if (existing?.portrait_url) {
      return new Response(
        JSON.stringify({ portraitUrl: existing.portrait_url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from available data
    const eraHint = birthYear
      ? `Born in ${birthYear}${deathYear ? `, died in ${deathYear}` : ""}.`
      : "";
    const nationalityHint = nationality ? `Nationality: ${nationality}.` : "";
    const bioHint = bio ? `Bio context: ${bio.slice(0, 200)}` : "";

    const prompt = `Create a photorealistic portrait of the real science fiction author ${authorName}. 
${eraHint} ${nationalityHint} ${bioHint}

CRITICAL REQUIREMENTS:
- This must look like a REAL PHOTOGRAPH of the actual person, not an illustration or cartoon
- Use photographic lighting, realistic skin textures, and natural expressions
- If the author is well-known, aim for accuracy to their real appearance
- If less known, create a believable photorealistic portrait appropriate to their era and background
- Portrait composition: head and shoulders, slightly off-center
- Background MUST be dark — deep navy, charcoal, or near-black tones. NEVER use white or light backgrounds
- Professional author portrait style, warm but moody lighting
- Square 1:1 aspect ratio`;

    let imageDataUrl: string | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI gateway error:", aiResponse.status, errText);
        
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI generation failed: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      imageDataUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;

      if (imageDataUrl) break;
      console.warn(`Attempt ${attempt + 1}: No image in AI response, retrying...`);
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!imageDataUrl) {
      throw new Error("No image generated after retries");
    }

    const base64Match = imageDataUrl.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format");
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const storagePath = `${authorId}.${imageFormat === 'jpeg' ? 'jpg' : imageFormat}`;
    const contentType = `image/${imageFormat}`;

    const { error: uploadError } = await supabase.storage
      .from("author-portraits")
      .upload(storagePath, bytes, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("author-portraits")
      .getPublicUrl(storagePath);

    const portraitUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from("scifi_authors")
      .update({ portrait_url: portraitUrl })
      .eq("id", authorId);

    if (updateError) {
      console.error("DB update error:", updateError);
    }

    return new Response(JSON.stringify({ portraitUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-author-portrait error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
