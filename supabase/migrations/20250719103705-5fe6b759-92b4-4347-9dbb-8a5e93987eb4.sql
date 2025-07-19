-- Update existing publisher series to only keep the three requested ones
-- First, get existing series IDs to preserve foreign key relationships
WITH 
existing_series AS (
  SELECT id, name FROM public.publisher_series ORDER BY created_at LIMIT 3
),
target_series AS (
  SELECT 
    ROW_NUMBER() OVER () as rn,
    'Gollancz SF Masterworks' as name,
    'Gollancz' as publisher,
    'The greatest science fiction novels of all time' as description,
    '⚡' as badge_emoji
  UNION ALL
  SELECT 
    2,
    'Penguin Science Fiction',
    'Penguin',
    'Classic and contemporary science fiction from Penguin',
    '🐧'
  UNION ALL
  SELECT 
    3,
    'Angry Robot',
    'Angry Robot',
    'Cutting-edge science fiction and fantasy',
    '🤖'
)
UPDATE public.publisher_series 
SET 
  name = t.name,
  publisher = t.publisher,
  description = t.description,
  badge_emoji = t.badge_emoji
FROM (
  SELECT 
    e.id,
    t.name,
    t.publisher,
    t.description,
    t.badge_emoji,
    ROW_NUMBER() OVER () as rn
  FROM existing_series e
  CROSS JOIN target_series t
  WHERE e.rn = t.rn OR (e.rn <= 3 AND t.rn <= 3)
) t
WHERE publisher_series.id = t.id;

-- Delete any extra series beyond the first 3
DELETE FROM public.publisher_series 
WHERE id NOT IN (
  SELECT id FROM public.publisher_series ORDER BY created_at LIMIT 3
);

-- Clear existing books and add new ones
DELETE FROM public.publisher_books;

-- Add sample books for each of the three series
WITH series_data AS (
  SELECT id, name FROM public.publisher_series
)
INSERT INTO public.publisher_books (id, series_id, title, author, isbn, editorial_note) 
VALUES
-- Gollancz SF Masterworks books
((SELECT gen_random_uuid()), (SELECT id FROM series_data WHERE name = 'Gollancz SF Masterworks'), 'The Left Hand of Darkness', 'Ursula K. Le Guin', '9780575077331', 'A groundbreaking exploration of gender and society in speculative fiction'),
((SELECT gen_random_uuid()), (SELECT id FROM series_data WHERE name = 'Gollancz SF Masterworks'), 'Foundation', 'Isaac Asimov', '9780575077232', 'The first book in Asimov''s Foundation series'),
((SELECT gen_random_uuid()), (SELECT id FROM series_data WHERE name = 'Gollancz SF Masterworks'), 'Dune', 'Frank Herbert', '9780575077133', 'The epic space opera that defined a genre'),
((SELECT gen_random_uuid()), (SELECT id FROM series_data WHERE name = 'Gollancz SF Masterworks'), 'Childhood''s End', 'Arthur C. Clarke', '9780575077034', 'Humanity''s next evolutionary leap through alien intervention'),
-- Penguin Science Fiction books
((SELECT gen_random_uuid()), (SELECT id FROM series_data WHERE name = 'Penguin Science Fiction'), 'Neuromancer', 'William Gibson', '9780143111603', 'The cyberpunk novel that started it all'),
((SELECT gen_random_uuid()), (SELECT id FROM series_data WHERE name = 'Penguin Science Fiction'), 'The Time Machine', 'H.G. Wells', '9780141439976', 'The original time travel narrative that started it all'),
((SELECT gen_random_uuid()), (SELECT id FROM series_data WHERE name = 'Penguin Science Fiction'), 'The Handmaid''s Tale', 'Margaret Atwood', '9780385490818', 'Dystopian fiction that feels increasingly prescient'),
-- Angry Robot books
((SELECT gen_random_uuid()), (SELECT id FROM series_data WHERE name = 'Angry Robot'), 'The Windup Girl', 'Paolo Bacigalupi', '9780356500539', 'Biopunk vision of our climate-changed future'),
((SELECT gen_random_uuid()), (SELECT id FROM series_data WHERE name = 'Angry Robot'), 'Station Eleven', 'Emily St. John Mandel', '9780385353304', 'Post-apocalyptic literary science fiction'),
((SELECT gen_random_uuid()), (SELECT id FROM series_data WHERE name = 'Angry Robot'), 'The Fifth Season', 'N.K. Jemisin', '9780316229296', 'World-shattering fantasy with geological powers');