-- Add is_favorite column to transmissions table for "Keep" functionality
ALTER TABLE transmissions 
ADD COLUMN is_favorite boolean DEFAULT false;

-- Add index for efficient querying of favorite books
CREATE INDEX idx_transmissions_is_favorite ON transmissions(is_favorite) WHERE is_favorite = true;

-- Add comment for documentation
COMMENT ON COLUMN transmissions.is_favorite IS 'Marks books that user wants to keep with extra protection against accidental deletion';