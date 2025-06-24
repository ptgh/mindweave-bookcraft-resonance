
// Simplified and optimized version
import { searchGoogleBooks, getBookByISBN, GoogleBook } from "./googleBooks";

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  subtitle?: string;
}

export const searchBooks = async (query: string): Promise<Book[]> => {
  try {
    const books = await searchGoogleBooks(query, 10);
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

export const getBookDetails = async (bookId: string): Promise<Book | null> => {
  try {
    const books = await searchGoogleBooks(bookId, 1);
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
