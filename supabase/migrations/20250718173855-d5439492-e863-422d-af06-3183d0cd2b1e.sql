
-- Phase 2: Fix Author Enrichment System - Create missing authors and clean orphaned queue entries

-- First, let's create the missing authors that are referenced in transmissions but don't exist in scifi_authors
INSERT INTO public.scifi_authors (name, data_source, verification_status, needs_enrichment, data_quality_score)
SELECT DISTINCT t.author, 'transmission_auto', 'pending', true, 0
FROM public.transmissions t
LEFT JOIN public.scifi_authors sa ON LOWER(TRIM(sa.name)) = LOWER(TRIM(t.author))
WHERE sa.id IS NULL 
  AND t.author IS NOT NULL 
  AND TRIM(t.author) != '';

-- Clean up orphaned enrichment queue entries that reference non-existent authors
DELETE FROM public.author_enrichment_queue 
WHERE author_id NOT IN (SELECT id FROM public.scifi_authors);

-- Add a constraint to prevent future orphaned queue entries
ALTER TABLE public.author_enrichment_queue 
ADD CONSTRAINT fk_author_enrichment_queue_author_id 
FOREIGN KEY (author_id) REFERENCES public.scifi_authors(id) ON DELETE CASCADE;

-- Create an index to improve performance of author lookups
CREATE INDEX IF NOT EXISTS idx_scifi_authors_name_lower ON public.scifi_authors USING btree (LOWER(name));

-- Add a trigger to automatically create authors when transmissions are inserted
CREATE OR REPLACE FUNCTION public.auto_create_author_for_transmission()
RETURNS TRIGGER AS $$
DECLARE
  author_id UUID;
BEGIN
  -- Only proceed if author is not null and not empty
  IF NEW.author IS NOT NULL AND TRIM(NEW.author) != '' THEN
    -- Try to find existing author (case-insensitive)
    SELECT id INTO author_id 
    FROM public.scifi_authors 
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(NEW.author))
    LIMIT 1;
    
    -- If not found, create new author
    IF author_id IS NULL THEN
      INSERT INTO public.scifi_authors (name, data_source, verification_status, needs_enrichment, data_quality_score)
      VALUES (TRIM(NEW.author), 'transmission_auto', 'pending', true, 0)
      RETURNING id INTO author_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_create_author_for_transmission ON public.transmissions;
CREATE TRIGGER trigger_auto_create_author_for_transmission
  BEFORE INSERT OR UPDATE ON public.transmissions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_author_for_transmission();

-- Update data quality scores for existing authors based on available data
UPDATE public.scifi_authors 
SET data_quality_score = (
  CASE WHEN bio IS NOT NULL AND TRIM(bio) != '' THEN 40 ELSE 0 END +
  CASE WHEN birth_year IS NOT NULL THEN 20 ELSE 0 END +
  CASE WHEN death_year IS NOT NULL THEN 20 ELSE 0 END +
  CASE WHEN notable_works IS NOT NULL AND array_length(notable_works, 1) > 0 THEN 20 ELSE 0 END
),
needs_enrichment = (
  CASE WHEN bio IS NOT NULL AND TRIM(bio) != '' THEN 40 ELSE 0 END +
  CASE WHEN birth_year IS NOT NULL THEN 20 ELSE 0 END +
  CASE WHEN death_year IS NOT NULL THEN 20 ELSE 0 END +
  CASE WHEN notable_works IS NOT NULL AND array_length(notable_works, 1) > 0 THEN 20 ELSE 0 END
) < 80;
