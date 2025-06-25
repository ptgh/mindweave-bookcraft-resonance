
import { useState, useCallback } from 'react';

export interface DeepLinkInfo {
  type: 'google';
  url: string;
  icon: string;
}

export const useDeepLinking = () => {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

  const generateGoogleSearchLink = useCallback((title: string, author: string) => {
    const query = encodeURIComponent(`${title} ${author}`);
    return `https://www.google.com/search?q=${query}+book`;
  }, []);

  const getDeepLink = useCallback((book: any): DeepLinkInfo | null => {
    const title = book.title || '';
    const author = book.author || '';

    // Priority 1: Google Books Preview (if available)
    const previewLink = book.volumeInfo?.previewLink || book.previewLink;
    if (previewLink) {
      return {
        type: 'google',
        url: previewLink,
        icon: '📖'
      };
    }

    // Fallback: Google Search for the book
    if (title && author) {
      return {
        type: 'google',
        url: generateGoogleSearchLink(title, author),
        icon: '📖'
      };
    }

    return null;
  }, [generateGoogleSearchLink]);

  const handleDeepLinkClick = useCallback(async (bookId: number, url: string) => {
    if (loadingIds.has(bookId)) return;

    setLoadingIds(prev => new Set(prev).add(bookId));

    try {
      // Simplified - just open the URL without database updates for book browser
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
