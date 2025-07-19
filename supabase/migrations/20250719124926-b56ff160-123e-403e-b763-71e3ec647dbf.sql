-- Remove all non-Penguin publisher series and their books
DELETE FROM public.publisher_books WHERE series_id IN (
  SELECT id FROM public.publisher_series WHERE publisher != 'Penguin'
);

DELETE FROM public.publisher_series WHERE publisher != 'Penguin';

-- Update Penguin series to be clean and simple
UPDATE public.publisher_series 
SET name = 'Penguin Classics', 
    description = 'Essential works of literature and thought',
    badge_emoji = '🐧'
WHERE publisher = 'Penguin';

-- Add The Ark Sakura book
INSERT INTO public.publisher_books (
  series_id,
  title,
  author,
  isbn,
  cover_url,
  editorial_note,
  publication_year
) VALUES (
  (SELECT id FROM public.publisher_series WHERE publisher = 'Penguin' LIMIT 1),
  'The Ark Sakura',
  'Kobo Abe',
  '9780241454589',
  '/lovable-uploads/dc4cbac0-8b33-4da7-a3a5-3b39cf3a6609.png',
  'A surreal masterpiece about survival and human nature in post-apocalyptic Japan',
  2020
);