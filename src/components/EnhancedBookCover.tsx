
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
  // Generate a more thematic placeholder based on the title and sci-fi genre
  const getPlaceholderElements = (title: string) => {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('space') || lowerTitle.includes('opera') || lowerTitle.includes('galaxy')) {
      return { icon: '🚀', color: 'from-purple-600 to-blue-700', accent: 'bg-purple-400' };
    }
    if (lowerTitle.includes('cyberpunk') || lowerTitle.includes('cyber') || lowerTitle.includes('punk')) {
      return { icon: '🤖', color: 'from-cyan-600 to-indigo-700', accent: 'bg-cyan-400' };
    }
    if (lowerTitle.includes('time') || lowerTitle.includes('future') || lowerTitle.includes('past')) {
      return { icon: '⏰', color: 'from-green-600 to-teal-700', accent: 'bg-green-400' };
    }
    if (lowerTitle.includes('alien') || lowerTitle.includes('extraterrestrial')) {
      return { icon: '👽', color: 'from-violet-600 to-purple-700', accent: 'bg-violet-400' };
    }
    if (lowerTitle.includes('robot') || lowerTitle.includes('android') || lowerTitle.includes('ai')) {
      return { icon: '🤖', color: 'from-orange-600 to-red-700', accent: 'bg-orange-400' };
    }
    if (lowerTitle.includes('dystopian') || lowerTitle.includes('apocalypse')) {
      return { icon: '🌆', color: 'from-red-600 to-gray-800', accent: 'bg-red-400' };
    }
    
    // Default sci-fi themed placeholder
    return { icon: '📚', color: 'from-slate-600 to-slate-800', accent: 'bg-blue-400' };
  };

  const { icon, color, accent } = getPlaceholderElements(title);

  return (
    <div className={`${className} flex-shrink-0 rounded overflow-hidden bg-gradient-to-br ${color} flex flex-col items-center justify-center relative`}>
      {/* Subtle circuit pattern background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 40 40" fill="none">
          <path d="M8 8h4v4H8zm8 0h4v4h-4zm8 0h4v4h-4zM8 16h4v4H8zm16 0h4v4h-4zM8 24h4v4H8zm8 0h4v4h-4zm8 0h4v4h-4z" fill="currentColor"/>
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className={`w-6 h-6 mb-2 rounded-sm ${accent}/20 flex items-center justify-center`}>
          <BookOpen className={`w-3 h-3 text-${accent.split('-')[1]}-300 opacity-80`} />
        </div>
        <div className="text-lg opacity-80 mb-2">{icon}</div>
        <div className="flex space-x-1">
          <div className={`w-1 h-1 ${accent} rounded-full opacity-60 animate-pulse`}></div>
          <div className={`w-1 h-1 ${accent} rounded-full opacity-80 animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
          <div className={`w-1 h-1 ${accent} rounded-full opacity-60 animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBookCover;
