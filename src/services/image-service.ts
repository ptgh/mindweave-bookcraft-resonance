
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

  async loadImage({ src, fallbacks = [], timeout = 5000 }: ImageLoadOptions): Promise<string> {
    // Check cache first
    const cached = this.cache.get(src);
    if (cached?.loaded && !cached.error) {
      return src;
    }

    // Try original URL first, then fallbacks
    const urlsToTry = [src, ...fallbacks];
    
    for (const url of urlsToTry) {
      try {
        await this.loadSingleImage(url, timeout);
        this.cache.set(url, { url, loaded: true, error: false, timestamp: Date.now() });
        return url;
      } catch (error) {
        console.warn(`Failed to load image: ${url}`, error);
        this.cache.set(url, { url, loaded: false, error: true, timestamp: Date.now() });
        continue;
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

  getCachedUrl(src: string): string | null {
    const cached = this.cache.get(src);
    return cached?.loaded && !cached.error ? src : null;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const imageService = new ImageService();
