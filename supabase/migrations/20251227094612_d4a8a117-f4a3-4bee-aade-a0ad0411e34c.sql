-- Create table to track cached images
CREATE TABLE public.cached_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_url TEXT NOT NULL,
  cached_path TEXT NOT NULL,
  cached_url TEXT NOT NULL,
  image_type TEXT NOT NULL DEFAULT 'book', -- 'book' or 'film'
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  access_count INTEGER NOT NULL DEFAULT 1
);

-- Create unique index on original URL for fast lookups
CREATE UNIQUE INDEX idx_cached_images_original_url ON public.cached_images(original_url);

-- Create index on last_accessed for cleanup queries
CREATE INDEX idx_cached_images_last_accessed ON public.cached_images(last_accessed);

-- Enable RLS
ALTER TABLE public.cached_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access (cached images are public)
CREATE POLICY "Anyone can view cached images"
  ON public.cached_images
  FOR SELECT
  USING (true);

-- Only service role can insert/update (edge function)
CREATE POLICY "Service role can manage cached images"
  ON public.cached_images
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');