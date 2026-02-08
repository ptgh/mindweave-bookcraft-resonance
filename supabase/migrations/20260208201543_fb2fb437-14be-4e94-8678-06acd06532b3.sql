-- Delete phantom Ubik film (not a real released film, confirmed via TMDB)
DELETE FROM sf_film_adaptations WHERE id = '23ef3758-cf60-4eec-a453-573e73741aa8';

-- Clear broken cached cover for Bicentennial Man so fallback chain can discover a working one
UPDATE sf_film_adaptations SET book_cover_url = NULL WHERE id = '56f4733c-4516-4045-a258-d8bef857d3f9';