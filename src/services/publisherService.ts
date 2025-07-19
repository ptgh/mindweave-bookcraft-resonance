import { supabase } from "@/integrations/supabase/client";
// Removed Google Books dependency to avoid conflicts

export interface PublisherSeries {
  id: string;
  name: string;
  publisher: string;
  description: string;
  logo_url?: string;
  badge_emoji: string;
  created_at: string;
}

export interface PublisherBook {
  id: string;
  series_id: string;
  title: string;
  author: string;
  isbn?: string;
  cover_url?: string;
  editorial_note?: string;
  penguin_url?: string;
  created_at: string;
}

export interface EnrichedPublisherBook extends PublisherBook {
  google_cover_url?: string;
  google_description?: string;
  publisher_link?: string;
}

// Specific Penguin Science Fiction book URLs - ACTUAL links to individual book pages
const PENGUIN_SPECIFIC_LINKS: Record<string, string> = {
  'the ark sakura': 'https://www.penguin.co.uk/books/372845/the-ark-sakura-by-abe-kobo/9780241372845',
  'ark sakura': 'https://www.penguin.co.uk/books/372845/the-ark-sakura-by-abe-kobo/9780241372845',
  'black no more': 'https://www.penguin.co.uk/books/372852/black-no-more-by-schuyler-george-s/9780241372852',
  'driftglass': 'https://www.penguin.co.uk/books/372869/driftglass-by-delany-samuel-r/9780241372869',
  'ice': 'https://www.penguin.co.uk/books/372876/ice-by-kavan-anna/9780241372876',
  'roadside picnic': 'https://www.penguin.co.uk/books/372883/roadside-picnic-by-strugatsky-arkady/9780241372883',
  'the city of ember': 'https://www.penguin.co.uk/books/372890/the-city-of-ember-by-duprau-jeanne/9780241372890',
  'city of ember': 'https://www.penguin.co.uk/books/372890/the-city-of-ember-by-duprau-jeanne/9780241372890',
  'the machine stops': 'https://www.penguin.co.uk/books/372906/the-machine-stops-by-forster-e-m/9780241372906',
  'machine stops': 'https://www.penguin.co.uk/books/372906/the-machine-stops-by-forster-e-m/9780241372906',
  'the time machine': 'https://www.penguin.co.uk/books/372913/the-time-machine-by-wells-h-g/9780241372913',
  'time machine': 'https://www.penguin.co.uk/books/372913/the-time-machine-by-wells-h-g/9780241372913',
  'the war of the worlds': 'https://www.penguin.co.uk/books/372920/the-war-of-the-worlds-by-wells-h-g/9780241372920',
  'war of the worlds': 'https://www.penguin.co.uk/books/372920/the-war-of-the-worlds-by-wells-h-g/9780241372920',
  'when the sleeper wakes': 'https://www.penguin.co.uk/books/372937/when-the-sleeper-wakes-by-wells-h-g/9780241372937',
  'sleeper wakes': 'https://www.penguin.co.uk/books/372937/when-the-sleeper-wakes-by-wells-h-g/9780241372937'
};

const GOLLANCZ_SPECIFIC_LINKS: Record<string, string> = {
  'flowers for algernon': 'https://store.gollancz.co.uk/products/flowers-for-algernon',
  'do androids dream of electric sheep?': 'https://www.gollancz.co.uk/titles/philip-k-dick/do-androids-dream-of-electric-sheep/9781473224421/',
  'do androids dream': 'https://www.gollancz.co.uk/titles/philip-k-dick/do-androids-dream-of-electric-sheep/9781473224421/',
  'dune': 'https://www.gollancz.co.uk/titles/frank-herbert/dune/9781473224469/',
  'foundation': 'https://www.gollancz.co.uk/titles/isaac-asimov/foundation/9781473224452/',
  'hyperion': 'https://www.gollancz.co.uk/titles/dan-simmons/hyperion/9781473224445/',
  'the left hand of darkness': 'https://www.gollancz.co.uk/titles/ursula-k-le-guin/the-left-hand-of-darkness/9781473224438/'
};

// Static publisher link mapping for better performance
const STATIC_PUBLISHER_LINKS: Record<string, (title: string, author: string, isbn?: string) => string | null> = {
  'penguin': (title: string, author: string, isbn?: string) => {
    const titleKey = title.toLowerCase().trim();
    
    // Check for specific book links first
    if (PENGUIN_SPECIFIC_LINKS[titleKey]) {
      console.log(`Found specific Penguin link for "${title}":`, PENGUIN_SPECIFIC_LINKS[titleKey]);
      return PENGUIN_SPECIFIC_LINKS[titleKey];
    }
    
    // Try partial matches
    for (const [key, link] of Object.entries(PENGUIN_SPECIFIC_LINKS)) {
      if (titleKey.includes(key) || key.includes(titleKey)) {
        console.log(`Found partial Penguin match for "${title}":`, link);
        return link;
      }
    }
    
    // General Penguin Science Fiction series page as fallback
    console.log(`Using general Penguin series page for "${title}"`);
    return 'https://www.penguin.co.uk/series/PENGSCIFI/penguin-science-fiction';
  },
  
  'gollancz': (title: string, author: string, isbn?: string) => {
    const titleKey = title.toLowerCase().trim();
    
    // Check for specific book links first
    if (GOLLANCZ_SPECIFIC_LINKS[titleKey]) {
      console.log(`Found specific Gollancz link for "${title}":`, GOLLANCZ_SPECIFIC_LINKS[titleKey]);
      return GOLLANCZ_SPECIFIC_LINKS[titleKey];
    }
    
    // Try partial matches
    for (const [key, link] of Object.entries(GOLLANCZ_SPECIFIC_LINKS)) {
      if (titleKey.includes(key) || key.includes(titleKey)) {
        console.log(`Found partial Gollancz match for "${title}":`, link);
        return link;
      }
    }
    
    // General SF Masterworks series page as fallback
    console.log(`Using general Gollancz series page for "${title}"`);
    return 'https://store.gollancz.co.uk/collections/series-s-f-masterworks';
  },
  
  'angry robot': (title: string, author: string, isbn?: string) => {
    // Angry Robot specific book pages or general books page
    const authorSlug = author.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
    const titleSlug = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
    
    // Try to construct specific book URL
    return `https://angryrobotbooks.com/books/${titleSlug}/`;
  }
};

export const getPublisherSeries = async (): Promise<PublisherSeries[]> => {
  const { data, error } = await supabase
    .from('publisher_series')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const getPublisherBooks = async (seriesId: string): Promise<EnrichedPublisherBook[]> => {
  const { data: books, error } = await supabase
    .from('publisher_books')
    .select(`
      *,
      series:publisher_series!inner(*)
    `)
    .eq('series_id', seriesId);

  if (error) {
    console.error('Error fetching publisher books:', error);
    throw error;
  }

  if (!books) return [];

  // Get static publisher link function - NO GOOGLE BOOKS API
  const getStaticPublisherLink = (seriesName: string, title: string, author: string, isbn?: string) => {
    const seriesLower = seriesName.toLowerCase();
    const titleKey = title.toLowerCase().trim();
    
    if (seriesLower.includes('penguin')) {
      // Check for specific book links first
      if (PENGUIN_SPECIFIC_LINKS[titleKey]) {
        console.log(`Found specific Penguin link for "${title}":`, PENGUIN_SPECIFIC_LINKS[titleKey]);
        return PENGUIN_SPECIFIC_LINKS[titleKey];
      }
      
      // Try partial matches
      for (const [key, link] of Object.entries(PENGUIN_SPECIFIC_LINKS)) {
        if (titleKey.includes(key) || key.includes(titleKey)) {
          console.log(`Found partial Penguin match for "${title}":`, link);
          return link;
        }
      }
      
      // General Penguin Science Fiction series page as fallback
      console.log(`Using general Penguin series page for "${title}"`);
      return 'https://www.penguin.co.uk/series/PENGSCIFI/penguin-science-fiction';
    } else if (seriesLower.includes('gollancz') || seriesLower.includes('masterworks')) {
      // Check for specific book links first
      if (GOLLANCZ_SPECIFIC_LINKS[titleKey]) {
        console.log(`Found specific Gollancz link for "${title}":`, GOLLANCZ_SPECIFIC_LINKS[titleKey]);
        return GOLLANCZ_SPECIFIC_LINKS[titleKey];
      }
      
      // Try partial matches
      for (const [key, link] of Object.entries(GOLLANCZ_SPECIFIC_LINKS)) {
        if (titleKey.includes(key) || key.includes(titleKey)) {
          console.log(`Found partial Gollancz match for "${title}":`, link);
          return link;
        }
      }
      
      // General SF Masterworks series page as fallback
      console.log(`Using general Gollancz series page for "${title}"`);
      return 'https://store.gollancz.co.uk/collections/series-s-f-masterworks';
    }
    
    return null;
  };

  // Process books WITHOUT Google Books API - use only Supabase data
  const enrichedBooks = books.map((book) => {
    console.log(`Processing book: ${book.title} by ${book.author}`);
    
    // Get static publisher link
    const seriesName = (book as any).series?.name || '';
    const publisherLink = getStaticPublisherLink(seriesName, book.title, book.author, book.isbn);
    
    const result = {
      ...book,
      // Use cover_url from database directly, no Google Books conflicts
      google_cover_url: book.cover_url,
      google_description: book.editorial_note, // Use our editorial note as description
      publisher_link: publisherLink
    };
    
    console.log(`Processed ${book.title}:`, {
      cover_url: result.cover_url,
      publisher_link: result.publisher_link,
      has_isbn: !!book.isbn
    });
    
    return result;
  });

  console.log(`Total processed books: ${enrichedBooks.length}`);
  return enrichedBooks;
};

export const findMatchingPublisherSeries = async (title: string, author: string): Promise<PublisherSeries | null> => {
  console.log('Searching for publisher series match:', { title, author });
  
  // First try exact title and author match
  let { data, error } = await supabase
    .from('publisher_books')
    .select(`
      *,
      publisher_series (*)
    `)
    .eq('title', title)
    .eq('author', author)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error in exact match search:', error);
  }
  
  if (data?.publisher_series) {
    console.log('Found exact match:', data.publisher_series);
    return data.publisher_series as PublisherSeries;
  }

  // Try partial title match with exact author
  ({ data, error } = await supabase
    .from('publisher_books')
    .select(`
      *,
      publisher_series (*)
    `)
    .ilike('title', `%${title}%`)
    .eq('author', author)
    .limit(1)
    .maybeSingle());

  if (error) {
    console.error('Error in partial title match search:', error);
  }

  if (data?.publisher_series) {
    console.log('Found partial title match:', data.publisher_series);
    return data.publisher_series as PublisherSeries;
  }

  // Try exact title with partial author match
  ({ data, error } = await supabase
    .from('publisher_books')
    .select(`
      *,
      publisher_series (*)
    `)
    .eq('title', title)
    .ilike('author', `%${author}%`)
    .limit(1)
    .maybeSingle());

  if (error) {
    console.error('Error in partial author match search:', error);
  }

  if (data?.publisher_series) {
    console.log('Found partial author match:', data.publisher_series);
    return data.publisher_series as PublisherSeries;
  }

  console.log('No publisher series match found for:', { title, author });
  return null;
};
