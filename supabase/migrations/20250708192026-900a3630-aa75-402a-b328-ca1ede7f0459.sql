-- Create table for caching free ebook links
CREATE TABLE public.free_ebook_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  isbn TEXT,
  gutenberg_url TEXT,
  archive_url TEXT,
  gutenberg_id TEXT,
  archive_id TEXT,
  formats JSONB, -- Store available formats (epub, pdf, txt, etc.)
  last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.free_ebook_links ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since this is public domain content)
CREATE POLICY "Free ebook links are publicly readable" 
ON public.free_ebook_links 
FOR SELECT 
USING (true);

-- Create policy for authenticated users to insert/update
CREATE POLICY "Authenticated users can manage free ebook links" 
ON public.free_ebook_links 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create indexes for efficient lookup
CREATE INDEX idx_free_ebook_links_title_author ON public.free_ebook_links(book_title, book_author);
CREATE INDEX idx_free_ebook_links_isbn ON public.free_ebook_links(isbn) WHERE isbn IS NOT NULL;
CREATE INDEX idx_free_ebook_links_last_checked ON public.free_ebook_links(last_checked);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_free_ebook_links_updated_at
BEFORE UPDATE ON public.free_ebook_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();