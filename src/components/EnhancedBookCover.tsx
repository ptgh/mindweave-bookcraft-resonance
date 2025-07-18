
import { useState, useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";
import { imageService } from "@/services/image-service";
import { supabase } from "@/integrations/supabase/client";
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
  const [lowResSrc, setLowResSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isProgressiveLoading, setIsProgressiveLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Cache image URLs in Supabase for faster subsequent loads
  const cacheImageUrl = async (url: string, title: string, author?: string) => {
    try {
      await supabase.from('ebook_search_cache').upsert({
        search_key: `cover_${title}_${author || 'unknown'}`,
        title,
        author: author || 'Unknown',
        internet_archive_results: { cover_url: url },
        last_searched: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to cache image URL:', error);
    }
  };

  // Get cached image URL from Supabase
  const getCachedImageUrl = async (title: string, author?: string) => {
    try {
      const { data } = await supabase
        .from('ebook_search_cache')
        .select('internet_archive_results')
        .eq('search_key', `cover_${title}_${author || 'unknown'}`)
        .single();
      
      const results = data?.internet_archive_results as { cover_url?: string } | null;
      return results?.cover_url;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const loadImageProgressively = async () => {
      // First check Supabase cache
      const cachedUrl = await getCachedImageUrl(title);
      if (cachedUrl) {
        setCurrentSrc(cachedUrl);
        setIsLoading(false);
        return;
      }

      if (!coverUrl && !thumbnailUrl && !smallThumbnailUrl) {
        setIsLoading(false);
        setHasError(true);
        return;
      }

      setIsLoading(true);
      setHasError(false);
      setIsProgressiveLoading(true);

      // Simpler, more reliable loading with clear fallback chain
      const lowQualityUrls = [
        smallThumbnailUrl,
        thumbnailUrl
      ].filter(Boolean) as string[];

      const highQualityUrls = [
        coverUrl,
        thumbnailUrl,
        smallThumbnailUrl
      ].filter(Boolean) as string[];

      try {
        // Load low quality first for quick display
        if (lowQualityUrls.length > 0) {
          try {
            const lowResSrc = await imageService.loadImage({
              src: lowQualityUrls[0],
              fallbacks: lowQualityUrls.slice(1),
              timeout: 800
            });
            setLowResSrc(lowResSrc);
          } catch (error) {
            console.warn('Low quality image failed:', error);
          }
        }

        // Then load high quality
        const highResSrc = await imageService.loadImage({
          src: highQualityUrls[0] || '',
          fallbacks: highQualityUrls.slice(1),
          timeout: 3000
        });
        
        setCurrentSrc(highResSrc);
        setIsLoading(false);
        setIsProgressiveLoading(false);
        
        // Cache the successful URL
        await cacheImageUrl(highResSrc, title);
      } catch (error) {
        console.warn('High quality image failed:', error);
        setIsLoading(false);
        setHasError(true);
        setIsProgressiveLoading(false);
      }
    };

    if (lazy && imgRef.current) {
      const primaryUrl = coverUrl || thumbnailUrl || smallThumbnailUrl;
      if (primaryUrl) {
        // Use progressive loading for lazy images too
        const enhancedUrl = primaryUrl
          .replace('zoom=1', 'zoom=0')
          .replace('&edge=curl', '');
        imageService.setupLazyLoading(imgRef.current, enhancedUrl);
        setIsLoading(false);
        return;
      }
    }

    // Start progressive loading immediately
    loadImageProgressively();
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

  if (isLoading && !lowResSrc) {
    return (
      <div className={`${className} flex-shrink-0 rounded overflow-hidden bg-gradient-to-br from-blue-900/40 to-blue-700/60`}>
        <div className="w-full h-full animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Show progressive loading: low res first, then high res
  if (lowResSrc && (isProgressiveLoading || !currentSrc)) {
    return (
      <div className={`${className} flex-shrink-0 rounded overflow-hidden bg-gradient-to-br from-blue-900/40 to-blue-700/60 relative`}>
        <img
          src={lowResSrc}
          alt={title}
          className="w-full h-full object-cover filter blur-sm"
          style={{ imageRendering: 'auto' }}
        />
        {isProgressiveLoading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-3 h-3 border border-white/60 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  if (hasError || (!currentSrc && !lowResSrc)) {
    return <PlaceholderCover title={title} className={className} />;
  }

  return (
    <div className={`${className} flex-shrink-0 rounded overflow-hidden bg-gradient-to-br from-blue-900/40 to-blue-700/60`}>
      <img
        src={currentSrc || lowResSrc}
        alt={title}
        className="w-full h-full object-cover transition-all duration-500"
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
    <div className={`${className} flex-shrink-0 rounded overflow-hidden relative bg-gradient-to-br from-blue-900/60 to-blue-700/80`}>
      <img
        src={getPlaceholderImage(title)}
        alt={`Placeholder cover for ${title}`}
        className="w-full h-full object-cover opacity-40"
        style={{ imageRendering: 'crisp-edges' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-blue-700/60 flex items-center justify-center">
        <div className="text-center p-2">
          <BookOpen className="w-4 h-4 text-blue-200 mx-auto mb-1" />
          <div className="text-[8px] text-blue-100 font-medium leading-tight">
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
