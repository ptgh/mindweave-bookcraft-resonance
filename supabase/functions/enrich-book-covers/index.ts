import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleBooksItem {
  volumeInfo: {
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
}

async function searchGoogleBooks(query: string, maxResults = 3): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const items = data.items as GoogleBooksItem[];
    
    if (!items || items.length === 0) return null;
    
    // Get the first available cover image
    for (const item of items) {
      const imageLinks = item.volumeInfo?.imageLinks;
      if (imageLinks?.thumbnail) {
        return imageLinks.thumbnail.replace('http:', 'https:');
      }
      if (imageLinks?.smallThumbnail) {
        return imageLinks.smallThumbnail.replace('http:', 'https:');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Google Books search error:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting book cover enrichment...');

    // Get books without covers (limit to 10 per run to avoid timeouts)
    const { data: booksWithoutCovers, error: fetchError } = await supabase
      .from('transmissions')
      .select('id, title, author, isbn')
      .or('cover_url.is.null,cover_url.eq.')
      .limit(10);

    if (fetchError) {
      console.error('Error fetching books:', fetchError);
      throw fetchError;
    }

    if (!booksWithoutCovers || booksWithoutCovers.length === 0) {
      console.log('No books need cover enrichment');
      return new Response(
        JSON.stringify({ message: 'No books need enrichment', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${booksWithoutCovers.length} books without covers`);

    let successful = 0;
    let failed = 0;

    for (const book of booksWithoutCovers) {
      try {
        let coverUrl: string | null = null;

        // Try ISBN first if available
        if (book.isbn) {
          console.log(`Searching by ISBN: ${book.isbn} for ${book.title}`);
          coverUrl = await searchGoogleBooks(`isbn:${book.isbn}`, 1);
        }

        // Try title + author if ISBN didn't work
        if (!coverUrl && book.title && book.author) {
          console.log(`Searching by title/author: ${book.title} by ${book.author}`);
          const searchQuery = `${book.title} ${book.author}`;
          coverUrl = await searchGoogleBooks(searchQuery, 3);
        }

        if (coverUrl) {
          const { error: updateError } = await supabase
            .from('transmissions')
            .update({ cover_url: coverUrl })
            .eq('id', book.id);

          if (updateError) {
            console.error(`Failed to update cover for ${book.title}:`, updateError);
            failed++;
          } else {
            console.log(`✓ Updated cover for: ${book.title}`);
            successful++;
          }
        } else {
          console.log(`✗ No cover found for: ${book.title}`);
          failed++;
        }

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing ${book.title}:`, error);
        failed++;
      }
    }

    const result = {
      message: 'Book cover enrichment completed',
      processed: successful + failed,
      successful,
      failed,
    };

    console.log('Enrichment complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
