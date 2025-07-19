-- First, remove the foreign key constraint from transmissions table
ALTER TABLE transmissions DROP CONSTRAINT IF EXISTS transmissions_publisher_series_id_fkey;

-- Clean out existing data and set up just two books
DELETE FROM publisher_books;
DELETE FROM publisher_series;

-- Insert the two publisher series with proper UUIDs
INSERT INTO publisher_series (id, name, publisher, description, badge_emoji) VALUES
('11111111-1111-1111-1111-111111111111', 'Science Fiction', 'Penguin', 'Penguin Science Fiction collection', '🐧'),
('22222222-2222-2222-2222-222222222222', 'SF Masterworks', 'Gollancz', 'Gollancz SF Masterworks series', '⭐');

-- Insert the two books
INSERT INTO publisher_books (id, series_id, title, author, isbn, cover_url, editorial_note, penguin_url) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'The Ark Sakura', 'Kobo Abe', '9780241454589', '/lovable-uploads/f7e71602-e483-4866-9851-cf6cf357be99.png', 'One of Japan''s most venerated writers. In this unnerving fable, a recluse known as ''Mole'' retreats to a vast underground bunker, only to find strange guests, booby traps and a giant toilet may prove greater obstacles than nuclear disaster.', 'https://www.penguin.co.uk/books/317662/the-ark-sakura-by-abe-kobo/9780241454589'),
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Flowers for Algernon', 'Daniel Keyes', '9780575094192', '/lovable-uploads/6b672b89-735c-4d4b-a2e4-7a11840dffc2.png', 'Winner of the Hugo and Nebula Awards. The classic tale of Charlie Gordon, a mentally disabled man who undergoes experimental surgery to increase his intelligence, only to discover the temporary nature of his transformation.', 'https://store.gollancz.co.uk/collections/series-s-f-masterworks');