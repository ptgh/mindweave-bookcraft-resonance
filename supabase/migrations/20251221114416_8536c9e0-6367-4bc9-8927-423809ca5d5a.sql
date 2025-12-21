-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Book embeddings table for semantic search
CREATE TABLE public.book_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_identifier TEXT NOT NULL UNIQUE, -- hash of title+author for cross-source matching
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  embedding_text TEXT, -- The concatenated text that was embedded (for debugging)
  model_version TEXT DEFAULT 'text-embedding-3-small',
  source_type TEXT DEFAULT 'transmission', -- transmission, author_book, publisher_book, google_books
  metadata JSONB DEFAULT '{}', -- Additional book data (description, tags, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create HNSW index for fast similarity search (better for smaller datasets)
CREATE INDEX book_embeddings_embedding_idx ON public.book_embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- Index for book_identifier lookups
CREATE INDEX book_embeddings_identifier_idx ON public.book_embeddings (book_identifier);

-- Index for source filtering
CREATE INDEX book_embeddings_source_idx ON public.book_embeddings (source_type);

-- Search queries table for tracking and improvement
CREATE TABLE public.search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT, -- Can be null for anonymous searches
  query_text TEXT NOT NULL,
  query_embedding vector(1536),
  result_count INTEGER DEFAULT 0,
  clicked_book_identifier TEXT, -- Which result was clicked
  search_type TEXT DEFAULT 'semantic', -- semantic, keyword, hybrid
  filters_applied JSONB DEFAULT '{}',
  response_time_ms INTEGER,
  was_helpful BOOLEAN, -- User feedback
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user query history
CREATE INDEX search_queries_user_idx ON public.search_queries (user_id, created_at DESC);

-- Index for analyzing popular queries
CREATE INDEX search_queries_text_idx ON public.search_queries USING gin (to_tsvector('english', query_text));

-- Enable RLS
ALTER TABLE public.book_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

-- Book embeddings are publicly readable (for search)
CREATE POLICY "Book embeddings are publicly readable"
  ON public.book_embeddings FOR SELECT
  USING (true);

-- Authenticated users can create book embeddings (via edge functions)
CREATE POLICY "Authenticated users can create book embeddings"
  ON public.book_embeddings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Service role can manage all embeddings
CREATE POLICY "Service role manages book embeddings"
  ON public.book_embeddings FOR ALL
  USING (auth.role() = 'service_role');

-- Anyone can create search queries (for tracking)
CREATE POLICY "Anyone can log search queries"
  ON public.search_queries FOR INSERT
  WITH CHECK (true);

-- Users can view their own search history
CREATE POLICY "Users can view their own searches"
  ON public.search_queries FOR SELECT
  USING (user_id IS NULL OR user_id = (auth.uid())::text);

-- Users can update their own search feedback
CREATE POLICY "Users can update their own search feedback"
  ON public.search_queries FOR UPDATE
  USING (user_id = (auth.uid())::text);

-- Create function for semantic search
CREATE OR REPLACE FUNCTION public.semantic_search(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 20,
  filter_source TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  book_identifier TEXT,
  title TEXT,
  author TEXT,
  source_type TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    be.id,
    be.book_identifier,
    be.title,
    be.author,
    be.source_type,
    be.metadata,
    1 - (be.embedding <=> query_embedding) AS similarity
  FROM public.book_embeddings be
  WHERE 
    be.embedding IS NOT NULL
    AND (filter_source IS NULL OR be.source_type = filter_source)
    AND 1 - (be.embedding <=> query_embedding) > match_threshold
  ORDER BY be.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_book_embeddings_updated_at
  BEFORE UPDATE ON public.book_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();