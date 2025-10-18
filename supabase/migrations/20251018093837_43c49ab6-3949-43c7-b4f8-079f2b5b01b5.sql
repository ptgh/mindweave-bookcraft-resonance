-- Phase 1: AI Enhancement Tables

-- Table for caching AI tag suggestions
CREATE TABLE IF NOT EXISTS public.book_ai_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_identifier TEXT NOT NULL,
  suggested_tags JSONB NOT NULL,
  user_id TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for storing reading insights narratives
CREATE TABLE IF NOT EXISTS public.reading_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  narrative TEXT NOT NULL,
  metadata JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  timeframe TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for caching book recommendations
CREATE TABLE IF NOT EXISTS public.book_recommendations_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  recommendations JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_ai_tags_identifier ON public.book_ai_tags(book_identifier);
CREATE INDEX IF NOT EXISTS idx_book_ai_tags_user ON public.book_ai_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_insights_user ON public.reading_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_book_recommendations_user ON public.book_recommendations_cache(user_id);

-- Enable RLS
ALTER TABLE public.book_ai_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_recommendations_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_ai_tags
CREATE POLICY "Users can view tag suggestions"
  ON public.book_ai_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tag suggestions"
  ON public.book_ai_tags FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for reading_insights
CREATE POLICY "Users can view their own insights"
  ON public.reading_insights FOR SELECT
  USING (user_id = (auth.uid())::text);

CREATE POLICY "Users can create their own insights"
  ON public.reading_insights FOR INSERT
  WITH CHECK (user_id = (auth.uid())::text);

CREATE POLICY "Users can update their own insights"
  ON public.reading_insights FOR UPDATE
  USING (user_id = (auth.uid())::text);

-- RLS Policies for book_recommendations_cache
CREATE POLICY "Users can view their own recommendations"
  ON public.book_recommendations_cache FOR SELECT
  USING (user_id = (auth.uid())::text);

CREATE POLICY "Users can manage their own recommendations"
  ON public.book_recommendations_cache FOR ALL
  USING (user_id = (auth.uid())::text);