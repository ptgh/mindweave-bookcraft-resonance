import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRecommendation {
  film_title: string;
  book_title: string;
  author: string;
  year: number;
  director: string;
  reason: string;
}

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

    // Get existing films for context and deduplication
    const { data: existingFilms } = await supabase
      .from('sf_film_adaptations')
      .select('film_title, book_title, book_author')
      .limit(100);

    const existingTitles = existingFilms?.map(f => f.film_title.toLowerCase()) || [];
    const existingTitlesStr = existingFilms?.map(f => f.film_title).join(', ') || '';

const systemPrompt = `You are a science fiction film expert. Your task is to suggest classic SF book-to-film adaptations that would be interesting for a curated collection.

Focus on:
- Classic and influential SF adaptations (1920s-2020s)
- Films based on renowned SF literature
- Critically acclaimed adaptations
- Mix of well-known classics and hidden gems
- Diverse range of directors and authors

IMPORTANT: Use only English characters in your responses. Author names must be in English/Latin script only (e.g., "Isaac Asimov" not transliterated names). If there are multiple authors, separate with commas only.

Existing films in collection (AVOID suggesting these): ${existingTitlesStr}`;

    const userPrompt = `Suggest 6 science fiction film adaptations that are NOT already in the collection. For each, provide:
1. Film title (exact title as commonly known)
2. Book title (the source material)
3. Author (of the book/source)
4. Year of film release
5. Director
6. A brief reason why it's notable (1 sentence)

Return ONLY a valid JSON array with this exact structure:
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
    let recommendations: AIRecommendation[] = [];
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

    // Auto-add recommendations to database (avoiding duplicates)
    let addedCount = 0;
    const addedFilms: string[] = [];
    const skippedFilms: string[] = [];

    for (const rec of recommendations) {
      const normalizedTitle = rec.film_title.toLowerCase().trim();
      
      // Check if already exists
      if (existingTitles.includes(normalizedTitle)) {
        skippedFilms.push(rec.film_title);
        console.log(`Skipped (already exists): ${rec.film_title}`);
        continue;
      }

      // Double-check in database
      const { data: existing } = await supabase
        .from('sf_film_adaptations')
        .select('id')
        .ilike('film_title', rec.film_title)
        .limit(1);

      if (existing && existing.length > 0) {
        skippedFilms.push(rec.film_title);
        console.log(`Skipped (found in DB): ${rec.film_title}`);
        continue;
      }

      // Insert new film
      const { error: insertError } = await supabase
        .from('sf_film_adaptations')
        .insert({
          film_title: rec.film_title,
          book_title: rec.book_title,
          book_author: rec.author,
          film_year: rec.year,
          director: rec.director,
          source: 'ai_suggested',
          is_criterion_collection: false,
        });

      if (insertError) {
        console.error(`Failed to insert ${rec.film_title}:`, insertError);
      } else {
        addedCount++;
        addedFilms.push(rec.film_title);
        existingTitles.push(normalizedTitle); // Prevent duplicates in this batch
        console.log(`Added: ${rec.film_title}`);
      }
    }

    console.log(`Added ${addedCount} new films to database`);

    return new Response(JSON.stringify({ 
      recommendations,
      added: addedFilms,
      skipped: skippedFilms,
      addedCount,
      message: addedCount > 0 
        ? `Added ${addedCount} new film${addedCount > 1 ? 's' : ''} to collection!`
        : 'All suggested films are already in your collection.'
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
