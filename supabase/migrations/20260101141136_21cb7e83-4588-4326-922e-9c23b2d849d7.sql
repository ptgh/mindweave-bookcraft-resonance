-- Fix existing screenplay records with correct writers and script URLs
-- Predator (1987): Jim Thomas & John Thomas
UPDATE sf_film_adaptations 
SET 
  book_author = 'Jim Thomas & John Thomas',
  book_title = 'Predator (original screenplay)',
  script_url = 'https://assets.scriptslug.com/live/pdf/scripts/predator-1987.pdf',
  script_source = 'scriptslug'
WHERE id = '141f6e74-99cb-47f4-bea5-2282eddb3850';

-- Ex Machina (2015): Alex Garland (already correct writer, but he wrote AND directed)
UPDATE sf_film_adaptations 
SET 
  book_title = 'Ex Machina (original screenplay)',
  script_url = 'https://assets.scriptslug.com/live/pdf/scripts/ex-machina-2015.pdf',
  script_source = 'scriptslug'
WHERE id = '0c296abb-7913-4ded-8208-05bdc8e785d9';

-- The Creator (2023): Gareth Edwards & Chris Weitz
UPDATE sf_film_adaptations 
SET 
  book_author = 'Gareth Edwards & Chris Weitz',
  book_title = 'The Creator (original screenplay)'
WHERE id = 'c8488bcf-07b1-49da-8461-cf531677ae43';

-- Predator: Badlands (2025): Patrick Aison (based on reported writer)
UPDATE sf_film_adaptations 
SET 
  book_author = 'Patrick Aison',
  book_title = 'Predator: Badlands (original screenplay)'
WHERE id = '7f6c5a93-280f-4276-ba79-aae375d0eafc';

-- Insert The Predator (2018) if not exists
INSERT INTO sf_film_adaptations (
  film_title,
  film_year,
  book_title,
  book_author,
  director,
  adaptation_type,
  script_url,
  script_source,
  source
) 
SELECT 
  'The Predator',
  2018,
  'The Predator (original screenplay)',
  'Fred Dekker & Shane Black',
  'Shane Black',
  'original',
  'https://assets.scriptslug.com/live/pdf/scripts/the-predator-2018.pdf',
  'scriptslug',
  'curated'
WHERE NOT EXISTS (
  SELECT 1 FROM sf_film_adaptations 
  WHERE film_title = 'The Predator' AND film_year = 2018
);