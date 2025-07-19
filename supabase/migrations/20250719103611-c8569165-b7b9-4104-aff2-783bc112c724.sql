-- Remove duplicate publisher series and keep only the three requested ones
DELETE FROM public.publisher_series;

-- Insert only the three requested publisher series
INSERT INTO public.publisher_series (id, name, publisher, description, badge_emoji) VALUES
(gen_random_uuid(), 'Gollancz SF Masterworks', 'Gollancz', 'The greatest science fiction novels of all time', '⚡'),
(gen_random_uuid(), 'Penguin Science Fiction', 'Penguin', 'Classic and contemporary science fiction from Penguin', '🐧'),
(gen_random_uuid(), 'Angry Robot', 'Angry Robot', 'Cutting-edge science fiction and fantasy', '🤖');

-- Remove any existing books and add sample books for each series
DELETE FROM public.publisher_books;

-- Get the series IDs for inserting books
WITH series_ids AS (
  SELECT id, name FROM public.publisher_series
)
INSERT INTO public.publisher_books (id, series_id, title, author, isbn, cover_url, editorial_note) 
SELECT 
  gen_random_uuid(),
  s.id,
  b.title,
  b.author,
  b.isbn,
  b.cover_url,
  b.editorial_note
FROM series_ids s
CROSS JOIN LATERAL (
  VALUES 
    -- Gollancz SF Masterworks books
    (CASE WHEN s.name = 'Gollancz SF Masterworks' THEN 'The Left Hand of Darkness' END, 
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN 'Ursula K. Le Guin' END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN '9780575077331' END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN NULL END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN 'A groundbreaking exploration of gender and society in speculative fiction' END),
    (CASE WHEN s.name = 'Gollancz SF Masterworks' THEN 'Foundation' END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN 'Isaac Asimov' END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN '9780575077232' END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN NULL END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN 'The first book in Asimov''s Foundation series' END),
    (CASE WHEN s.name = 'Gollancz SF Masterworks' THEN 'Dune' END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN 'Frank Herbert' END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN '9780575077133' END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN NULL END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN 'The epic space opera that defined a genre' END),
    (CASE WHEN s.name = 'Gollancz SF Masterworks' THEN 'Childhood''s End' END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN 'Arthur C. Clarke' END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN '9780575077034' END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN NULL END,
     CASE WHEN s.name = 'Gollancz SF Masterworks' THEN 'Humanity''s next evolutionary leap through alien intervention' END),
    -- Penguin Science Fiction books
    (CASE WHEN s.name = 'Penguin Science Fiction' THEN 'Neuromancer' END,
     CASE WHEN s.name = 'Penguin Science Fiction' THEN 'William Gibson' END,
     CASE WHEN s.name = 'Penguin Science Fiction' THEN '9780143111603' END,
     CASE WHEN s.name = 'Penguin Science Fiction' THEN NULL END,
     CASE WHEN s.name = 'Penguin Science Fiction' THEN 'The cyberpunk novel that started it all' END),
    (CASE WHEN s.name = 'Penguin Science Fiction' THEN 'The Time Machine' END,
     CASE WHEN s.name = 'Penguin Science Fiction' THEN 'H.G. Wells' END,
     CASE WHEN s.name = 'Penguin Science Fiction' THEN '9780141439976' END,
     CASE WHEN s.name = 'Penguin Science Fiction' THEN NULL END,
     CASE WHEN s.name = 'Penguin Science Fiction' THEN 'The original time travel narrative that started it all' END),
    (CASE WHEN s.name = 'Penguin Science Fiction' THEN 'The Handmaid''s Tale' END,
     CASE WHEN s.name = 'Penguin Science Fiction' THEN 'Margaret Atwood' END,
     CASE WHEN s.name = 'Penguin Science Fiction' THEN '9780385490818' END,
     CASE WHEN s.name = 'Penguin Science Fiction' THEN NULL END,
     CASE WHEN s.name = 'Penguin Science Fiction' THEN 'Dystopian fiction that feels increasingly prescient' END),
    -- Angry Robot books
    (CASE WHEN s.name = 'Angry Robot' THEN 'The Windup Girl' END,
     CASE WHEN s.name = 'Angry Robot' THEN 'Paolo Bacigalupi' END,
     CASE WHEN s.name = 'Angry Robot' THEN '9780356500539' END,
     CASE WHEN s.name = 'Angry Robot' THEN NULL END,
     CASE WHEN s.name = 'Angry Robot' THEN 'Biopunk vision of our climate-changed future' END),
    (CASE WHEN s.name = 'Angry Robot' THEN 'Station Eleven' END,
     CASE WHEN s.name = 'Angry Robot' THEN 'Emily St. John Mandel' END,
     CASE WHEN s.name = 'Angry Robot' THEN '9780385353304' END,
     CASE WHEN s.name = 'Angry Robot' THEN NULL END,
     CASE WHEN s.name = 'Angry Robot' THEN 'Post-apocalyptic literary science fiction' END),
    (CASE WHEN s.name = 'Angry Robot' THEN 'The Fifth Season' END,
     CASE WHEN s.name = 'Angry Robot' THEN 'N.K. Jemisin' END,
     CASE WHEN s.name = 'Angry Robot' THEN '9780316229296' END,
     CASE WHEN s.name = 'Angry Robot' THEN NULL END,
     CASE WHEN s.name = 'Angry Robot' THEN 'World-shattering fantasy with geological powers' END)
) AS b(title, author, isbn, cover_url, editorial_note)
WHERE b.title IS NOT NULL;