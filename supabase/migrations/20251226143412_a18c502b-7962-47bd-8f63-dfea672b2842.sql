-- Create sf_directors table for storing director information
CREATE TABLE public.sf_directors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  nationality TEXT,
  bio TEXT,
  birth_year INTEGER,
  death_year INTEGER,
  photo_url TEXT,
  wikipedia_url TEXT,
  notable_sf_films TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sf_directors ENABLE ROW LEVEL SECURITY;

-- Create read-only policy for everyone
CREATE POLICY "SF directors are publicly readable"
  ON public.sf_directors
  FOR SELECT
  USING (true);

-- Create criterion_films table for Criterion Collection SF films
CREATE TABLE public.criterion_films (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  director TEXT NOT NULL,
  year INTEGER,
  spine_number INTEGER,
  criterion_url TEXT,
  cover_url TEXT,
  trailer_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.criterion_films ENABLE ROW LEVEL SECURITY;

-- Create read-only policy for everyone
CREATE POLICY "Criterion films are publicly readable"
  ON public.criterion_films
  FOR SELECT
  USING (true);

-- Add new columns to sf_film_adaptations
ALTER TABLE public.sf_film_adaptations
  ADD COLUMN IF NOT EXISTS poster_url TEXT,
  ADD COLUMN IF NOT EXISTS book_cover_url TEXT,
  ADD COLUMN IF NOT EXISTS criterion_spine INTEGER;