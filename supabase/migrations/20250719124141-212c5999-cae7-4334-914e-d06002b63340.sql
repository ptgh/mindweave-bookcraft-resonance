-- Clear all Penguin Science Fiction books to start fresh
DELETE FROM publisher_books 
WHERE series_id = (
  SELECT id FROM publisher_series 
  WHERE name = 'Penguin Science Fiction' 
  AND publisher = 'Penguin'
);