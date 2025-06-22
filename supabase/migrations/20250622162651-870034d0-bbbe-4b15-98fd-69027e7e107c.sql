
-- Insert Penguin Science Fiction series
INSERT INTO publisher_series (name, publisher, description, badge_emoji) VALUES 
('Penguin Science Fiction', 'Penguin Classics', 'Curated classics of speculative literature—timeless signals from futures past.', '🐧');

-- Get the series ID for Penguin Science Fiction (we'll need this for the books)
-- Insert some classic Penguin Science Fiction books
INSERT INTO publisher_books (series_id, title, author, cover_url, editorial_note) VALUES 
(
  (SELECT id FROM publisher_series WHERE name = 'Penguin Science Fiction' LIMIT 1),
  'Dune',
  'Frank Herbert',
  'https://images.unsplash.com/photo-1518373714866-3f1478910cc0?w=300&h=450&fit=crop',
  'The desert planet epic that redefined space opera.'
),
(
  (SELECT id FROM publisher_series WHERE name = 'Penguin Science Fiction' LIMIT 1),
  'Neuromancer',
  'William Gibson',
  'https://images.unsplash.com/photo-1516981879613-88b2d0cb4b8e?w=300&h=450&fit=crop',
  'The cyberpunk genesis—virtual reality before we knew its name.'
),
(
  (SELECT id FROM publisher_series WHERE name = 'Penguin Science Fiction' LIMIT 1),
  'The Left Hand of Darkness',
  'Ursula K. Le Guin',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=450&fit=crop',
  'A masterpiece of gender and society in speculative form.'
),
(
  (SELECT id FROM publisher_series WHERE name = 'Penguin Science Fiction' LIMIT 1),
  'Foundation',
  'Isaac Asimov',
  'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=300&h=450&fit=crop',
  'Psychohistory meets galactic empire in this foundational work.'
),
(
  (SELECT id FROM publisher_series WHERE name = 'Penguin Science Fiction' LIMIT 1),
  'Childhood''s End',
  'Arthur C. Clarke',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=450&fit=crop',
  'Humanity''s next evolutionary leap through alien intervention.'
),
(
  (SELECT id FROM publisher_series WHERE name = 'Penguin Science Fiction' LIMIT 1),
  'The Time Machine',
  'H.G. Wells',
  'https://images.unsplash.com/photo-1495592822108-9e6261896da8?w=300&h=450&fit=crop',
  'The original time travel narrative that started it all.'
);
