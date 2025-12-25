import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Official Penguin Science Fiction series - 19 titles
// Source: https://www.penguin.co.uk/series/PENGSCIFI/penguin-science-fiction
const PENGUIN_SF_BOOKS = [
  {
    isbn: '9780241454589',
    title: 'The Ark Sakura',
    author: 'Kobo Abe',
    penguin_url: 'https://www.penguin.co.uk/books/317662/the-ark-sakura-by-abe-kobo/9780241454589',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454589/9780241454589-jacket-large.jpg',
    publication_year: 1988
  },
  {
    isbn: '9780241465684',
    title: 'Black No More',
    author: 'George S. Schuyler',
    penguin_url: 'https://www.penguin.co.uk/books/316943/black-no-more-by-schuyler-george-s/9780241465684',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241465684/9780241465684-jacket-large.jpg',
    publication_year: 1931
  },
  {
    isbn: '9780241472781',
    title: 'Roadside Picnic',
    author: 'Arkady Strugatsky & Boris Strugatsky',
    penguin_url: 'https://www.penguin.co.uk/books/316944/roadside-picnic-by-strugatsky-arkady-and-boris/9780241472781',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241472781/9780241472781-jacket-large.jpg',
    publication_year: 1972
  },
  {
    isbn: '9780241472798',
    title: 'The Body Snatchers',
    author: 'Jack Finney',
    penguin_url: 'https://www.penguin.co.uk/books/316945/the-body-snatchers-by-finney-jack/9780241472798',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241472798/9780241472798-jacket-large.jpg',
    publication_year: 1955
  },
  {
    isbn: '9780241454572',
    title: 'Solaris',
    author: 'Stanisław Lem',
    penguin_url: 'https://www.penguin.co.uk/books/317663/solaris-by-lem-stanislaw/9780241454572',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454572/9780241454572-jacket-large.jpg',
    publication_year: 1961
  },
  {
    isbn: '9780241453094',
    title: 'The Drowned World',
    author: 'J. G. Ballard',
    penguin_url: 'https://www.penguin.co.uk/books/317664/the-drowned-world-by-ballard-j-g/9780241453094',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241453094/9780241453094-jacket-large.jpg',
    publication_year: 1962
  },
  {
    isbn: '9780241465608',
    title: 'Woman on the Edge of Time',
    author: 'Marge Piercy',
    penguin_url: 'https://www.penguin.co.uk/books/316946/woman-on-the-edge-of-time-by-piercy-marge/9780241465608',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241465608/9780241465608-jacket-large.jpg',
    publication_year: 1976
  },
  {
    isbn: '9780241454527',
    title: 'The Penultimate Truth',
    author: 'Philip K. Dick',
    penguin_url: 'https://www.penguin.co.uk/books/317665/the-penultimate-truth-by-dick-philip-k/9780241454527',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454527/9780241454527-jacket-large.jpg',
    publication_year: 1964
  },
  {
    isbn: '9780241454534',
    title: 'Flow My Tears, the Policeman Said',
    author: 'Philip K. Dick',
    penguin_url: 'https://www.penguin.co.uk/books/317666/flow-my-tears-the-policeman-said-by-dick-philip-k/9780241454534',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454534/9780241454534-jacket-large.jpg',
    publication_year: 1974
  },
  {
    isbn: '9780241473597',
    title: 'The Stars My Destination',
    author: 'Alfred Bester',
    penguin_url: 'https://www.penguin.co.uk/books/316947/the-stars-my-destination-by-bester-alfred/9780241473597',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241473597/9780241473597-jacket-large.jpg',
    publication_year: 1956
  },
  {
    isbn: '9780241454541',
    title: 'The Three Stigmata of Palmer Eldritch',
    author: 'Philip K. Dick',
    penguin_url: 'https://www.penguin.co.uk/books/317667/the-three-stigmata-of-palmer-eldritch-by-dick-philip-k/9780241454541',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454541/9780241454541-jacket-large.jpg',
    publication_year: 1965
  },
  {
    isbn: '9780241465646',
    title: 'Flowers for Algernon',
    author: 'Daniel Keyes',
    penguin_url: 'https://www.penguin.co.uk/books/316948/flowers-for-algernon-by-keyes-daniel/9780241465646',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241465646/9780241465646-jacket-large.jpg',
    publication_year: 1966
  },
  {
    isbn: '9780241454558',
    title: 'The Man in the High Castle',
    author: 'Philip K. Dick',
    penguin_url: 'https://www.penguin.co.uk/books/317668/the-man-in-the-high-castle-by-dick-philip-k/9780241454558',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454558/9780241454558-jacket-large.jpg',
    publication_year: 1962
  },
  {
    isbn: '9780241454565',
    title: 'Do Androids Dream of Electric Sheep?',
    author: 'Philip K. Dick',
    penguin_url: 'https://www.penguin.co.uk/books/317669/do-androids-dream-of-electric-sheep-by-dick-philip-k/9780241454565',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454565/9780241454565-jacket-large.jpg',
    publication_year: 1968
  },
  {
    isbn: '9780241465653',
    title: 'The Left Hand of Darkness',
    author: 'Ursula K. Le Guin',
    penguin_url: 'https://www.penguin.co.uk/books/316949/the-left-hand-of-darkness-by-le-guin-ursula-k/9780241465653',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241465653/9780241465653-jacket-large.jpg',
    publication_year: 1969
  },
  {
    isbn: '9780241465660',
    title: 'The Forever War',
    author: 'Joe Haldeman',
    penguin_url: 'https://www.penguin.co.uk/books/316950/the-forever-war-by-haldeman-joe/9780241465660',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241465660/9780241465660-jacket-large.jpg',
    publication_year: 1974
  },
  {
    isbn: '9780241465677',
    title: "Childhood's End",
    author: 'Arthur C. Clarke',
    penguin_url: 'https://www.penguin.co.uk/books/316951/childhoods-end-by-clarke-arthur-c/9780241465677',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241465677/9780241465677-jacket-large.jpg',
    publication_year: 1953
  },
  {
    isbn: '9780241465691',
    title: 'Rendezvous with Rama',
    author: 'Arthur C. Clarke',
    penguin_url: 'https://www.penguin.co.uk/books/316952/rendezvous-with-rama-by-clarke-arthur-c/9780241465691',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241465691/9780241465691-jacket-large.jpg',
    publication_year: 1973
  },
  {
    isbn: '9780241454510',
    title: 'A Scanner Darkly',
    author: 'Philip K. Dick',
    penguin_url: 'https://www.penguin.co.uk/books/317670/a-scanner-darkly-by-dick-philip-k/9780241454510',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454510/9780241454510-jacket-large.jpg',
    publication_year: 1977
  }
];

const PENGUIN_SF_SERIES = {
  name: 'Penguin Science Fiction',
  publisher: 'penguin',
  description: 'A curated collection of classic science fiction, featuring distinctive cover art celebrating the genre\'s most influential works from the mid-20th century.',
  badge_emoji: '🐧'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Penguin Science Fiction population...');

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Ensure the Penguin Science Fiction series exists
    console.log('Checking for Penguin Science Fiction series...');
    
    const { data: existingSeries, error: seriesCheckError } = await supabase
      .from('publisher_series')
      .select('id')
      .eq('name', PENGUIN_SF_SERIES.name)
      .eq('publisher', PENGUIN_SF_SERIES.publisher)
      .maybeSingle();

    if (seriesCheckError) {
      console.error('Error checking for series:', seriesCheckError);
      throw seriesCheckError;
    }

    let seriesId: string;

    if (existingSeries) {
      seriesId = existingSeries.id;
      console.log(`Found existing series with ID: ${seriesId}`);
    } else {
      // Create the series
      const { data: newSeries, error: seriesCreateError } = await supabase
        .from('publisher_series')
        .insert({
          name: PENGUIN_SF_SERIES.name,
          publisher: PENGUIN_SF_SERIES.publisher,
          description: PENGUIN_SF_SERIES.description,
          badge_emoji: PENGUIN_SF_SERIES.badge_emoji
        })
        .select('id')
        .single();

      if (seriesCreateError) {
        console.error('Error creating series:', seriesCreateError);
        throw seriesCreateError;
      }

      seriesId = newSeries.id;
      console.log(`Created new series with ID: ${seriesId}`);
    }

    // Step 2: Clear existing Penguin SF books for this series (to allow re-population with correct data)
    console.log('Clearing existing books for series...');
    const { error: deleteError } = await supabase
      .from('publisher_books')
      .delete()
      .eq('series_id', seriesId);

    if (deleteError) {
      console.error('Error clearing existing books:', deleteError);
      // Continue anyway - might be empty
    }

    // Step 3: Insert all books
    console.log(`Inserting ${PENGUIN_SF_BOOKS.length} books...`);
    
    const booksToInsert = PENGUIN_SF_BOOKS.map(book => ({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      penguin_url: book.penguin_url,
      cover_url: book.cover_url,
      publication_year: book.publication_year,
      series_id: seriesId
    }));

    const { data: insertedBooks, error: insertError } = await supabase
      .from('publisher_books')
      .insert(booksToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting books:', insertError);
      throw insertError;
    }

    console.log(`Successfully inserted ${insertedBooks?.length || 0} books`);

    const response = {
      success: true,
      message: `Successfully populated ${insertedBooks?.length || 0} Penguin Science Fiction books`,
      seriesId,
      booksAdded: insertedBooks?.length || 0,
      books: insertedBooks?.map(b => ({ title: b.title, author: b.author, isbn: b.isbn }))
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in populate-publisher-books:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to populate books' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
