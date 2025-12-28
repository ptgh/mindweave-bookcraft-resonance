-- Add screenplay-related columns to sf_film_adaptations
ALTER TABLE sf_film_adaptations ADD COLUMN IF NOT EXISTS script_url TEXT;
ALTER TABLE sf_film_adaptations ADD COLUMN IF NOT EXISTS script_source TEXT DEFAULT 'imsdb';
ALTER TABLE sf_film_adaptations ADD COLUMN IF NOT EXISTS script_last_checked TIMESTAMPTZ;

-- Create index for efficient script queries
CREATE INDEX IF NOT EXISTS idx_film_script_url ON sf_film_adaptations(script_url) WHERE script_url IS NOT NULL;