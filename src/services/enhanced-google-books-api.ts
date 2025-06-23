
export interface GoogleBook {
  id: string;
  volumeInfo: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    publishedDate?: string;
    categories?: string[];
    pageCount?: number;
    previewLink?: string;
    infoLink?: string;
    averageRating?: number;
    ratingsCount?: number;
  };
}

export interface EnhancedBookSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  coverUrl?: string;
  thumbnailUrl?: string;
  smallThumbnailUrl?: string;
  description?: string;
  categories?: string[];
  publishedDate?: string;
  pageCount?: number;
  previewLink?: string;
  infoLink?: string;
  rating?: number;
  ratingsCount?: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

class GoogleBooksCache {
  private cache = new Map<string, { data: any; timestamp: number }>();

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
    // Store in localStorage for persistence
    try {
      localStorage.setItem(`gb_cache_${key}`, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (error) {
      console.warn('Failed to cache to localStorage:', error);
    }
  }

  get(key: string) {
    let cached = this.cache.get(key);
    
    if (!cached) {
      // Try to load from localStorage
      try {
        const stored = localStorage.getItem(`gb_cache_${key}`);
        if (stored) {
          cached = JSON.parse(stored);
          if (cached) this.cache.set(key, cached);
        }
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
      }
    }

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    if (cached) {
      this.cache.delete(key);
      try {
        localStorage.removeItem(`gb_cache_${key}`);
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    }

    return null;
  }

  clear() {
    this.cache.clear();
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('gb_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }
}

const cache = new GoogleBooksCache();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const enforceHttps = (url?: string): string | undefined => {
  if (!url) return undefined;
  return url.replace(/^http:/, 'https:');
};

const processImageLinks = (imageLinks?: GoogleBook['volumeInfo']['imageLinks']) => {
  if (!imageLinks) return {};
  
  return {
    coverUrl: enforceHttps(imageLinks.thumbnail) || enforceHttps(imageLinks.smallThumbnail),
    thumbnailUrl: enforceHttps(imageLinks.thumbnail),
    smallThumbnailUrl: enforceHttps(imageLinks.smallThumbnail)
  };
};

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  retryDelay = RETRY_DELAY
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.warn(`API call failed, retrying in ${retryDelay}ms...`, error);
      await delay(retryDelay);
      return retryWithBackoff(fn, retries - 1, retryDelay * 2);
    }
    throw error;
  }
};

export const searchBooksEnhanced = async (
  query: string,
  maxResults: number = 20,
  startIndex: number = 0
): Promise<EnhancedBookSuggestion[]> => {
  if (!query || query.length < 2) return [];
  
  const cacheKey = `search_${query}_${maxResults}_${startIndex}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  try {
    const data = await retryWithBackoff(async () => {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&startIndex=${startIndex}&printType=books&orderBy=relevance`
      );
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    });
    
    const results = data.items?.map((item: GoogleBook) => {
      const imageLinks = processImageLinks(item.volumeInfo.imageLinks);
      
      return {
        id: item.id,
        title: item.volumeInfo.title || 'Unknown Title',
        subtitle: item.volumeInfo.subtitle,
        author: item.volumeInfo.authors?.[0] || 'Unknown Author',
        description: item.volumeInfo.description,
        categories: item.volumeInfo.categories,
        publishedDate: item.volumeInfo.publishedDate,
        pageCount: item.volumeInfo.pageCount,
        previewLink: item.volumeInfo.previewLink,
        infoLink: item.volumeInfo.infoLink,
        rating: item.volumeInfo.averageRating,
        ratingsCount: item.volumeInfo.ratingsCount,
        ...imageLinks
      };
    }) || [];
    
    cache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Enhanced search failed:', error);
    return [];
  }
};

export const getBookDetailsEnhanced = async (bookId: string): Promise<GoogleBook | null> => {
  const cacheKey = `book_${bookId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  try {
    const data = await retryWithBackoff(async () => {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    });
    
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Failed to fetch book details:', error);
    return null;
  }
};

export { cache as booksCache };
