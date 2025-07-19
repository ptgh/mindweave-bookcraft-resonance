-- First, update all transmissions to point to the first Penguin Science Fiction series (keeping it as default)
UPDATE public.transmissions 
SET publisher_series_id = 'f4164552-2450-43fa-8654-e778cf5d120e'
WHERE publisher_series_id IS NOT NULL;

-- Now we can safely delete all series except the ones we want to keep
-- Keep the first three series in order: Penguin Science Fiction, Gollancz SF Masterworks, and update one more to Angry Robot
DELETE FROM public.publisher_series 
WHERE id NOT IN (
  'f4164552-2450-43fa-8654-e778cf5d120e',  -- Penguin Science Fiction (keep as is)
  'b8e8d411-010b-4f5b-8043-b0daae9b12a0',  -- Will become Gollancz SF Masterworks
  'c9f4650c-bb85-473c-b3c4-4da1ecec85ec'   -- Will become Angry Robot
);

-- Update the existing series to our target configurations
UPDATE public.publisher_series 
SET name = 'Penguin Science Fiction', 
    publisher = 'Penguin', 
    description = 'Classic and contemporary science fiction from Penguin', 
    badge_emoji = '🐧'
WHERE id = 'f4164552-2450-43fa-8654-e778cf5d120e';

UPDATE public.publisher_series 
SET name = 'Gollancz SF Masterworks', 
    publisher = 'Gollancz', 
    description = 'The greatest science fiction novels of all time', 
    badge_emoji = '⚡'
WHERE id = 'b8e8d411-010b-4f5b-8043-b0daae9b12a0';

UPDATE public.publisher_series 
SET name = 'Angry Robot', 
    publisher = 'Angry Robot', 
    description = 'Cutting-edge science fiction and fantasy', 
    badge_emoji = '🤖'
WHERE id = 'c9f4650c-bb85-473c-b3c4-4da1ecec85ec';

-- Clear existing books and add new ones
DELETE FROM public.publisher_books;

-- Add sample books for each series
INSERT INTO public.publisher_books (id, series_id, title, author, isbn, editorial_note) VALUES
-- Penguin Science Fiction books
(gen_random_uuid(), 'f4164552-2450-43fa-8654-e778cf5d120e', 'Neuromancer', 'William Gibson', '9780143111603', 'The cyberpunk novel that started it all'),
(gen_random_uuid(), 'f4164552-2450-43fa-8654-e778cf5d120e', 'The Time Machine', 'H.G. Wells', '9780141439976', 'The original time travel narrative that started it all'),
(gen_random_uuid(), 'f4164552-2450-43fa-8654-e778cf5d120e', 'The Handmaid''s Tale', 'Margaret Atwood', '9780385490818', 'Dystopian fiction that feels increasingly prescient'),
-- Gollancz SF Masterworks books
(gen_random_uuid(), 'b8e8d411-010b-4f5b-8043-b0daae9b12a0', 'The Left Hand of Darkness', 'Ursula K. Le Guin', '9780575077331', 'A groundbreaking exploration of gender and society in speculative fiction'),
(gen_random_uuid(), 'b8e8d411-010b-4f5b-8043-b0daae9b12a0', 'Foundation', 'Isaac Asimov', '9780575077232', 'The first book in Asimov''s Foundation series'),
(gen_random_uuid(), 'b8e8d411-010b-4f5b-8043-b0daae9b12a0', 'Dune', 'Frank Herbert', '9780575077133', 'The epic space opera that defined a genre'),
(gen_random_uuid(), 'b8e8d411-010b-4f5b-8043-b0daae9b12a0', 'Childhood''s End', 'Arthur C. Clarke', '9780575077034', 'Humanity''s next evolutionary leap through alien intervention'),
-- Angry Robot books
(gen_random_uuid(), 'c9f4650c-bb85-473c-b3c4-4da1ecec85ec', 'The Windup Girl', 'Paolo Bacigalupi', '9780356500539', 'Biopunk vision of our climate-changed future'),
(gen_random_uuid(), 'c9f4650c-bb85-473c-b3c4-4da1ecec85ec', 'Station Eleven', 'Emily St. John Mandel', '9780385353304', 'Post-apocalyptic literary science fiction'),
(gen_random_uuid(), 'c9f4650c-bb85-473c-b3c4-4da1ecec85ec', 'The Fifth Season', 'N.K. Jemisin', '9780316229296', 'World-shattering fantasy with geological powers');