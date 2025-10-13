import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CuratedBook {
  title: string;
  author: string;
  category: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting curated books population...');

    // Get list of additional respected sci-fi books using Gemini
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
            content: 'You are a science fiction literature expert. Provide a diverse list of respected sci-fi books.'
          },
          {
            role: 'user',
            content: `Generate a list of 30 additional respected science fiction books that complement classics and contemporary works. Include diverse subgenres: space opera, cyberpunk, time travel, first contact, dystopian, post-apocalyptic, hard sci-fi, social sci-fi, etc. Format each as: \"Title\" by Author (Category). Focus on books from 1990-2024 that are highly regarded.`
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const geminiResponse = data.choices[0].message.content;
    console.log('Gemini response received');

    // Parse the Gemini response to extract books
    const bookPattern = /\"([^\"]+)\"\s+by\s+([^(]+)\s*\(([^)]+)\)/gi;
    const geminiBooks: CuratedBook[] = [];
    let match;
    
    while ((match = bookPattern.exec(geminiResponse)) !== null) {
      geminiBooks.push({
        title: match[1].trim(),
        author: match[2].trim(),
        category: match[3].trim()
      });
    }

    console.log(`Parsed ${geminiBooks.length} books from Gemini`);

    // Hardcoded curated list from Wikipedia + existing
    const curatedBooks: CuratedBook[] = [
      // Existing curated books (keeping them)
      { title: "Dune", author: "Frank Herbert", category: "Space Opera" },
      { title: "Foundation", author: "Isaac Asimov", category: "Space Opera" },
      { title: "Neuromancer", author: "William Gibson", category: "Cyberpunk" },
      { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", category: "Social Science Fiction" },
      { title: "Hyperion", author: "Dan Simmons", category: "Space Opera" },
      
      // Wikipedia list additions (not already in list)
      { title: "The Stars My Destination", author: "Alfred Bester", category: "Space Opera" },
      { title: "A Canticle for Leibowitz", author: "Walter M. Miller Jr.", category: "Post-Apocalyptic" },
      { title: "Flowers for Algernon", author: "Daniel Keyes", category: "Social Science Fiction" },
      { title: "Do Androids Dream of Electric Sheep?", author: "Philip K. Dick", category: "Dystopian" },
      { title: "The Dispossessed", author: "Ursula K. Le Guin", category: "Anarchist Science Fiction" },
      { title: "Stand on Zanzibar", author: "John Brunner", category: "Dystopian" },
      { title: "A Clockwork Orange", author: "Anthony Burgess", category: "Dystopian" },
      { title: "The Man in the High Castle", author: "Philip K. Dick", category: "Alternate History" },
      { title: "Cat's Cradle", author: "Kurt Vonnegut", category: "Satire" },
      { title: "The Female Man", author: "Joanna Russ", category: "Feminist Science Fiction" },
      { title: "Tau Zero", author: "Poul Anderson", category: "Hard Science Fiction" },
      { title: "Riddley Walker", author: "Russell Hoban", category: "Post-Apocalyptic" },
      { title: "The Shadow of the Torturer", author: "Gene Wolfe", category: "Dying Earth" },
      { title: "Wild Seed", author: "Octavia E. Butler", category: "Science Fantasy" },
      { title: "Timescape", author: "Gregory Benford", category: "Hard Science Fiction" },
      { title: "The End of Eternity", author: "Isaac Asimov", category: "Time Travel" },
      { title: "The Sirens of Titan", author: "Kurt Vonnegut", category: "Space Opera" },
      { title: "Way Station", author: "Clifford D. Simak", category: "First Contact" },
      { title: "The Drowned World", author: "J. G. Ballard", category: "Climate Fiction" },
      { title: "Crash", author: "J. G. Ballard", category: "New Wave" },
      { title: "High Rise", author: "J. G. Ballard", category: "Social Science Fiction" },
      { title: "The Crystal World", author: "J. G. Ballard", category: "New Wave" },
      { title: "The Wanderer", author: "Fritz Leiber", category: "Space Opera" },
      { title: "Nova", author: "Samuel R. Delany", category: "Space Opera" },
      { title: "Engine Summer", author: "John Crowley", category: "Post-Apocalyptic" },
    ];

    // Merge with Gemini books
    const allBooks = [...curatedBooks, ...geminiBooks];
    
    // Remove duplicates based on title (case-insensitive)
    const uniqueBooks = allBooks.reduce((acc, book) => {
      const key = book.title.toLowerCase();
      if (!acc.has(key)) {
        acc.set(key, book);
      }
      return acc;
    }, new Map<string, CuratedBook>());

    const finalBooks = Array.from(uniqueBooks.values());
    console.log(`Final unique book count: ${finalBooks.length}`);

    // Process each book: find or create author, add book if not exists
    const results = {
      authorsCreated: 0,
      authorsFound: 0,
      booksAdded: 0,
      booksSkipped: 0,
      errors: [] as string[]
    };

    for (const book of finalBooks) {
      try {
        // Find or create author
        const { data: authorId, error: authorError } = await supabase
          .rpc('find_or_create_scifi_author', { author_name: book.author });

        if (authorError) {
          console.error(`Error finding/creating author ${book.author}:`, authorError);
          results.errors.push(`Author ${book.author}: ${authorError.message}`);
          continue;
        }

        if (!authorId) {
          results.errors.push(`Failed to get author ID for ${book.author}`);
          continue;
        }

        // Check if book already exists for this author
        const { data: existingBook } = await supabase
          .from('author_books')
          .select('id')
          .eq('author_id', authorId)
          .ilike('title', book.title)
          .single();

        if (existingBook) {
          results.booksSkipped++;
          console.log(`Book already exists: ${book.title} by ${book.author}`);
          continue;
        }

        // Insert book
        const { error: bookError } = await supabase
          .from('author_books')
          .insert({
            author_id: authorId,
            title: book.title,
            categories: [book.category]
          });

        if (bookError) {
          console.error(`Error inserting book ${book.title}:`, bookError);
          results.errors.push(`Book ${book.title}: ${bookError.message}`);
        } else {
          results.booksAdded++;
          console.log(`Added book: ${book.title} by ${book.author}`);
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${book.title}: ${errorMsg}`);
      }
    }

    console.log('Population complete:', results);

    return new Response(JSON.stringify({
      success: true,
      message: 'Curated books populated successfully',
      stats: results,
      totalProcessed: finalBooks.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in populate-curated-books:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

