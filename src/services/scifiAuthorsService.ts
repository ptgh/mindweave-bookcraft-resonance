
import { supabase } from "@/integrations/supabase/client";

export interface ScifiAuthor {
  id: string;
  name: string;
  bio?: string;
  nationality?: string;
  notable_works?: string[];
  birth_year?: number;
  death_year?: number;
  last_enriched?: string;
  data_source?: string;
  verification_status?: string;
  data_quality_score?: number;
  enrichment_attempts?: number;
  needs_enrichment?: boolean;
  wikipedia_url?: string;
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

export const getAuthorByName = async (authorName: string): Promise<ScifiAuthor | null> => {
  console.log('Fetching author by name:', authorName);
  
  // Prevent matching empty or invalid author names
  const trimmedName = authorName?.trim();
  if (!trimmedName || trimmedName.length < 2) {
    console.warn('Author name too short or empty, skipping search');
    return null;
  }
  
  const { data, error } = await supabase
    .from('scifi_authors')
    .select('*')
    .ilike('name', `%${trimmedName}%`)
    .order('data_quality_score', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching author by name:', error);
    return null;
  }
  
  return data;
};

export const findOrCreateAuthor = async (authorName: string): Promise<string | null> => {
  console.log('Finding or creating author:', authorName);
  
  try {
    const { data, error } = await supabase.rpc('find_or_create_scifi_author', {
      author_name: authorName
    });
    
    if (error) {
      console.error('Error in find_or_create_scifi_author:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Error calling find_or_create_scifi_author:', err);
    return null;
  }
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

export const triggerAuthorEnrichment = async (authorId: string): Promise<void> => {
  console.log('Triggering enrichment for author:', authorId);
  
  try {
    const response = await fetch('/api/enrich-author-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authorId })
    });
    
    if (!response.ok) {
      console.warn('Author enrichment request failed:', response.statusText);
    }
  } catch (error) {
    console.warn('Author enrichment trigger failed:', error);
  }
};

export const getAllAuthorBooks = async (limit: number = 100): Promise<AuthorBook[]> => {
  console.log('Fetching all author books from database...');
  
  const { data, error } = await supabase
    .from('author_books')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching all author books:', error);
    throw error;
  }
  
  console.log('Successfully fetched author books:', data?.length || 0);
  return data || [];
};
