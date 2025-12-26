-- Add new columns to sf_film_adaptations for Criterion and source tracking
ALTER TABLE public.sf_film_adaptations 
ADD COLUMN IF NOT EXISTS is_criterion_collection boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS criterion_spine_number integer,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

-- Create index for Criterion filtering
CREATE INDEX IF NOT EXISTS idx_sf_film_adaptations_criterion 
ON public.sf_film_adaptations(is_criterion_collection) 
WHERE is_criterion_collection = true;

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_sf_film_adaptations_source 
ON public.sf_film_adaptations(source);

-- Add comment for documentation
COMMENT ON COLUMN public.sf_film_adaptations.is_criterion_collection IS 'Whether film is in the Criterion Collection';
COMMENT ON COLUMN public.sf_film_adaptations.criterion_spine_number IS 'Criterion Collection spine number';
COMMENT ON COLUMN public.sf_film_adaptations.source IS 'Source of the film entry: manual, criterion, ai_suggested';