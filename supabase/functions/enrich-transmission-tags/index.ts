import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, requireAdminOrInternal, createServiceClient, json } from "../_shared/adminAuth.ts";
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

  // Require admin for batch operations
  const auth = await requireAdminOrInternal(req);
  if (auth instanceof Response) return auth;

  try {
    const { limit = 50, minConfidence = 70 } = await req.json().catch(() => ({}));
    
    const supabase = createServiceClient();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get transmissions with empty or null tags
    const { data: transmissions, error: fetchError } = await supabase
      .from('transmissions')
      .select('id, title, author, tags')
      .or('tags.is.null,tags.eq.[]')
      .limit(limit);

    if (fetchError) {
      console.error('Error fetching transmissions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${transmissions?.length || 0} transmissions to enrich`);

    const results = {
      processed: 0,
      enriched: 0,
      skipped: 0,
      errors: 0
    };

    const availableTags = [...CONCEPTUAL_TAGS];

    for (const transmission of transmissions || []) {
      results.processed++;
      
      if (!transmission.title || !transmission.author) {
        results.skipped++;
        continue;
      }

      try {
        // Check for cached suggestions first
        const bookIdentifier = `${transmission.title.toLowerCase().trim()}|${transmission.author.toLowerCase().trim()}`;
        
        const { data: cached } = await supabase
          .from('book_ai_tags')
          .select('suggested_tags')
          .eq('book_identifier', bookIdentifier)
          .order('cached_at', { ascending: false })
          .limit(1)
          .single();

        let suggestions: TagSuggestion[] = [];

        if (cached?.suggested_tags) {
          suggestions = cached.suggested_tags as TagSuggestion[];
          console.log(`Using cached suggestions for "${transmission.title}"`);
        } else {
          // Generate new suggestions via AI
          const systemPrompt = `You are an expert science fiction literary analyst. Suggest relevant conceptual tags for science fiction books.

Available tags (ONLY use these exact tags): ${availableTags.join(', ')}

Rules:
1. Suggest 2-4 tags maximum
2. Return ONLY tags from the available list exactly as written
3. Assign confidence scores (0-100)
4. Provide brief reasons for each suggestion

Return JSON format:
{
  "suggestions": [
    { "name": "exact tag name from list", "confidence": 95, "reason": "brief explanation" }
  ]
}`;

          const userPrompt = `Book: "${transmission.title}" by ${transmission.author}

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
            console.error(`AI error for "${transmission.title}":`, aiResponse.status);
            results.errors++;
            continue;
          }

          const aiData = await aiResponse.json();
          const content = aiData.choices[0].message.content;
          const parsed = JSON.parse(content);
          
          suggestions = (parsed.suggestions || []).filter(
            (s: TagSuggestion) => availableTags.includes(s.name)
          );

          // Cache the suggestions
          await supabase.from('book_ai_tags').insert({
            book_identifier: bookIdentifier,
            suggested_tags: suggestions,
            cached_at: new Date().toISOString()
          });

          // Rate limit to avoid hitting API limits
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Apply high-confidence tags
        const tagsToApply = suggestions
          .filter(s => s.confidence >= minConfidence)
          .map(s => s.name);

        if (tagsToApply.length > 0) {
          const { error: updateError } = await supabase
            .from('transmissions')
            .update({ tags: JSON.stringify(tagsToApply) })
            .eq('id', transmission.id);

          if (updateError) {
            console.error(`Error updating transmission ${transmission.id}:`, updateError);
            results.errors++;
          } else {
            console.log(`Enriched "${transmission.title}" with tags: ${tagsToApply.join(', ')}`);
            results.enriched++;
          }
        } else {
          results.skipped++;
        }

      } catch (error) {
        console.error(`Error processing "${transmission.title}":`, error);
        results.errors++;
      }
    }

    console.log('Enrichment complete:', results);
    return json(200, { 
      success: true, 
      results,
      message: `Enriched ${results.enriched} of ${results.processed} transmissions`
    });

  } catch (error) {
    console.error('Error in enrich-transmission-tags:', error);
    return json(500, { error: (error as Error).message });
  }
});
