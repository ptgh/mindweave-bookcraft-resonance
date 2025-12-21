import { supabase } from '@/integrations/supabase/client';

export interface SemanticSearchResult {
  id: string;
  bookIdentifier: string;
  title: string;
  author: string;
  sourceType: string;
  metadata: Record<string, unknown>;
  combinedScore: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
  highlights?: string[];
}

export interface SearchFilters {
  sourceTypes?: string[];
  yearRange?: [number, number];
  minRating?: number;
  excludeRead?: boolean;
  genres?: string[];
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  filters?: SearchFilters;
  searchType?: 'semantic' | 'keyword' | 'hybrid';
}

export interface SearchResponse {
  results: SemanticSearchResult[];
  query: string;
  resultCount: number;
  searchType: string;
  responseTimeMs: number;
}

// Cache for recent searches
const searchCache = new Map<string, { results: SemanticSearchResult[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(query: string, options: SearchOptions): string {
  return `${query.toLowerCase().trim()}|${JSON.stringify(options)}`;
}

export async function semanticSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const {
    limit = 20,
    threshold = 0.3,
    filters,
    searchType = 'hybrid',
  } = options;

  // Check cache
  const cacheKey = getCacheKey(query, options);
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Returning cached search results for:', query);
    return {
      results: cached.results,
      query,
      resultCount: cached.results.length,
      searchType,
      responseTimeMs: 0,
    };
  }

  // Get current user ID for personalization
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  const startTime = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke('semantic-search', {
      body: {
        query,
        limit,
        threshold,
        filters,
        userId,
        searchType,
      },
    });

    if (error) {
      console.error('Semantic search error:', error);
      throw new Error(error.message || 'Search failed');
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Search failed');
    }

    // Transform results
    const results: SemanticSearchResult[] = (data.results || []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      bookIdentifier: r.book_identifier as string,
      title: r.title as string,
      author: r.author as string,
      sourceType: r.source_type as string,
      metadata: (r.metadata || {}) as Record<string, unknown>,
      combinedScore: r.combined_score as number,
      matchType: r.match_type as 'semantic' | 'keyword' | 'hybrid',
    }));

    // Cache results
    searchCache.set(cacheKey, { results, timestamp: Date.now() });

    return {
      results,
      query,
      resultCount: results.length,
      searchType: data.searchType,
      responseTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Semantic search failed:', error);
    throw error;
  }
}

export async function generateBookEmbedding(book: {
  title: string;
  author: string;
  description?: string;
  tags?: string[];
  genres?: string[];
  themes?: string[];
  sourceType?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: { singleBook: book },
    });

    if (error) {
      console.error('Embedding generation error:', error);
      return false;
    }

    return data?.success === true;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return false;
  }
}

export async function generateBatchEmbeddings(books: Array<{
  title: string;
  author: string;
  description?: string;
  tags?: string[];
  genres?: string[];
  themes?: string[];
  sourceType?: string;
  metadata?: Record<string, unknown>;
}>): Promise<{ successful: number; total: number }> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: { books },
    });

    if (error) {
      console.error('Batch embedding generation error:', error);
      return { successful: 0, total: books.length };
    }

    return {
      successful: data?.successful || 0,
      total: books.length,
    };
  } catch (error) {
    console.error('Failed to generate batch embeddings:', error);
    return { successful: 0, total: books.length };
  }
}

export async function generateTransmissionEmbeddings(
  limit: number = 50
): Promise<{ processed: number; skipped: number; errors: number; total: number }> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-transmission-embeddings', {
      body: { limit, skipExisting: true },
    });

    if (error) {
      console.error('Transmission embedding generation error:', error);
      throw new Error(error.message || 'Failed to generate embeddings');
    }

    return {
      processed: data?.processed || 0,
      skipped: data?.skipped || 0,
      errors: data?.errors || 0,
      total: data?.total || 0,
    };
  } catch (error) {
    console.error('Failed to generate transmission embeddings:', error);
    throw error;
  }
}

export async function logSearchClick(
  queryId: string,
  bookIdentifier: string
): Promise<void> {
  try {
    await supabase
      .from('search_queries')
      .update({ clicked_book_identifier: bookIdentifier })
      .eq('id', queryId);
  } catch (error) {
    console.error('Failed to log search click:', error);
  }
}

export async function submitSearchFeedback(
  queryId: string,
  wasHelpful: boolean
): Promise<void> {
  try {
    await supabase
      .from('search_queries')
      .update({ was_helpful: wasHelpful })
      .eq('id', queryId);
  } catch (error) {
    console.error('Failed to submit search feedback:', error);
  }
}

export async function getRecentSearches(limit: number = 10): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('search_queries')
      .select('query_text')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Dedupe and return unique queries
    const seen = new Set<string>();
    return (data || [])
      .map(d => d.query_text)
      .filter(q => {
        const lower = q.toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
      });
  } catch (error) {
    console.error('Failed to get recent searches:', error);
    return [];
  }
}

export async function getPopularSearches(limit: number = 10): Promise<string[]> {
  // For now, return curated example searches
  // In production, this could query aggregated search data
  return [
    'Books like Dune but with female protagonists',
    'Hard SF with optimistic futures',
    'First contact stories with linguistics focus',
    'Space opera under 300 pages',
    'Cyberpunk noir mysteries',
    'Time travel paradox stories',
    'AI consciousness exploration',
    'Generation ships and colony worlds',
    'Alien biology and xenobiology',
    'Climate fiction with hope',
  ].slice(0, limit);
}

// Clear search cache
export function clearSearchCache(): void {
  searchCache.clear();
}
