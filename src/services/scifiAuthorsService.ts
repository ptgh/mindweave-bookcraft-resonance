import { supabase } from "@/integrations/supabase/client";

export interface ScifiAuthor {
  id: string;
  name: string;
  bio?: string;
  nationality?: string;
  notable_works?: string[];
  birth_year?: number;
  death_year?: number;
}

export interface AuthorBook {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  cover_url?: string;
  categories?: string[];
  published_date?: string;
  page_count?: number;
  rating?: number;
  ratings_count?: number;
}

export const getScifiAuthors = async (): Promise<ScifiAuthor[]> => {
  const { data, error } = await supabase
    .from('scifi_authors')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
};

export const getAuthorBooks = async (authorId: string): Promise<AuthorBook[]> => {
  // First get books from our database
  const { data: dbBooks, error: dbError } = await supabase
    .from('author_books')
    .select('*')
    .eq('author_id', authorId);
  
  if (dbError) throw dbError;
  
  // If we have books in the database, return them
  if (dbBooks && dbBooks.length > 0) {
    return dbBooks;
  }
  
  // Otherwise, try to fetch from Google Books API for this author
  const { data: author } = await supabase
    .from('scifi_authors')
    .select('name')
    .eq('id', authorId)
    .single();
  
  if (!author) return [];
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=inauthor:"${encodeURIComponent(author.name)}"&maxResults=20&orderBy=relevance`
    );
    
    if (!response.ok) return [];
    
    const googleData = await response.json();
    
    if (!googleData.items) return [];
    
    const books: AuthorBook[] = googleData.items.map((item: any) => ({
      id: item.id,
      title: item.volumeInfo.title || 'Unknown Title',
      subtitle: item.volumeInfo.subtitle,
      description: item.volumeInfo.description,
      cover_url: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
      categories: item.volumeInfo.categories,
      published_date: item.volumeInfo.publishedDate,
      page_count: item.volumeInfo.pageCount,
      rating: item.volumeInfo.averageRating,
      ratings_count: item.volumeInfo.ratingsCount
    }));
    
    return books;
  } catch (error) {
    console.error('Error fetching books from Google Books API:', error);
    return [];
  }
};
