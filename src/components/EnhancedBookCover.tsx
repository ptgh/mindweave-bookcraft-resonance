
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

      const fallbacks = [
        coverUrl,
        thumbnailUrl,
        smallThumbnailUrl,
        coverUrl?.replace('&edge=curl', ''),
        thumbnailUrl?.replace('&edge=curl', ''),
        coverUrl?.replace('zoom=1', 'zoom=0'),
        thumbnailUrl?.replace('zoom=1', 'zoom=0'),
        coverUrl?.split('?')[0],
        thumbnailUrl?.split('?')[0],
        smallThumbnailUrl?.split('?')[0]
      ].filter(Boolean) as string[];
      
      try {
        const src = await imageService.loadImage({
          src: fallbacks[0] || '',
          fallbacks: fallbacks.slice(1),
          timeout: 2000
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
        imageService.setupLazyLoading(imgRef.current, primaryUrl);
        setIsLoading(false);
        return;
      }
    }

    loadImage();
  }, [coverUrl, thumbnailUrl, smallThumbnailUrl, title, lazy]);

  if (lazy) {
    return (
      <div className={`${className} flex-shrink-0 rounded overflow-hidden relative bg-slate-700`}>
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
      <div className={`${className} flex-shrink-0 rounded overflow-hidden bg-slate-700`}>
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
    <div className={`${className} flex-shrink-0 rounded overflow-hidden bg-slate-700`}>
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
    <div className={`${className} flex-shrink-0 rounded overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 flex flex-col items-center justify-center relative border border-slate-600/30`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/3 to-transparent opacity-40" />
      <div className="absolute top-2 left-2 right-8 h-px bg-white/5" />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-2">
        <div className="w-6 h-6 mb-2 rounded-sm bg-slate-600/30 flex items-center justify-center backdrop-blur-sm flex-shrink-0">
          <BookOpen className="w-3 h-3 text-slate-400" />
        </div>
        <div className="text-[8px] text-slate-400 text-center px-1 leading-tight flex-1 flex items-center">
          <span className="break-words hyphens-auto line-clamp-3" style={{ wordBreak: 'break-word' }}>
            {title}
          </span>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/2 to-transparent" />
    </div>
  );
};

export default EnhancedBookCover;
