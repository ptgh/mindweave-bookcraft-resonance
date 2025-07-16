
import { CacheEntry, GoogleBook } from "./types";

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for better performance
const MAX_CACHE_SIZE = 300; // Increased for better performance

class GoogleBooksCache {
  private cache = new Map<string, CacheEntry>();
  
  get(key: string): GoogleBook[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key: string, data: GoogleBook[]): void {
    // Clean old entries if cache is getting too large
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + CACHE_DURATION
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const googleBooksCache = new GoogleBooksCache();
