import { AnnasArchiveBook, SupportedFormat, SUPPORTED_FORMATS } from './types';

export class AnnasArchiveTransformer {
  /**
   * Filter books to prioritize English titles
   */
  static filterEnglishBooks(books: AnnasArchiveBook[]): AnnasArchiveBook[] {
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
  static groupByFormat(books: AnnasArchiveBook[]): Record<string, AnnasArchiveBook[]> {
    return books.reduce((groups, book) => {
      const format = book.extension.toLowerCase();
      if (!groups[format]) {
        groups[format] = [];
      }
      groups[format].push(book);
      return groups;
    }, {} as Record<string, AnnasArchiveBook[]>);
  }

  /**
   * Get unique formats available for a book search
   */
  static getAvailableFormats(books: AnnasArchiveBook[]): SupportedFormat[] {
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

  /**
   * Enhanced search matching for better book discovery
   */
  static fuzzyMatchBooks(searchTitle: string, searchAuthor: string, books: AnnasArchiveBook[]): AnnasArchiveBook[] {
    const normalizeString = (str: string) => 
      str.toLowerCase()
         .replace(/[^\w\s]/g, '')
         .replace(/\s+/g, ' ')
         .trim();

    const normalizedSearchTitle = normalizeString(searchTitle);
    const normalizedSearchAuthor = normalizeString(searchAuthor);

    return books
      .map(book => ({
        book,
        score: this.calculateMatchScore(
          normalizedSearchTitle,
          normalizedSearchAuthor,
          normalizeString(book.title),
          normalizeString(book.author)
        )
      }))
      .filter(({ score }) => score > 0.3) // Only return reasonable matches
      .sort((a, b) => b.score - a.score)
      .map(({ book }) => book);
  }

  private static calculateMatchScore(
    searchTitle: string,
    searchAuthor: string,
    bookTitle: string,
    bookAuthor: string
  ): number {
    let score = 0;

    // Title matching (weighted heavily)
    const titleWords = searchTitle.split(' ');
    const bookTitleWords = bookTitle.split(' ');
    
    titleWords.forEach(word => {
      if (bookTitleWords.some(bookWord => bookWord.includes(word) || word.includes(bookWord))) {
        score += 0.4;
      }
    });

    // Author matching
    const authorWords = searchAuthor.split(' ');
    const bookAuthorWords = bookAuthor.split(' ');
    
    authorWords.forEach(word => {
      if (bookAuthorWords.some(bookWord => bookWord.includes(word) || word.includes(bookWord))) {
        score += 0.3;
      }
    });

    // Exact matches get bonus points
    if (bookTitle.includes(searchTitle)) score += 0.5;
    if (bookAuthor.includes(searchAuthor)) score += 0.3;

    return Math.min(score, 1.0); // Cap at 1.0
  }
}