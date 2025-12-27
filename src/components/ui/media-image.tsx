import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, getHighQualityDisplayUrl, preloadImage } from '@/utils/performance';

interface MediaImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  alt: string;
  type?: 'book' | 'film' | 'generic';
  quality?: 'optimized' | 'high' | 'social';
  fallbackIcon?: React.ReactNode;
  aspectRatio?: 'poster' | 'square' | 'auto';
  showSkeleton?: boolean;
}

/**
 * Unified media image component for books and films
 * Handles loading states, quality optimization, and fallbacks consistently
 */
export function MediaImage({
  src,
  alt,
  type = 'generic',
  quality = 'optimized',
  fallbackIcon,
  aspectRatio = 'poster',
  showSkeleton = true,
  className,
  ...props
}: MediaImageProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [optimizedSrc, setOptimizedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) {
      setImageState('error');
      return;
    }

    // Get optimized URL based on quality setting
    let finalSrc = src;
    if (quality === 'high') {
      finalSrc = getHighQualityDisplayUrl(src);
    } else if (quality === 'optimized') {
      finalSrc = getOptimizedImageUrl(src);
    }
    // 'social' uses getSocialShareImageUrl but that's for meta tags

    setOptimizedSrc(finalSrc);
    setImageState('loading');

    // Preload image to prevent layout shift
    preloadImage(finalSrc)
      .then(() => setImageState('loaded'))
      .catch(() => setImageState('error'));
  }, [src, quality]);

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
  if (imageState === 'error' || !optimizedSrc) {
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
      src={optimizedSrc}
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
