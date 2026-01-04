import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, requireUser, createUserClient, json } from "../_shared/adminAuth.ts";
import { CONCEPTUAL_TAGS } from "../_shared/conceptualTags.ts";

interface TagSuggestion {
  name: string;
  confidence: number;
  reason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated user
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  try {
    const { title, author, description, currentTags, userTaggingPatterns } = await req.json();

    if (!title || !author) {
      return json(400, { error: 'Title and author are required' });
    }

    const supabase = createUserClient(auth.token);

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
        return json(200, { suggestions: cached.suggested_tags });
      }
    }

    // Use official CONCEPTUAL_TAGS from shared constants
    const availableTags = [...CONCEPTUAL_TAGS];

    // Call Lovable AI for tag suggestions
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert science fiction literary analyst. Suggest relevant conceptual tags for science fiction books.

Available tags (ONLY use these exact tags): ${availableTags.join(', ')}

Rules:
1. Suggest 2-4 tags maximum
2. Return ONLY tags from the available list exactly as written
3. Assign confidence scores (0-100)
4. Provide brief reasons for each suggestion
5. Consider user's tagging patterns if provided
6. Avoid already selected tags: ${currentTags?.join(', ') || 'none'}

Return JSON format:
{
  "suggestions": [
    { "name": "exact tag name from list", "confidence": 95, "reason": "brief explanation" }
  ]
}`;

    const userPrompt = `Book: "${title}" by ${author}${description ? `\n\nDescription: ${description}` : ''}${userTaggingPatterns?.length ? `\n\nUser typically tags books with: ${userTaggingPatterns.join(', ')}` : ''}

Suggest appropriate conceptual tags from the available list.`;

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
    
    // Filter to ensure only valid CONCEPTUAL_TAGS are returned
    const suggestions: TagSuggestion[] = (parsed.suggestions || []).filter(
      (s: TagSuggestion) => availableTags.includes(s.name)
    );

    // Cache the results
    await supabase.from('book_ai_tags').insert({
      book_identifier: bookIdentifier,
      suggested_tags: suggestions,
      cached_at: new Date().toISOString()
    });

    console.log(`Generated ${suggestions.length} tag suggestions for "${title}"`);

    return json(200, { suggestions });

  } catch (error) {
    console.error('Error in ai-tag-suggestions:', error);
    return json(500, { error: (error as Error).message });
  }
});