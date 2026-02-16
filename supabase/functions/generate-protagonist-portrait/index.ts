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
    const { bookTitle, bookAuthor, protagonistName, transmissionId } = await req.json();

    if (!bookTitle || !protagonistName || !transmissionId) {
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
      .from("transmissions")
      .select("protagonist_portrait_url")
      .eq("id", transmissionId)
      .maybeSingle();

    if (existing?.protagonist_portrait_url) {
      return new Response(
        JSON.stringify({ portraitUrl: existing.protagonist_portrait_url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate portrait using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Based ONLY on the novel "${bookTitle}" by ${bookAuthor}, create a portrait of the character ${protagonistName}. 

IMPORTANT: Do NOT reference any film, TV, or media adaptation. Base the portrait SOLELY on the literary text description.

Style requirements:
- Painterly, moody art style with rich textures
- Dark sci-fi color palette dominated by deep slate blues, violet/purple accents, and subtle cyan highlights
- Atmospheric lighting with dramatic shadows
- Portrait composition: head and upper shoulders, slightly off-center
- Background should be abstract/atmospheric, suggesting the world of the novel
- The character should feel like they belong in a literary reading app with a neural/cerebral aesthetic
- Square 1:1 aspect ratio portrait`;

    // Retry up to 2 times if AI doesn't return an image
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
      console.warn(`Attempt ${attempt + 1}: No image in AI response, retrying...`, JSON.stringify(aiData).slice(0, 300));
      // Brief pause before retry
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!imageDataUrl) {
      throw new Error("No image generated after retries");
    }

    // Extract base64 data from data URL
    const base64Match = imageDataUrl.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format");
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    
    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const storagePath = `${transmissionId}.${imageFormat === 'jpeg' ? 'jpg' : imageFormat}`;
    const contentType = `image/${imageFormat}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("protagonist-portraits")
      .upload(storagePath, bytes, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("protagonist-portraits")
      .getPublicUrl(storagePath);

    const portraitUrl = urlData.publicUrl;

    // Update transmissions record
    const { error: updateError } = await supabase
      .from("transmissions")
      .update({ protagonist_portrait_url: portraitUrl })
      .eq("id", transmissionId);

    if (updateError) {
      console.error("DB update error:", updateError);
    }

    return new Response(JSON.stringify({ portraitUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-protagonist-portrait error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
