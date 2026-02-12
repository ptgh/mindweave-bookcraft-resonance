-- Clear broken cached cover for Simulacron-3 so runtime discovery can find a fresh one
UPDATE public.sf_film_adaptations 
SET book_cover_url = NULL
WHERE book_title = 'Simulacron-3' AND book_author = 'Daniel F. Galouye';
