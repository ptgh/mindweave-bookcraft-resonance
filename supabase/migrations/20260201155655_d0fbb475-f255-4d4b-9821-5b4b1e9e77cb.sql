-- Phase 2: Legacy Criterion Cleanup Migration
-- Drop unused criterion_films table and remove legacy columns from sf_film_adaptations

-- Drop the RLS policies on criterion_films first
DROP POLICY IF EXISTS "Criterion films are publicly readable" ON public.criterion_films;
DROP POLICY IF EXISTS "Only admins can delete criterion_films" ON public.criterion_films;
DROP POLICY IF EXISTS "Only admins can insert criterion_films" ON public.criterion_films;
DROP POLICY IF EXISTS "Only admins can update criterion_films" ON public.criterion_films;

-- Drop the criterion_films table
DROP TABLE IF EXISTS public.criterion_films;

-- Remove legacy Criterion columns from sf_film_adaptations
ALTER TABLE public.sf_film_adaptations 
  DROP COLUMN IF EXISTS criterion_spine,
  DROP COLUMN IF EXISTS criterion_spine_number,
  DROP COLUMN IF EXISTS criterion_url,
  DROP COLUMN IF EXISTS is_criterion_collection;