
-- Add Gollancz SF Masterworks series
INSERT INTO public.publisher_series (
  id,
  name,
  publisher,
  description,
  badge_emoji
) VALUES (
  gen_random_uuid(),
  'SF Masterworks',
  'Gollancz',
  'The finest science fiction novels ever written',
  '🏛️'
);

-- Add "Flowers for Algernon" book to the Gollancz series
INSERT INTO public.publisher_books (
  series_id,
  title,
  author,
  isbn,
  cover_url,
  editorial_note,
  publication_year,
  penguin_url
) VALUES (
  (SELECT id FROM public.publisher_series WHERE publisher = 'Gollancz' LIMIT 1),
  'Flowers for Algernon',
  'Daniel Keyes',
  '9781473224469',
  '/lovable-uploads/flowers-algernon-cover.jpg',
  'The Hugo and Nebula Award-winning masterpiece about intelligence, humanity, and the meaning of existence. Charlie Gordon''s journey from intellectual disability to genius and back again remains one of science fiction''s most moving and profound explorations of what it means to be human.',
  2021,
  'https://store.gollancz.co.uk/products/flowers-for-algernon'
);
