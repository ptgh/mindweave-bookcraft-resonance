
import { supabase } from "@/integrations/supabase/client";
import { searchBooks } from "./googleBooksApi";

export interface SearchResult {
  type: 'author' | 'book' | 'transmission';
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  coverUrl?: string;
  description?: string;
  nationality?: string;
  notableWorks?: string[];
}

export const searchAll = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim()) return [];
  
  const results: SearchResult[] = [];
  
  try {
    // Search authors
    const { data: authors, error: authorsError } = await supabase
      .from('scifi_authors')
      .select('*')
      .or(`name.ilike.%${query}%,nationality.ilike.%${query}%`)
      .limit(10);
    
    if (authorsError) throw authorsError;
    
    if (authors) {
      results.push(...authors.map(author => ({
        type: 'author' as const,
        id: author.id,
        title: author.name,
        subtitle: author.nationality,
        description: author.bio,
        nationality: author.nationality,
        notableWorks: author.notable_works
      })));
    }

    // Search author books
    const { data: authorBooks, error: booksError } = await supabase
      .from('author_books')
      .select(`
        *,
        scifi_authors (name, nationality)
      `)
      .or(`title.ilike.%${query}%,subtitle.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10);
    
    if (booksError) throw booksError;
    
    if (authorBooks) {
      results.push(...authorBooks.map(book => ({
        type: 'book' as const,
        id: book.id,
        title: book.title,
        subtitle: book.subtitle,
        author: book.scifi_authors?.name,
        coverUrl: book.cover_url,
        description: book.description
      })));
    }

    // Search user transmissions if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: transmissions, error: transmissionsError } = await supabase
        .from('transmissions')
        .select('*')
        .eq('user_id', user.id)
        .or(`title.ilike.%${query}%,author.ilike.%${query}%,notes.ilike.%${query}%`)
        .limit(10);
      
      if (transmissionsError) throw transmissionsError;
      
      if (transmissions) {
        results.push(...transmissions.map(transmission => ({
          type: 'transmission' as const,
          id: transmission.id.toString(),
          title: transmission.title || 'Untitled',
          author: transmission.author,
          coverUrl: transmission.cover_url,
          description: transmission.notes
        })));
      }
    }

    // Search Google Books for additional results
    try {
      const googleResults = await searchBooks(query);
      results.push(...googleResults.slice(0, 5).map(book => ({
        type: 'book' as const,
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        description: book.subtitle
      })));
    } catch (error) {
      console.warn('Google Books search failed:', error);
    }

  } catch (error) {
    console.error('Search error:', error);
  }
  
  return results;
};
