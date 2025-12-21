import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function generateBookIdentifier(title: string, author: string): string {
  const normalized = `${title.toLowerCase().trim()}|${author.toLowerCase().trim()}`;
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `transmission_${Math.abs(hash).toString(16)}`;
}

function buildEmbeddingText(transmission: Record<string, unknown>): string {
  const parts: string[] = [];
  
  parts.push(`Title: ${transmission.title || 'Unknown'}`);
  parts.push(`Author: ${transmission.author || 'Unknown'}`);
  
  if (transmission.notes) {
    parts.push(`Notes: ${transmission.notes}`);
  }
  
  if (transmission.tags) {
    const tags = typeof transmission.tags === 'string' 
      ? transmission.tags 
      : Array.isArray(transmission.tags) 
        ? transmission.tags.join(', ') 
        : '';
    if (tags) parts.push(`Tags: ${tags}`);
  }
  
  if (transmission.resonance_labels) {
    parts.push(`Resonance: ${transmission.resonance_labels}`);
  }
  
  if (transmission.thematic_constellation) {
    parts.push(`Themes: ${transmission.thematic_constellation}`);
  }

  if (transmission.temporal_context_tags && Array.isArray(transmission.temporal_context_tags)) {
    parts.push(`Temporal Context: ${transmission.temporal_context_tags.join(', ')}`);
  }

  if (transmission.historical_context_tags && Array.isArray(transmission.historical_context_tags)) {
    parts.push(`Historical Context: ${transmission.historical_context_tags.join(', ')}`);
  }
  
  if (transmission.publication_year) {
    parts.push(`Published: ${transmission.publication_year}`);
  }
  
  return parts.join('\n');
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI embedding error:', error);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { userId, limit = 50, skipExisting = true } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Generating embeddings for transmissions. userId: ${userId || 'all'}, limit: ${limit}`);

    // Fetch transmissions
    let query = supabase
      .from('transmissions')
      .select('id, title, author, notes, tags, resonance_labels, thematic_constellation, temporal_context_tags, historical_context_tags, publication_year, cover_url')
      .not('title', 'is', null)
      .not('author', 'is', null)
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: transmissions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching transmissions:', fetchError);
      throw fetchError;
    }

    if (!transmissions || transmissions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No transmissions found', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${transmissions.length} transmissions to process`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const transmission of transmissions) {
      const bookIdentifier = generateBookIdentifier(
        transmission.title || '', 
        transmission.author || ''
      );

      try {
        // Check if embedding exists
        if (skipExisting) {
          const { data: existing } = await supabase
            .from('book_embeddings')
            .select('id')
            .eq('book_identifier', bookIdentifier)
            .maybeSingle();

          if (existing) {
            console.log(`Skipping existing: ${transmission.title}`);
            skipped++;
            continue;
          }
        }

        // Build embedding text
        const embeddingText = buildEmbeddingText(transmission);
        
        // Generate embedding
        const embedding = await generateEmbedding(embeddingText);

        // Store embedding
        const { error: insertError } = await supabase
          .from('book_embeddings')
          .upsert({
            book_identifier: bookIdentifier,
            title: transmission.title,
            author: transmission.author,
            embedding: embedding,
            embedding_text: embeddingText,
            source_type: 'transmission',
            metadata: {
              transmission_id: transmission.id,
              cover_url: transmission.cover_url,
              tags: transmission.tags,
              publication_year: transmission.publication_year,
              thematic_constellation: transmission.thematic_constellation,
            },
          }, { onConflict: 'book_identifier' });

        if (insertError) {
          console.error(`Error storing embedding for ${transmission.title}:`, insertError);
          errors++;
        } else {
          console.log(`Created embedding: ${transmission.title}`);
          processed++;
        }

        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, 150));

      } catch (error) {
        console.error(`Error processing ${transmission.title}:`, error);
        errors++;
      }
    }

    console.log(`Completed: ${processed} processed, ${skipped} skipped, ${errors} errors`);

    return new Response(
      JSON.stringify({ 
        success: true,
        total: transmissions.length,
        processed,
        skipped,
        errors,
        message: `Generated ${processed} embeddings from ${transmissions.length} transmissions`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-transmission-embeddings:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
