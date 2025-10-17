-- Add conceptual_tags column to author_books table
ALTER TABLE author_books 
ADD COLUMN conceptual_tags text[] DEFAULT '{}';

-- Create GIN index for efficient array searches
CREATE INDEX idx_author_books_conceptual_tags ON author_books USING GIN (conceptual_tags);

-- Add comment for documentation
COMMENT ON COLUMN author_books.conceptual_tags IS 'Curated sci-fi conceptual tags (Cyberpunk, Space Opera, etc.) - replaces generic categories';