import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAdminOrInternal, corsHeaders, createServiceClient } from "../_shared/adminAuth.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface BookData {
  title: string;
  author: string;
  description?: string;
  tags?: string[];
  genres?: string[];
  themes?: string[];
  awards?: string[];
  firstParagraph?: string;
  sourceType?: string;
  metadata?: Record<string, unknown>;
}

function generateBookIdentifier(title: string, author: string): string {
  const normalized = `${title.toLowerCase().trim()}|${author.toLowerCase().trim()}`;
  // Simple hash for identifier
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `book_${Math.abs(hash).toString(16)}`;
}

function buildEmbeddingText(book: BookData): string {
  const parts: string[] = [];
  
  parts.push(`Title: ${book.title}`);
  parts.push(`Author: ${book.author}`);
  
  if (book.description) {
    parts.push(`Description: ${book.description}`);
  }
  
  if (book.tags && book.tags.length > 0) {
    parts.push(`Tags: ${book.tags.join(', ')}`);
  }
  
  if (book.genres && book.genres.length > 0) {
    parts.push(`Genres: ${book.genres.join(', ')}`);
  }
  
  if (book.themes && book.themes.length > 0) {
    parts.push(`Themes: ${book.themes.join(', ')}`);
  }
  
  if (book.awards && book.awards.length > 0) {
    parts.push(`Awards: ${book.awards.join(', ')}`);
  }
  
  if (book.firstParagraph) {
    parts.push(`Excerpt: ${book.firstParagraph}`);
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
      input: text.slice(0, 8000), // Token limit safety
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

  // Require admin authorization
  const auth = await requireAdminOrInternal(req);
  if (auth instanceof Response) return auth;

  try {
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { books, singleBook } = await req.json();
    const supabase = createServiceClient();

    // Handle single book or batch
    const booksToProcess: BookData[] = singleBook ? [singleBook] : (books || []);
    
    if (booksToProcess.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No books provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${booksToProcess.length} books for embedding generation`);

    const results: Array<{ bookIdentifier: string; success: boolean; error?: string }> = [];

    for (const book of booksToProcess) {
      const bookIdentifier = generateBookIdentifier(book.title, book.author);
      
      try {
        // Check if embedding already exists
        const { data: existing } = await supabase
          .from('book_embeddings')
          .select('id')
          .eq('book_identifier', bookIdentifier)
          .maybeSingle();

        if (existing) {
          console.log(`Embedding already exists for: ${book.title}`);
          results.push({ bookIdentifier, success: true });
          continue;
        }

        // Build text for embedding
        const embeddingText = buildEmbeddingText(book);
        
        // Generate embedding
        const embedding = await generateEmbedding(embeddingText);

        // Store in database
        const { error: insertError } = await supabase
          .from('book_embeddings')
          .insert({
            book_identifier: bookIdentifier,
            title: book.title,
            author: book.author,
            embedding: embedding,
            embedding_text: embeddingText,
            source_type: book.sourceType || 'transmission',
            metadata: book.metadata || {},
          });

        if (insertError) {
          console.error(`Error storing embedding for ${book.title}:`, insertError);
          results.push({ bookIdentifier, success: false, error: insertError.message });
        } else {
          console.log(`Successfully created embedding for: ${book.title}`);
          results.push({ bookIdentifier, success: true });
        }

        // Small delay to avoid rate limits
        if (booksToProcess.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error processing ${book.title}:`, error);
        results.push({ 
          bookIdentifier, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Completed: ${successCount}/${booksToProcess.length} embeddings generated`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: booksToProcess.length,
        successful: successCount,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-embedding:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
