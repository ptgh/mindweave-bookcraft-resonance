
import { supabase } from "@/integrations/supabase/client";
import { searchBooks } from "./googleBooksApi";

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

  // Helper function to generate specific book links
  const getPublisherLink = (seriesName: string, title: string, author: string, isbn?: string) => {
    // Create URL-friendly slugs
    const titleSlug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const authorSlug = author.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    if (seriesName.toLowerCase().includes('gollancz')) {
      // Generate specific Gollancz book URL structure
      return `https://store.gollancz.co.uk/products/${titleSlug}-by-${authorSlug}`;
    }
    if (seriesName.toLowerCase().includes('penguin')) {
      // Generate specific Penguin book URL structure  
      return `https://www.penguin.co.uk/books/${titleSlug}-by-${authorSlug}${isbn ? `/${isbn}` : ''}`;
    }
    if (seriesName.toLowerCase().includes('angry robot')) {
      // Generate specific Angry Robot book URL
      return `https://angryrobotbooks.com/book/${titleSlug}`;
    }
    return null;
  };

  // Enrich with Google Books data and publisher links
  const enrichedBooks = await Promise.all(
    books.map(async (book) => {
      try {
        const googleBooks = await searchBooks(`${book.title} ${book.author}`);
        const googleBook = googleBooks[0];
        const seriesName = (book as any).series?.name || '';
        
        return {
          ...book,
          google_cover_url: googleBook?.coverUrl,
          cover_url: googleBook?.coverUrl || book.cover_url, // Update cover_url with Google Books cover
          google_description: undefined, // Book interface doesn't have description
          publisher_link: getPublisherLink(seriesName, book.title, book.author, book.isbn)
        };
      } catch (error) {
        console.error(`Error enriching book ${book.title}:`, error);
        const seriesName = (book as any).series?.name || '';
        return {
          ...book,
          google_cover_url: book.cover_url,
          google_description: undefined,
          publisher_link: getPublisherLink(seriesName, book.title, book.author, book.isbn)
        };
      }
    })
  );

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
