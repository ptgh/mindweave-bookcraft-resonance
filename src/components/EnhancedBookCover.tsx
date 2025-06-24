
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

      const fallbacks = [thumbnailUrl, smallThumbnailUrl].filter(Boolean) as string[];
      
      try {
        const src = await imageService.loadImage({
          src: coverUrl || thumbnailUrl || smallThumbnailUrl || '',
          fallbacks,
          timeout: 5000 // Reduced timeout for better performance
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
      <div className={`${className} flex-shrink-0 rounded overflow-hidden`}>
        <img
          ref={imgRef}
          alt={title}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={() => setHasError(true)}
        />
        {hasError && <PlaceholderCover title={title} />}
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

const PlaceholderCover = ({ title, className = "w-12 h-16" }: { title: string; className?: string }) => (
  <div className={`${className} flex-shrink-0 rounded overflow-hidden bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 flex flex-col items-center justify-center`}>
    <div className="w-4 h-4 mb-1 rounded-sm bg-blue-400/20 flex items-center justify-center">
      <BookOpen className="w-2 h-2 text-blue-400 opacity-60" />
    </div>
    <div className="flex space-x-0.5">
      <div className="w-0.5 h-0.5 bg-blue-400 rounded-full opacity-40"></div>
      <div className="w-0.5 h-0.5 bg-cyan-400 rounded-full opacity-60"></div>
      <div className="w-0.5 h-0.5 bg-blue-400 rounded-full opacity-40"></div>
    </div>
  </div>
);

export default EnhancedBookCover;
