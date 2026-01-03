-- Fix George R. Stewart author name (stored as "George.r. Stewart") 
-- First identify the ID we're updating
UPDATE public.scifi_authors 
SET 
  name = 'George R. Stewart',
  wikipedia_url = 'https://en.wikipedia.org/wiki/George_R._Stewart',
  birth_year = 1895,
  death_year = 1980,
  nationality = 'American',
  data_quality_score = 90,
  bio = 'George Rippey Stewart Jr. (May 31, 1895 – August 22, 1980) was an American historian, toponymist, novelist, and professor of English at the University of California, Berkeley. His 1949 post-apocalyptic novel Earth Abides won the first International Fantasy Award in 1951 and is considered a seminal work of science fiction.',
  notable_works = ARRAY['Earth Abides', 'Storm', 'Fire', 'Ordeal by Hunger'],
  needs_enrichment = false,
  last_enriched = now()
WHERE id = '5609bc44-4139-4b90-8e74-84647a18d163';