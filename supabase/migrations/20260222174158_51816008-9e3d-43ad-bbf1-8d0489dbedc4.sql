
-- Delete duplicate Stalker entry (keep d5112128 which has correct TMDB data)
DELETE FROM sf_film_adaptations WHERE id = 'b22bd884-a334-476a-b2ff-e4825128d025';

-- Fix Stalker trailer to correct 1979 Tarkovsky trailer (was showing 2017 AMC "Roadside Picnic")
UPDATE sf_film_adaptations 
SET trailer_url = 'https://www.youtube.com/watch?v=mIfWXqeOrJ4',
    book_title = 'Roadside Picnic'
WHERE id = 'd5112128-0d9d-4929-aec9-2d3f3ee77c9d';
