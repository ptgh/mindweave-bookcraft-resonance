import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, requireUser, createServiceClient, json } from "../_shared/adminAuth.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface SearchFilters {
  sourceTypes?: string[];
  yearRange?: [number, number];
  minRating?: number;
  excludeRead?: boolean;
  genres?: string[];
}

interface SearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
  filters?: SearchFilters;
  searchType?: 'semantic' | 'keyword' | 'hybrid';
}

interface SearchResult {
  id: string;
  book_identifier: string;
  title: string;
  author: string;
  source_type: string;
  metadata: Record<string, unknown>;
  similarity?: number;
  combined_score?: number;
  match_type?: string;
}

async function generateQueryEmbedding(query: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: query,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI embedding error:', error);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function semanticSearch(
  supabase: ReturnType<typeof createServiceClient>,
  embedding: number[],
  limit: number,
  threshold: number,
  filters?: SearchFilters
) {
  // Use the database function for semantic search
  const { data, error } = await supabase.rpc('semantic_search', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
    filter_source: filters?.sourceTypes?.[0] || null,
  });

  if (error) {
    console.error('Semantic search error:', error);
    throw error;
  }

  return data || [];
}

// Fallback keyword search across multiple tables when embeddings are empty
async function fallbackKeywordSearch(
  supabase: ReturnType<typeof createServiceClient>,
  query: string,
  limit: number,
  userId?: string
): Promise<SearchResult[]> {
  const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 2);
  
  if (searchTerms.length === 0) {
    return [];
  }

  const results: SearchResult[] = [];
  
  // Search author_books table
  try {
    const { data: authorBooks, error } = await supabase
      .from('author_books')
      .select(`
        id,
        title,
        description,
        cover_url,
        published_date,
        categories,
        rating,
        author:scifi_authors(name)
      `)
      .or(searchTerms.map(term => 
        `title.ilike.%${term}%,description.ilike.%${term}%`
      ).join(','))
      .limit(limit);

    if (!error && authorBooks) {
      for (const book of authorBooks) {
        const authorName = (book.author as { name: string } | null)?.name || 'Unknown Author';
        results.push({
          id: book.id,
          book_identifier: `author_book_${book.id}`,
          title: book.title,
          author: authorName,
          source_type: 'author_books',
          metadata: {
            description: book.description,
            cover_url: book.cover_url,
            published_date: book.published_date,
            categories: book.categories,
            rating: book.rating,
          },
          similarity: 0.6,
          match_type: 'keyword',
        });
      }
      console.log(`Found ${authorBooks.length} results in author_books`);
    }
  } catch (e) {
    console.error('Error searching author_books:', e);
  }

  // Search publisher_books table
  try {
    const { data: publisherBooks, error } = await supabase
      .from('publisher_books')
      .select('id, title, author, cover_url, isbn, publication_year, editorial_note')
      .or(searchTerms.map(term => 
        `title.ilike.%${term}%,author.ilike.%${term}%`
      ).join(','))
      .limit(limit);

    if (!error && publisherBooks) {
      for (const book of publisherBooks) {
        results.push({
          id: book.id,
          book_identifier: `publisher_${book.id}`,
          title: book.title,
          author: book.author,
          source_type: 'publisher_books',
          metadata: {
            cover_url: book.cover_url,
            isbn: book.isbn,
            publication_year: book.publication_year,
            editorial_note: book.editorial_note,
          },
          similarity: 0.55,
          match_type: 'keyword',
        });
      }
      console.log(`Found ${publisherBooks.length} results in publisher_books`);
    }
  } catch (e) {
    console.error('Error searching publisher_books:', e);
  }

  // Search user's transmissions only (filtered by userId if available)
  try {
    let transmissionQuery = supabase
      .from('transmissions')
      .select('id, title, author, cover_url, tags, notes, publication_year')
      .or(searchTerms.map(term => 
        `title.ilike.%${term}%,author.ilike.%${term}%,notes.ilike.%${term}%`
      ).join(','));
    
    // Only show user's own transmissions if userId is provided
    if (userId) {
      transmissionQuery = transmissionQuery.eq('user_id', userId);
    }
    
    const { data: transmissions, error } = await transmissionQuery.limit(limit);

    if (!error && transmissions) {
      for (const t of transmissions) {
        results.push({
          id: `transmission-${t.id}`,
          book_identifier: `transmission_${t.id}`,
          title: t.title || 'Unknown Title',
          author: t.author || 'Unknown Author',
          source_type: 'transmissions',
          metadata: {
            transmission_id: t.id,
            cover_url: t.cover_url,
            tags: t.tags,
            notes: t.notes,
            publication_year: t.publication_year,
          },
          similarity: 0.5,
          match_type: 'keyword',
        });
      }
      console.log(`Found ${transmissions.length} results in transmissions`);
    }
  } catch (e) {
    console.error('Error searching transmissions:', e);
  }

  // Dedupe by title
  const seen = new Set<string>();
  const deduped = results.filter(r => {
    const key = r.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.slice(0, limit);
}

async function keywordSearch(
  supabase: ReturnType<typeof createServiceClient>,
  query: string,
  limit: number
) {
  // Full-text search on title, author, and embedding_text
  const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 2);
  
  if (searchTerms.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('book_embeddings')
    .select('id, book_identifier, title, author, source_type, metadata')
    .or(searchTerms.map(term => 
      `title.ilike.%${term}%,author.ilike.%${term}%,embedding_text.ilike.%${term}%`
    ).join(','))
    .limit(limit);

  if (error) {
    console.error('Keyword search error:', error);
    return [];
  }

  // Add a keyword match score
  return (data || []).map(item => ({
    ...item,
    similarity: 0.5, // Base score for keyword matches
    match_type: 'keyword' as const,
  }));
}

function combineResults(
  semanticResults: Array<{ book_identifier: string; similarity: number; [key: string]: unknown }>,
  keywordResults: Array<{ book_identifier: string; similarity: number; [key: string]: unknown }>,
  limit: number
) {
  const combined = new Map<string, { result: unknown; score: number; matchType: string }>();

  // Add semantic results with higher weight
  for (const result of semanticResults) {
    combined.set(result.book_identifier, {
      result,
      score: result.similarity * 0.7, // 70% weight for semantic
      matchType: 'semantic',
    });
  }

  // Merge keyword results
  for (const result of keywordResults) {
    const existing = combined.get(result.book_identifier);
    if (existing) {
      // Boost score for hybrid matches
      existing.score += result.similarity * 0.3;
      existing.matchType = 'hybrid';
    } else {
      combined.set(result.book_identifier, {
        result,
        score: result.similarity * 0.3,
        matchType: 'keyword',
      });
    }
  }

  // Sort by combined score and return top results
  return Array.from(combined.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => ({
      ...item.result as Record<string, unknown>,
      combined_score: item.score,
      match_type: item.matchType,
    }));
}

async function logSearchQuery(
  supabase: ReturnType<typeof createServiceClient>,
  query: string,
  embedding: number[] | null,
  resultCount: number,
  searchType: string,
  filters: SearchFilters | undefined,
  responseTimeMs: number,
  userId?: string
) {
  try {
    await supabase.from('search_queries').insert({
      user_id: userId || null,
      query_text: query,
      query_embedding: embedding,
      result_count: resultCount,
      search_type: searchType,
      filters_applied: filters || {},
      response_time_ms: responseTimeMs,
    });
  } catch (error) {
    console.error('Error logging search query:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated user
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const startTime = Date.now();

  try {
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const body: SearchRequest = await req.json();
    const {
      query,
      limit = 20,
      threshold = 0.3,
      filters,
      searchType = 'hybrid',
    } = body;

    if (!query || query.trim().length === 0) {
      return json(400, { error: 'Query is required' });
    }

    console.log(`Semantic search: "${query}" (type: ${searchType}, limit: ${limit})`);

    const supabase = createServiceClient();

    let results: Array<Record<string, unknown>> = [];
    let queryEmbedding: number[] | null = null;

    // Check if book_embeddings has any data
    const { count: embeddingsCount } = await supabase
      .from('book_embeddings')
      .select('*', { count: 'exact', head: true });

    const hasEmbeddings = (embeddingsCount || 0) > 0;
    console.log(`Book embeddings count: ${embeddingsCount}, hasEmbeddings: ${hasEmbeddings}`);

    if (hasEmbeddings && (searchType === 'semantic' || searchType === 'hybrid')) {
      // Generate query embedding
      queryEmbedding = await generateQueryEmbedding(query);
      
      // Perform semantic search
      const semanticResults = await semanticSearch(
        supabase,
        queryEmbedding,
        limit,
        threshold,
        filters
      );

      if (searchType === 'hybrid') {
        // Also perform keyword search
        const keywordResults = await keywordSearch(supabase, query, limit);
        results = combineResults(semanticResults, keywordResults, limit);
      } else {
        results = semanticResults.map((r: Record<string, unknown>) => ({
          ...r,
          combined_score: r.similarity,
          match_type: 'semantic',
        }));
      }
    } else {
      // Fallback: search across multiple tables when embeddings are empty
      console.log('Using fallback keyword search across author_books, publisher_books, transmissions');
      const fallbackResults = await fallbackKeywordSearch(supabase, query, limit, auth.userId);
      results = fallbackResults.map(r => ({
        ...r,
        combined_score: r.similarity || 0.5,
        match_type: 'keyword',
      }));
    }

    const responseTimeMs = Date.now() - startTime;

    // Log the search query (async, don't await)
    logSearchQuery(
      supabase,
      query,
      queryEmbedding,
      results.length,
      searchType,
      filters,
      responseTimeMs,
      auth.userId
    );

    console.log(`Search completed: ${results.length} results in ${responseTimeMs}ms`);

    return json(200, {
      success: true,
      query,
      results,
      resultCount: results.length,
      searchType: hasEmbeddings ? searchType : 'fallback_keyword',
      responseTimeMs,
    });

  } catch (error) {
    console.error('Semantic search error:', error);
    return json(500, { 
      error: error instanceof Error ? error.message : 'Search failed' 
    });
  }
});
