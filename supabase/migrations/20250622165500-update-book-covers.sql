
-- Update book covers with better book cover images
UPDATE publisher_books 
SET cover_url = CASE 
  WHEN title = 'Dune' THEN 'https://covers.openlibrary.org/b/isbn/9780441172719-M.jpg'
  WHEN title = 'Neuromancer' THEN 'https://covers.openlibrary.org/b/isbn/9780441569595-M.jpg'
  WHEN title = 'The Left Hand of Darkness' THEN 'https://covers.openlibrary.org/b/isbn/9780441478125-M.jpg'
  WHEN title = 'Foundation' THEN 'https://covers.openlibrary.org/b/isbn/9780553293357-M.jpg'
  WHEN title = 'Childhood''s End' THEN 'https://covers.openlibrary.org/b/isbn/9780345347954-M.jpg'
  WHEN title = 'The Time Machine' THEN 'https://covers.openlibrary.org/b/isbn/9780486284729-M.jpg'
  ELSE cover_url
END
WHERE series_id = (SELECT id FROM publisher_series WHERE name = 'Penguin Science Fiction' LIMIT 1);
