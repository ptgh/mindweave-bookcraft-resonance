-- Fix Predator: Badlands script URL (IMSDb link shown in screenshot)
UPDATE sf_film_adaptations 
SET script_url = 'https://imsdb.com/scripts/Badlands.html',
    script_source = 'imsdb'
WHERE film_title = 'Predator: Badlands' AND film_year = 2025;

-- Clear invalid book_cover_url for all original screenplays (they're pulling random Google Books images)
UPDATE sf_film_adaptations 
SET book_cover_url = NULL
WHERE adaptation_type = 'original';