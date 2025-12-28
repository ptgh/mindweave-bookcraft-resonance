import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAdminOrInternal, corsHeaders, createServiceClient } from "../_shared/adminAuth.ts";
import { TEMPORAL_CONTEXT_TAGS } from '../_shared/temporalTags.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface BookData {
  id: number;
  title: string;
  author: string;
  publication_year?: number;
  narrative_time_period?: string;
  created_at: string;
}

interface EnrichedBookData {
  publication_year: number;
  narrative_time_period: string;
  literary_era: string[];
  historical_forces: string[];
  technological_context: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require admin authorization
  const auth = await requireAdminOrInternal(req);
  if (auth instanceof Response) return auth;

  try {
    const supabase = createServiceClient();
    
    // Get all transmissions that need enrichment
    const { data: transmissions, error } = await supabase
      .from('transmissions')
      .select('id, title, author, publication_year, narrative_time_period, created_at')
      .or('publication_year.is.null,narrative_time_period.is.null');

    if (error) {
      console.error('Error fetching transmissions:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${transmissions?.length || 0} transmissions for enrichment`);

    const enrichedData = [];

    for (const book of transmissions || []) {
      try {
        const prompt = `Analyze this science fiction book's temporal context: "${book.title}" by ${book.author}.

You must select appropriate tags from the controlled vocabulary provided in the tool schema. Be selective and precise - choose only the most relevant tags that directly apply to this book's historical and technological context.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: 'You are an expert in science fiction literature and history. Analyze books and select appropriate temporal context tags from the provided controlled vocabulary. Be selective - only choose tags that directly apply to the book.' 
              },
              { role: 'user', content: prompt }
            ],
            tools: [{
              type: "function",
              function: {
                name: "enrich_temporal_context",
                description: "Enrich a science fiction book with structured temporal metadata",
                parameters: {
                  type: "object",
                  properties: {
                    publication_year: { 
                      type: "number",
                      description: "Actual publication year of the book"
                    },
                    narrative_time_period: { 
                      type: "string",
                      description: "When the story takes place (e.g., '2157', 'Far Future', '22nd Century')"
                    },
                    literary_era: {
                      type: "array",
                      description: "Literary movement(s) the book belongs to - select 1-3 most relevant",
                      items: {
                        type: "string",
                        enum: TEMPORAL_CONTEXT_TAGS.literaryEra
                      }
                    },
                    historical_forces: {
                      type: "array",
                      description: "Historical context that influenced the book - select 2-5 most relevant",
                      items: {
                        type: "string",
                        enum: TEMPORAL_CONTEXT_TAGS.historicalForces
                      }
                    },
                    technological_context: {
                      type: "array",
                      description: "Technological era(s) relevant to the book - select 2-5 most relevant",
                      items: {
                        type: "string",
                        enum: TEMPORAL_CONTEXT_TAGS.technologicalContext
                      }
                    }
                  },
                  required: ["publication_year", "narrative_time_period", "literary_era", "historical_forces", "technological_context"]
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "enrich_temporal_context" } },
            temperature: 0.3,
          }),
        });

        const aiResponse = await response.json();
        const toolCall = aiResponse.choices[0].message.tool_calls?.[0];
        
        if (!toolCall) {
          console.error(`No tool call for ${book.title}`);
          continue;
        }

        const enrichedInfo = JSON.parse(toolCall.function.arguments);

        // Flatten all temporal tags into single array
        const temporal_tags = [
          ...(enrichedInfo.literary_era || []),
          ...(enrichedInfo.historical_forces || []),
          ...(enrichedInfo.technological_context || [])
        ];

        // Update the database with enriched information
        const { error: updateError } = await supabase
          .from('transmissions')
          .update({
            publication_year: enrichedInfo.publication_year,
            narrative_time_period: enrichedInfo.narrative_time_period,
            temporal_context_tags: temporal_tags
          })
          .eq('id', book.id);

        if (updateError) {
          console.error(`Error updating book ${book.id}:`, updateError);
        } else {
          console.log(`Successfully enriched: ${book.title}`);
          enrichedData.push({
            id: book.id,
            title: book.title,
            ...enrichedInfo
          });
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing book ${book.title}:`, error);
        // Continue with next book even if this one fails
      }
    }

    return new Response(JSON.stringify({ 
      message: `Successfully enriched ${enrichedData.length} books`,
      enriched: enrichedData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enrich-timeline-data function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
