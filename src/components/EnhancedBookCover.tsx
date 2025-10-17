
import { useState, useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { imageService } from "@/services/image-service";
import { OptimizedImage } from "@/components/OptimizedImage";
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
      
      const { data } = await query.limit(1).maybeSingle();
      
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
            try {
              await imageService.loadImage({ src: url, timeout: 8000 });
              console.log('Found Archive.org cover:', url);
              return url;
            } catch (error) {
              continue;
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
        .maybeSingle();
      
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

  // Build robust fallbacks for Google Books image URLs
  const createImageFallbacks = (urls: string[]): string[] => {
    const variants = new Set<string>();

    const ensureParam = (u: string, key: string, value: string) =>
      new RegExp(`[?&]${key}=`).test(u) ? u : `${u}${u.includes('?') ? '&' : '?'}${key}=${value}`;

    for (const raw of urls) {
      if (!raw) continue;

      // Prefer HTTPS variant and keep original too
      const https = raw.replace(/^http:\/\//, 'https://');
      variants.add(raw);
      variants.add(https);

      // Special handling for Google Books content endpoint
      if (/books\.google(?:usercontent)?\.com\/books\/content/.test(https)) {
        const base = ensureParam(ensureParam(https, 'img', '1'), 'printsec', 'frontcover');
        variants.add(base);

        // Try both hosts as some titles only resolve on one
        variants.add(base.replace('books.google.com', 'books.googleusercontent.com'));
        variants.add(base.replace('books.googleusercontent.com', 'books.google.com'));

        // Provide multiple zoom levels (do NOT force 0)
        for (const z of [1, 2, 3, 4]) {
          const withZoom = /[?&]zoom=/.test(base)
            ? base.replace(/([?&])zoom=\d+/, `$1zoom=${z}`)
            : `${base}${base.includes('?') ? '&' : '?'}zoom=${z}`;
          variants.add(withZoom);
          variants.add(withZoom.replace('books.google.com', 'books.googleusercontent.com'));
        }

        // Also try keeping/adding edge=curl (some covers require it)
        if (!/[?&]edge=/.test(base)) {
          variants.add(`${base}${base.includes('?') ? '&' : '?'}edge=curl`);
        }
      }
    }

    return Array.from(variants);
  };

  useEffect(() => {
    const loadImage = async () => {
      console.log('Loading cover for:', title, { coverUrl, thumbnailUrl, smallThumbnailUrl, author, isbn });
      
      setIsLoading(true);
      setHasError(false);

      // First check if image service has this URL cached
      const imageServiceCached = imageService.getCachedUrl(coverUrl || '');
      if (imageServiceCached) {
        console.log('Using image service cache:', imageServiceCached);
        setCurrentSrc(imageServiceCached);
        setIsLoading(false);
        return;
      }

      // Then check Supabase cache
      const cachedUrl = await getCachedImageUrl(title);
      if (cachedUrl) {
        console.log('Using Supabase cached image:', cachedUrl);
        try {
          const validUrl = await imageService.loadImage({ src: cachedUrl, timeout: 8000 });
          setCurrentSrc(validUrl);
          setIsLoading(false);
          return;
        } catch (error) {
          console.log('Cached URL no longer valid:', cachedUrl);
        }
      }

      // Prepare all available URLs with fallbacks
      const originalUrls = [coverUrl, thumbnailUrl, smallThumbnailUrl].filter(Boolean) as string[];
      const allUrls = createImageFallbacks(originalUrls);

      console.log('Trying URLs for', title, ':', allUrls);

      // Try each URL with image service
      for (const url of allUrls) {
        console.log('Testing URL:', url);
        try {
          const validUrl = await imageService.loadImage({ 
            src: url, 
            timeout: 8000,
            fallbacks: []
          });
          console.log('Successfully loaded:', validUrl);
          setCurrentSrc(validUrl);
          setIsLoading(false);
          await cacheImageUrl(validUrl, title);
          return;
        } catch (error) {
          console.log('Failed to load:', url);
          continue;
        }
      }

      // As a last resort, let the <img> tag try the raw URL directly
      if (originalUrls.length > 0) {
        console.warn('Preload failed; falling back to raw <img> for', originalUrls[0]);
        setCurrentSrc(originalUrls[0]);
        setIsLoading(false);
        return;
      }

      // Try Archive.org as last resort
      console.log('All provided URLs failed, trying Archive.org...');
      const archiveCoverUrl = await getArchiveCover(title, author);
      if (archiveCoverUrl) {
        try {
          const validUrl = await imageService.loadImage({ 
            src: archiveCoverUrl, 
            timeout: 8000 
          });
          console.log('Successfully loaded Archive.org cover:', validUrl);
          setCurrentSrc(validUrl);
          setIsLoading(false);
          await cacheImageUrl(validUrl, title);
          return;
        } catch (error) {
          console.log('Archive.org cover also failed:', archiveCoverUrl);
        }
      }

      // If all URLs fail
      console.warn('All image URLs failed for', title);
      setIsLoading(false);
      setHasError(true);
    };

    // Don't reload if we already have a working image
    if (currentSrc && !hasError) {
      return;
    }

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
      <OptimizedImage
        src={currentSrc}
        alt={title}
        width={parseInt(className.match(/w-(\d+)/)?.[1] || '12') * 4}
        height={parseInt(className.match(/h-(\d+)/)?.[1] || '16') * 4}
        fallbackSrc={getPlaceholderImage(title)}
        className="w-full h-full object-cover transition-all duration-300"
        lazy={lazy}
        priority={!lazy}
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

const PlaceholderCover = ({ title, className = "w-12 h-16" }: { title: string; className?: string }) => {
  return (
    <div className={`${className} flex-shrink-0 rounded overflow-hidden relative bg-gradient-to-br from-blue-900/60 to-blue-700/80`}>
      <OptimizedImage
        src={getPlaceholderImage(title)}
        alt={`Placeholder cover for ${title}`}
        className="w-full h-full object-cover opacity-40"
        priority
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
