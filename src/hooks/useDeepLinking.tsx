
import { useState, useCallback, useMemo } from 'react';
import { normalizeForMatching } from '@/utils/textCleaners';

export interface DeepLinkInfo {
  type: 'google';
  url: string;
  icon: string;
}

export const useDeepLinking = () => {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  
  // Simple cache for deep links
  const urlCache = useMemo(() => new Map<string, DeepLinkInfo | null>(), []);

  const getDeepLink = useCallback((book: any): DeepLinkInfo | null => {
    if (!book) return null;
    
    const title = book.title || '';
    const author = book.author || '';
    const cacheKey = `${title}-${author}`;
    
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
      // Create a more targeted search query using centralized cleaners
      const cleanTitle = normalizeForMatching(title);
      const cleanAuthor = normalizeForMatching(author);
      const query = encodeURIComponent(`"${cleanTitle}" "${cleanAuthor}"`);
      const searchUrl = `https://books.google.com/books?q=${query}&source=gbs_navlinks_s`;
      console.log('Generated search URL:', searchUrl);
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
