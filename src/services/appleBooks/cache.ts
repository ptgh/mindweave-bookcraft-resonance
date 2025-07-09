import { AppleBook, AppleBooksCacheEntry } from "./types";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (book data doesn't change often)
const NO_RESULT_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for no results
const MAX_CACHE_SIZE = 200;

class AppleBooksCache {
  private cache = new Map<string, AppleBooksCacheEntry>();
  
  get(key: string): AppleBook | null | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined; // Not in cache
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined; // Expired
    }
    
    return entry.data; // Can be null for "no result" or AppleBook for found result
  }
  
  set(key: string, data: AppleBook | null): void {
    // Clean old entries if cache is getting too large
    if (this.cache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entries (first in)
      const entriesToDelete = Array.from(this.cache.keys()).slice(0, 10);
      entriesToDelete.forEach(k => this.cache.delete(k));
    }
    
    const isNoResult = data === null;
    const cacheDuration = isNoResult ? NO_RESULT_CACHE_DURATION : CACHE_DURATION;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + cacheDuration,
      isNoResult
    });
  }
  
  generateKey(isbn?: string, title?: string, author?: string): string {
    if (isbn) {
      return `isbn:${isbn}`;
    }
    if (title && author) {
      return `title_author:${title.toLowerCase()}|${author.toLowerCase()}`;
    }
    throw new Error('Must provide either ISBN or both title and author for cache key');
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    const active = entries.filter(e => e.expires > now);
    const noResults = active.filter(e => e.isNoResult);
    
    return {
      total: this.cache.size,
      active: active.length,
      expired: entries.length - active.length,
      noResults: noResults.length,
      withResults: active.length - noResults.length
    };
  }
}

export const appleBooksCache = new AppleBooksCache();