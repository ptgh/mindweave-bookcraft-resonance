-- Add tmdb_id column to sf_film_adaptations for external film search
ALTER TABLE public.sf_film_adaptations
ADD COLUMN IF NOT EXISTS tmdb_id integer;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sf_film_adaptations_tmdb_id 
ON public.sf_film_adaptations(tmdb_id) 
WHERE tmdb_id IS NOT NULL;

-- Add tmdb_rating column
ALTER TABLE public.sf_film_adaptations
ADD COLUMN IF NOT EXISTS tmdb_rating numeric(3,1);

COMMENT ON COLUMN public.sf_film_adaptations.tmdb_id IS 'The Movie Database (TMDB) ID for external matching';
COMMENT ON COLUMN public.sf_film_adaptations.tmdb_rating IS 'TMDB user rating (0-10)';