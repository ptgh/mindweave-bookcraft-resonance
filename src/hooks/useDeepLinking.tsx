
import { useState, useCallback } from 'react';

export interface DeepLinkInfo {
  type: 'google';
  url: string;
  icon: string;
}

export const useDeepLinking = () => {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

  const getDeepLink = useCallback((book: any): DeepLinkInfo | null => {
    const title = book.title || '';
    const author = book.author || '';

    // Priority 1: Google Books Preview (if available)
    const previewLink = book.volumeInfo?.previewLink || book.previewLink;
    if (previewLink) {
      console.log('Found preview link:', previewLink);
      return {
        type: 'google',
        url: previewLink,
        icon: '📖'
      };
    }

    // Priority 2: Google Books Info Link
    const infoLink = book.volumeInfo?.infoLink || book.infoLink;
    if (infoLink) {
      console.log('Found info link:', infoLink);
      return {
        type: 'google',
        url: infoLink,
        icon: '📖'
      };
    }

    // Fallback: Generate Google Books search URL
    if (title && author) {
      const query = encodeURIComponent(`${title} ${author}`);
      const searchUrl = `https://books.google.com/books?q=${query}`;
      console.log('Generated search URL:', searchUrl);
      return {
        type: 'google',
        url: searchUrl,
        icon: '📖'
      };
    }

    console.log('No deep link available for book:', title);
    return null;
  }, []);

  const handleDeepLinkClick = useCallback(async (bookId: number, url: string) => {
    if (loadingIds.has(bookId)) return;

    setLoadingIds(prev => new Set(prev).add(bookId));

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening book link:', error);
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setLoadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  }, [loadingIds]);

  return {
    getDeepLink,
    handleDeepLinkClick,
    isLoading: (id: number) => loadingIds.has(id)
  };
};
