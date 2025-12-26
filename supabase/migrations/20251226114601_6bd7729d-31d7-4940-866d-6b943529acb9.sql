-- Create SF Film Adaptations table for book-to-film connections
CREATE TABLE public.sf_film_adaptations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  book_isbn TEXT,
  book_publication_year INTEGER,
  film_title TEXT NOT NULL,
  film_year INTEGER,
  director TEXT,
  imdb_id TEXT,
  imdb_rating DECIMAL(3,1),
  rotten_tomatoes_score INTEGER,
  streaming_availability JSONB DEFAULT '{}'::jsonb,
  adaptation_type TEXT DEFAULT 'direct', -- 'direct', 'loose', 'inspired_by', 'sequel'
  notable_differences TEXT,
  awards JSONB DEFAULT '[]'::jsonb,
  trailer_url TEXT,
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sf_film_adaptations ENABLE ROW LEVEL SECURITY;

-- Public read access for everyone
CREATE POLICY "SF film adaptations are publicly readable"
ON public.sf_film_adaptations
FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Only admins can manage film adaptations"
ON public.sf_film_adaptations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage for edge functions
CREATE POLICY "Service role manages film adaptations"
ON public.sf_film_adaptations
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create indexes for common queries
CREATE INDEX idx_sf_film_adaptations_book_author ON public.sf_film_adaptations(book_author);
CREATE INDEX idx_sf_film_adaptations_film_year ON public.sf_film_adaptations(film_year);
CREATE INDEX idx_sf_film_adaptations_book_title ON public.sf_film_adaptations USING gin(to_tsvector('english', book_title));

-- Create trigger for updated_at
CREATE TRIGGER update_sf_film_adaptations_updated_at
BEFORE UPDATE ON public.sf_film_adaptations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();