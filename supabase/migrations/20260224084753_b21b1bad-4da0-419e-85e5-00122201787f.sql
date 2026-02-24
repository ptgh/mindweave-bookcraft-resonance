-- Clear broken cached Supabase storage book cover URLs
-- The frontend FilmBookCover component will auto-rediscover from Google Books/Apple Books/OpenLibrary
-- and write back valid URLs on each page load
UPDATE sf_film_adaptations 
SET book_cover_url = NULL 
WHERE book_cover_url LIKE '%supabase.co/storage%book-covers%';

-- Also clear the transmissions table broken cached URLs
UPDATE transmissions 
SET cover_url = NULL 
WHERE cover_url LIKE '%supabase.co/storage%book-covers%' 
AND id IN (
  SELECT id FROM transmissions 
  WHERE cover_url LIKE '%supabase.co/storage%book-covers%'
  LIMIT 50
);