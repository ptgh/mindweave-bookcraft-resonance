
-- Clear broken TMDB poster URLs so enrichment can re-fetch them
-- These URLs return "File Not Found" from TMDB
UPDATE sf_film_adaptations SET poster_url = NULL 
WHERE id IN (
  'd25922ee-1349-456b-936e-e7d6d440cd15',  -- Dune (1984)
  '874b76cc-3a8e-41ea-810a-c1e98de81839',  -- Man in the High Castle
  'd5112128-0d9d-4929-aec9-2d3f3ee77c9d'   -- Stalker
);

-- Also fix Dune (1984) film_title for better TMDB matching - remove year suffix
UPDATE sf_film_adaptations SET film_title = 'Dune' WHERE id = 'd25922ee-1349-456b-936e-e7d6d440cd15';
