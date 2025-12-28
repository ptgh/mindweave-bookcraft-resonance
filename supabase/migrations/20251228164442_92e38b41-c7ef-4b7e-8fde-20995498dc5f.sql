-- Add provider caching columns to sf_film_adaptations
ALTER TABLE public.sf_film_adaptations
ADD COLUMN IF NOT EXISTS watch_providers JSONB,
ADD COLUMN IF NOT EXISTS watch_providers_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS watch_providers_region TEXT DEFAULT 'GB';

-- Create index for efficient cache staleness checks
CREATE INDEX IF NOT EXISTS idx_film_providers_updated 
ON public.sf_film_adaptations(watch_providers_updated_at);

-- Add comment for documentation
COMMENT ON COLUMN public.sf_film_adaptations.watch_providers IS 'Cached streaming/rental/buy providers from TMDB';
COMMENT ON COLUMN public.sf_film_adaptations.watch_providers_updated_at IS 'When providers were last fetched';
COMMENT ON COLUMN public.sf_film_adaptations.watch_providers_region IS 'Region code for cached providers (default GB)';