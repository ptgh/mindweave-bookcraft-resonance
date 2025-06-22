
-- Update the publisher_series table to be readable by all users
ALTER TABLE public.publisher_series ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read publisher series
CREATE POLICY "Allow all users to read publisher series" 
  ON public.publisher_series 
  FOR SELECT 
  USING (true);

-- Add some additional series to demonstrate the functionality
INSERT INTO publisher_series (name, publisher, description, badge_emoji) VALUES 
('Gollancz Masterworks', 'Gollancz', 'The essential science fiction and fantasy collection—timeless works that shaped the genre.', '🏛️'),
('Tor Essentials', 'Tor Books', 'Modern classics and groundbreaking narratives from contemporary voices.', '🗲'),
('Oxford World Classics', 'Oxford University Press', 'Literary foundations—the texts that built our understanding of narrative.', '📜');

-- Add books for Gollancz Masterworks
INSERT INTO publisher_books (series_id, title, author, isbn, editorial_note) VALUES 
(
  (SELECT id FROM publisher_series WHERE name = 'Gollancz Masterworks' LIMIT 1),
  'The Forever War',
  'Joe Haldeman',
  '9780575094147',
  'A powerful anti-war allegory disguised as military science fiction.'
),
(
  (SELECT id FROM publisher_series WHERE name = 'Gollancz Masterworks' LIMIT 1),
  'Gateway',
  'Frederik Pohl',
  '9780575094239',
  'Exploration and discovery at the edge of known space.'
),
(
  (SELECT id FROM publisher_series WHERE name = 'Gollancz Masterworks' LIMIT 1),
  'The Stars My Destination',
  'Alfred Bester',
  '9780575094154',
  'A classic tale of revenge and human potential.'
);

-- Add books for Tor Essentials
INSERT INTO publisher_books (series_id, title, author, isbn, editorial_note) VALUES 
(
  (SELECT id FROM publisher_series WHERE name = 'Tor Essentials' LIMIT 1),
  'The Fifth Season',
  'N.K. Jemisin',
  '9780316229296',
  'First book of the groundbreaking Broken Earth trilogy.'
),
(
  (SELECT id FROM publisher_series WHERE name = 'Tor Essentials' LIMIT 1),
  'Station Eleven',
  'Emily St. John Mandel',
  '9780804172448',
  'Post-apocalyptic beauty and the power of art to endure.'
),
(
  (SELECT id FROM publisher_series WHERE name = 'Tor Essentials' LIMIT 1),
  'The Power',
  'Naomi Alderman',
  '9780316547604',
  'A world where women develop electrical powers—everything changes.'
);

-- Add books for Oxford World Classics
INSERT INTO publisher_books (series_id, title, author, isbn, editorial_note) VALUES 
(
  (SELECT id FROM publisher_series WHERE name = 'Oxford World Classics' LIMIT 1),
  'Frankenstein',
  'Mary Shelley',
  '9780199537150',
  'The first true science fiction novel—creation and responsibility.'
),
(
  (SELECT id FROM publisher_series WHERE name = 'Oxford World Classics' LIMIT 1),
  'The Strange Case of Dr. Jekyll and Mr. Hyde',
  'Robert Louis Stevenson',
  '9780199536221',
  'The duality of human nature explored through transformation.'
),
(
  (SELECT id FROM publisher_series WHERE name = 'Oxford World Classics' LIMIT 1),
  'Twenty Thousand Leagues Under the Sea',
  'Jules Verne',
  '9780199539277',
  'Underwater adventure and scientific wonder.'
);
