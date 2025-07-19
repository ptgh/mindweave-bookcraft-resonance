import { supabase } from "@/integrations/supabase/client";
import { searchGoogleBooks } from "./googleBooks";

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
  created_at: string;
}

export interface EnrichedPublisherBook extends PublisherBook {
  google_cover_url?: string;
  google_description?: string;
  publisher_link?: string;
}

// Enhanced static publisher link mapping for specific books
const PENGUIN_SPECIFIC_LINKS: Record<string, string> = {
  'neuromancer': 'https://www.penguin.co.uk/books/56389/neuromancer-by-gibson-william/9780143111603',
  'the handmaid\'s tale': 'https://www.penguin.co.uk/books/432108/the-handmaids-tale-by-atwood-margaret/9780099740919',
  'handmaid\'s tale': 'https://www.penguin.co.uk/books/432108/the-handmaids-tale-by-atwood-margaret/9780099740919',
  'the city & the city': 'https://www.penguin.co.uk/books/432109/the-city--the-city-by-mieville-china/9780230710214',
  'city & city': 'https://www.penguin.co.uk/books/432109/the-city--the-city-by-mieville-china/9780230710214',
  'the windup girl': 'https://www.penguin.co.uk/books/432110/the-windup-girl-by-bacigalupi-paolo/9780748111732',
  'windup girl': 'https://www.penguin.co.uk/books/432110/the-windup-girl-by-bacigalupi-paolo/9780748111732',
  'brave new world': 'https://www.penguin.co.uk/books/432111/brave-new-world-by-huxley-aldous/9780099477464',
  'nineteen eighty-four': 'https://www.penguin.co.uk/books/432112/nineteen-eighty-four-by-orwell-george/9780141036144',
  '1984': 'https://www.penguin.co.uk/books/432112/nineteen-eighty-four-by-orwell-george/9780141036144'
};

const GOLLANCZ_SPECIFIC_LINKS: Record<string, string> = {
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
    return 'https://www.gollancz.co.uk/series/sf-masterworks/';
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

  // Get static publisher link function
  const getStaticPublisherLink = (seriesName: string, title: string, author: string, isbn?: string) => {
    const seriesLower = seriesName.toLowerCase();
    
    if (seriesLower.includes('penguin')) {
      return STATIC_PUBLISHER_LINKS['penguin'](title, author, isbn);
    }
    if (seriesLower.includes('gollancz')) {
      return STATIC_PUBLISHER_LINKS['gollancz'](title, author, isbn);
    }
    if (seriesLower.includes('angry robot')) {
      return STATIC_PUBLISHER_LINKS['angry robot'](title, author, isbn);
    }
    
    return null;
  };

  // Enrich with Google Books data and static publisher links
  const enrichedBooks = await Promise.all(
    books.map(async (book) => {
      try {
        console.log(`Enriching book: ${book.title} by ${book.author}`);
        
        // Enhanced Google Books search with multiple strategies
        let googleBooks: any[] = [];
        
        // Strategy 1: Title + Author search
        try {
          googleBooks = await searchGoogleBooks(`${book.title} ${book.author}`, 3);
          console.log(`Google Books search 1 for "${book.title}": ${googleBooks.length} results`);
        } catch (error) {
          console.warn(`Google Books search 1 failed for ${book.title}:`, error);
        }
        
        // Strategy 2: ISBN search if available and first search didn't work well
        if (book.isbn && googleBooks.length === 0) {
          try {
            googleBooks = await searchGoogleBooks(`isbn:${book.isbn}`, 1);
            console.log(`Google Books ISBN search for "${book.title}": ${googleBooks.length} results`);
          } catch (error) {
            console.warn(`Google Books ISBN search failed for ${book.title}:`, error);
          }
        }
        
        // Strategy 3: Title only search if still no good results
        if (googleBooks.length === 0) {
          try {
            googleBooks = await searchGoogleBooks(book.title, 2);
            console.log(`Google Books title-only search for "${book.title}": ${googleBooks.length} results`);
          } catch (error) {
            console.warn(`Google Books title-only search failed for ${book.title}:`, error);
          }
        }
        
        const googleBook = googleBooks[0];
        
        // Get static publisher link
        const seriesName = (book as any).series?.name || '';
        const publisherLink = getStaticPublisherLink(seriesName, book.title, book.author, book.isbn);
        
        const result = {
          ...book,
          google_cover_url: googleBook?.coverUrl,
          cover_url: googleBook?.coverUrl || book.cover_url,
          google_description: googleBook?.description,
          publisher_link: publisherLink
        };
        
        console.log(`Enriched ${book.title}:`, {
          google_cover_url: result.google_cover_url,
          publisher_link: result.publisher_link,
          has_isbn: !!book.isbn
        });
        
        return result;
      } catch (error) {
        console.error(`Error enriching book ${book.title}:`, error);
        const seriesName = (book as any).series?.name || '';
        const publisherLink = getStaticPublisherLink(seriesName, book.title, book.author, book.isbn);
        
        return {
          ...book,
          google_cover_url: book.cover_url,
          google_description: undefined,
          publisher_link: publisherLink
        };
      }
    })
  );

  console.log(`Total enriched books: ${enrichedBooks.length}`);
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
