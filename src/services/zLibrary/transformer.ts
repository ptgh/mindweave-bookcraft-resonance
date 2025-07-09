import { ZLibraryBook, SupportedFormat, SUPPORTED_FORMATS } from './types';

export class ZLibraryTransformer {
  /**
   * Filter books to prioritize English titles
   */
  static filterEnglishBooks(books: ZLibraryBook[]): ZLibraryBook[] {
    return books
      .filter(book => book.language.toLowerCase().includes('english'))
      .sort((a, b) => {
        // Prioritize common formats
        const formatPriority = ['pdf', 'epub', 'mobi'];
        const aIndex = formatPriority.indexOf(a.extension.toLowerCase());
        const bIndex = formatPriority.indexOf(b.extension.toLowerCase());
        
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return 0;
      });
  }

  /**
   * Group books by format for better display
   */
  static groupByFormat(books: ZLibraryBook[]): Record<string, ZLibraryBook[]> {
    return books.reduce((groups, book) => {
      const format = book.extension.toLowerCase();
      if (!groups[format]) {
        groups[format] = [];
      }
      groups[format].push(book);
      return groups;
    }, {} as Record<string, ZLibraryBook[]>);
  }

  /**
   * Get unique formats available for a book search
   */
  static getAvailableFormats(books: ZLibraryBook[]): SupportedFormat[] {
    const formats = books.map(book => book.extension.toLowerCase());
    const uniqueFormats = Array.from(new Set(formats));
    
    return uniqueFormats.filter(format => 
      SUPPORTED_FORMATS.includes(format as SupportedFormat)
    ) as SupportedFormat[];
  }

  /**
   * Format file size for display
   */
  static formatFileSize(sizeStr?: string): string {
    if (!sizeStr) return 'Unknown size';
    return sizeStr;
  }

  /**
   * Clean and format book title
   */
  static formatTitle(title: string): string {
    return title
      .replace(/\[.*?\]/g, '') // Remove bracketed text
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
  }
}