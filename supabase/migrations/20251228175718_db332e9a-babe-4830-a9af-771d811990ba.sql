-- Backfill criterion_spine from criterion_spine_number where needed
UPDATE sf_film_adaptations
SET criterion_spine = criterion_spine_number
WHERE criterion_spine IS NULL 
  AND criterion_spine_number IS NOT NULL;