-- Normalize original screenplay book_title to include "(original screenplay)" suffix
UPDATE sf_film_adaptations
SET 
  book_title = film_title || ' (original screenplay)',
  book_publication_year = COALESCE(book_publication_year, film_year)
WHERE adaptation_type = 'original'
  AND (
    book_title IS NULL 
    OR book_title = '' 
    OR book_title = film_title 
    OR LOWER(book_title) = 'original screenplay'
    OR book_title NOT LIKE '%(original screenplay)%'
  );

-- Clean up book_author that says "Original screenplay" - set to director if available, else 'Unknown Screenwriter'
UPDATE sf_film_adaptations
SET book_author = COALESCE(director, 'Unknown Screenwriter')
WHERE adaptation_type = 'original'
  AND LOWER(book_author) = 'original screenplay';