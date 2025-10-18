import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { CONCEPTUAL_TAGS } from "../_shared/conceptualTags.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TagSuggestion {
  name: string;
  confidence: number;
  reason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, author, description, userTaggingPatterns } = await req.json();

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
      .from('book_ai_tags')
      .select('suggested_tags, cached_at')
      .eq('book_identifier', bookIdentifier)
      .order('cached_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Return cached if less than 30 days old
    if (cachedData && cachedData.cached_at) {
      const cacheAge = Date.now() - new Date(cachedData.cached_at).getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (cacheAge < thirtyDays) {
        console.log('Returning cached tag suggestions');
        return new Response(
          JSON.stringify({ suggestions: cachedData.suggested_tags }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Call AI for suggestions
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const availableTags = CONCEPTUAL_TAGS.join(', ');
    const userPatterns = userTaggingPatterns ? 
      `\n\nUser's common tags: ${userTaggingPatterns.slice(0, 10).join(', ')}` : '';

    const prompt = `Analyze this science fiction book and suggest 3-5 most relevant conceptual tags from the official list.

Book: "${title}" by ${author}
${description ? `Description: ${description}` : ''}${userPatterns}

Available tags (ONLY use these exact tags):
${availableTags}

Return a JSON array of 3-5 tag suggestions with:
- name (exact match from available tags)
- confidence (0-100)
- reason (one short sentence why this tag fits)

Example format:
[
  {"name": "Cyberpunk", "confidence": 95, "reason": "Explores urban high-tech dystopia themes"},
  {"name": "Post-Cyberpunk", "confidence": 87, "reason": "Features optimistic technology perspectives"}
]`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert in science fiction literature taxonomy. Return only valid JSON.' },
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

    // Parse AI response (handle markdown code blocks)
    let suggestions: TagSuggestion[];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      suggestions = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI suggestions');
    }

    // Validate suggestions match available tags
    const validSuggestions = suggestions
      .filter(s => CONCEPTUAL_TAGS.includes(s.name as any))
      .slice(0, 5);

    if (validSuggestions.length === 0) {
      throw new Error('No valid tag suggestions generated');
    }

    // Cache the results
    await supabase.from('book_ai_tags').insert({
      book_identifier: bookIdentifier,
      suggested_tags: validSuggestions,
      cached_at: new Date().toISOString(),
    });

    console.log(`Generated ${validSuggestions.length} tag suggestions for "${title}"`);

    return new Response(
      JSON.stringify({ suggestions: validSuggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-tag-suggestions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});