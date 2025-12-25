import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Publisher series definitions - VERIFIED FROM OFFICIAL WEBSITES
const SERIES_CONFIG = {
  penguin: {
    name: 'Penguin Science Fiction',
    publisher: 'Penguin',
    description: 'A curated collection of classic science fiction, featuring distinctive cover art celebrating the genre\'s most influential works.',
    badge_emoji: '🐧',
    // Data from https://www.penguin.co.uk/series/PENGSCIFI/penguin-science-fiction
    books: [
      { isbn: '9780241454589', title: 'The Ark Sakura', author: 'Kobo Abe', publisher_url: 'https://www.penguin.co.uk/books/317662/the-ark-sakura-by-abe-kobo/9780241454589', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454589/9780241454589-jacket-large.jpg', publication_year: 1988 },
      { isbn: '9780241505724', title: 'Black No More', author: 'George S. Schuyler', publisher_url: 'https://www.penguin.co.uk/books/443345/black-no-more-by-schuyler-george-s/9780241505724', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241505724/9780241505724-jacket-large.jpg', publication_year: 1931 },
      { isbn: '9780241510575', title: 'Driftglass', author: 'Samuel R. Delany', publisher_url: 'https://www.penguin.co.uk/books/443621/driftglass-by-delany-samuel-r/9780241510575', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241510575/9780241510575-jacket-large.jpg', publication_year: 1971 },
      { isbn: '9780241507704', title: 'Make Room! Make Room!', author: 'Harry Harrison', publisher_url: 'https://www.penguin.co.uk/books/57645/make-room-make-room-by-harrison-harry/9780241507704', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241507704/9780241507704-jacket-large.jpg', publication_year: 1966 },
      { isbn: '9780241485118', title: 'Robot', author: 'Adam Wisniewski-Snerg', publisher_url: 'https://www.penguin.co.uk/books/320533/robot-by-wisniewski-snerg-adam/9780241485118', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241485118/9780241485118-jacket-large.jpg', publication_year: 1973 },
      { isbn: '9780141992914', title: 'Star Maker', author: 'Olaf Stapledon', publisher_url: 'https://www.penguin.co.uk/books/317404/star-maker-by-stapledon-olaf/9780141992914', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780141992914/9780141992914-jacket-large.jpg', publication_year: 1937 },
      { isbn: '9780241473023', title: 'Untouched By Human Hands', author: 'Robert Sheckley', publisher_url: 'https://www.penguin.co.uk/books/320418/untouched-by-human-hands-by-sheckley-robert/9780241473023', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241473023/9780241473023-jacket-large.jpg', publication_year: 1954 },
      { isbn: '9780241441589', title: 'A Voyage to Arcturus', author: 'David Lindsay', publisher_url: 'https://www.penguin.co.uk/books/317266/a-voyage-to-arcturus-by-lindsay-david/9780241441589', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241441589/9780241441589-jacket-large.jpg', publication_year: 1920 },
      { isbn: '9780241509753', title: 'Warm Worlds and Otherwise', author: 'James Tiptree Jr.', publisher_url: 'https://www.penguin.co.uk/books/443292/warm-worlds-and-otherwise-by-jr-james-tiptree/9780241509753', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241509753/9780241509753-jacket-large.jpg', publication_year: 1975 },
      { isbn: '9780241467985', title: "Cat's Cradle", author: 'Kurt Vonnegut', publisher_url: 'https://www.penguin.co.uk/books/180112/cats-cradle-by-vonnegut-kurt/9780241467985', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241467985/9780241467985-jacket-large.jpg', publication_year: 1963 },
      { isbn: '9780241443934', title: 'The Colour Out of Space', author: 'H. P. Lovecraft', publisher_url: 'https://www.penguin.co.uk/books/317441/the-colour-out-of-space-by-lovecraft-h-p/9780241443934', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241443934/9780241443934-jacket-large.jpg', publication_year: 1927 },
      { isbn: '9780241467992', title: 'The Cyberiad', author: 'Stanisław Lem', publisher_url: 'https://www.penguin.co.uk/books/256135/the-cyberiad-by-lem-stanislaw/9780241467992', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241467992/9780241467992-jacket-large.jpg', publication_year: 1974 },
      { isbn: '9780241472491', title: 'Dimension of Miracles', author: 'Robert Sheckley', publisher_url: 'https://www.penguin.co.uk/books/320417/dimension-of-miracles-by-sheckley-robert/9780241472491', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241472491/9780241472491-jacket-large.jpg', publication_year: 1968 },
      { isbn: '9780241441572', title: 'Flatland', author: 'Edwin Abbott', publisher_url: 'https://www.penguin.co.uk/books/317265/flatland-by-abbott-edwin/9780241441572', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241441572/9780241441572-jacket-large.jpg', publication_year: 1884 },
      { isbn: '9780241454718', title: 'The Hair Carpet Weavers', author: 'Andreas Eschbach', publisher_url: 'https://www.penguin.co.uk/books/318915/the-hair-carpet-weavers-by-eschbach-andreas/9780241454718', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454718/9780241454718-jacket-large.jpg', publication_year: 1995 },
      { isbn: '9780241472477', title: 'One Billion Years to the End of the World', author: 'Arkady Strugatsky & Boris Strugatsky', publisher_url: 'https://www.penguin.co.uk/books/320603/one-billion-years-to-the-end-of-the-world-by-strugatsky-arkady-and-boris/9780241472477', cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241472477/9780241472477-jacket-large.jpg', publication_year: 1977 }
    ]
  },
  gollancz: {
    name: 'Gollancz SF Masterworks',
    publisher: 'Gollancz',
    description: 'The definitive library of science fiction classics, featuring essential works from the genre\'s greatest authors with iconic cover designs.',
    badge_emoji: '⭐',
    // Data from https://store.gollancz.co.uk/collections/best-of-masterworks
    books: [
      { isbn: '9781399623001', title: 'Dune', author: 'Frank Herbert', publisher_url: 'https://store.gollancz.co.uk/products/dune', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781399623001-original.jpg', publication_year: 1965 },
      { isbn: '9781399625654', title: 'The Dispossessed', author: 'Ursula K. Le Guin', publisher_url: 'https://store.gollancz.co.uk/products/the-dispossessed', cover_url: 'https://store.gollancz.co.uk/cdn/shop/files/9781399625654-original.jpg', publication_year: 1974 },
      { isbn: '9780575099432', title: 'Hyperion', author: 'Dan Simmons', publisher_url: 'https://store.gollancz.co.uk/products/hyperion', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575099432-original.jpg', publication_year: 1989 },
      { isbn: '9781399639033', title: 'The Fall of Hyperion', author: 'Dan Simmons', publisher_url: 'https://store.gollancz.co.uk/products/the-fall-of-hyperion', cover_url: 'https://store.gollancz.co.uk/cdn/shop/files/9781399639033-original.jpg', publication_year: 1990 },
      { isbn: '9780575094161', title: 'I Am Legend', author: 'Richard Matheson', publisher_url: 'https://store.gollancz.co.uk/products/i-am-legend', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575094161-original.jpg', publication_year: 1954 },
      { isbn: '9780575079939', title: 'Do Androids Dream Of Electric Sheep?', author: 'Philip K. Dick', publisher_url: 'https://store.gollancz.co.uk/products/do-androids-dream-of-electric-sheep', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575079939-original.jpg', publication_year: 1968 },
      { isbn: '9781473225947', title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', publisher_url: 'https://store.gollancz.co.uk/products/the-left-hand-of-darkness', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781473225947-original.jpg', publication_year: 1969 },
      { isbn: '9781473217423', title: 'Mona Lisa Overdrive', author: 'William Gibson', publisher_url: 'https://store.gollancz.co.uk/products/mona-lisa-overdrive', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781473217423-original.jpg', publication_year: 1988 },
      { isbn: '9781399607766', title: 'Flowers For Algernon', author: 'Daniel Keyes', publisher_url: 'https://store.gollancz.co.uk/products/flowers-for-algernon', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781399607766-original.jpg', publication_year: 1966 },
      { isbn: '9780575094147', title: 'The Forever War', author: 'Joe Haldeman', publisher_url: 'https://store.gollancz.co.uk/products/the-forever-war', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575094147-original.jpg', publication_year: 1974 },
      { isbn: '9781399607834', title: 'The Man Who Fell to Earth', author: 'Walter Tevis', publisher_url: 'https://store.gollancz.co.uk/products/the-man-who-fell-to-earth', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781399607834-original.jpg', publication_year: 1963 },
      { isbn: '9781399607827', title: 'Grass', author: 'Sheri S. Tepper', publisher_url: 'https://store.gollancz.co.uk/products/grass', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781399607827-original.jpg', publication_year: 1989 },
      { isbn: '9781399617222', title: 'The Sirens Of Titan', author: 'Kurt Vonnegut', publisher_url: 'https://store.gollancz.co.uk/products/the-sirens-of-titan', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781399617222-original.jpg', publication_year: 1959 },
      { isbn: '9781399617239', title: 'The Island Of Doctor Moreau', author: 'H.G. Wells', publisher_url: 'https://store.gollancz.co.uk/products/the-island-of-doctor-moreau', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781399617239-original.jpg', publication_year: 1896 },
      { isbn: '9780575115347', title: "The Hitchhiker's Guide To The Galaxy", author: 'Douglas Adams', publisher_url: 'https://store.gollancz.co.uk/products/the-hitchhikers-guide-to-the-galaxy', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575115347-original.jpg', publication_year: 1979 },
      { isbn: '9781473216495', title: 'The Book Of The New Sun: Volume 1', author: 'Gene Wolfe', publisher_url: 'https://store.gollancz.co.uk/products/the-book-of-the-new-sun-volume-1', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781473216495-original.jpg', publication_year: 1980 },
      { isbn: '9781473211964', title: 'A Deepness in the Sky', author: 'Vernor Vinge', publisher_url: 'https://store.gollancz.co.uk/products/a-deepness-in-the-sky', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781473211964-original.jpg', publication_year: 1999 },
      { isbn: '9780575074767', title: 'The Dancers at the End of Time', author: 'Michael Moorcock', publisher_url: 'https://store.gollancz.co.uk/products/the-dancers-at-the-end-of-time', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575074767-original.jpg', publication_year: 1972 },
      { isbn: '9781473222168', title: 'The Chronicles of Amber', author: 'Roger Zelazny', publisher_url: 'https://store.gollancz.co.uk/products/the-chronicles-of-amber', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781473222168-original.jpg', publication_year: 1970 },
      { isbn: '9780575079953', title: 'More Than Human', author: 'Theodore Sturgeon', publisher_url: 'https://store.gollancz.co.uk/products/more-than-human', cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575079953-original.jpg', publication_year: 1953 }
    ]
  }
};

async function populateSeries(supabase: any, seriesKey: 'penguin' | 'gollancz') {
  const config = SERIES_CONFIG[seriesKey];
  console.log(`Starting ${config.name} population...`);

  // Step 1: Ensure the series exists
  console.log(`Checking for ${config.name} series...`);
  
  const { data: existingSeries, error: seriesCheckError } = await supabase
    .from('publisher_series')
    .select('id')
    .eq('name', config.name)
    .eq('publisher', config.publisher)
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
        name: config.name,
        publisher: config.publisher,
        description: config.description,
        badge_emoji: config.badge_emoji
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

  // Step 2: Clear existing books for this series
  console.log('Clearing existing books for series...');
  const { error: deleteError } = await supabase
    .from('publisher_books')
    .delete()
    .eq('series_id', seriesId);

  if (deleteError) {
    console.error('Error clearing existing books:', deleteError);
  }

  // Step 3: Insert all books
  console.log(`Inserting ${config.books.length} books...`);
  
  const booksToInsert = config.books.map(book => ({
    isbn: book.isbn,
    title: book.title,
    author: book.author,
    penguin_url: book.publisher_url,
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

  console.log(`Successfully inserted ${insertedBooks?.length || 0} books for ${config.name}`);

  return {
    seriesName: config.name,
    seriesId,
    booksAdded: insertedBooks?.length || 0,
    books: insertedBooks?.map((b: any) => ({ title: b.title, author: b.author, isbn: b.isbn }))
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body for series selection
    let seriesKey: 'penguin' | 'gollancz' = 'penguin'; // default to penguin
    
    try {
      const body = await req.json();
      if (body.series === 'gollancz') {
        seriesKey = 'gollancz';
      }
    } catch {
      // No body or invalid JSON, use default
    }

    console.log(`Populating ${seriesKey} series...`);

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const result = await populateSeries(supabase, seriesKey);

    const response = {
      success: true,
      message: `Successfully populated ${result.booksAdded} ${result.seriesName} books`,
      ...result
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
