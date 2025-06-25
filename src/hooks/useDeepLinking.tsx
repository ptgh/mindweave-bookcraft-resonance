
import { useState, useCallback, useMemo } from 'react';

export interface DeepLinkInfo {
  type: 'google';
  url: string;
  icon: string;
}

export const useDeepLinking = () => {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  
  // Simple cache without complex memoization that might cause issues
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

    // Priority 1: Use previewLink if available
    if (book.previewLink) {
      console.log('Found previewLink:', book.previewLink);
      result = {
        type: 'google',
        url: book.previewLink,
        icon: '📖'
      };
    }
    // Priority 2: Use infoLink
    else if (book.infoLink) {
      console.log('Found infoLink:', book.infoLink);
      result = {
        type: 'google',
        url: book.infoLink,
        icon: '📖'
      };
    }
    // Priority 3: Use volumeInfo links if available
    else if (book.volumeInfo?.previewLink) {
      console.log('Found volumeInfo.previewLink:', book.volumeInfo.previewLink);
      result = {
        type: 'google',
        url: book.volumeInfo.previewLink,
        icon: '📖'
      };
    }
    else if (book.volumeInfo?.infoLink) {
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
        url: `https://books.google.com/books?id=${book.id}`,
        icon: '📖'
      };
    }
    // Fallback: Generate search URL if we have title and author
    else if (title && author && title.length > 2 && author.length > 2) {
      const query = encodeURIComponent(`"${title}" "${author}"`);
      const searchUrl = `https://books.google.com/books?q=${query}`;
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
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error opening book link:', error);
      try {
        window.location.href = url;
      } catch (finalError) {
        console.error('Final fallback failed:', finalError);
      }
    } finally {
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
