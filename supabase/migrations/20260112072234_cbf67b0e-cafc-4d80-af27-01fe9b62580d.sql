-- Update the PKD comic entry with correct cover using page 1 of the comic
UPDATE public.sf_film_adaptations 
SET 
  book_cover_url = '/scripts/pkd-religious-experience/page-1.webp',
  poster_url = '/scripts/pkd-religious-experience/page-1.webp'
WHERE id = '6fae0bbc-26e3-4719-954d-ddec85800ba7';