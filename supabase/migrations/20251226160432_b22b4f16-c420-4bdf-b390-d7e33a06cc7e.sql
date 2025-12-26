-- Add criterion_url column to sf_film_adaptations for direct Criterion links
ALTER TABLE public.sf_film_adaptations 
ADD COLUMN IF NOT EXISTS criterion_url TEXT;