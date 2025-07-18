
interface ImageLoadOptions {
  src: string;
  fallbacks?: string[];
  timeout?: number;
}

interface ImageCache {
  url: string;
  loaded: boolean;
  error: boolean;
  timestamp: number;
}

class ImageService {
  private cache = new Map<string, ImageCache>();
  private loadingPromises = new Map<string, Promise<string>>();
  private observer?: IntersectionObserver;

  constructor() {
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = img.dataset.src;
              if (src) {
                this.loadImage({ src }).then(url => {
                  img.src = url;
                  img.classList.remove('opacity-0');
                  img.classList.add('opacity-100');
                });
                this.observer?.unobserve(img);
              }
            }
          });
        },
        { threshold: 0.1 }
      );
    }
  }

  async loadImage({ src, fallbacks = [], timeout = 5000 }: ImageLoadOptions): Promise<string> {
    // Prioritize higher quality images by adding quality parameters
    const enhancedUrls = this.enhanceImageUrls([src, ...fallbacks].filter(Boolean));
    
    // Check cache first
    for (const url of enhancedUrls) {
      const cached = this.cache.get(url);
      if (cached?.loaded && !cached.error) {
        return url;
      }
    }

    // Check if already loading
    const loadingKey = enhancedUrls[0];
    if (this.loadingPromises.has(loadingKey)) {
      return this.loadingPromises.get(loadingKey)!;
    }

    const promise = this.tryLoadImages(enhancedUrls, timeout);
    this.loadingPromises.set(loadingKey, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.loadingPromises.delete(loadingKey);
    }
  }

  private async tryLoadImages(urls: string[], timeout: number): Promise<string> {
    for (const url of urls) {
      try {
        await this.loadSingleImage(url, timeout);
        this.cache.set(url, { url, loaded: true, error: false, timestamp: Date.now() });
        return url;
      } catch (error) {
        console.warn(`Failed to load image: ${url}`, error);
        this.cache.set(url, { url, loaded: false, error: true, timestamp: Date.now() });
        continue; // Try next URL instead of stopping
      }
    }
    throw new Error('All image URLs failed to load');
  }

  private loadSingleImage(src: string, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => {
        reject(new Error(`Image load timeout: ${src}`));
      }, timeout);

      img.onload = () => {
        clearTimeout(timer);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timer);
        reject(new Error(`Image load error: ${src}`));
      };

      img.src = src;
    });
  }

  preloadImages(urls: string[]): void {
    urls.forEach(url => {
      if (url && !this.cache.has(url)) {
        this.loadImage({ src: url }).catch(() => {
          // Silent fail for preloading
        });
      }
    });
  }

  setupLazyLoading(img: HTMLImageElement, src: string): void {
    if (!this.observer) {
      // Fallback if IntersectionObserver is not supported
      img.src = src;
      return;
    }

    img.dataset.src = src;
    img.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    this.observer.observe(img);
  }

  getCachedUrl(src: string): string | null {
    const cached = this.cache.get(src);
    return cached?.loaded && !cached.error ? src : null;
  }

  private enhanceImageUrls(urls: string[]): string[] {
    return urls.map(url => {
      if (!url) return url;
      
      // For Google Books images, maximize quality
      if (url.includes('books.google.com')) {
        let enhancedUrl = url;
        
        // Remove limiting parameters
        enhancedUrl = enhancedUrl.replace('&edge=curl', '');
        enhancedUrl = enhancedUrl.replace('&img=1', '');
        
        // Set highest zoom level
        if (enhancedUrl.includes('zoom=')) {
          enhancedUrl = enhancedUrl.replace(/zoom=\d+/, 'zoom=0');
        } else {
          const separator = enhancedUrl.includes('?') ? '&' : '?';
          enhancedUrl = `${enhancedUrl}${separator}zoom=0`;
        }
        
        // Force HTTPS for better performance
        enhancedUrl = enhancedUrl.replace('http://', 'https://');
        
        return enhancedUrl;
      }
      
      // For other image services, maximize quality
      if (url.includes('thumbnail') && !url.includes('maxres')) {
        return url.replace('thumbnail', 'maxresdefault');
      }
      
      // Ensure HTTPS
      return url.replace('http://', 'https://');
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const imageService = new ImageService();
