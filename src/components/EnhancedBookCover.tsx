
import { useState, useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import scifiPlaceholder from "@/assets/book-placeholder-scifi.jpg";
import classicPlaceholder from "@/assets/book-placeholder-classic.jpg";
import generalPlaceholder from "@/assets/book-placeholder-general.jpg";

interface EnhancedBookCoverProps {
  title: string;
  author?: string;
  isbn?: string;
  coverUrl?: string;
  thumbnailUrl?: string;
  smallThumbnailUrl?: string;
  className?: string;
  lazy?: boolean;
}

const EnhancedBookCover = ({ 
  title, 
  author,
  isbn,
  coverUrl, 
  thumbnailUrl, 
  smallThumbnailUrl, 
  className = "w-12 h-16",
  lazy = false // Default to false for immediate loading
}: EnhancedBookCoverProps) => {
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Get Archive.org cover from free_ebook_links
  const getArchiveCover = async (title: string, author?: string) => {
    try {
      let query = supabase
        .from('free_ebook_links')
        .select('archive_url, formats')
        .eq('book_title', title);
      
      if (author) {
        query = query.eq('book_author', author);
      }
      
      const { data } = await query.limit(1).single();
      
      if (data?.archive_url) {
        // Extract identifier from Archive.org URL
        const match = data.archive_url.match(/archive\.org\/details\/([^\/\?]+)/);
        if (match) {
          const identifier = match[1];
          // Try multiple cover formats from Archive.org
          const coverUrls = [
            `https://archive.org/download/${identifier}/${identifier}.jpg`,
            `https://archive.org/download/${identifier}/cover.jpg`,
            `https://archive.org/services/img/${identifier}`,
            `https://archive.org/download/${identifier}/__ia_thumb.jpg`
          ];
          
          for (const url of coverUrls) {
            const isValid = await testImageUrl(url);
            if (isValid) {
              console.log('Found Archive.org cover:', url);
              return url;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get Archive.org cover:', error);
      return null;
    }
  };

  // Get cached image URL from Supabase
  const getCachedImageUrl = async (title: string) => {
    try {
      const { data } = await supabase
        .from('ebook_search_cache')
        .select('internet_archive_results')
        .eq('search_key', `cover_${title}`)
        .single();
      
      const results = data?.internet_archive_results as { cover_url?: string } | null;
      return results?.cover_url;
    } catch (error) {
      return null;
    }
  };

  // Cache successful image URL
  const cacheImageUrl = async (url: string, title: string) => {
    try {
      await supabase.from('ebook_search_cache').upsert({
        search_key: `cover_${title}`,
        title,
        author: 'Unknown',
        internet_archive_results: { cover_url: url },
        last_searched: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to cache image URL:', error);
    }
  };

  // Test if image URL is valid
  const testImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const timer = setTimeout(() => {
        resolve(false);
      }, 3000);

      img.onload = () => {
        clearTimeout(timer);
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timer);
        resolve(false);
      };

      img.src = url;
    });
  };

  useEffect(() => {
    const loadImage = async () => {
      console.log('Loading cover for:', title, { coverUrl, thumbnailUrl, smallThumbnailUrl, author, isbn });
      
      setIsLoading(true);
      setHasError(false);

      // First check cache
      const cachedUrl = await getCachedImageUrl(title);
      if (cachedUrl) {
        console.log('Using cached image:', cachedUrl);
        const isValid = await testImageUrl(cachedUrl);
        if (isValid) {
          setCurrentSrc(cachedUrl);
          setIsLoading(false);
          return;
        }
      }

      // Prepare all available URLs without modification first
      const originalUrls = [coverUrl, thumbnailUrl, smallThumbnailUrl].filter(Boolean) as string[];
      
      // Then create enhanced versions as fallbacks
      const enhancedUrls = originalUrls.map(url => {
        if (url.includes('books.google.com')) {
          let enhanced = url.replace('&edge=curl', '');
          if (enhanced.includes('zoom=')) {
            enhanced = enhanced.replace(/zoom=\d+/, 'zoom=0');
          }
          return enhanced;
        }
        return url;
      });

      // Try to get Archive.org cover if no cover URLs provided or if existing ones fail
      let archiveCoverUrl: string | null = null;
      if (originalUrls.length === 0 || !coverUrl) {
        console.log('No cover URLs provided, checking Archive.org...');
        archiveCoverUrl = await getArchiveCover(title, author);
      }

      // Combine all URLs, prioritizing originals, then enhanced, then Archive.org
      const allUrls = [
        ...originalUrls, 
        ...enhancedUrls.filter(url => !originalUrls.includes(url)),
        ...(archiveCoverUrl ? [archiveCoverUrl] : [])
      ];

      console.log('Trying URLs for', title, ':', allUrls);

      // Try each URL until one works
      for (const url of allUrls) {
        console.log('Testing URL:', url);
        const isValid = await testImageUrl(url);
        if (isValid) {
          console.log('Successfully loaded:', url);
          setCurrentSrc(url);
          setIsLoading(false);
          await cacheImageUrl(url, title);
          return;
        } else {
          console.log('Failed to load:', url);
        }
      }

      // If we haven't tried Archive.org yet and original URLs failed, try it now
      if (!archiveCoverUrl && originalUrls.length > 0) {
        console.log('Original URLs failed, trying Archive.org as fallback...');
        archiveCoverUrl = await getArchiveCover(title, author);
        if (archiveCoverUrl) {
          const isValid = await testImageUrl(archiveCoverUrl);
          if (isValid) {
            console.log('Successfully loaded Archive.org cover:', archiveCoverUrl);
            setCurrentSrc(archiveCoverUrl);
            setIsLoading(false);
            await cacheImageUrl(archiveCoverUrl, title);
            return;
          }
        }
      }

      // If all URLs fail
      console.warn('All image URLs failed for', title);
      setIsLoading(false);
      setHasError(true);
    };

    loadImage();
  }, [coverUrl, thumbnailUrl, smallThumbnailUrl, title, author, isbn]);

  if (isLoading) {
    return (
      <div className={`${className} flex-shrink-0 rounded overflow-hidden bg-gradient-to-br from-blue-900/40 to-blue-700/60`}>
        <div className="w-full h-full animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (hasError || !currentSrc) {
    return <PlaceholderCover title={title} className={className} />;
  }

  return (
    <div className={`${className} flex-shrink-0 rounded overflow-hidden bg-gradient-to-br from-blue-900/40 to-blue-700/60`}>
      <img
        ref={imgRef}
        src={currentSrc}
        alt={title}
        className="w-full h-full object-cover transition-all duration-300"
        onError={() => {
          console.error('Image failed to load:', currentSrc);
          setHasError(true);
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', currentSrc);
        }}
      />
    </div>
  );
};

const PlaceholderCover = ({ title, className = "w-12 h-16" }: { title: string; className?: string }) => {
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
