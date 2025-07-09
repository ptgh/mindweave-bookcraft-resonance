import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

const ITUNES_SEARCH_BASE_URL = "https://itunes.apple.com/search";
const ITUNES_LOOKUP_BASE_URL = "https://itunes.apple.com/lookup";
const REQUEST_TIMEOUT = 8000; // 8 seconds
const COUNTRY_CODE = "GB"; // UK store

// Helper function to clean search terms for better matching
const cleanSearchTerm = (term: string): string => {
  return term
    .replace(/[^\w\s]/g, ' ') // Replace special characters with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
};

// Simple string similarity calculation
const calculateSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  // Check if one string contains the other
  if (str1.includes(str2) || str2.includes(str1)) return 0.8;
  
  // Basic Levenshtein-inspired similarity
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  const matches = shorter.split('').filter(char => longer.includes(char)).length;
  return matches / longer.length;
};

// Helper function to find the best match from results
const findBestMatch = (results: any[], targetTitle: string, targetAuthor: string): any | null => {
  const normalizeString = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const normalizedTargetTitle = normalizeString(targetTitle);
  const normalizedTargetAuthor = normalizeString(targetAuthor);
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const result of results) {
    const resultTitle = normalizeString(result.trackName || '');
    const resultAuthor = normalizeString(result.artistName || '');
    
    // Calculate similarity scores
    const titleScore = calculateSimilarity(normalizedTargetTitle, resultTitle);
    const authorScore = calculateSimilarity(normalizedTargetAuthor, resultAuthor);
    
    // Combined score (weight title more heavily)
    const combinedScore = (titleScore * 0.7) + (authorScore * 0.3);
    
    // Require minimum thresholds
    if (titleScore > 0.6 && authorScore > 0.4 && combinedScore > bestScore) {
      bestScore = combinedScore;
      bestMatch = result;
    }
  }
  
  console.log(`🎯 Best match score: ${bestScore.toFixed(2)} for "${targetTitle}" by ${targetAuthor}`);
  return bestScore > 0.6 ? bestMatch : null;
};

// Helper function to try multiple search strategies
const tryMultipleSearches = async (title: string, author: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  const searchStrategies = [
    // Strategy 1: Clean title + author
    `${cleanSearchTerm(title)} ${cleanSearchTerm(author)}`,
    // Strategy 2: Just clean title
    cleanSearchTerm(title),
    // Strategy 3: Author + title (reversed order)
    `${cleanSearchTerm(author)} ${cleanSearchTerm(title)}`,
    // Strategy 4: Title with quotes (exact match)
    `"${cleanSearchTerm(title)}" ${cleanSearchTerm(author)}`
  ];
  
  try {
    for (const searchTerm of searchStrategies) {
      console.log(`🔍 Trying search strategy: "${searchTerm}"`);
      
      const params = new URLSearchParams({
        term: searchTerm,
        entity: 'ebook',
        country: COUNTRY_CODE,
        limit: '5' // Get more results to find better matches
      });
      
      const url = `${ITUNES_SEARCH_BASE_URL}?${params}`;
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Try to find the best match by comparing titles and authors
        const bestMatch = findBestMatch(data.results, title, author);
        if (bestMatch) {
          clearTimeout(timeoutId);
          return { ...data, results: [bestMatch] };
        }
      }
    }
  } catch (error) {
    console.warn('Search strategy failed:', error);
  } finally {
    clearTimeout(timeoutId);
  }
  
  return null;
};

const searchByISBN = async (isbn: string) => {
  if (!rateLimiter.canMakeRequest()) {
    console.warn('Rate limit reached for Apple Books API');
    return { error: 'Rate limit reached' };
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
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Apple Books API request timed out for ISBN:', isbn);
    } else {
      console.error('Error searching Apple Books by ISBN:', error);
    }
    return { error: error.message };
  }
};

const searchByTitleAuthor = async (title: string, author: string) => {
  if (!rateLimiter.canMakeRequest()) {
    console.warn('Rate limit reached for Apple Books API');
    return { error: 'Rate limit reached' };
  }
  
  try {
    rateLimiter.recordRequest();
    
    console.log('🌐 Making Apple Books title/author request for:', { title, author });
    
    const data = await tryMultipleSearches(title, author);
    return data || { error: 'No results found' };
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Apple Books API request timed out for:', title, 'by', author);
    } else {
      console.error('Error searching Apple Books:', error);
    }
    return { error: error.message };
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchType, isbn, title, author } = await req.json();

    console.log('🍎 Apple Books proxy request:', { searchType, isbn, title, author });

    let result;
    
    if (searchType === 'isbn' && isbn) {
      result = await searchByISBN(isbn);
    } else if (searchType === 'titleAuthor' && title && author) {
      result = await searchByTitleAuthor(title, author);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Apple Books proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});