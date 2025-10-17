-- Enable pg_trgm extension for trigram-based text search (must be first)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add performance indices for transmissions table
CREATE INDEX IF NOT EXISTS idx_transmissions_user_id ON public.transmissions(user_id);
CREATE INDEX IF NOT EXISTS idx_transmissions_created_at ON public.transmissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transmissions_author ON public.transmissions(author);
CREATE INDEX IF NOT EXISTS idx_transmissions_publication_year ON public.transmissions(publication_year);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_transmissions_user_created ON public.transmissions(user_id, created_at DESC);

-- Add indices for scifi_authors table
CREATE INDEX IF NOT EXISTS idx_scifi_authors_name ON public.scifi_authors(name);
CREATE INDEX IF NOT EXISTS idx_scifi_authors_birth_year ON public.scifi_authors(birth_year);
CREATE INDEX IF NOT EXISTS idx_scifi_authors_needs_enrichment ON public.scifi_authors(needs_enrichment) WHERE needs_enrichment = true;

-- Add indices for author_books table
CREATE INDEX IF NOT EXISTS idx_author_books_author_id ON public.author_books(author_id);
CREATE INDEX IF NOT EXISTS idx_author_books_title ON public.author_books(title);

-- Add indices for reading_sessions table
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_start ON public.reading_sessions(session_start DESC);

-- Add indices for book_collections table
CREATE INDEX IF NOT EXISTS idx_book_collections_user_id ON public.book_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_book_collections_public ON public.book_collections(is_public) WHERE is_public = true;

-- Add indices for collection_books table
CREATE INDEX IF NOT EXISTS idx_collection_books_collection_id ON public.collection_books(collection_id);

-- Add indices for author_enrichment_queue table
CREATE INDEX IF NOT EXISTS idx_author_enrichment_queue_status ON public.author_enrichment_queue(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_author_enrichment_queue_priority ON public.author_enrichment_queue(priority DESC, scheduled_for);

-- Add text search indices (GIN) for better full-text search performance
CREATE INDEX IF NOT EXISTS idx_transmissions_title_trgm ON public.transmissions USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_transmissions_author_trgm ON public.transmissions USING gin(author gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_scifi_authors_name_trgm ON public.scifi_authors USING gin(name gin_trgm_ops);

COMMENT ON INDEX idx_transmissions_user_id IS 'Improve user-specific transmission queries';
COMMENT ON INDEX idx_transmissions_user_created IS 'Optimize timeline and recent books queries';
COMMENT ON INDEX idx_transmissions_title_trgm IS 'Enable fast fuzzy text search on book titles';
COMMENT ON INDEX idx_author_enrichment_queue_status IS 'Optimize enrichment queue processing';