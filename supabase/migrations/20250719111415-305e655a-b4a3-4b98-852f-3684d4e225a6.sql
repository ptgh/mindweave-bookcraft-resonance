-- Add more books to all three publisher series
-- First, add more Angry Robot books
INSERT INTO public.publisher_books (series_id, title, author, isbn, editorial_note) VALUES
  -- Get Angry Robot series ID
  ((SELECT id FROM public.publisher_series WHERE name = 'Angry Robot'), 'Kameron Hurley The Light Eaters', 'Kameron Hurley', '9780857669094', 'A mind-bending exploration of artificial intelligence and consciousness'),
  ((SELECT id FROM public.publisher_series WHERE name = 'Angry Robot'), 'The Water Will Come', 'Jeff Goodell', '9780857669087', 'A gripping look at climate change consequences'),
  ((SELECT id FROM public.publisher_series WHERE name = 'Angry Robot'), 'The Memory Police', 'Yoko Ogawa', '9780857669080', 'A haunting dystopian tale of forgetting and remembrance'),
  ((SELECT id FROM public.publisher_series WHERE name = 'Angry Robot'), 'Machines Like Me', 'Ian McEwan', '9780857669073', 'Exploring what it means to be human in an AI world'),
  ((SELECT id FROM public.publisher_series WHERE name = 'Angry Robot'), 'The Power', 'Naomi Alderman', '9780857669066', 'A provocative look at power dynamics and gender');

-- Add more Gollancz books
INSERT INTO public.publisher_books (series_id, title, author, isbn, editorial_note) VALUES
  -- Get Gollancz series ID
  ((SELECT id FROM public.publisher_series WHERE name = 'Gollancz SF Masterworks'), 'Dune', 'Frank Herbert', '9781473224469', 'The epic space opera that defined modern science fiction'),
  ((SELECT id FROM public.publisher_series WHERE name = 'Gollancz SF Masterworks'), 'Foundation', 'Isaac Asimov', '9781473224452', 'The classic tale of psychohistory and galactic empire'),
  ((SELECT id FROM public.publisher_series WHERE name = 'Gollancz SF Masterworks'), 'Hyperion', 'Dan Simmons', '9781473224445', 'A Canterbury Tales-style journey through deep space'),
  ((SELECT id FROM public.publisher_series WHERE name = 'Gollancz SF Masterworks'), 'The Left Hand of Darkness', 'Ursula K. Le Guin', '9781473224438', 'Groundbreaking exploration of gender and society'),
  ((SELECT id FROM public.publisher_series WHERE name = 'Gollancz SF Masterworks'), 'Do Androids Dream of Electric Sheep?', 'Philip K. Dick', '9781473224421', 'The philosophical basis for Blade Runner'),
  ((SELECT id FROM public.publisher_series WHERE name = 'Gollancz SF Masterworks'), 'The Stars My Destination', 'Alfred Bester', '9781473224414', 'The ultimate tale of revenge and teleportation');

-- Add more Penguin Science Fiction books (keeping existing ones and adding more)
INSERT INTO public.publisher_books (series_id, title, author, isbn, editorial_note) VALUES
  -- Get Penguin Science Fiction series ID
  ((SELECT id FROM public.publisher_series WHERE name = 'Penguin Science Fiction'), 'The City & The City', 'China Miéville', '9780143113409', 'A mind-bending police procedural in overlapping cities'),
  ((SELECT id FROM public.publisher_series WHERE name = 'Penguin Science Fiction'), 'The Windup Girl', 'Paolo Bacigalupi', '9780143113556', 'Biopunk vision of our climate-changed future'),
  ((SELECT id FROM public.publisher_series WHERE name = 'Penguin Science Fiction'), 'Station Eleven', 'Emily St. John Mandel', '9780143124313', 'Post-apocalyptic literary science fiction'),
  ((SELECT id FROM public.publisher_series WHERE name = 'Penguin Science Fiction'), 'The Parable of the Sower', 'Octavia E. Butler', '9780143105015', 'Prescient tale of climate change and social collapse'),
  ((SELECT id FROM public.publisher_series WHERE name = 'Penguin Science Fiction'), 'Klara and the Sun', 'Kazuo Ishiguro', '9780143139331', 'An artificial friend explores love and sacrifice');