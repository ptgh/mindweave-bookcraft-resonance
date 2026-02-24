
-- ============================================
-- 1. Add missing canonical SF authors (dedup by name)
-- ============================================
INSERT INTO public.scifi_authors (name, birth_year, death_year, nationality, data_source, verification_status, needs_enrichment)
SELECT v.name, v.birth_year, v.death_year, v.nationality, 'manual', 'verified', true
FROM (VALUES
  ('Ted Chiang', 1967, NULL, 'American'),
  ('John Wyndham', 1903, 1969, 'British'),
  ('Cordwainer Smith', 1913, 1966, 'American'),
  ('Samuel Butler', 1835, 1902, 'British'),
  ('Karin Tidbeck', 1977, NULL, 'Swedish'),
  ('Annalee Newitz', 1969, NULL, 'American'),
  ('Christopher Priest', 1943, NULL, 'British'),
  ('Doris Lessing', 1919, 2013, 'British'),
  ('Mervyn Peake', 1911, 1968, 'British'),
  ('James White', 1928, 1999, 'Irish'),
  ('Bob Shaw', 1931, 1996, 'Irish'),
  ('John Christopher', 1922, 2012, 'British'),
  ('Richard K. Morgan', 1965, NULL, 'British'),
  ('Emily St. John Mandel', 1979, NULL, 'Canadian'),
  ('John Scalzi', 1969, NULL, 'American')
) AS v(name, birth_year, death_year, nationality)
WHERE NOT EXISTS (
  SELECT 1 FROM public.scifi_authors sa WHERE LOWER(sa.name) = LOWER(v.name)
);

-- ============================================
-- 2. Merge duplicate authors (keep canonical name, delete duplicates)
-- ============================================

-- Merge "A. Roberts" into "Adam Roberts" (keep Adam Roberts)
UPDATE public.author_books SET author_id = (SELECT id FROM public.scifi_authors WHERE name = 'Adam Roberts' LIMIT 1)
WHERE author_id = (SELECT id FROM public.scifi_authors WHERE name = 'A. Roberts' LIMIT 1);

UPDATE public.author_enrichment_queue SET author_id = (SELECT id FROM public.scifi_authors WHERE name = 'Adam Roberts' LIMIT 1)
WHERE author_id = (SELECT id FROM public.scifi_authors WHERE name = 'A. Roberts' LIMIT 1);

DELETE FROM public.scifi_authors WHERE name = 'A. Roberts'
  AND EXISTS (SELECT 1 FROM public.scifi_authors WHERE name = 'Adam Roberts');

-- Merge "Octavia Butler" into "Octavia E. Butler"
UPDATE public.author_books SET author_id = (SELECT id FROM public.scifi_authors WHERE name = 'Octavia E. Butler' LIMIT 1)
WHERE author_id = (SELECT id FROM public.scifi_authors WHERE name = 'Octavia Butler' LIMIT 1);

UPDATE public.author_enrichment_queue SET author_id = (SELECT id FROM public.scifi_authors WHERE name = 'Octavia E. Butler' LIMIT 1)
WHERE author_id = (SELECT id FROM public.scifi_authors WHERE name = 'Octavia Butler' LIMIT 1);

DELETE FROM public.scifi_authors WHERE name = 'Octavia Butler'
  AND EXISTS (SELECT 1 FROM public.scifi_authors WHERE name = 'Octavia E. Butler');

-- Merge "Arkady Strugatsky" into "Arkady And Boris Strugatsky"
UPDATE public.author_books SET author_id = (SELECT id FROM public.scifi_authors WHERE name = 'Arkady And Boris Strugatsky' LIMIT 1)
WHERE author_id = (SELECT id FROM public.scifi_authors WHERE name = 'Arkady Strugatsky' LIMIT 1);

UPDATE public.author_enrichment_queue SET author_id = (SELECT id FROM public.scifi_authors WHERE name = 'Arkady And Boris Strugatsky' LIMIT 1)
WHERE author_id = (SELECT id FROM public.scifi_authors WHERE name = 'Arkady Strugatsky' LIMIT 1);

DELETE FROM public.scifi_authors WHERE name = 'Arkady Strugatsky'
  AND EXISTS (SELECT 1 FROM public.scifi_authors WHERE name = 'Arkady And Boris Strugatsky');

-- ============================================
-- 3. Add ~25 quality SF transmissions (for the primary user)
-- ============================================
INSERT INTO public.transmissions (title, author, tags, user_id, protagonist, publication_year)
SELECT v.title, v.author, v.tags, '54fe1e09-034d-4e53-bf36-64c47d217393', v.protagonist, v.pub_year
FROM (VALUES
  ('The Left Hand of Darkness', 'Ursula K. Le Guin', 'Science Fiction', 'Genly Ai', 1969),
  ('The Dispossessed', 'Ursula K. Le Guin', 'Science Fiction', 'Shevek', 1974),
  ('Count Zero', 'William Gibson', 'Science Fiction, Cyberpunk', 'Bobby Newmark', 1986),
  ('Consider Phlebas', 'Iain M. Banks', 'Science Fiction, Space Opera', 'Bora Horza Gobuchul', 1987),
  ('Use of Weapons', 'Iain M. Banks', 'Science Fiction, Space Opera', 'Cheradenine Zakalwe', 1990),
  ('Revelation Space', 'Alastair Reynolds', 'Science Fiction, Hard SF', 'Dan Sylveste', 2000),
  ('The Three-Body Problem', 'Liu Cixin', 'Science Fiction, Hard SF', 'Ye Wenjie', 2008),
  ('Blindsight', 'Peter Watts', 'Science Fiction, Hard SF', 'Siri Keeton', 2006),
  ('Rendezvous with Rama', 'Arthur C. Clarke', 'Science Fiction, Hard SF', 'Commander Norton', 1973),
  ('The Stars My Destination', 'Alfred Bester', 'Science Fiction', 'Gully Foyle', 1956),
  ('Ringworld', 'Larry Niven', 'Science Fiction, Hard SF', 'Louis Wu', 1970),
  ('Gateway', 'Frederik Pohl', 'Science Fiction', 'Robinette Broadhead', 1977),
  ('Solaris', 'Stanislaw Lem', 'Science Fiction', 'Kris Kelvin', 1961),
  ('A Canticle for Leibowitz', 'Walter M. Miller Jr.', 'Science Fiction, Post-Apocalyptic', 'Brother Francis', 1960),
  ('The Book of the New Sun', 'Gene Wolfe', 'Science Fiction, Dying Earth', 'Severian', 1980),
  ('Parable of the Sower', 'Octavia E. Butler', 'Science Fiction, Dystopian', 'Lauren Olamina', 1993),
  ('Children of Time', 'Adrian Tchaikovsky', 'Science Fiction, Hard SF', 'Holsten Mason', 2015),
  ('Old Man''s War', 'John Scalzi', 'Science Fiction, Military SF', 'John Perry', 2005),
  ('Altered Carbon', 'Richard K. Morgan', 'Science Fiction, Cyberpunk', 'Takeshi Kovacs', 2002),
  ('The Fifth Season', 'N.K. Jemisin', 'Science Fiction, Dying Earth', 'Essun', 2015),
  ('Leviathan Wakes', 'James S.A. Corey', 'Science Fiction, Space Opera', 'Jim Holden', 2011),
  ('Station Eleven', 'Emily St. John Mandel', 'Science Fiction, Post-Apocalyptic', 'Kirsten Raymonde', 2014),
  ('The Handmaid''s Tale', 'Margaret Atwood', 'Science Fiction, Dystopian', 'Offred', 1985),
  ('We', 'Yevgeny Zamyatin', 'Science Fiction, Dystopian', 'D-503', 1924),
  ('The Day of the Triffids', 'John Wyndham', 'Science Fiction, Post-Apocalyptic', 'Bill Masen', 1951)
) AS v(title, author, tags, protagonist, pub_year)
WHERE NOT EXISTS (
  SELECT 1 FROM public.transmissions t 
  WHERE LOWER(t.title) = LOWER(v.title) AND t.user_id = '54fe1e09-034d-4e53-bf36-64c47d217393'
);
