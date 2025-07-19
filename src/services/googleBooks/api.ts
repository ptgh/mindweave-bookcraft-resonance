
import { GoogleBook, GoogleBooksApiResponse } from "./types";
import { googleBooksCache } from "./cache";
import { transformGoogleBookData } from "./transformer";

const BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const REQUEST_TIMEOUT = 8000; // 8 seconds for Apple platforms

// Rate limiting
const rateLimiter = {
  requests: [] as number[],
  maxRequests: 10,
  timeWindow: 10000, // 10 seconds
  
  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length < this.maxRequests;
  },
  
  recordRequest(): void {
    this.requests.push(Date.now());
  }
};

export const searchGoogleBooks = async (query: string, maxResults = 10): Promise<GoogleBook[]> => {
  if (!query.trim()) return [];
  
  const cacheKey = `search:${query}:${maxResults}`;
  const cached = googleBooksCache.get(cacheKey);
  if (cached) {
    console.log(`Cache hit for query: ${query}`);
    return cached;
  }
  
  if (!rateLimiter.canMakeRequest()) {
    console.warn('Rate limit reached for Google Books API');
    return [];
  }
  
  try {
    rateLimiter.recordRequest();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    const params = new URLSearchParams({
      q: query,
      maxResults: Math.min(maxResults, 40).toString(),
      printType: 'books',
      langRestrict: 'en',
      orderBy: 'relevance'
    });
    
    console.log(`Google Books API request: ${query} (max: ${maxResults})`);
    
    const response = await fetch(`${BASE_URL}?${params}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: GoogleBooksApiResponse = await response.json();
    const books = (data.items || []).map(transformGoogleBookData).filter(Boolean) as GoogleBook[];
    
    console.log(`Google Books API response: ${books.length} books found for "${query}"`);
    books.forEach(book => {
      console.log(`- ${book.title} by ${book.author} | Cover: ${book.coverUrl ? 'Yes' : 'No'}`);
    });
    
    googleBooksCache.set(cacheKey, books);
    return books;
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`Google Books API request timed out for: ${query}`);
    } else {
      console.error(`Error searching Google Books for "${query}":`, error);
    }
    return [];
  }
};

export const getBookByISBN = async (isbn: string): Promise<GoogleBook | null> => {
  const cacheKey = `isbn:${isbn}`;
  const cached = googleBooksCache.get(cacheKey);
  if (cached && cached.length > 0) return cached[0];
  
  try {
    console.log(`Searching Google Books by ISBN: ${isbn}`);
    const books = await searchGoogleBooks(`isbn:${isbn}`, 1);
    return books[0] || null;
  } catch (error) {
    console.error(`Error fetching book by ISBN ${isbn}:`, error);
    return null;
  }
};
