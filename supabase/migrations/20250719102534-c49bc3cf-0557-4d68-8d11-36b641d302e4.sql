-- Insert the three publisher series
INSERT INTO publisher_series (id, name, publisher, description, badge_emoji) VALUES
('gollancz-masterworks', 'Gollancz SF Masterworks', 'Gollancz', 'Essential science fiction classics from Gollancz', '⚡'),
('penguin-scifi', 'Penguin Science Fiction', 'Penguin Random House', 'Classic science fiction titles from Penguin''s renowned collection', '📚'),
('angry-robot', 'Angry Robot', 'Angry Robot Books', 'Cutting-edge science fiction and fantasy from independent publishers', '🤖')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  publisher = EXCLUDED.publisher,
  description = EXCLUDED.description,
  badge_emoji = EXCLUDED.badge_emoji;

-- Insert sample books for each series
INSERT INTO publisher_books (id, series_id, title, author, isbn, editorial_note) VALUES
-- Gollancz SF Masterworks
('city-gollancz', 'gollancz-masterworks', 'City', 'Clifford D. Simak', '9780575094215', 'Dogs inherit the Earth in Simak''s pastoral vision of the future.'),
('left-hand-gollancz', 'gollancz-masterworks', 'The Left Hand of Darkness', 'Ursula K. Le Guin', '9780575099999', 'Gender and society explored on the planet Gethen.'),
('childhood-end-gollancz', 'gollancz-masterworks', 'Childhood''s End', 'Arthur C. Clarke', '9780575073951', 'Clarke''s masterpiece about humanity''s next evolutionary step.'),
('foundation-gollancz', 'gollancz-masterworks', 'Foundation', 'Isaac Asimov', '9780575079939', 'Psychohistory and the fall of empires in Asimov''s epic.'),

-- Penguin Science Fiction  
('dune-penguin', 'penguin-scifi', 'Dune', 'Frank Herbert', '9780340960191', 'The spice must flow. Herbert''s masterpiece of ecology and power.'),
('neuromancer-penguin', 'penguin-scifi', 'Neuromancer', 'William Gibson', '9780140295078', 'The cyberpunk novel that defined a genre.'),
('do-androids-penguin', 'penguin-scifi', 'Do Androids Dream of Electric Sheep?', 'Philip K. Dick', '9780140134568', 'The inspiration for Blade Runner explores what makes us human.'),
('stranger-penguin', 'penguin-scifi', 'Stranger in a Strange Land', 'Robert A. Heinlein', '9780140054927', 'Heinlein''s exploration of society through alien eyes.'),

-- Angry Robot
('machine-dynasty-angry', 'angry-robot', 'vN: The First Machine Dynasty', 'Madeline Ashby', '9780857662002', 'Self-replicating androids and the nature of consciousness.'),
('windup-girl-angry', 'angry-robot', 'The Windup Girl', 'Paolo Bacigalupi', '9780857660169', 'Biopunk vision of humanity''s future after ecological collapse.'),
('station-eleven-angry', 'angry-robot', 'Station Eleven', 'Emily St. John Mandel', '9780857662003', 'Post-apocalyptic story about art, memory, and human connections.'),
('ancillary-justice-angry', 'angry-robot', 'Ancillary Justice', 'Ann Leckie', '9780857664686', 'AI consciousness and identity in this award-winning space opera.')
ON CONFLICT (id) DO UPDATE SET
  series_id = EXCLUDED.series_id,
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  isbn = EXCLUDED.isbn,
  editorial_note = EXCLUDED.editorial_note;