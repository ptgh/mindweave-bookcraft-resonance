import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, author, isbn, description } = await req.json();

    if (!title || !author) {
      return new Response(
        JSON.stringify({ error: 'Title and author are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const bookIdentifier = `${title.toLowerCase()}-${author.toLowerCase()}`.replace(/\s+/g, '-');
    const { data: cachedData } = await supabase
      .from('book_ai_analysis')
      .select('analysis_data, cached_at')
      .eq('book_identifier', bookIdentifier)
      .order('cached_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Return cached if less than 30 days old
    if (cachedData && cachedData.cached_at) {
      const cacheAge = Date.now() - new Date(cachedData.cached_at).getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (cacheAge < thirtyDays) {
        console.log('Returning cached book analysis');
        return new Response(
          JSON.stringify(cachedData.analysis_data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Analyze this science fiction book and provide a thematic overview:

Book: "${title}" by ${author}
${description ? `Description: ${description}` : ''}
${isbn ? `ISBN: ${isbn}` : ''}

Provide a JSON response with:
1. synopsis: A theme-focused summary (2-3 sentences) highlighting conceptual elements
2. key_concepts: Array of 3-5 key SF concepts explored (e.g., "Post-Singularity Society", "Consciousness Upload")
3. thematic_elements: Array of 3-4 broader thematic elements (e.g., "Identity", "Power dynamics")
4. reading_experience: One sentence describing what kind of SF reader would enjoy this

Return ONLY valid JSON:
{
  "synopsis": "...",
  "key_concepts": ["...", "..."],
  "thematic_elements": ["...", "..."],
  "reading_experience": "..."
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert in science fiction literature analysis. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse analysis
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      analysis = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse analysis');
    }

    // Cache the results
    await supabase.from('book_ai_analysis').insert({
      book_identifier: bookIdentifier,
      analysis_data: analysis,
      cached_at: new Date().toISOString(),
    });

    console.log(`Generated analysis for "${title}"`);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-book-analysis:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
