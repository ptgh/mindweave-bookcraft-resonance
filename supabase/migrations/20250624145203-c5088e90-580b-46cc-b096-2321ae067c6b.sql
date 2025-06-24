
-- Add indexes for faster queries on transmissions table
CREATE INDEX IF NOT EXISTS idx_transmissions_user_id ON transmissions(user_id);
CREATE INDEX IF NOT EXISTS idx_transmissions_created_at ON transmissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transmissions_user_created ON transmissions(user_id, created_at DESC);

-- Add indexes for publisher series lookups
CREATE INDEX IF NOT EXISTS idx_publisher_series_id ON publisher_series(id);

-- Enable better query performance for text searches
CREATE INDEX IF NOT EXISTS idx_transmissions_title_gin ON transmissions USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_transmissions_author_gin ON transmissions USING gin(to_tsvector('english', author));
