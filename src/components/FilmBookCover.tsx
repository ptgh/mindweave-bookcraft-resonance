import React, { useState, useEffect, useCallback } from 'react';
import { Book } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchGoogleBooks } from '@/services/googleBooks';
import { requestImageCache, getCachedImageUrl } from '@/services/imageCacheService';
import { getOptimizedImageUrl, preloadImage } from '@/utils/performance';
import { writeBackFilmCover } from '@/services/filmCoverWritebackService';

interface FilmBookCoverProps {
  bookTitle: string;
  bookAuthor: string;
  storedCoverUrl?: string | null;
  className?: string;
}

/**
 * Book cover component specifically for film adaptations grid
 * Uses a multi-stage fallback strategy:
 * 1. Try cached Supabase URL if stored URL is external
 * 2. Try the stored URL directly
 * 3. Make a live Google Books API call
 * 4. Show fallback icon
 */
export const FilmBookCover: React.FC<FilmBookCoverProps> = ({
  bookTitle,
  bookAuthor,
  storedCoverUrl,
  className,
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [attemptStage, setAttemptStage] = useState(0);

  const tryLoadCover = useCallback(async (stage: number) => {
    // Stage 0: Try stored URL directly (might be Supabase or external)
    if (stage === 0 && storedCoverUrl) {
      // Check if it's already a Supabase URL
      if (storedCoverUrl.includes('supabase.co/storage')) {
        setDisplayUrl(storedCoverUrl);
        try {
          await preloadImage(storedCoverUrl);
          setImageState('loaded');
          return;
        } catch {
          // Continue to next stage
        }
      }
      
      // Try to get cached version of external URL
      try {
        const cachedUrl = await getCachedImageUrl(storedCoverUrl, 'book');
        if (cachedUrl && cachedUrl !== storedCoverUrl) {
          setDisplayUrl(cachedUrl);
          await preloadImage(cachedUrl);
          setImageState('loaded');
          return;
        }
      } catch {
        // No cache, try original
      }

      // Try original external URL with optimization
      try {
        const optimizedUrl = getOptimizedImageUrl(storedCoverUrl);
        setDisplayUrl(optimizedUrl);
        await preloadImage(optimizedUrl);
        setImageState('loaded');
        // Queue for caching
        requestImageCache(storedCoverUrl, 'book');
        return;
      } catch {
        // Original failed, continue to live search
      }
    }

    // Stage 1: Live Google Books search (same as preview modal)
    if (stage <= 1) {
      try {
        const results = await searchGoogleBooks(`${bookTitle} ${bookAuthor}`, 3);
        
        // Find best match by title similarity
        const bestMatch = results.find(result => 
          result.title.toLowerCase().includes(bookTitle.toLowerCase()) ||
          bookTitle.toLowerCase().includes(result.title.toLowerCase())
        ) || results[0];

        if (bestMatch?.coverUrl) {
          setDisplayUrl(bestMatch.coverUrl);
          await preloadImage(bestMatch.coverUrl);
          setImageState('loaded');
          // Queue for caching so next time it loads faster
          requestImageCache(bestMatch.coverUrl, 'book');
          // Write back to database so enrichment picks it up
          writeBackFilmCover(bookTitle, bookAuthor, bestMatch.coverUrl);
          return;
        }
      } catch (error) {
        console.warn(`Live cover fetch failed for ${bookTitle}:`, error);
      }
    }

    // All stages failed
    setImageState('error');
  }, [storedCoverUrl, bookTitle, bookAuthor]);

  useEffect(() => {
    setImageState('loading');
    setAttemptStage(0);
    tryLoadCover(0);
  }, [storedCoverUrl, bookTitle, bookAuthor, tryLoadCover]);

  // Skeleton while loading
  if (imageState === 'loading') {
    return (
      <div className={cn(
        'bg-muted/30 animate-pulse flex items-center justify-center',
        className
      )}>
        <Book className="w-5 h-5 text-muted-foreground/30" />
      </div>
    );
  }

  // Error fallback
  if (imageState === 'error' || !displayUrl) {
    return (
      <div className={cn(
        'bg-gradient-to-br from-muted/60 to-muted/40 flex flex-col items-center justify-center border border-border/30',
        className
      )}>
        <Book className="w-5 h-5 text-muted-foreground" />
        <span className="text-[7px] text-muted-foreground text-center px-1 mt-1 line-clamp-2 leading-tight max-w-full">
          {bookTitle.slice(0, 20)}
        </span>
      </div>
    );
  }

  // Successfully loaded image
  return (
    <img
      src={displayUrl}
      alt={bookTitle}
      loading="lazy"
      decoding="async"
      className={cn('w-full h-full object-cover', className)}
      onError={() => {
        // If img tag errors after preload succeeded, move to next stage
        if (attemptStage === 0) {
          setAttemptStage(1);
          setImageState('loading');
          tryLoadCover(1);
        } else {
          setImageState('error');
        }
      }}
    />
  );
};
