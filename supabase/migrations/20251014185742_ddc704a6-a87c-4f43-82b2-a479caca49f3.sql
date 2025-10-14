-- Phase 2: Advanced Analytics Schema (Fixed)

-- Add performance indexes for pattern recognition
CREATE INDEX IF NOT EXISTS idx_transmissions_user_created ON public.transmissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transmissions_author ON public.transmissions(author);
CREATE INDEX IF NOT EXISTS idx_transmissions_publication_year ON public.transmissions(publication_year);
CREATE INDEX IF NOT EXISTS idx_transmissions_tags ON public.transmissions USING gin(string_to_array(tags, ','));

-- Add analytics columns to transmissions
ALTER TABLE public.transmissions 
ADD COLUMN IF NOT EXISTS reading_velocity_score numeric,
ADD COLUMN IF NOT EXISTS thematic_constellation text,
ADD COLUMN IF NOT EXISTS last_analytics_update timestamp with time zone DEFAULT now();

-- Create materialized view for reading analytics (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.reading_analytics AS
SELECT 
  user_id,
  COUNT(*) as total_books,
  COUNT(DISTINCT author) as unique_authors,
  (SELECT COUNT(DISTINCT tag) FROM (
    SELECT unnest(string_to_array(t.tags, ',')) as tag 
    FROM public.transmissions t 
    WHERE t.user_id = transmissions.user_id AND t.tags IS NOT NULL
  ) tags_unnested) as unique_tags,
  AVG(publication_year) as avg_publication_year,
  MIN(created_at) as first_transmission,
  MAX(created_at) as latest_transmission,
  EXTRACT(DAYS FROM (MAX(created_at) - MIN(created_at))) as reading_span_days,
  CASE 
    WHEN EXTRACT(DAYS FROM (MAX(created_at) - MIN(created_at))) > 0 
    THEN COUNT(*)::numeric / EXTRACT(DAYS FROM (MAX(created_at) - MIN(created_at)))
    ELSE 0 
  END as books_per_day
FROM public.transmissions
WHERE user_id IS NOT NULL
GROUP BY user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_analytics_user ON public.reading_analytics(user_id);

-- Function to refresh analytics
CREATE OR REPLACE FUNCTION public.refresh_reading_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.reading_analytics;
END;
$$;

-- Create table for storing pattern insights
CREATE TABLE IF NOT EXISTS public.user_reading_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  pattern_type text NOT NULL,
  confidence numeric NOT NULL,
  description text,
  evidence jsonb,
  detected_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, pattern_type)
);

ALTER TABLE public.user_reading_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reading patterns"
ON public.user_reading_patterns FOR SELECT
USING (user_id = (auth.uid())::text);

CREATE POLICY "Users can insert their own reading patterns"
ON public.user_reading_patterns FOR INSERT
WITH CHECK (user_id = (auth.uid())::text);

CREATE POLICY "Users can update their own reading patterns"
ON public.user_reading_patterns FOR UPDATE
USING (user_id = (auth.uid())::text);