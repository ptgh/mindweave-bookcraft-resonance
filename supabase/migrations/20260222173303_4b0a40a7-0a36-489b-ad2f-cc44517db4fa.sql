-- Blade Runner (1982) - TMDB ID 78
UPDATE sf_film_adaptations SET poster_url = 'https://image.tmdb.org/t/p/w500/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg', tmdb_id = 78 WHERE id = 'c1d1ede4-4bc3-49f8-a82b-55daabf60cd5';

-- Children of Men (2006) - TMDB ID 9693
UPDATE sf_film_adaptations SET poster_url = 'https://image.tmdb.org/t/p/w500/pMAPOvIFBMhGMGaqjfUfJDmOMPo.jpg', tmdb_id = 9693 WHERE id = '47329343-9d77-41fb-903a-132c123a460d';

-- Dune (1984) - TMDB ID 841
UPDATE sf_film_adaptations SET poster_url = 'https://image.tmdb.org/t/p/w500/oOaHBuShfLkXhqhsP0V4oHadPMI.jpg', tmdb_id = 841 WHERE id = 'd25922ee-1349-456b-936e-e7d6d440cd15';

-- Marjorie Prime (2017) - TMDB ID 429200
UPDATE sf_film_adaptations SET poster_url = 'https://image.tmdb.org/t/p/w500/r33U8u7cizJqEgFpqKQpSBLvHXI.jpg', tmdb_id = 429200 WHERE id = '88903b88-c8f0-45cb-ba13-3b76d5a58529';

-- Metropolis (1927) - TMDB ID 19
UPDATE sf_film_adaptations SET poster_url = 'https://image.tmdb.org/t/p/w500/hUK9rewffKGqtmGnLHi0HDbYFfl.jpg', tmdb_id = 19 WHERE id = 'b8c6fb19-af07-49b5-8974-f6df66183674';

-- Stalker (1979) - TMDB ID 1398
UPDATE sf_film_adaptations SET poster_url = 'https://image.tmdb.org/t/p/w500/kTFxyaehkMj8XgjDKcMbBnzGm5k.jpg', tmdb_id = 1398 WHERE id = 'd5112128-0d9d-4929-aec9-2d3f3ee77c9d';

-- The Day of the Triffids (1962) - TMDB ID 28175
UPDATE sf_film_adaptations SET poster_url = 'https://image.tmdb.org/t/p/w500/3chOxYpnOhiUTYYvbfnlUmCXbJn.jpg', tmdb_id = 28175 WHERE id = '27cffba6-4db9-4de8-8426-9729f5da890f';

-- The Man in the High Castle (TV, 2015) - TMDB ID 62017 (TV show)
UPDATE sf_film_adaptations SET poster_url = 'https://image.tmdb.org/t/p/w500/wfwVn6INJkZjf9pJwcrCIrJT5ch.jpg', tmdb_id = 62017 WHERE id = '874b76cc-3a8e-41ea-810a-c1e98de81839';

-- World on a Wire (1973) - TMDB ID 28440
UPDATE sf_film_adaptations SET poster_url = 'https://image.tmdb.org/t/p/w500/5TMYqfwBh0GY92ygVVIzLqJaful.jpg', tmdb_id = 28440 WHERE id = '33a8e34d-8c4d-47a0-89d1-05ed4a3544b8';

-- Nastaliq (2022) - TMDB ID 960703
UPDATE sf_film_adaptations SET poster_url = 'https://image.tmdb.org/t/p/w500/lSJZA6hSwxv8O3d1DfyuN7wZ0Zi.jpg', tmdb_id = 960703 WHERE id = '029a1088-bb18-4b4e-a316-6017c07bff6c';

-- Also fix Nastaliq's broken trailer URL (video unavailable per user screenshot)
-- Replace with a valid trailer or NULL
UPDATE sf_film_adaptations SET trailer_url = NULL WHERE id = '029a1088-bb18-4b4e-a316-6017c07bff6c';