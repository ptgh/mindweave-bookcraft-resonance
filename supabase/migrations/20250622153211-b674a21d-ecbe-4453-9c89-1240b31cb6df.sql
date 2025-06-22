
-- Create publisher series table
CREATE TABLE public.publisher_series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  publisher TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  badge_emoji TEXT DEFAULT '📚',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create publisher books table for curated series
CREATE TABLE public.publisher_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id UUID REFERENCES public.publisher_series(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  cover_url TEXT,
  editorial_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add publisher_series_id to transmissions table to link user books to series
ALTER TABLE public.transmissions 
ADD COLUMN publisher_series_id UUID REFERENCES public.publisher_series(id);

-- Enable RLS on new tables
ALTER TABLE public.publisher_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publisher_books ENABLE ROW LEVEL SECURITY;

-- Publisher series and books are public readable (for discovery)
CREATE POLICY "Publisher series are publicly readable" 
  ON public.publisher_series 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Publisher books are publicly readable" 
  ON public.publisher_books 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Insert sample publisher series data
INSERT INTO public.publisher_series (name, publisher, description, badge_emoji) VALUES
('Penguin Science Fiction', 'Penguin Classics', 'Curated classics of speculative literature—timeless signals from futures past.', '🐧'),
('Gollancz SF Masterworks', 'Gollancz', 'The definitive collection of science fiction classics that shaped tomorrow.', '🌌'),
('Vintage Contemporaries', 'Vintage Books', 'Literary fiction that captures the pulse of now and the echo of what comes next.', '📖');

-- Insert sample books for Penguin Science Fiction
INSERT INTO public.publisher_books (series_id, title, author, editorial_note) VALUES
((SELECT id FROM public.publisher_series WHERE name = 'Penguin Science Fiction'), 'Dune', 'Frank Herbert', 'The desert planet epic that redefined space opera.'),
((SELECT id FROM public.publisher_series WHERE name = 'Penguin Science Fiction'), 'The Left Hand of Darkness', 'Ursula K. Le Guin', 'A masterpiece of gender and society in speculative form.'),
((SELECT id FROM public.publisher_series WHERE name = 'Penguin Science Fiction'), 'Neuromancer', 'William Gibson', 'The cyberpunk genesis—virtual reality before we knew its name.');
