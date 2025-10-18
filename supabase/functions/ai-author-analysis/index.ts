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
    const { authorName, compareWith } = await req.json();

    if (!authorName) {
      return new Response(
        JSON.stringify({ error: 'Author name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const authorIdentifier = authorName.toLowerCase().replace(/\s+/g, '-');
    const { data: cachedData } = await supabase
      .from('author_ai_analysis')
      .select('analysis_data, cached_at')
      .eq('author_identifier', authorIdentifier)
      .order('cached_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Return cached if less than 7 days old
    if (cachedData && cachedData.cached_at) {
      const cacheAge = Date.now() - new Date(cachedData.cached_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (cacheAge < sevenDays) {
        console.log('Returning cached author analysis');
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

    let prompt = `Analyze ${authorName} as a science fiction author.`;
    
    if (compareWith && compareWith.length > 0) {
      prompt += `\n\nCompare with: ${compareWith.slice(0, 3).join(', ')}`;
    }

    prompt += `\n\nProvide a JSON response with:
1. influences: Array of 2-3 notable influences/predecessors (if known)
2. thematic_signature: 2-3 recurring themes across their work
3. stylistic_notes: 1-2 sentences on their writing style or approach
4. connections: If comparing with other authors, explain the relationships

Return ONLY valid JSON:
{
  "influences": ["Author 1 (reason)", "Author 2 (reason)"],
  "thematic_signature": ["Theme 1", "Theme 2"],
  "stylistic_notes": "...",
  "connections": "..."
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
          { role: 'system', content: 'You are an expert in science fiction literature and author relationships. Return only valid JSON.' },
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
    await supabase.from('author_ai_analysis').insert({
      author_identifier: authorIdentifier,
      analysis_data: analysis,
      cached_at: new Date().toISOString(),
    });

    console.log(`Generated analysis for author: ${authorName}`);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-author-analysis:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
