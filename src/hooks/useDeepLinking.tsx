
import { useState, useCallback, useMemo } from 'react';

export interface DeepLinkInfo {
  type: 'google';
  url: string;
  icon: string;
}

export const useDeepLinking = () => {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  
  // Memoize URL cache to avoid recalculating
  const urlCache = useMemo(() => new Map<string, DeepLinkInfo | null>(), []);

  const getDeepLink = useCallback((book: any): DeepLinkInfo | null => {
    const title = book.title || '';
    const author = book.author || '';
    const cacheKey = `${title}-${author}`;
    
    // Check cache first
    if (urlCache.has(cacheKey)) {
      return urlCache.get(cacheKey);
    }

    console.log('Getting deep link for book:', { title, author });

    let result: DeepLinkInfo | null = null;

    // Priority 1: Google Books Preview Link (best for embedding)
    const previewLink = book.volumeInfo?.previewLink || book.previewLink;
    if (previewLink) {
      console.log('Found preview link:', previewLink);
      result = {
        type: 'google',
        url: previewLink,
        icon: '📖'
      };
    }
    // Priority 2: Google Books Info Link
    else if (book.volumeInfo?.infoLink || book.infoLink) {
      const infoLink = book.volumeInfo?.infoLink || book.infoLink;
      console.log('Found info link:', infoLink);
      result = {
        type: 'google',
        url: infoLink,
        icon: '📖'
      };
    }
    // Priority 3: Use Google Books ID if available
    else if (book.volumeInfo?.id || book.id) {
      const googleBooksId = book.volumeInfo?.id || book.id;
      if (googleBooksId && googleBooksId !== title) {
        const bookUrl = `https://books.google.com/books?id=${googleBooksId}&output=embed`;
        console.log('Generated ID-based URL:', bookUrl);
        result = {
          type: 'google',
          url: bookUrl,
          icon: '📖'
        };
      }
    }
    // Fallback: Generate Google Books search URL (only if we have both title and author)
    else if (title && author && title.length > 2 && author.length > 2) {
      const query = encodeURIComponent(`"${title}" "${author}"`);
      const searchUrl = `https://books.google.com/books?q=${query}&output=embed`;
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

    setLoadingIds(prev => new Set(prev).add(bookId));

    try {
      // Use a more reliable window opening approach
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        // Fallback if popup blocked
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error opening book link:', error);
      // Final fallback
      try {
        window.location.href = url;
      } catch (finalError) {
        console.error('Final fallback failed:', finalError);
      }
    } finally {
      // Clear loading state after a short delay
      setTimeout(() => {
        setLoadingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookId);
          return newSet;
        });
      }, 500);
    }
  }, [loadingIds]);

  return {
    getDeepLink,
    handleDeepLinkClick,
    isLoading: (id: number) => loadingIds.has(id)
  };
};
