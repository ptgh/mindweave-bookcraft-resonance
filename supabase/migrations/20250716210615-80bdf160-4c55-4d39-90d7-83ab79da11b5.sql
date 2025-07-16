-- Add comprehensive book tracking and analytics
-- Create book_interactions table for detailed analytics
CREATE TABLE IF NOT EXISTS public.book_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  book_isbn TEXT,
  interaction_type TEXT NOT NULL, -- 'preview', 'add', 'digital_copy_click', 'search', 'view'
  digital_source TEXT, -- 'apple_books', 'internet_archive', 'project_gutenberg', 'none'
  source_context TEXT, -- 'publisher_resonance', 'author_matrix', 'search', 'discovery'
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser_type TEXT, -- 'chrome', 'safari', 'firefox', 'edge'
  search_query TEXT,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_details TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.book_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for book interactions
CREATE POLICY "Users can view their own interactions" 
ON public.book_interactions 
FOR SELECT 
USING (auth.uid()::text = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can log interactions" 
ON public.book_interactions 
FOR INSERT 
WITH CHECK (true);

-- Add performance tracking table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL, -- 'page_load', 'api_response', 'search_time', 'cache_hit'
  metric_value NUMERIC NOT NULL,
  context TEXT, -- 'publisher_resonance', 'author_matrix', 'search'
  user_agent TEXT,
  device_type TEXT,
  network_type TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for performance metrics
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert performance metrics
CREATE POLICY "Anyone can log performance metrics" 
ON public.performance_metrics 
FOR INSERT 
WITH CHECK (true);

-- Allow admins to read performance metrics
CREATE POLICY "Service role can read performance metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_book_interactions_user_id ON public.book_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_book_interactions_created_at ON public.book_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_interactions_interaction_type ON public.book_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_book_interactions_digital_source ON public.book_interactions(digital_source);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON public.performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON public.performance_metrics(metric_type);

-- Update existing tables with better indexing for performance
CREATE INDEX IF NOT EXISTS idx_publisher_books_title_search ON public.publisher_books USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_publisher_books_author_search ON public.publisher_books USING gin(to_tsvector('english', author));
CREATE INDEX IF NOT EXISTS idx_scifi_authors_name_search ON public.scifi_authors USING gin(to_tsvector('english', name));

-- Add function to log book interactions
CREATE OR REPLACE FUNCTION public.log_book_interaction(
  p_user_id TEXT,
  p_book_title TEXT,
  p_book_author TEXT,
  p_book_isbn TEXT DEFAULT NULL,
  p_interaction_type TEXT DEFAULT 'view',
  p_digital_source TEXT DEFAULT NULL,
  p_source_context TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_browser_type TEXT DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_details TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  interaction_id UUID;
BEGIN
  INSERT INTO public.book_interactions (
    user_id, book_title, book_author, book_isbn, interaction_type,
    digital_source, source_context, device_type, browser_type,
    search_query, response_time_ms, success, error_details, metadata
  ) VALUES (
    p_user_id, p_book_title, p_book_author, p_book_isbn, p_interaction_type,
    p_digital_source, p_source_context, p_device_type, p_browser_type,
    p_search_query, p_response_time_ms, p_success, p_error_details, p_metadata
  ) RETURNING id INTO interaction_id;
  
  RETURN interaction_id;
END;
$$;

-- Add function to log performance metrics
CREATE OR REPLACE FUNCTION public.log_performance_metric(
  p_metric_type TEXT,
  p_metric_value NUMERIC,
  p_context TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_network_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  metric_id UUID;
BEGIN
  INSERT INTO public.performance_metrics (
    metric_type, metric_value, context, user_agent, device_type, network_type
  ) VALUES (
    p_metric_type, p_metric_value, p_context, p_user_agent, p_device_type, p_network_type
  ) RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$$;