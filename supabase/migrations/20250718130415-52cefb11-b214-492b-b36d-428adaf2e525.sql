
-- Add metadata tracking columns to scifi_authors table
ALTER TABLE public.scifi_authors 
ADD COLUMN IF NOT EXISTS last_enriched TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS enrichment_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS needs_enrichment BOOLEAN DEFAULT true;

-- Create author_data_sources table to track biographical data sources
CREATE TABLE IF NOT EXISTS public.author_data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.scifi_authors(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'wikipedia', 'google_books', 'manual', 'api'
  source_url TEXT,
  data_retrieved JSONB,
  confidence_score INTEGER DEFAULT 0,
  last_validated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create author_enrichment_queue table for managing data enrichment jobs
CREATE TABLE IF NOT EXISTS public.author_enrichment_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.scifi_authors(id) ON DELETE CASCADE,
  enrichment_type TEXT NOT NULL, -- 'bio', 'works', 'dates', 'full'
  priority INTEGER DEFAULT 5, -- 1-10, higher number = higher priority
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scifi_authors_needs_enrichment ON public.scifi_authors(needs_enrichment);
CREATE INDEX IF NOT EXISTS idx_scifi_authors_last_enriched ON public.scifi_authors(last_enriched);
CREATE INDEX IF NOT EXISTS idx_author_data_sources_author_id ON public.author_data_sources(author_id);
CREATE INDEX IF NOT EXISTS idx_author_enrichment_queue_status ON public.author_enrichment_queue(status);
CREATE INDEX IF NOT EXISTS idx_author_enrichment_queue_priority ON public.author_enrichment_queue(priority DESC);

-- Enable RLS on new tables
ALTER TABLE public.author_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_enrichment_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to data sources (for transparency)
CREATE POLICY "Allow public read access to author_data_sources" 
  ON public.author_data_sources 
  FOR SELECT 
  USING (true);

-- Create policies for enrichment queue (admin access only for queue management)
CREATE POLICY "Allow public read access to author_enrichment_queue" 
  ON public.author_enrichment_queue 
  FOR SELECT 
  USING (true);

-- Create function to automatically queue authors for enrichment when they're created or updated
CREATE OR REPLACE FUNCTION public.queue_author_enrichment()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for automatic enrichment queuing
DROP TRIGGER IF EXISTS trigger_queue_author_enrichment ON public.scifi_authors;
CREATE TRIGGER trigger_queue_author_enrichment
  BEFORE INSERT OR UPDATE ON public.scifi_authors
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_author_enrichment();

-- Create function to find or create author from transmission data
CREATE OR REPLACE FUNCTION public.find_or_create_scifi_author(author_name TEXT)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql;

-- Update existing authors to trigger enrichment for incomplete records
UPDATE public.scifi_authors 
SET needs_enrichment = true, 
    verification_status = COALESCE(verification_status, 'pending'),
    data_source = COALESCE(data_source, 'manual')
WHERE bio IS NULL OR birth_year IS NULL OR death_year IS NULL;

-- Add some sample data quality scores based on completeness
UPDATE public.scifi_authors 
SET data_quality_score = 
  CASE 
    WHEN bio IS NOT NULL AND birth_year IS NOT NULL AND death_year IS NOT NULL AND notable_works IS NOT NULL THEN 100
    WHEN bio IS NOT NULL AND (birth_year IS NOT NULL OR death_year IS NOT NULL) AND notable_works IS NOT NULL THEN 75
    WHEN bio IS NOT NULL AND notable_works IS NOT NULL THEN 60
    WHEN notable_works IS NOT NULL THEN 40
    ELSE 20
  END;
