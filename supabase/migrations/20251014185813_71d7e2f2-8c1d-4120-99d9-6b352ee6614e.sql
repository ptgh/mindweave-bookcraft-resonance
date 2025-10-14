-- Fix security warning: Create security definer function to safely access reading analytics
CREATE OR REPLACE FUNCTION public.get_user_reading_analytics()
RETURNS TABLE (
  user_id text,
  total_books bigint,
  unique_authors bigint,
  unique_tags bigint,
  avg_publication_year numeric,
  first_transmission timestamp with time zone,
  latest_transmission timestamp with time zone,
  reading_span_days numeric,
  books_per_day numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ra.user_id,
    ra.total_books,
    ra.unique_authors,
    ra.unique_tags,
    ra.avg_publication_year,
    ra.first_transmission,
    ra.latest_transmission,
    ra.reading_span_days,
    ra.books_per_day
  FROM public.reading_analytics ra
  WHERE ra.user_id = (auth.uid())::text;
END;
$$;

-- Revoke direct access to the materialized view from anon and authenticated roles
REVOKE ALL ON public.reading_analytics FROM anon, authenticated;

-- Grant execute permission on the safe function
GRANT EXECUTE ON FUNCTION public.get_user_reading_analytics() TO authenticated;