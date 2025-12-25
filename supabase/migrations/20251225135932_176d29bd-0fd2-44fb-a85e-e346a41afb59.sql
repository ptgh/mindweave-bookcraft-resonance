-- Delete old duplicate publisher_series entries that have fewer books
-- These are the hardcoded entries from the original seed data

-- First, identify series with fewer books per publisher and delete them
WITH series_book_counts AS (
  SELECT 
    ps.id,
    ps.publisher,
    ps.name,
    COUNT(pb.id) as book_count
  FROM publisher_series ps
  LEFT JOIN publisher_books pb ON pb.series_id = ps.id
  GROUP BY ps.id, ps.publisher, ps.name
),
series_to_keep AS (
  -- For each publisher, keep the series with the most books
  SELECT DISTINCT ON (LOWER(publisher)) id
  FROM series_book_counts
  ORDER BY LOWER(publisher), book_count DESC
)
DELETE FROM publisher_series 
WHERE id NOT IN (SELECT id FROM series_to_keep);

-- Update remaining series to have proper capitalized publisher names
UPDATE publisher_series SET publisher = 'Penguin' WHERE LOWER(publisher) = 'penguin';
UPDATE publisher_series SET publisher = 'Gollancz' WHERE LOWER(publisher) = 'gollancz';