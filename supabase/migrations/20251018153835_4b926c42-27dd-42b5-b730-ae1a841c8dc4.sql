-- Phase 2: Database tables for enhanced discovery

-- Book AI analysis cache
CREATE TABLE IF NOT EXISTS public.book_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_identifier TEXT NOT NULL UNIQUE,
  analysis_data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_book_ai_analysis_identifier ON public.book_ai_analysis(book_identifier);
CREATE INDEX IF NOT EXISTS idx_book_ai_analysis_cached ON public.book_ai_analysis(cached_at);

-- Enable RLS
ALTER TABLE public.book_ai_analysis ENABLE ROW LEVEL SECURITY;

-- Public read access (analysis is generic, not user-specific)
CREATE POLICY "Book AI analysis is publicly readable" 
ON public.book_ai_analysis 
FOR SELECT 
USING (true);

-- Authenticated users can create analysis
CREATE POLICY "Authenticated users can create book analysis" 
ON public.book_ai_analysis 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Author AI analysis cache  
CREATE TABLE IF NOT EXISTS public.author_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_identifier TEXT NOT NULL UNIQUE,
  analysis_data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_author_ai_analysis_identifier ON public.author_ai_analysis(author_identifier);
CREATE INDEX IF NOT EXISTS idx_author_ai_analysis_cached ON public.author_ai_analysis(cached_at);

-- Enable RLS
ALTER TABLE public.author_ai_analysis ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Author AI analysis is publicly readable" 
ON public.author_ai_analysis 
FOR SELECT 
USING (true);

-- Authenticated users can create analysis
CREATE POLICY "Authenticated users can create author analysis" 
ON public.author_ai_analysis 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');