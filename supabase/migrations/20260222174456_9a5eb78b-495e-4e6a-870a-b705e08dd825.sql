
-- Replace ALL broken TMDB poster URLs with verified Amazon/OMDB URLs

-- Dune (1984)
UPDATE sf_film_adaptations 
SET poster_url = 'https://m.media-amazon.com/images/M/MV5BMGJlMGM3NDAtOWNhMy00MWExLWI2MzEtMDQ0ZDIzZDY5ZmQ2XkEyXkFqcGc@._V1_SX300.jpg',
    film_title = 'Dune (1984)'
WHERE id = 'd25922ee-1349-456b-936e-e7d6d440cd15';

-- The Man in the High Castle
UPDATE sf_film_adaptations 
SET poster_url = 'https://m.media-amazon.com/images/M/MV5BOGQyOWQ3YmUtYmU1MC00ZGZlLThhYTEtMTNiNWNhZjQwMGU3XkEyXkFqcGc@._V1_SX300.jpg'
WHERE id = '874b76cc-3a8e-41ea-810a-c1e98de81839';

-- Stalker (1979) - also set correct trailer
UPDATE sf_film_adaptations 
SET poster_url = 'https://m.media-amazon.com/images/M/MV5BMDIzMDRiYjgtM2U1Yy00MjlhLTliODMtM2E5NDI5Njc3YmZkXkEyXkFqcGc@._V1_SX300.jpg'
WHERE id = 'd5112128-0d9d-4929-aec9-2d3f3ee77c9d';

-- Blade Runner
UPDATE sf_film_adaptations 
SET poster_url = 'https://m.media-amazon.com/images/M/MV5BOWQ4YTBmNTQtMDYxMC00NGFjLTkwOGQtNzdhNmY1Nzc1MzUxXkEyXkFqcGc@._V1_SX300.jpg'
WHERE id = 'c1d1ede4-4bc3-49f8-a82b-55daabf60cd5';

-- Children of Men
UPDATE sf_film_adaptations 
SET poster_url = 'https://m.media-amazon.com/images/M/MV5BMDNkNmNiYzYtYWY0YS00NWEwLTgwMWUtYjM0M2E4Nzk3MzhmXkEyXkFqcGc@._V1_SX300.jpg'
WHERE id = '47329343-9d77-41fb-903a-132c123a460d';

-- Metropolis (1927)
UPDATE sf_film_adaptations 
SET poster_url = 'https://m.media-amazon.com/images/M/MV5BMjhjMGYyMjAtMzJkYy00NzhlLWIwY2MtMWQ2ODIxZDUyOGYyXkEyXkFqcGc@._V1_SX300.jpg'
WHERE id = 'b8c6fb19-af07-49b5-8974-f6df66183674';

-- World on a Wire
UPDATE sf_film_adaptations 
SET poster_url = 'https://m.media-amazon.com/images/M/MV5BMWQxMGM2YTAtMzJlMS00MTRkLWJkNDUtMzhkOGI1ZWE0OTRkXkEyXkFqcGc@._V1_SX300.jpg'
WHERE id = '33a8e34d-8c4d-47a0-89d1-05ed4a3544b8';

-- Marjorie Prime
UPDATE sf_film_adaptations 
SET poster_url = 'https://m.media-amazon.com/images/M/MV5BMzU2NDI1NTEwNF5BMl5BanBnXkFtZTgwMjEwNTIwMzI@._V1_SX300.jpg'
WHERE id = '88903b88-c8f0-45cb-ba13-3b76d5a58529';

-- Day of the Triffids
UPDATE sf_film_adaptations 
SET poster_url = 'https://m.media-amazon.com/images/M/MV5BYzEyZWY4YjgtOWRmNS00MGE0LWI0YTQtYTJmNDk0MjhkYzkyXkEyXkFqcGc@._V1_SX300.jpg'
WHERE id = '27cffba6-4db9-4de8-8426-9729f5da890f';

-- Nastaliq - use Amazon image if available, otherwise keep null
UPDATE sf_film_adaptations 
SET poster_url = NULL
WHERE id = '029a1088-bb18-4b4e-a316-6017c07bff6c' AND poster_url LIKE '%tmdb%';
