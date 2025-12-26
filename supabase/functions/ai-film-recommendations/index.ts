import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get existing films for context
    const { data: existingFilms } = await supabase
      .from('sf_film_adaptations')
      .select('film_title, book_title, book_author')
      .limit(50);

    const existingTitles = existingFilms?.map(f => f.film_title).join(', ') || '';

    const systemPrompt = `You are a science fiction film expert. Your task is to suggest classic SF book-to-film adaptations that would be interesting for a curated collection.

Focus on:
- Classic and influential SF adaptations
- Films based on renowned SF literature
- Critically acclaimed adaptations
- Diverse range of eras (1950s-2020s)
- Mix of well-known and hidden gems

Existing films in collection (avoid duplicates): ${existingTitles}`;

    const userPrompt = `Suggest 6 science fiction film adaptations that are NOT already in the collection. For each, provide:
1. Film title
2. Book title
3. Author
4. Year of film
5. Director
6. A brief reason why it's notable (1 sentence)

Return ONLY a JSON array with this structure:
[
  {
    "film_title": "...",
    "book_title": "...",
    "author": "...",
    "year": 1999,
    "director": "...",
    "reason": "..."
  }
]`;

    console.log('Calling Lovable AI for film recommendations...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response received, parsing...');

    // Extract JSON from response
    let recommendations = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      recommendations = [];
    }

    console.log(`Parsed ${recommendations.length} recommendations`);

    return new Response(JSON.stringify({ 
      recommendations,
      message: `Found ${recommendations.length} new adaptation suggestions`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-film-recommendations:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendations: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
