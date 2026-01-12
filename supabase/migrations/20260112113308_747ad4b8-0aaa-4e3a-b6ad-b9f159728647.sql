-- Fix Vesper: It's an original screenplay, not based on a book
UPDATE public.sf_film_adaptations 
SET 
  adaptation_type = 'original',
  book_title = 'Original Screenplay',
  book_author = 'Kristina Buožytė, Bruno Samper',
  book_cover_url = NULL -- No book exists for this original screenplay
WHERE id = 'c99bc379-af35-4a3b-bdf1-aad19ba6f576';

-- Fix The Medusa Touch cover - use a reliable Archive.org book cover
UPDATE public.sf_film_adaptations
SET book_cover_url = 'https://covers.openlibrary.org/b/id/6753696-L.jpg'
WHERE id = 'e7ca0878-ef00-434f-84be-fe6a8de57415';