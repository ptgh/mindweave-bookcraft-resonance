import { ZLibraryAPI } from './api';
import { ZLibraryTransformer } from './transformer';

export { ZLibraryAPI } from './api';
export { ZLibraryTransformer } from './transformer';
export type { 
  ZLibraryBook, 
  ZLibrarySearchParams, 
  ZLibrarySearchResponse,
  SupportedFormat 
} from './types';
export { SUPPORTED_FORMATS } from './types';

/**
 * Main search function for Z-Library integration
 */
export async function searchZLibrary(title: string, author: string, isbn?: string) {
  try {
    const searchParams = {
      title: title.trim(),
      author: author.trim(),
      isbn,
      language: 'English',
      limit: 10
    };

    const response = await ZLibraryAPI.searchBooks(searchParams);
    const englishBooks = ZLibraryTransformer.filterEnglishBooks(response.books);
    
    return {
      books: englishBooks,
      total: englishBooks.length,
      availableFormats: ZLibraryTransformer.getAvailableFormats(englishBooks)
    };
  } catch (error) {
    console.error('Z-Library search error:', error);
    throw new Error('Failed to search Z-Library');
  }
}