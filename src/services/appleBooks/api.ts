import { AppleBook } from "./types";
import { appleBooksCache } from "./cache";
import { transformAppleBookData } from "./transformer";
import { supabase } from "@/integrations/supabase/client";

export const searchAppleBooksByISBN = async (isbn: string): Promise<AppleBook | null> => {
  const cacheKey = appleBooksCache.generateKey(isbn);
  const cached = appleBooksCache.get(cacheKey);
  if (cached !== undefined) return cached; // Return cached result (can be null)
  
  try {
    console.log('📖 Searching Apple Books by ISBN via proxy:', isbn);
    
    const { data, error } = await supabase.functions.invoke('apple-books-proxy', {
      body: {
        searchType: 'isbn',
        isbn: isbn
      }
    });

    if (error) {
      console.error('Apple Books proxy error:', error);
      return null;
    }

    if (data?.error) {
      console.warn('Apple Books API error:', data.error);
      // Cache the "no result" to avoid repeated API calls
      appleBooksCache.set(cacheKey, null);
      return null;
    }
    
    if (!data?.results || data.results.length === 0) {
      // Cache the "no result" to avoid repeated API calls
      appleBooksCache.set(cacheKey, null);
      return null;
    }
    
    const book = transformAppleBookData(data.results[0]);
    if (book) {
      book.isbn = isbn; // Store the ISBN for reference
    }
    
    appleBooksCache.set(cacheKey, book);
    return book;
    
  } catch (error) {
    console.error('Error searching Apple Books by ISBN:', error);
    return null;
  }
};

export const searchAppleBooksByTitleAuthor = async (title: string, author: string): Promise<AppleBook | null> => {
  const cacheKey = appleBooksCache.generateKey(undefined, title, author);
  const cached = appleBooksCache.get(cacheKey);
  if (cached !== undefined) return cached; // Return cached result (can be null)
  
  try {
    console.log('🔍 Searching Apple Books by title/author via proxy:', { title, author });
    
    const { data, error } = await supabase.functions.invoke('apple-books-proxy', {
      body: {
        searchType: 'titleAuthor',
        title: title,
        author: author
      }
    });

    if (error) {
      console.error('Apple Books proxy error:', error);
      return null;
    }

    if (data?.error) {
      console.warn('Apple Books API error:', data.error);
      // Cache the "no result" to avoid repeated API calls
      appleBooksCache.set(cacheKey, null);
      return null;
    }
    
    if (!data?.results || data.results.length === 0) {
      // Cache the "no result" to avoid repeated API calls
      appleBooksCache.set(cacheKey, null);
      return null;
    }
    
    const book = transformAppleBookData(data.results[0]);
    appleBooksCache.set(cacheKey, book);
    return book;
    
  } catch (error) {
    console.error('Error searching Apple Books by title/author:', error);
    return null;
  }
};

// Main function to search Apple Books - tries ISBN first, then title/author
export const searchAppleBooks = async (
  title: string, 
  author: string, 
  isbn?: string
): Promise<AppleBook | null> => {
  console.log('🍎 Apple Books search started:', { title, author, isbn });
  
  // Try ISBN lookup first if available (more accurate and faster)
  if (isbn) {
    console.log('📖 Trying ISBN lookup first:', isbn);
    const result = await searchAppleBooksByISBN(isbn);
    if (result) {
      console.log('✅ ISBN lookup success:', result);
      return result;
    }
    console.log('❌ ISBN lookup failed, trying title/author');
  }
  
  // Fallback to title/author search
  console.log('🔍 Trying title/author search:', title, author);
  const result = await searchAppleBooksByTitleAuthor(title, author);
  console.log('📱 Title/author search result:', result);
  return result;
};