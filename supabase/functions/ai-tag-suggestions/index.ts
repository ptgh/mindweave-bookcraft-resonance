import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { title, author, description, currentTags, userTaggingPatterns } = await req.json();

    if (!title || !author) {
      return new Response(
        JSON.stringify({ error: 'Title and author are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create book identifier for caching
    const bookIdentifier = `${title.toLowerCase().trim()}|${author.toLowerCase().trim()}`;

    // Check cache first
    const { data: cached } = await supabase
      .from('book_ai_tags')
      .select('suggested_tags, cached_at')
      .eq('book_identifier', bookIdentifier)
      .order('cached_at', { ascending: false })
      .limit(1)
      .single();

    // Return cached if less than 30 days old
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.cached_at).getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      
      if (cacheAge < thirtyDays) {
        console.log('Returning cached tag suggestions');
        return new Response(
          JSON.stringify({ suggestions: cached.suggested_tags }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get available conceptual tags from constants
    const availableTags = [
      "AI Consciousness",
      "Post-Singularity",
      "Space Exploration",
      "Cyberpunk",
      "Time Travel",
      "First Contact",
      "Dystopian Future",
      "Utopian Vision",
      "Transhumanism",
      "Virtual Reality",
      "Climate Fiction",
      "Hard SF",
      "Soft SF",
      "Philosophy",
      "Existential",
      "Political",
      "Social Commentary"
    ];

    // Call Lovable AI for tag suggestions
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert science fiction literary analyst. Suggest relevant conceptual tags for science fiction books.

Available tags: ${availableTags.join(', ')}

Rules:
1. Suggest 3-5 tags maximum
2. Return ONLY tags from the available list
3. Assign confidence scores (0-100)
4. Provide brief reasons for each suggestion
5. Consider user's tagging patterns if provided
6. Avoid already selected tags: ${currentTags?.join(', ') || 'none'}

Return JSON format:
{
  "suggestions": [
    { "name": "tag name", "confidence": 95, "reason": "brief explanation" }
  ]
}`;

    const userPrompt = `Book: "${title}" by ${author}${description ? `\n\nDescription: ${description}` : ''}${userTaggingPatterns?.length ? `\n\nUser typically tags books with: ${userTaggingPatterns.join(', ')}` : ''}

Suggest appropriate conceptual tags.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    const suggestions: TagSuggestion[] = parsed.suggestions || [];

    // Cache the results
    await supabase.from('book_ai_tags').insert({
      book_identifier: bookIdentifier,
      suggested_tags: suggestions,
      cached_at: new Date().toISOString()
    });

    console.log(`Generated ${suggestions.length} tag suggestions for "${title}"`);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-tag-suggestions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});