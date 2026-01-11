-- Update "The Religious Experience of Philip K. Dick" to correct data
-- This is actually a comic by Robert Crumb, not a film
UPDATE public.sf_film_adaptations 
SET 
  book_author = 'Robert Crumb',
  book_title = 'The Religious Experience of Philip K. Dick (comic)',
  trailer_url = 'https://www.youtube.com/watch?v=smyhQhTER7o',
  script_url = '/scripts/pkd-religious-experience/',
  script_source = 'Comic Book',
  adaptation_type = 'comic',
  notable_differences = 'This is not a traditional film but an 8-page biographical comic by underground cartoonist Robert Crumb, illustrating Philip K. Dick''s 1974 mystical experiences described in his Exegesis. First published in Weirdo magazine #17 (1986).',
  updated_at = now()
WHERE id = '6fae0bbc-26e3-4719-954d-ddec85800ba7';