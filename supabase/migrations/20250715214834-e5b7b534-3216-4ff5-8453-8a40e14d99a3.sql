-- Create table to cache ebook search results for better performance
CREATE TABLE public.ebook_search_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_key text NOT NULL UNIQUE, -- combination of title and author
  title text NOT NULL,
  author text NOT NULL,
  annas_archive_results jsonb,
  internet_archive_results jsonb,
  gutenberg_results jsonb,
  last_searched timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ebook_search_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since ebook searches are public)
CREATE POLICY "Ebook search cache is publicly readable" 
ON public.ebook_search_cache 
FOR SELECT 
USING (true);

-- Create policy for authenticated users to insert/update cache
CREATE POLICY "Authenticated users can manage ebook search cache" 
ON public.ebook_search_cache 
FOR ALL 
USING (auth.role() = 'authenticated'::text)
WITH CHECK (auth.role() = 'authenticated'::text);

-- Create index for faster searches
CREATE INDEX idx_ebook_search_cache_search_key ON public.ebook_search_cache(search_key);
CREATE INDEX idx_ebook_search_cache_last_searched ON public.ebook_search_cache(last_searched);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ebook_search_cache_updated_at
BEFORE UPDATE ON public.ebook_search_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();