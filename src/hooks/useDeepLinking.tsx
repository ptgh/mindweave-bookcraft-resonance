
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

    console.log('useDeepLinking - Processing book:', { title, author, book });

    // Priority 1: Direct Google Books ID (most reliable)
    const googleBooksId = book.volumeInfo?.id || book.id;
    if (googleBooksId && googleBooksId !== title && typeof googleBooksId === 'string' && googleBooksId.length > 5) {
      const directUrl = `https://books.google.com/books?id=${googleBooksId}&lpg=PP1&pg=PP1`;
      console.log('useDeepLinking - Using direct book ID URL:', directUrl);
      return {
        type: 'google',
        url: directUrl,
        icon: '📖'
      };
    }

    // Priority 2: Preview Link (if available and valid)
    const previewLink = book.volumeInfo?.previewLink || book.previewLink;
    if (previewLink && typeof previewLink === 'string' && previewLink.includes('books.google.com')) {
      console.log('useDeepLinking - Using preview link:', previewLink);
      return {
        type: 'google',
        url: previewLink,
        icon: '📖'
      };
    }

    // Priority 3: Info Link (fallback)
    const infoLink = book.volumeInfo?.infoLink || book.infoLink;
    if (infoLink && typeof infoLink === 'string' && infoLink.includes('books.google.com')) {
      console.log('useDeepLinking - Using info link:', infoLink);
      return {
        type: 'google',
        url: infoLink,
        icon: '📖'
      };
    }

    // Priority 4: Search URL (last resort)
    if (title && author) {
      // Clean the search terms
      const cleanTitle = title.replace(/[^\w\s]/g, '').trim();
      const cleanAuthor = author.replace(/[^\w\s]/g, '').trim();
      const query = encodeURIComponent(`${cleanTitle} ${cleanAuthor}`);
      const searchUrl = `https://books.google.com/books?q=${query}&hl=en`;
      console.log('useDeepLinking - Generated search URL:', searchUrl);
      return {
        type: 'google',
        url: searchUrl,
        icon: '📖'
      };
    }

    console.log('useDeepLinking - No valid link found for book:', title);
    return null;
  }, []);

  const handleDeepLinkClick = useCallback(async (bookId: number, url: string) => {
    if (loadingIds.has(bookId)) return;

    setLoadingIds(prev => new Set(prev).add(bookId));

    try {
      console.log('useDeepLinking - Opening URL:', url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('useDeepLinking - Error opening book link:', error);
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setTimeout(() => {
        setLoadingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookId);
          return newSet;
        });
      }, 1000);
    }
  }, [loadingIds]);

  return {
    getDeepLink,
    handleDeepLinkClick,
    isLoading: (id: number) => loadingIds.has(id)
  };
};
