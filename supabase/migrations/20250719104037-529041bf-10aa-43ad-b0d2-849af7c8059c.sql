-- Update existing publisher series to only keep the three requested ones
-- First, get the first three existing series to preserve foreign key relationships
WITH series_to_update AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.publisher_series
  LIMIT 3
),
target_data AS (
  SELECT 1 as rn, 'Gollancz SF Masterworks' as name, 'Gollancz' as publisher, 'The greatest science fiction novels of all time' as description, '⚡' as badge_emoji
  UNION ALL
  SELECT 2, 'Penguin Science Fiction', 'Penguin', 'Classic and contemporary science fiction from Penguin', '🐧'
  UNION ALL
  SELECT 3, 'Angry Robot', 'Angry Robot', 'Cutting-edge science fiction and fantasy', '🤖'
)
UPDATE public.publisher_series 
SET 
  name = t.name,
  publisher = t.publisher,
  description = t.description,
  badge_emoji = t.badge_emoji
FROM series_to_update s
JOIN target_data t ON s.rn = t.rn
WHERE publisher_series.id = s.id;

-- Delete any extra series beyond the first 3
DELETE FROM public.publisher_series 
WHERE id NOT IN (
  SELECT id FROM public.publisher_series ORDER BY created_at LIMIT 3
);

-- Clear existing books and add new ones
DELETE FROM public.publisher_books;

-- Add sample books for each of the three series
INSERT INTO public.publisher_books (id, series_id, title, author, isbn, editorial_note) 
SELECT 
  gen_random_uuid(),
  s.id,
  books.title,
  books.author,
  books.isbn,
  books.editorial_note
FROM public.publisher_series s
CROSS JOIN (
  SELECT 'The Left Hand of Darkness' as title, 'Ursula K. Le Guin' as author, '9780575077331' as isbn, 'A groundbreaking exploration of gender and society in speculative fiction' as editorial_note, 'Gollancz SF Masterworks' as series_name
  UNION ALL
  SELECT 'Foundation', 'Isaac Asimov', '9780575077232', 'The first book in Asimov''s Foundation series', 'Gollancz SF Masterworks'
  UNION ALL
  SELECT 'Dune', 'Frank Herbert', '9780575077133', 'The epic space opera that defined a genre', 'Gollancz SF Masterworks'
  UNION ALL
  SELECT 'Childhood''s End', 'Arthur C. Clarke', '9780575077034', 'Humanity''s next evolutionary leap through alien intervention', 'Gollancz SF Masterworks'
  UNION ALL
  SELECT 'Neuromancer', 'William Gibson', '9780143111603', 'The cyberpunk novel that started it all', 'Penguin Science Fiction'
  UNION ALL
  SELECT 'The Time Machine', 'H.G. Wells', '9780141439976', 'The original time travel narrative that started it all', 'Penguin Science Fiction'
  UNION ALL
  SELECT 'The Handmaid''s Tale', 'Margaret Atwood', '9780385490818', 'Dystopian fiction that feels increasingly prescient', 'Penguin Science Fiction'
  UNION ALL
  SELECT 'The Windup Girl', 'Paolo Bacigalupi', '9780356500539', 'Biopunk vision of our climate-changed future', 'Angry Robot'
  UNION ALL
  SELECT 'Station Eleven', 'Emily St. John Mandel', '9780385353304', 'Post-apocalyptic literary science fiction', 'Angry Robot'
  UNION ALL
  SELECT 'The Fifth Season', 'N.K. Jemisin', '9780316229296', 'World-shattering fantasy with geological powers', 'Angry Robot'
) books
WHERE s.name = books.series_name;