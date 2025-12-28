import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAdminOrInternal, corsHeaders } from "../_shared/adminAuth.ts";

interface CuratedBook {
  title: string;
  author: string;
  category: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require admin authorization
  const auth = await requireAdminOrInternal(req);
  if (auth instanceof Response) return auth;

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'LOVABLE_API_KEY not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Starting curated books population via AI generation...');

    // Use AI to generate contemporary sci-fi book recommendations
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a science fiction literature expert. Return only valid JSON arrays, no markdown or explanations.'
          },
          {
            role: 'user',
            content: `Generate a JSON array of 50 notable science fiction books. Include:
- Classic SF authors (Asimov, Clarke, Dick, Le Guin, Herbert, etc.)
- Modern award winners (Hugo, Nebula nominees 2015-2024)
- International SF (Liu Cixin, Lem, Strugatsky)
- Diverse voices (Jemisin, Butler, Okorafor, etc.)

Return ONLY a valid JSON array with this exact format:
[{"title": "Book Title", "author": "Author Name", "category": "Subgenre"}]

No markdown, no explanations, just the JSON array.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `AI API error: ${response.status}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const geminiContent = data.choices?.[0]?.message?.content || '';
    console.log('AI response received, parsing JSON...');

    // Parse the AI response - use proper JSON.parse with error handling
    let books: CuratedBook[] = [];
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedContent = geminiContent.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7);
      }
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      cleanedContent = cleanedContent.trim();
      
      books = JSON.parse(cleanedContent);
      
      if (!Array.isArray(books)) {
        throw new Error('Response is not an array');
      }
      
      // Validate each book has required fields
      books = books.filter(book => 
        typeof book.title === 'string' && 
        typeof book.author === 'string' && 
        book.title.length > 0 && 
        book.author.length > 0
      );
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw content:', geminiContent.substring(0, 500));
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to parse AI response as valid JSON',
        details: parseError instanceof Error ? parseError.message : 'Parse error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (books.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No valid books found in AI response' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Parsed ${books.length} books from AI response`);

    let booksAdded = 0;
    let booksSkipped = 0;

    for (const book of books) {
      // Check if already exists (case-insensitive)
      const { data: existing } = await supabase
        .from('transmissions')
        .select('id')
        .ilike('title', book.title)
        .ilike('author', book.author)
        .limit(1);

      if (existing && existing.length > 0) {
        booksSkipped++;
        continue;
      }

      const { error } = await supabase
        .from('transmissions')
        .insert({
          title: book.title,
          author: book.author,
          tags: book.category || 'Science Fiction',
        });

      if (!error) {
        booksAdded++;
      } else {
        console.warn(`Failed to insert "${book.title}":`, error.message);
      }
    }

    console.log(`Population complete: ${booksAdded} added, ${booksSkipped} skipped`);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        booksAdded,
        booksSkipped,
        totalProcessed: books.length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error populating curated books:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
