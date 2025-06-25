
-- Add deep linking fields to transmissions table
ALTER TABLE public.transmissions 
ADD COLUMN IF NOT EXISTS isbn text,
ADD COLUMN IF NOT EXISTS apple_link text,
ADD COLUMN IF NOT EXISTS open_count integer DEFAULT 0;

-- Create index on ISBN for faster lookups
CREATE INDEX IF NOT EXISTS idx_transmissions_isbn ON public.transmissions(isbn);
