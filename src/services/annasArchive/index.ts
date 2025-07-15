import { AnnasArchiveAPI } from './api';
import { AnnasArchiveTransformer } from './transformer';

export { AnnasArchiveAPI } from './api';
export { AnnasArchiveTransformer } from './transformer';
export type { 
  AnnasArchiveBook, 
  AnnasArchiveSearchParams, 
  AnnasArchiveSearchResponse,
  SupportedFormat 
} from './types';
export { SUPPORTED_FORMATS } from './types';

/**
 * Main search function for Anna's Archive integration
 */
export async function searchAnnasArchive(title: string, author: string, isbn?: string) {
  try {
    const searchParams = {
      title: title.trim(),
      author: author.trim(),
      isbn,
      language: 'English',
      limit: 10
    };

    const response = await AnnasArchiveAPI.searchBooks(searchParams);
    const englishBooks = AnnasArchiveTransformer.filterEnglishBooks(response.books);
    
    // Apply fuzzy matching for better results
    const matchedBooks = AnnasArchiveTransformer.fuzzyMatchBooks(title, author, englishBooks);
    
    return {
      books: matchedBooks,
      total: matchedBooks.length,
      availableFormats: AnnasArchiveTransformer.getAvailableFormats(matchedBooks)
    };
  } catch (error) {
    console.error('Anna\'s Archive search error:', error);
    throw new Error('Failed to search Anna\'s Archive');
  }
}