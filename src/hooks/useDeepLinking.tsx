
import { useState, useCallback } from 'react';
import { updateTransmission } from '@/services/transmissionsService';

export interface DeepLinkInfo {
  type: 'apple' | 'google' | 'openlibrary';
  url: string;
  icon: string;
}

export const useDeepLinking = () => {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

  const isAppleDevice = useCallback(() => {
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
           (/MacIntel/.test(navigator.platform) && navigator.maxTouchPoints > 1);
  }, []);

  const generateAppleLink = useCallback((isbn: string) => {
    return `https://books.apple.com/book/isbn${isbn}`;
  }, []);

  const generateOpenLibraryLink = useCallback((isbn: string) => {
    return `https://openlibrary.org/isbn/${isbn}`;
  }, []);

  const getDeepLink = useCallback((book: any): DeepLinkInfo | null => {
    // Try to extract ISBN from various possible sources
    const isbn = book.isbn || 
                 book.volumeInfo?.industryIdentifiers?.find(
                   (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
                 )?.identifier ||
                 book.industryIdentifiers?.find(
                   (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
                 )?.identifier;

    const isApple = isAppleDevice();

    // Priority 1: Apple Books (prioritized on Apple devices, but only if we have ISBN)
    if (isbn && (isApple || (!book.volumeInfo?.previewLink && !book.previewLink))) {
      return {
        type: 'apple',
        url: generateAppleLink(isbn),
        icon: '🍎'
      };
    }

    // Priority 2: Google Books Preview (if available)
    const previewLink = book.volumeInfo?.previewLink || book.previewLink;
    if (previewLink) {
      return {
        type: 'google',
        url: previewLink,
        icon: '📖'
      };
    }

    // Priority 3: Open Library (if we have ISBN)
    if (isbn) {
      return {
        type: 'openlibrary',
        url: generateOpenLibraryLink(isbn),
        icon: '📚'
      };
    }

    // No valid link found
    return null;
  }, [isAppleDevice, generateAppleLink, generateOpenLibraryLink]);

  const handleDeepLinkClick = useCallback(async (bookId: number, url: string, isbn?: string) => {
    if (loadingIds.has(bookId)) return;

    setLoadingIds(prev => new Set(prev).add(bookId));

    try {
      // Update open_count and apple_link if needed
      const updates: any = {
        open_count: 1 // This will be incremented in the service
      };

      if (isbn && url.includes('books.apple.com')) {
        updates.apple_link = url;
        updates.isbn = isbn;
      }

      await updateTransmission(bookId, updates);
      
      // Open the link
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error updating book open count:', error);
      // Still open the link even if the update fails
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
