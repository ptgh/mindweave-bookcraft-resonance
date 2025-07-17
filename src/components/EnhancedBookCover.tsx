
import { useState, useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";
import { imageService } from "@/services/image-service";
import scifiPlaceholder from "@/assets/book-placeholder-scifi.jpg";
import classicPlaceholder from "@/assets/book-placeholder-classic.jpg";
import generalPlaceholder from "@/assets/book-placeholder-general.jpg";

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

      // Prioritize higher quality images for better display
      const fallbacks = [
        // Use zoom=0 for higher quality on Google Books images
        coverUrl?.replace('zoom=1', 'zoom=0').replace('&edge=curl', ''),
        coverUrl?.replace('&edge=curl', ''),
        coverUrl,
        thumbnailUrl?.replace('zoom=1', 'zoom=0').replace('&edge=curl', ''),
        thumbnailUrl?.replace('&edge=curl', ''),
        thumbnailUrl,
        smallThumbnailUrl?.replace('zoom=1', 'zoom=0').replace('&edge=curl', '')
      ].filter(Boolean) as string[];
      
      try {
        const src = await imageService.loadImage({
          src: fallbacks[0] || '',
          fallbacks: fallbacks.slice(1),
          timeout: 1500
        });
        setCurrentSrc(src);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        setHasError(true);
      }
    };

    if (lazy && imgRef.current) {
      const primaryUrl = coverUrl || thumbnailUrl || smallThumbnailUrl;
      if (primaryUrl) {
        // Use the highest quality URL for lazy loading
        const enhancedUrl = primaryUrl
          .replace('zoom=1', 'zoom=0')
          .replace('&edge=curl', '');
        imageService.setupLazyLoading(imgRef.current, enhancedUrl);
        setIsLoading(false);
        return;
      }
    }

    // Defer image loading to not block initial render
    const timeoutId = setTimeout(loadImage, 10);
    return () => clearTimeout(timeoutId);
  }, [coverUrl, thumbnailUrl, smallThumbnailUrl, title, lazy]);

  if (lazy) {
    return (
      <div className={`${className} flex-shrink-0 rounded overflow-hidden relative bg-slate-700`}>
        <img
          ref={imgRef}
          alt={title}
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ imageRendering: 'crisp-edges' }}
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
      <div className={`${className} flex-shrink-0 rounded overflow-hidden bg-slate-700`}>
      <div className="w-full h-full bg-slate-700 animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (hasError || !currentSrc) {
    return <PlaceholderCover title={title} className={className} />;
  }

  return (
    <div className={`${className} flex-shrink-0 rounded overflow-hidden bg-slate-700`}>
      <img
        src={currentSrc}
        alt={title}
        className="w-full h-full object-cover transition-opacity duration-300"
        style={{ imageRendering: 'crisp-edges' }}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
};

const PlaceholderCover = ({ title, className = "w-12 h-16" }: { title: string; className?: string }) => {
  // Determine which placeholder to use based on title/genre context
  const getPlaceholderImage = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('sci-fi') || titleLower.includes('science fiction') || 
        titleLower.includes('space') || titleLower.includes('robot') || 
        titleLower.includes('alien') || titleLower.includes('future') ||
        titleLower.includes('mars') || titleLower.includes('star') ||
        titleLower.includes('cyber') || titleLower.includes('android')) {
      return scifiPlaceholder;
    }
    if (titleLower.includes('classic') || titleLower.includes('vintage') ||
        titleLower.includes('victorian') || titleLower.includes('19th') ||
        titleLower.includes('18th') || titleLower.includes('century')) {
      return classicPlaceholder;
    }
    return generalPlaceholder;
  };

  return (
    <div className={`${className} flex-shrink-0 rounded overflow-hidden relative`}>
      <img
        src={getPlaceholderImage(title)}
        alt={`Placeholder cover for ${title}`}
        className="w-full h-full object-cover"
        style={{ imageRendering: 'crisp-edges' }}
      />
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
        <div className="text-center p-2">
          <BookOpen className="w-4 h-4 text-white/60 mx-auto mb-1" />
          <div className="text-[8px] text-white/80 font-medium leading-tight">
            <span className="break-words line-clamp-2" style={{ wordBreak: 'break-word' }}>
              {title}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBookCover;
