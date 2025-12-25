-- Clean up duplicate/old publisher_series entries and standardize publisher names
-- First, delete all existing publisher_books to allow clean re-population
DELETE FROM publisher_books;

-- Delete all existing publisher_series
DELETE FROM publisher_series;

-- Now create fresh series with correct publisher names
INSERT INTO publisher_series (name, publisher, description, badge_emoji)
VALUES 
  ('Penguin Science Fiction', 'Penguin', 'A curated collection of classic science fiction, featuring distinctive cover art celebrating the genre''s most influential works.', '🐧'),
  ('Gollancz SF Masterworks', 'Gollancz', 'The definitive library of science fiction classics, featuring essential works from the genre''s greatest authors with iconic cover designs.', '⭐');
