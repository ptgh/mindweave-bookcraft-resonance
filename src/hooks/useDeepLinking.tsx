
import { useState, useCallback, useMemo } from 'react';
import { normalizeForMatching } from '@/utils/textCleaners';

export interface DeepLinkInfo {
  type: 'google';
  url: string;
  icon: string;
}

// Known Google Books IDs for specific titles (verified correct book editions)
const KNOWN_GOOGLE_BOOKS_IDS: Record<string, string> = {
  'earth abides|george r. stewart': 'izeOd3pOZXwC',
  'earth abides|george stewart': 'izeOd3pOZXwC',
  'the day of the triffids|john wyndham': 'mfm6PgAACAAJ',
  'i am legend|richard matheson': 'mAKLoAEACAAJ',
  'a canticle for leibowitz|walter m. miller jr.': 'oWv2AAAAQBAJ',
  'a canticle for leibowitz|walter m. miller': 'oWv2AAAAQBAJ',
  'flowers for algernon|daniel keyes': 'jqtUDgAAQBAJ',
  'the body snatchers|jack finney': 'NpMRAAAAYAAJ',
  'invasion of the body snatchers|jack finney': 'NpMRAAAAYAAJ',
  'city|clifford d. simak': 'WvnKAAAAMAAJ',
  'city|clifford simak': 'WvnKAAAAMAAJ',
};

export const useDeepLinking = () => {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  
  // Simple cache for deep links
  const urlCache = useMemo(() => new Map<string, DeepLinkInfo | null>(), []);

  const getDeepLink = useCallback((book: any): DeepLinkInfo | null => {
    if (!book) return null;
    
    const title = book.title || '';
    const author = book.author || '';
    const cacheKey = `${title}-${author}`;
    
    // Check for known Google Books ID first
    const normalizedTitle = title.toLowerCase().trim();
    const normalizedAuthor = author.toLowerCase().trim();
    const lookupKey = `${normalizedTitle}|${normalizedAuthor}`;
    const knownId = KNOWN_GOOGLE_BOOKS_IDS[lookupKey];
    
    if (knownId) {
      console.log('Using known Google Books ID for:', title, '->', knownId);
      const result: DeepLinkInfo = {
        type: 'google',
        url: `https://books.google.co.uk/books/about/${encodeURIComponent(title.replace(/ /g, '_'))}.html?id=${knownId}`,
        icon: '📖'
      };
      urlCache.set(cacheKey, result);
      return result;
    }
    
    // Check cache first
    if (urlCache.has(cacheKey)) {
      return urlCache.get(cacheKey);
    }

    console.log('Getting deep link for book:', { title, author, book });

    let result: DeepLinkInfo | null = null;

    // Priority 1: Use previewLink if available and it's a proper Google Books URL
    if (book.previewLink && book.previewLink.includes('books.google.com')) {
      console.log('Found previewLink:', book.previewLink);
      result = {
        type: 'google',
        url: book.previewLink,
        icon: '📖'
      };
    }
    // Priority 2: Use infoLink if it's a Google Books URL
    else if (book.infoLink && book.infoLink.includes('books.google.com')) {
      console.log('Found infoLink:', book.infoLink);
      result = {
        type: 'google',
        url: book.infoLink,
        icon: '📖'
      };
    }
    // Priority 3: Use volumeInfo links if available
    else if (book.volumeInfo?.previewLink && book.volumeInfo.previewLink.includes('books.google.com')) {
      console.log('Found volumeInfo.previewLink:', book.volumeInfo.previewLink);
      result = {
        type: 'google',
        url: book.volumeInfo.previewLink,
        icon: '📖'
      };
    }
    else if (book.volumeInfo?.infoLink && book.volumeInfo.infoLink.includes('books.google.com')) {
      console.log('Found volumeInfo.infoLink:', book.volumeInfo.infoLink);
      result = {
        type: 'google',
        url: book.volumeInfo.infoLink,
        icon: '📖'
      };
    }
    // Priority 4: Use Google Books ID to construct URL
    else if (book.id) {
      console.log('Using book ID to construct URL:', book.id);
      result = {
        type: 'google',
        url: `https://books.google.com/books?id=${book.id}&source=gbs_book_other_versions`,
        icon: '📖'
      };
    }
    // Fallback: Generate search URL if we have title and author
    else if (title && author && title.length > 2 && author.length > 2) {
      // Create a more targeted search query - use intitle for better precision
      const cleanTitle = normalizeForMatching(title);
      const cleanAuthor = normalizeForMatching(author);
      // Use intitle: for exact title match and inauthor: for author
      const query = encodeURIComponent(`intitle:${cleanTitle} inauthor:${cleanAuthor}`);
      const searchUrl = `https://www.google.com/search?tbm=bks&q=${query}`;
      console.log('Generated Google Books search URL:', searchUrl);
      result = {
        type: 'google',
        url: searchUrl,
        icon: '📖'
      };
    }

    // Cache the result
    urlCache.set(cacheKey, result);
    
    if (!result) {
      console.log('No deep link available for book:', title);
    }
    
    return result;
  }, [urlCache]);

  const handleDeepLinkClick = useCallback(async (bookId: number, url: string) => {
    if (loadingIds.has(bookId)) return;

    console.log('Handling deep link click:', { bookId, url });

    setLoadingIds(prev => new Set(prev).add(bookId));

    try {
      // For Google Books URLs, we don't open in new window here
      // This will be handled by the popup component
      console.log('Deep link click handled for popup');
    } catch (error) {
      console.error('Error handling deep link:', error);
    } finally {
      // Quick cleanup since we're not actually doing async work
      setTimeout(() => {
        setLoadingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookId);
          return newSet;
        });
      }, 300);
    }
  }, [loadingIds]);

  return {
    getDeepLink,
    handleDeepLinkClick,
    isLoading: (id: number) => loadingIds.has(id)
  };
};
