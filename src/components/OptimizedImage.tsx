import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
  lazy?: boolean;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fallbackSrc,
  lazy = true,
  priority = false,
  className,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(priority ? src : '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) {
      return;
    }

    if (!lazy) {
      setImageSrc(src);
      return;
    }

    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, lazy, priority]);

  const handleLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
    if (fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  // Generate srcset for responsive images
  const generateSrcSet = (baseSrc: string) => {
    if (!baseSrc || !baseSrc.includes('googleusercontent.com')) {
      return undefined;
    }

    const sizes = [400, 600, 800, 1200];
    return sizes.map((size) => `${baseSrc.replace(/=s\d+/, `=s${size}`)} ${size}w`).join(', ');
  };

  const srcSet = generateSrcSet(imageSrc);

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ width, height }}>
      {isLoading && imageSrc && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={imageSrc || undefined}
        srcSet={srcSet}
        sizes={width ? `${width}px` : '100vw'}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : lazy ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          error && !fallbackSrc && 'hidden'
        )}
        {...props}
      />
      {error && !fallbackSrc && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Image unavailable</span>
        </div>
      )}
    </div>
  );
}
