
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
  isbn?: string;
}

// Memoized search function for better performance
const memoizedSearchBooks = memoize(searchGoogleBooks);

// Enhanced sci-fi filtering function
const isSciFiBook = (book: any): boolean => {
  const sciFiKeywords = [
    'science fiction', 'sci-fi', 'cyberpunk', 'dystopian', 'utopian',
    'space opera', 'time travel', 'artificial intelligence', 'robot',
    'android', 'cyborg', 'alien', 'extraterrestrial', 'space',
    'future', 'futuristic', 'dystopia', 'utopia', 'post-apocalyptic',
    'steampunk', 'biopunk', 'nanopunk', 'alternate history',
    'virtual reality', 'genetic engineering', 'bioengineering',
    'terraforming', 'interstellar', 'galactic', 'quantum',
    'dimensional', 'parallel universe', 'multiverse'
  ];

  const antiKeywords = [
    'climate policy', 'economics', 'politics', 'business',
    'self-help', 'biography', 'memoir', 'history',
    'religion', 'philosophy', 'psychology', 'sociology',
    'anthropology', 'education', 'health', 'medical',
    'cookbook', 'travel', 'romance', 'mystery',
    'thriller', 'horror', 'western', 'historical fiction',
    'literary fiction', 'young adult', 'children',
    'textbook', 'academic', 'reference'
  ];

  // Check categories first (most reliable)
  if (book.categories && Array.isArray(book.categories)) {
    const categoryText = book.categories.join(' ').toLowerCase();
    
    // Reject if contains anti-keywords in categories
    if (antiKeywords.some(keyword => categoryText.includes(keyword))) {
      return false;
    }
    
    // Accept if contains sci-fi keywords in categories
    if (sciFiKeywords.some(keyword => categoryText.includes(keyword))) {
      return true;
    }
  }

  // Check title and description
  const searchText = [
    book.title || '',
    book.subtitle || '',
    book.description || ''
  ].join(' ').toLowerCase();

  // Reject if contains strong anti-indicators
  const strongAntiKeywords = [
    'climate policy', 'economic analysis', 'political economy',
    'business strategy', 'policy making', 'government policy'
  ];
  
  if (strongAntiKeywords.some(keyword => searchText.includes(keyword))) {
    return false;
  }

  // Accept if contains sci-fi indicators
  return sciFiKeywords.some(keyword => searchText.includes(keyword));
};

export const searchBooks = async (query: string): Promise<Book[]> => {
  try {
    // Add sci-fi specific terms to the query
    const sciFiQuery = `${query} science fiction OR sci-fi OR cyberpunk OR dystopian OR space opera`;
    const books = await memoizedSearchBooks(sciFiQuery, 10);
    
    return books
      .filter(book => isSciFiBook(book))
      .map(book => ({
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

export const searchBooksEnhanced = async (query: string, maxResults = 10, startIndex = 0, authorFilter?: string): Promise<EnhancedBookSuggestion[]> => {
  try {
    // Use the exact query without modifications for better title accuracy
    const searchQuery = authorFilter 
      ? `${query} inauthor:${authorFilter}`
      : query;
    const books = await searchGoogleBooks(searchQuery, maxResults);
    
    return books
      .filter(book => book.title && book.author && isSciFiBook(book))
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
        infoLink: book.infoLink,
        isbn: book.isbn
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
