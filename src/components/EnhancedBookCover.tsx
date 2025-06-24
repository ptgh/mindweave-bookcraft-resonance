
import { useState, useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";
import { imageService } from "@/services/image-service";

interface EnhancedBookCoverProps {
  title: string;
  coverUrl?: string;
  thumbnailUrl?: string;
  smallThumbnailUrl?: string;
  className?: string;
  lazy?: boolean;
}

const EnhancedBookCover = ({ 
  title, 
  coverUrl, 
  thumbnailUrl, 
  smallThumbnailUrl, 
  className = "w-12 h-16",
  lazy = true
}: EnhancedBookCoverProps) => {
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const loadImage = async () => {
      if (!coverUrl && !thumbnailUrl && !smallThumbnailUrl) {
        setIsLoading(false);
        setHasError(true);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      // Create comprehensive fallback list with multiple image sizes and alternative URLs
      const fallbacks = [
        coverUrl,
        thumbnailUrl,
        smallThumbnailUrl,
        // Try alternative Google Books image URLs with different parameters
        coverUrl?.replace('&edge=curl', ''),
        thumbnailUrl?.replace('&edge=curl', ''),
        coverUrl?.replace('zoom=1', 'zoom=0'),
        thumbnailUrl?.replace('zoom=1', 'zoom=0'),
        // Try without query parameters
        coverUrl?.split('?')[0],
        thumbnailUrl?.split('?')[0],
        smallThumbnailUrl?.split('?')[0]
      ].filter(Boolean) as string[];
      
      try {
        const src = await imageService.loadImage({
          src: fallbacks[0] || '',
          fallbacks: fallbacks.slice(1),
          timeout: 3000
        });
        setCurrentSrc(src);
        setIsLoading(false);
      } catch (error) {
        console.warn('All image sources failed for:', title);
        setIsLoading(false);
        setHasError(true);
      }
    };

    if (lazy && imgRef.current) {
      const primaryUrl = coverUrl || thumbnailUrl || smallThumbnailUrl;
      if (primaryUrl) {
        imageService.setupLazyLoading(imgRef.current, primaryUrl);
        setIsLoading(false);
        return;
      }
    }

    loadImage();
  }, [coverUrl, thumbnailUrl, smallThumbnailUrl, title, lazy]);

  if (lazy) {
    return (
      <div className={`${className} flex-shrink-0 rounded overflow-hidden relative`}>
        <img
          ref={imgRef}
          alt={title}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={() => setHasError(true)}
          onLoad={() => setHasError(false)}
        />
        {hasError && (
          <div className="absolute inset-0">
            <PlaceholderCover title={title} className="w-full h-full" />
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${className} flex-shrink-0 rounded overflow-hidden`}>
        <div className="w-full h-full bg-slate-700 animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (hasError || !currentSrc) {
    return <PlaceholderCover title={title} className={className} />;
  }

  return (
    <div className={`${className} flex-shrink-0 rounded overflow-hidden`}>
      <img
        src={currentSrc}
        alt={title}
        className="w-full h-full object-cover transition-opacity duration-300"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
};

const PlaceholderCover = ({ title, className = "w-12 h-16" }: { title: string; className?: string }) => {
  return (
    <div className={`${className} flex-shrink-0 rounded overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black flex flex-col items-center justify-center relative`}>
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-40" />
      <div className="absolute top-2 left-2 right-8 h-px bg-white/10" />
      
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="w-8 h-8 mb-2 rounded-sm bg-white/5 flex items-center justify-center backdrop-blur-sm">
          <BookOpen className="w-4 h-4 text-white/60" />
        </div>
        <div className="text-xs text-white/40 text-center px-2 leading-tight">
          {title.length > 20 ? title.substring(0, 20) + '...' : title}
        </div>
      </div>
      
      {/* Bottom shine effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/3 to-transparent" />
    </div>
  );
};

export default EnhancedBookCover;
