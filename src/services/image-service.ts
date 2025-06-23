
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

  async loadImage({ src, fallbacks = [], timeout = 10000 }: ImageLoadOptions): Promise<string> {
    const allUrls = [src, ...fallbacks].filter(Boolean);
    
    // Check cache first
    for (const url of allUrls) {
      const cached = this.cache.get(url);
      if (cached?.loaded && !cached.error) {
        return url;
      }
    }

    // Check if already loading
    const loadingKey = allUrls[0];
    if (this.loadingPromises.has(loadingKey)) {
      return this.loadingPromises.get(loadingKey)!;
    }

    const promise = this.tryLoadImages(allUrls, timeout);
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

  clearCache(): void {
    this.cache.clear();
  }
}

export const imageService = new ImageService();
