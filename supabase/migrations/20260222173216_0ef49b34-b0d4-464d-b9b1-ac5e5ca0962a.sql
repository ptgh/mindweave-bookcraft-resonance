-- Delete the typo duplicate "Anniliation" (correct "Annihilation" already exists with id 39040f20)
DELETE FROM sf_film_adaptations WHERE id = '5a1c0b79-3dc9-41ed-9213-73fa893913c1';

-- Fix film_title for TMDB matching: "Do Androids Dream of Electric Sheep?" should be "Blade Runner"
UPDATE sf_film_adaptations SET film_title = 'Blade Runner' WHERE id = 'c1d1ede4-4bc3-49f8-a82b-55daabf60cd5';

-- Fix "Roadside Picnic" - the film is "Stalker" by Tarkovsky
UPDATE sf_film_adaptations SET film_title = 'Stalker' WHERE id = 'd5112128-0d9d-4929-aec9-2d3f3ee77c9d';

-- Fix "The Children of Men" - TMDB title is "Children of Men"
UPDATE sf_film_adaptations SET film_title = 'Children of Men' WHERE id = '47329343-9d77-41fb-903a-132c123a460d';

-- Fix "Majorie Prime" typo - should be "Marjorie Prime"
UPDATE sf_film_adaptations SET film_title = 'Marjorie Prime' WHERE id = '88903b88-c8f0-45cb-ba13-3b76d5a58529';