import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, getHighQualityDisplayUrl, preloadImage } from '@/utils/performance';
import { getCachedImageUrl, requestImageCache } from '@/services/imageCacheService';

interface MediaImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  alt: string;
  type?: 'book' | 'film' | 'generic';
  quality?: 'optimized' | 'high' | 'social';
  fallbackIcon?: React.ReactNode;
  fallbackTitle?: string;
  aspectRatio?: 'poster' | 'square' | 'auto';
  showSkeleton?: boolean;
  enableCaching?: boolean;
  /** Called when all image loading attempts fail */
  onAllAttemptsFailed?: () => void;
}

/**
 * Unified media image component for books and films
 * Handles loading states, quality optimization, caching, and fallbacks consistently
 * Uses a fallback chain: cached → optimized → original src
 */
export function MediaImage({
  src,
  alt,
  type = 'generic',
  quality = 'optimized',
  fallbackIcon,
  fallbackTitle,
  aspectRatio = 'poster',
  showSkeleton = true,
  enableCaching = true,
  onAllAttemptsFailed,
  className,
  ...props
}: MediaImageProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const attemptRef = useRef(0);
  const prevSrcRef = useRef<string | null>(null);

  useEffect(() => {
    if (!src) {
      setImageState('error');
      return;
    }

    // Only reset to loading if src actually changed
    if (prevSrcRef.current !== src) {
      if (!(displaySrc && imageState === 'loaded')) {
        setImageState('loading');
      }
      attemptRef.current = 0;
      prevSrcRef.current = src;
    }

    const tryLoadImage = async (attempt: number) => {
      let urlToTry = src;

      // Build URL candidates based on attempt number
      // Attempt 0: Try cached URL if available
      // Attempt 1: Try optimized URL
      // Attempt 2: Try original URL as-is
      if (attempt === 0 && enableCaching && (type === 'book' || type === 'film')) {
        try {
          const cachedUrl = await getCachedImageUrl(src, type);
          if (cachedUrl && cachedUrl !== src) {
            urlToTry = cachedUrl;
          } else {
            // No cache, skip to optimized
            attempt = 1;
          }
        } catch {
          attempt = 1;
        }
      }

      if (attempt === 1) {
        // Apply quality optimization
        if (quality === 'high') {
          urlToTry = getHighQualityDisplayUrl(src);
        } else if (quality === 'optimized') {
          urlToTry = getOptimizedImageUrl(src);
        }
      }

      if (attempt === 2) {
        // Use original URL exactly as-is (no optimization)
        urlToTry = src;
      }

      if (!urlToTry) {
        setImageState('error');
        return;
      }

      setDisplaySrc(urlToTry);

      try {
        await preloadImage(urlToTry);
        setImageState('loaded');
        // Request background caching on success
        if (enableCaching && (type === 'book' || type === 'film')) {
          requestImageCache(src, type);
        }
      } catch {
        // Try next fallback
        if (attempt < 2) {
          attemptRef.current = attempt + 1;
          tryLoadImage(attempt + 1);
        } else {
          setImageState('error');
          // Notify parent that all attempts failed
          onAllAttemptsFailed?.();
        }
      }
    };

    tryLoadImage(attemptRef.current);
  }, [src, quality, type, enableCaching, onAllAttemptsFailed]);

  const aspectClasses = {
    poster: 'aspect-[2/3]',
    square: 'aspect-square',
    auto: ''
  };

  // Show skeleton while loading
  if (imageState === 'loading' && showSkeleton) {
    return (
      <div 
        className={cn(
          'bg-muted/30 animate-pulse overflow-hidden',
          aspectClasses[aspectRatio],
          className
        )}
      >
        <div className="w-full h-full flex items-center justify-center">
          {fallbackIcon && (
            <div className="opacity-20">{fallbackIcon}</div>
          )}
        </div>
      </div>
    );
  }

  // Show fallback icon/title on error
  if (imageState === 'error' || !displaySrc) {
    return (
      <div 
        className={cn(
          'bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex flex-col items-center justify-center overflow-hidden border border-slate-600/30',
          aspectClasses[aspectRatio],
          className
        )}
      >
        {fallbackIcon}
        {fallbackTitle && (
          <span className="text-[8px] text-slate-400 text-center px-1 mt-1 line-clamp-2 leading-tight max-w-full">
            {fallbackTitle.slice(0, 30)}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={displaySrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn(
        'w-full h-full object-cover transition-opacity duration-200',
        imageState === 'loaded' ? 'opacity-100' : 'opacity-0',
        className
      )}
      onError={() => {
        // If img tag errors after preload succeeded, try next fallback
        if (attemptRef.current < 2) {
          attemptRef.current += 1;
          setImageState('loading');
        } else {
          setImageState('error');
        }
      }}
      {...props}
    />
  );
}
