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
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
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
const MAX_RETRIES = 2;
const RETRY_DELAY = 500;

// Simple sci-fi detection
const isSciFiBook = (book: GoogleBook): boolean => {
  const categories = book.volumeInfo.categories || [];
  const description = book.volumeInfo.description || '';
  const title = book.volumeInfo.title || '';
  
  const text = `${title} ${description} ${categories.join(' ')}`.toLowerCase();
  
  // Basic sci-fi indicators
  const indicators = [
    'science fiction', 'sci-fi', 'science-fiction',
    'space', 'future', 'robot', 'alien', 'cyberpunk',
    'dystopian', 'utopian', 'time travel', 'galaxy',
    'artificial intelligence', 'technology', 'cyber'
  ];
  
  return indicators.some(indicator => text.includes(indicator));
};

class GoogleBooksCache {
  private cache = new Map<string, { data: any; timestamp: number }>();

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
    try {
      localStorage.setItem(`gb_cache_${key}`, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (error) {
      console.warn('Failed to cache to localStorage:', error);
    }
  }

  get(key: string) {
    let cached = this.cache.get(key);
    
    if (!cached) {
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
  
  const coverOptions = [
    imageLinks.extraLarge,
    imageLinks.large,
    imageLinks.medium,
    imageLinks.thumbnail,
    imageLinks.small,
    imageLinks.smallThumbnail
  ].filter(Boolean);

  return {
    coverUrl: enforceHttps(coverOptions[0]),
    thumbnailUrl: enforceHttps(imageLinks.thumbnail || imageLinks.medium),
    smallThumbnailUrl: enforceHttps(imageLinks.smallThumbnail || imageLinks.small)
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
  if (!query || query.length < 2) {
    console.log('Query too short or empty:', query);
    return [];
  }
  
  const cacheKey = `search_${query}_${maxResults}_${startIndex}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Returning cached results for:', query, 'Count:', cached.length);
    return cached;
  }
  
  try {
    console.log(`Making API call for: "${query}", maxResults: ${maxResults}, startIndex: ${startIndex}`);
    
    const data = await retryWithBackoff(async () => {
      // Simple, direct search
      const searchQuery = encodeURIComponent(query);
      const url = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=${maxResults}&startIndex=${startIndex}&printType=books&langRestrict=en`;
      
      console.log('API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', response.status, response.statusText, errorText);
        throw new Error(`Google Books API error: ${response.status} - ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('Raw API response:', {
        totalItems: responseData.totalItems,
        itemsCount: responseData.items?.length || 0,
        firstItem: responseData.items?.[0]?.volumeInfo?.title
      });
      
      return responseData;
    });
    
    if (!data.items || data.items.length === 0) {
      console.log('No items returned from API for query:', query);
      return [];
    }
    
    console.log(`Processing ${data.items.length} items from API`);
    
    const processedResults = data.items
      .filter((item: GoogleBook) => {
        // Basic validation
        if (!item.id || !item.volumeInfo) return false;
        if (!item.volumeInfo.title) return false;
        return true;
      })
      .map((item: GoogleBook) => {
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
          ...imageLinks,
          originalBook: item
        };
      });
    
    console.log(`Processed ${processedResults.length} valid books`);
    
    // Filter for sci-fi books if the query is generic
    const shouldFilter = !query.toLowerCase().includes('science fiction') && 
                        !query.toLowerCase().includes('sci-fi') &&
                        !query.toLowerCase().includes('cyberpunk') &&
                        !query.toLowerCase().includes('space opera');
    
    let finalResults;
    if (shouldFilter) {
      finalResults = processedResults.filter((book: any) => 
        isSciFiBook(book.originalBook)
      );
      console.log(`Filtered to ${finalResults.length} sci-fi books`);
    } else {
      finalResults = processedResults;
      console.log(`Using all ${finalResults.length} books (query was specific)`);
    }
    
    // Clean up the results
    const cleanResults = finalResults.map(book => {
      const { originalBook, ...cleanBook } = book;
      return cleanBook;
    });
    
    console.log(`Final result count for "${query}": ${cleanResults.length}`);
    
    cache.set(cacheKey, cleanResults);
    return cleanResults;
  } catch (error) {
    console.error('Enhanced search failed for query:', query, 'Error:', error);
    // Return empty array instead of throwing to prevent breaking the UI
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

export const searchSpaceOperaBooks = async (): Promise<EnhancedBookSuggestion[]> => {
  console.log('Searching for Space Opera books...');
  
  const queries = [
    '"The New Space Opera" anthology',
    '"New Space Opera" Gardner Dozois',
    'space opera anthology science fiction',
    '"Space Opera Renaissance"'
  ];
  
  const allResults: EnhancedBookSuggestion[] = [];
  
  for (const query of queries) {
    try {
      const results = await searchBooksEnhanced(query, 10);
      allResults.push(...results);
    } catch (error) {
      console.warn(`Failed to search for: ${query}`, error);
    }
  }
  
  // Remove duplicates based on title similarity
  const uniqueResults = allResults.filter((book, index, self) => 
    index === self.findIndex(b => 
      b.title.toLowerCase().includes('space opera') && 
      b.id === book.id
    )
  );
  
  console.log(`Found ${uniqueResults.length} unique Space Opera books`);
  return uniqueResults;
};

export { cache as booksCache };
