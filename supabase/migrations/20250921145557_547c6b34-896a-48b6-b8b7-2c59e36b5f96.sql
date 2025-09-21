-- Fix remaining functions without proper search_path
CREATE OR REPLACE FUNCTION public.queue_author_enrichment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is a new author or bio/birth_year/death_year is still null, queue for enrichment
  IF (TG_OP = 'INSERT' OR 
      (TG_OP = 'UPDATE' AND (NEW.bio IS NULL OR NEW.birth_year IS NULL OR NEW.death_year IS NULL))) THEN
    
    -- Only queue if not already queued and pending
    IF NOT EXISTS (
      SELECT 1 FROM public.author_enrichment_queue 
      WHERE author_id = NEW.id AND status = 'pending'
    ) THEN
      INSERT INTO public.author_enrichment_queue (author_id, enrichment_type, priority)
      VALUES (NEW.id, 'full', 7); -- High priority for new/incomplete authors
    END IF;
    
    -- Mark as needing enrichment
    NEW.needs_enrichment = true;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_or_create_scifi_author(author_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  author_id UUID;
  normalized_name TEXT;
BEGIN
  -- Normalize the author name (trim, title case)
  normalized_name = TRIM(INITCAP(author_name));
  
  -- Try to find existing author (case-insensitive)
  SELECT id INTO author_id 
  FROM public.scifi_authors 
  WHERE LOWER(name) = LOWER(normalized_name)
  LIMIT 1;
  
  -- If not found, create new author
  IF author_id IS NULL THEN
    INSERT INTO public.scifi_authors (name, data_source, verification_status, needs_enrichment)
    VALUES (normalized_name, 'transmission_auto', 'pending', true)
    RETURNING id INTO author_id;
  END IF;
  
  RETURN author_id;
END;
$$;