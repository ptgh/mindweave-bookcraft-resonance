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
  aspectRatio?: 'poster' | 'square' | 'auto';
  showSkeleton?: boolean;
  enableCaching?: boolean;
}

/**
 * Unified media image component for books and films
 * Handles loading states, quality optimization, caching, and fallbacks consistently
 */
export function MediaImage({
  src,
  alt,
  type = 'generic',
  quality = 'optimized',
  fallbackIcon,
  aspectRatio = 'poster',
  showSkeleton = true,
  enableCaching = true,
  className,
  ...props
}: MediaImageProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const cacheRequested = useRef(false);
  const prevSrcRef = useRef<string | null>(null);

  useEffect(() => {
    if (!src) {
      setImageState('error');
      return;
    }

    // Only reset to loading if src actually changed, not on re-renders
    if (prevSrcRef.current !== src) {
      // If we already have a displayed image, keep showing it while loading new one
      if (displaySrc && imageState === 'loaded') {
        // Don't reset to loading - keep showing current image
      } else {
        setImageState('loading');
      }
      cacheRequested.current = false;
      prevSrcRef.current = src;
    }

    const loadImage = async () => {
      // Try to get cached URL first
      let finalSrc = src;
      
      if (enableCaching && (type === 'book' || type === 'film')) {
        try {
          const cachedUrl = await getCachedImageUrl(src, type);
          if (cachedUrl && cachedUrl !== src) {
            finalSrc = cachedUrl;
          }
        } catch (e) {
          // Fallback to original
        }
      }

      // Apply quality optimization
      if (quality === 'high') {
        finalSrc = getHighQualityDisplayUrl(finalSrc);
      } else if (quality === 'optimized') {
        finalSrc = getOptimizedImageUrl(finalSrc);
      }

      // Only update displaySrc if it actually changed
      if (finalSrc !== displaySrc) {
        setDisplaySrc(finalSrc);
      }

      // Preload image to prevent layout shift
      preloadImage(finalSrc)
        .then(() => {
          setImageState('loaded');
          // Request background caching after successful load
          if (enableCaching && !cacheRequested.current && (type === 'book' || type === 'film')) {
            cacheRequested.current = true;
            requestImageCache(src, type);
          }
        })
        .catch(() => setImageState('error'));
    };

    loadImage();
  }, [src, quality, type, enableCaching]);

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

  // Show fallback icon on error
  if (imageState === 'error' || !displaySrc) {
    return (
      <div 
        className={cn(
          'bg-gradient-to-br from-muted/40 to-muted/20 flex items-center justify-center overflow-hidden',
          aspectClasses[aspectRatio],
          className
        )}
      >
        {fallbackIcon}
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
      onError={() => setImageState('error')}
      {...props}
    />
  );
}
