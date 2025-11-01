-- Add temporal_context_tags column to transmissions table
ALTER TABLE transmissions 
ADD COLUMN temporal_context_tags text[] DEFAULT '{}';

-- Create GIN index for efficient array queries
CREATE INDEX idx_transmissions_temporal_tags 
ON transmissions USING GIN (temporal_context_tags);

-- Add comment for documentation
COMMENT ON COLUMN transmissions.temporal_context_tags IS 'Structured temporal context tags: Literary Era (20), Historical Forces (35), Technological Context (40). Total: 95 controlled vocabulary tags.';