-- Insert the three publisher series with proper UUIDs
INSERT INTO publisher_series (id, name, publisher, description, badge_emoji) VALUES
('11111111-1111-1111-1111-111111111111', 'Gollancz SF Masterworks', 'Gollancz', 'Essential science fiction classics from Gollancz', '⚡'),
('22222222-2222-2222-2222-222222222222', 'Penguin Science Fiction', 'Penguin Random House', 'Classic science fiction titles from Penguin''s renowned collection', '📚'),
('33333333-3333-3333-3333-333333333333', 'Angry Robot', 'Angry Robot Books', 'Cutting-edge science fiction and fantasy from independent publishers', '🤖')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  publisher = EXCLUDED.publisher,
  description = EXCLUDED.description,
  badge_emoji = EXCLUDED.badge_emoji;

-- Insert sample books for each series with proper UUIDs
INSERT INTO publisher_books (id, series_id, title, author, isbn, editorial_note) VALUES
-- Gollancz SF Masterworks
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'City', 'Clifford D. Simak', '9780575094215', 'Dogs inherit the Earth in Simak''s pastoral vision of the future.'),
('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'The Left Hand of Darkness', 'Ursula K. Le Guin', '9780575099999', 'Gender and society explored on the planet Gethen.'),
('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Childhood''s End', 'Arthur C. Clarke', '9780575073951', 'Clarke''s masterpiece about humanity''s next evolutionary step.'),
('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Foundation', 'Isaac Asimov', '9780575079939', 'Psychohistory and the fall of empires in Asimov''s epic.'),

-- Penguin Science Fiction  
('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Dune', 'Frank Herbert', '9780340960191', 'The spice must flow. Herbert''s masterpiece of ecology and power.'),
('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Neuromancer', 'William Gibson', '9780140295078', 'The cyberpunk novel that defined a genre.'),
('b3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Do Androids Dream of Electric Sheep?', 'Philip K. Dick', '9780140134568', 'The inspiration for Blade Runner explores what makes us human.'),
('b4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Stranger in a Strange Land', 'Robert A. Heinlein', '9780140054927', 'Heinlein''s exploration of society through alien eyes.'),

-- Angry Robot
('c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'vN: The First Machine Dynasty', 'Madeline Ashby', '9780857662002', 'Self-replicating androids and the nature of consciousness.'),
('c2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'The Windup Girl', 'Paolo Bacigalupi', '9780857660169', 'Biopunk vision of humanity''s future after ecological collapse.'),
('c3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Station Eleven', 'Emily St. John Mandel', '9780857662003', 'Post-apocalyptic story about art, memory, and human connections.'),
('c4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Ancillary Justice', 'Ann Leckie', '9780857664686', 'AI consciousness and identity in this award-winning space opera.')
ON CONFLICT (id) DO UPDATE SET
  series_id = EXCLUDED.series_id,
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  isbn = EXCLUDED.isbn,
  editorial_note = EXCLUDED.editorial_note;