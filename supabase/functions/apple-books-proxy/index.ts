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

// Improved string similarity calculation with exact match priority
const calculateSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  // Normalize for comparison
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match after normalization
  if (s1 === s2) return 0.98;
  
  // Check if one string contains the other (substring match)
  if (s1.includes(s2)) return 0.85 + (s2.length / s1.length) * 0.1;
  if (s2.includes(s1)) return 0.85 + (s1.length / s2.length) * 0.1;
  
  // Word overlap scoring
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w)).length;
  const maxWords = Math.max(words1.length, words2.length);
  
  if (commonWords > 0) {
    return (commonWords / maxWords) * 0.7;
  }
  
  // Character-based similarity as last resort
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const matches = shorter.split('').filter(char => longer.includes(char)).length;
  return (matches / longer.length) * 0.5;
};

// Helper function to find the best match from results with improved scoring
const findBestMatch = (results: any[], targetTitle: string, targetAuthor: string): any | null => {
  const normalizeString = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const normalizedTargetTitle = normalizeString(targetTitle);
  const normalizedTargetAuthor = normalizeString(targetAuthor);
  
  let bestMatch = null;
  let bestScore = 0;
  
  console.log(`🔍 Finding best match for: "${targetTitle}" by ${targetAuthor}`);
  
  for (const result of results) {
    const resultTitle = normalizeString(result.trackName || '');
    const resultAuthor = normalizeString(result.artistName || '');
    
    console.log(`  Comparing with: "${result.trackName}" by ${result.artistName}`);
    
    // Calculate similarity scores
    const titleScore = calculateSimilarity(normalizedTargetTitle, resultTitle);
    const authorScore = calculateSimilarity(normalizedTargetAuthor, resultAuthor);
    
    console.log(`    Title: ${titleScore.toFixed(2)}, Author: ${authorScore.toFixed(2)}`);
    
    // Combined score - weight title heavily but REQUIRE good author match
    const combinedScore = (titleScore * 0.85) + (authorScore * 0.15);
    
    // Require strong title match (0.7+) AND strong author match (0.5+) to prevent wrong books
    // This ensures we don't match "Metamorphosis and Place" by Mohamed Bakari with "Metamorphosis" by James Blaylock
    if (titleScore >= 0.7 && authorScore >= 0.5 && combinedScore > bestScore) {
      bestScore = combinedScore;
      bestMatch = result;
      console.log(`    ✅ New best match! Score: ${combinedScore.toFixed(2)}`);
    }
  }
  
  console.log(`🎯 Final best match score: ${bestScore.toFixed(2)}`);
  return bestScore >= 0.7 ? bestMatch : null;
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
    return { error: (error as Error).message };
  }
};

// Lookup by Apple track ID and verify it matches the requested title/author
const lookupById = async (id: string, title: string, author: string) => {
  if (!rateLimiter.canMakeRequest()) {
    console.warn('Rate limit reached for Apple Books API');
    return { error: 'Rate limit reached' };
  }
  
  try {
    rateLimiter.recordRequest();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const params = new URLSearchParams({
      id,
      entity: 'ebook',
      country: COUNTRY_CODE,
      limit: '1'
    });

    const url = `${ITUNES_LOOKUP_BASE_URL}?${params}`;
    console.log('🌐 Apple Books ID lookup request to:', url);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    if (!data?.results || data.results.length === 0) {
      return { error: 'Not found' };
    }

    const result = data.results[0];

    // Verify against requested title/author
    const titleScore = calculateSimilarity(title, result.trackName || '');
    const authorScore = calculateSimilarity(author, result.artistName || '');
    const combined = (titleScore * 0.85) + (authorScore * 0.15);

    console.log(`🔎 ID verify scores — Title: ${titleScore.toFixed(2)}, Author: ${authorScore.toFixed(2)}, Combined: ${combined.toFixed(2)}`);

    if (titleScore >= 0.7 && authorScore >= 0.5) {
      return { ...data, results: [result] };
    }

    return { error: 'mismatch', scores: { titleScore, authorScore } };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Apple Books API request timed out for ID:', id);
    } else {
      console.error('Error in Apple Books ID lookup:', error);
    }
    return { error: (error as Error).message };
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { searchType, isbn, title, author, id } = body;

    console.log('🍎 Apple Books proxy request:', { searchType, isbn, title, author, id });

    let result;
    
    if (searchType === 'isbn' && isbn) {
      result = await searchByISBN(isbn);
    } else if (searchType === 'titleAuthor' && title && author) {
      result = await searchByTitleAuthor(title, author);
    } else if (searchType === 'lookupId') {
      if (id && title && author) {
        result = await lookupById(String(id), title, author);
      } else {
        result = { error: 'Missing id/title/author for lookupId' };
      }
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