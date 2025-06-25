
import { searchGoogleBooks, getBookByISBN, GoogleBook } from "./googleBooks";
import { memoize } from "@/utils/performance";

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  subtitle?: string;
}

export interface BookSuggestion {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  subtitle?: string;
}

export interface EnhancedBookSuggestion {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  thumbnailUrl?: string;
  smallThumbnailUrl?: string;
  subtitle?: string;
  description?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  rating?: number;
  ratingsCount?: number;
  previewLink?: string;
  infoLink?: string;
}

// Memoized search function for better performance
const memoizedSearchBooks = memoize(searchGoogleBooks);

export const searchBooks = async (query: string): Promise<Book[]> => {
  try {
    const books = await memoizedSearchBooks(query, 10);
    return books.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      subtitle: book.subtitle
    }));
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
};

export const searchBooksEnhanced = async (query: string, maxResults = 10, startIndex = 0): Promise<EnhancedBookSuggestion[]> => {
  try {
    // Use cache key that includes startIndex for better caching
    const cacheKey = `${query}-${maxResults}-${startIndex}`;
    const books = await searchGoogleBooks(query, maxResults);
    
    return books
      .filter(book => book.title && book.author) // Filter out incomplete books
      .map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        thumbnailUrl: book.coverUrl,
        smallThumbnailUrl: book.coverUrl,
        subtitle: book.subtitle,
        description: book.description,
        publishedDate: book.publishedDate,
        pageCount: book.pageCount,
        categories: book.categories,
        rating: book.averageRating,
        ratingsCount: book.ratingsCount,
        previewLink: book.previewLink,
        infoLink: book.infoLink
      }));
  } catch (error) {
    console.error('Error searching books enhanced:', error);
    return [];
  }
};

export const getBookDetails = async (bookId: string): Promise<Book | null> => {
  try {
    const books = await memoizedSearchBooks(bookId, 1);
    const book = books[0];
    if (!book) return null;
    
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      subtitle: book.subtitle
    };
  } catch (error) {
    console.error('Error getting book details:', error);
    return null;
  }
};

export const searchBooksByISBN = async (isbn: string): Promise<Book | null> => {
  try {
    const book = await getBookByISBN(isbn);
    if (!book) return null;
    
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      subtitle: book.subtitle
    };
  } catch (error) {
    console.error('Error searching by ISBN:', error);
    return null;
  }
};
