import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  historical_context: string;
  temporal_significance: string;
  era_classification: string;
  connections: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
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
        const prompt = `
Analyze this science fiction book and provide temporal information in JSON format:

Title: "${book.title}"
Author: "${book.author}"

Please provide:
1. publication_year: The actual year this book was published (number)
2. narrative_time_period: The time period the story takes place in (e.g., "2157", "Far Future", "22nd Century")
3. historical_context: Brief context about when this was written and its significance
4. temporal_significance: Why this book is important in SF chronology
5. era_classification: Which era it belongs to (e.g., "Golden Age", "New Wave", "Cyberpunk", "Modern")
6. connections: Array of related themes or concepts that connect it to other works

Return ONLY valid JSON with these exact field names.
`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are an expert in science fiction literature and chronology. Provide accurate, well-researched information about SF books and their temporal contexts.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
          }),
        });

        const aiResponse = await response.json();
        const enrichedInfo = JSON.parse(aiResponse.choices[0].message.content);

        // Update the database with enriched information
        const { error: updateError } = await supabase
          .from('transmissions')
          .update({
            publication_year: enrichedInfo.publication_year,
            narrative_time_period: enrichedInfo.narrative_time_period,
            historical_context_tags: enrichedInfo.connections,
            notes: enrichedInfo.historical_context + '\n\nTemporal Significance: ' + enrichedInfo.temporal_significance
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});