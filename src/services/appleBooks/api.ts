import { AppleBook, AppleBooksApiResponse } from "./types";
import { appleBooksCache } from "./cache";
import { transformAppleBookData } from "./transformer";

const ITUNES_SEARCH_BASE_URL = "https://itunes.apple.com/search";
const ITUNES_LOOKUP_BASE_URL = "https://itunes.apple.com/lookup";
const REQUEST_TIMEOUT = 8000; // 8 seconds
const COUNTRY_CODE = "GB"; // UK store

// Rate limiting for Apple's API (approximately 20 calls/minute)
const rateLimiter = {
  requests: [] as number[],
  maxRequests: 18, // Stay slightly under the limit
  timeWindow: 60000, // 1 minute
  
  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length < this.maxRequests;
  },
  
  recordRequest(): void {
    this.requests.push(Date.now());
  }
};

export const searchAppleBooksByISBN = async (isbn: string): Promise<AppleBook | null> => {
  const cacheKey = appleBooksCache.generateKey(isbn);
  const cached = appleBooksCache.get(cacheKey);
  if (cached !== undefined) return cached; // Return cached result (can be null)
  
  if (!rateLimiter.canMakeRequest()) {
    console.warn('Rate limit reached for Apple Books API');
    return null;
  }
  
  try {
    rateLimiter.recordRequest();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    const params = new URLSearchParams({
      isbn: isbn,
      country: COUNTRY_CODE,
      entity: 'ebook'
    });
    
    const url = `${ITUNES_LOOKUP_BASE_URL}?${params}`;
    console.log('🌐 Making Apple Books ISBN request to:', url);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: AppleBooksApiResponse = await response.json();
    
    if (!data.results || data.results.length === 0) {
      // Cache the "no result" to avoid repeated API calls
      appleBooksCache.set(cacheKey, null);
      return null;
    }
    
    const book = transformAppleBookData(data.results[0]);
    if (book) {
      book.isbn = isbn; // Store the ISBN for reference
    }
    
    appleBooksCache.set(cacheKey, book);
    return book;
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Apple Books API request timed out for ISBN:', isbn);
    } else {
      console.error('Error searching Apple Books by ISBN:', error);
    }
    return null;
  }
};

export const searchAppleBooksByTitleAuthor = async (title: string, author: string): Promise<AppleBook | null> => {
  const cacheKey = appleBooksCache.generateKey(undefined, title, author);
  const cached = appleBooksCache.get(cacheKey);
  if (cached !== undefined) return cached; // Return cached result (can be null)
  
  if (!rateLimiter.canMakeRequest()) {
    console.warn('Rate limit reached for Apple Books API');
    return null;
  }
  
  try {
    rateLimiter.recordRequest();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    // Construct search term: "title author"
    const searchTerm = `${title} ${author}`.trim();
    
    const params = new URLSearchParams({
      term: searchTerm,
      entity: 'ebook',
      country: COUNTRY_CODE,
      limit: '1' // We only want the top match
    });
    
    const url = `${ITUNES_SEARCH_BASE_URL}?${params}`;
    console.log('🌐 Making Apple Books title/author request to:', url);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: AppleBooksApiResponse = await response.json();
    
    if (!data.results || data.results.length === 0) {
      // Cache the "no result" to avoid repeated API calls
      appleBooksCache.set(cacheKey, null);
      return null;
    }
    
    const book = transformAppleBookData(data.results[0]);
    appleBooksCache.set(cacheKey, book);
    return book;
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Apple Books API request timed out for:', title, 'by', author);
    } else {
      console.error('Error searching Apple Books:', error);
    }
    return null;
  }
};

// Main function to search Apple Books - tries ISBN first, then title/author
export const searchAppleBooks = async (
  title: string, 
  author: string, 
  isbn?: string
): Promise<AppleBook | null> => {
  console.log('🍎 Apple Books search started:', { title, author, isbn });
  
  // Try ISBN lookup first if available (more accurate and faster)
  if (isbn) {
    console.log('📖 Trying ISBN lookup first:', isbn);
    const result = await searchAppleBooksByISBN(isbn);
    if (result) {
      console.log('✅ ISBN lookup success:', result);
      return result;
    }
    console.log('❌ ISBN lookup failed, trying title/author');
  }
  
  // Fallback to title/author search
  console.log('🔍 Trying title/author search:', title, author);
  const result = await searchAppleBooksByTitleAuthor(title, author);
  console.log('📱 Title/author search result:', result);
  return result;
};