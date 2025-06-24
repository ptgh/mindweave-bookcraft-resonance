
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
  author_id: string;
  google_books_id: string;
  title: string;
  subtitle?: string;
  description?: string;
  cover_url?: string;
  categories?: string[];
  published_date?: string;
  page_count?: number;
  rating?: number;
  ratings_count?: number;
  preview_link?: string;
  info_link?: string;
  created_at: string;
  updated_at: string;
}

export const getScifiAuthors = async (): Promise<ScifiAuthor[]> => {
  console.log('Fetching sci-fi authors from database...');
  
  const { data, error } = await supabase
    .from('scifi_authors')
    .select('*')
    .order('name')
    .limit(1000); // Add reasonable limit
  
  if (error) {
    console.error('Error fetching authors:', error);
    throw error;
  }
  
  console.log('Successfully fetched authors:', data?.length || 0);
  return data || [];
};

export const getAuthorBooks = async (authorId: string): Promise<AuthorBook[]> => {
  console.log('Fetching books for author:', authorId);
  
  // First get books from our database
  const { data: dbBooks, error: dbError } = await supabase
    .from('author_books')
    .select('*')
    .eq('author_id', authorId)
    .limit(50); // Add reasonable limit
  
  if (dbError) {
    console.error('Error fetching author books:', dbError);
    throw dbError;
  }
  
  // If we have books in the database, return them
  if (dbBooks && dbBooks.length > 0) {
    console.log('Found books in database:', dbBooks.length);
    return dbBooks;
  }
  
  console.log('No books found in database for author:', authorId);
  return [];
};
