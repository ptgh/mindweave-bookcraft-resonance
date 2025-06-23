
-- Add comprehensive list of sci-fi authors from Wikipedia
INSERT INTO scifi_authors (id, name, bio, nationality, notable_works, birth_year, death_year) VALUES
-- Continuing from J onwards
('kim-stanley-robinson', 'Kim Stanley Robinson', 'American writer of science fiction. Best known for his Mars trilogy and climate fiction works.', 'American', '["Red Mars", "Green Mars", "Blue Mars", "New York 2140"]', 1952, NULL),
('kurt-vonnegut', 'Kurt Vonnegut', 'American writer known for his satirical and darkly humorous novels with science fiction elements.', 'American', '["Slaughterhouse-Five", "Cat''s Cradle", "The Sirens of Titan"]', 1922, 2007),
('larry-niven', 'Larry Niven', 'American science fiction writer known for hard science fiction and the Known Space universe.', 'American', '["Ringworld", "Protector", "Neutron Star"]', 1938, NULL),
('lois-mcmaster-bujold', 'Lois McMaster Bujold', 'American speculative fiction writer known for the Vorkosigan Saga.', 'American', '["The Warrior''s Apprentice", "Barrayar", "Mirror Dance"]', 1949, NULL),
('margaret-atwood', 'Margaret Atwood', 'Canadian poet, novelist, and speculative fiction writer.', 'Canadian', '["The Handmaid''s Tale", "Oryx and Crake", "The Testaments"]', 1939, NULL),
('mary-shelley', 'Mary Shelley', 'English novelist who wrote the first science fiction novel.', 'British', '["Frankenstein", "The Last Man"]', 1797, 1851),
('michael-crichton', 'Michael Crichton', 'American author and filmmaker known for techno-thrillers.', 'American', '["Jurassic Park", "The Andromeda Strain", "Sphere"]', 1942, 2008),
('neal-stephenson', 'Neal Stephenson', 'American writer known for speculative fiction exploring mathematics, cryptography, and technology.', 'American', '["Snow Crash", "Cryptonomicon", "The Diamond Age"]', 1959, NULL),
('octavia-butler', 'Octavia Butler', 'American science fiction author, one of the first African-American women to gain recognition in the genre.', 'American', '["Kindred", "Parable of the Sower", "Dawn"]', 1947, 2006),
('orson-scott-card', 'Orson Scott Card', 'American novelist known for his science fiction works.', 'American', '["Ender''s Game", "Speaker for the Dead", "Xenocide"]', 1951, NULL),
('piers-anthony', 'Piers Anthony', 'English-American author known for his long-running Xanth series.', 'British-American', '["A Spell for Chameleon", "The Source of Magic", "Castle Roogna"]', 1934, NULL),
('peter-watts', 'Peter Watts', 'Canadian author and marine biologist known for hard science fiction.', 'Canadian', '["Blindsight", "The Rifters Trilogy", "Echopraxia"]', 1958, NULL),
('richard-k-morgan', 'Richard K. Morgan', 'British science fiction author known for cyberpunk and military science fiction.', 'British', '["Altered Carbon", "Broken Angels", "Woken Furies"]', 1965, NULL),
('robert-silverberg', 'Robert Silverberg', 'American author and editor, best known for writing science fiction.', 'American', '["Dying Inside", "Lord Valentine''s Castle", "The Book of Skulls"]', 1935, NULL),
('stanislaw-lem', 'Stanislaw Lem', 'Polish writer of science fiction and essays on various subjects.', 'Polish', '["Solaris", "The Cyberiad", "His Master''s Voice"]', 1921, 2006),
('stephen-baxter', 'Stephen Baxter', 'British hard science fiction author known for his Xeelee Sequence.', 'British', '["Timelike Infinity", "Ring", "Evolution"]', 1957, NULL),
('ted-chiang', 'Ted Chiang', 'American science fiction writer known for his short stories.', 'American', '["Story of Your Life", "The Merchant and the Alchemist''s Gate", "Exhalation"]', 1967, NULL),
('ursula-k-le-guin', 'Ursula K. Le Guin', 'American author best known for her works of speculative fiction.', 'American', '["The Left Hand of Darkness", "The Dispossessed", "A Wizard of Earthsea"]', 1929, 2018),
('vernor-vinge', 'Vernor Vinge', 'American science fiction author and retired San Diego State University professor.', 'American', '["A Fire Upon the Deep", "A Deepness in the Sky", "Rainbows End"]', 1944, NULL),
('william-gibson', 'William Gibson', 'American-Canadian speculative fiction writer and essayist widely credited with pioneering the cyberpunk subgenre.', 'American-Canadian', '["Neuromancer", "Count Zero", "Mona Lisa Overdrive"]', 1948, NULL),
-- Additional notable authors
('ann-leckie', 'Ann Leckie', 'American author known for her Imperial Radch series.', 'American', '["Ancillary Justice", "Ancillary Sword", "Ancillary Mercy"]', 1966, NULL),
('becky-chambers', 'Becky Chambers', 'American science fiction writer known for her Wayfarers series.', 'American', '["A Closed and Common Orbit", "The Long Way to a Small, Angry Planet"]', 1985, NULL),
('charlie-stross', 'Charlie Stross', 'British writer of science fiction and fantasy.', 'British', '["Accelerando", "The Laundry Files", "Glasshouse"]', 1964, NULL),
('cory-doctorow', 'Cory Doctorow', 'Canadian-British blogger, journalist, and science fiction author.', 'Canadian-British', '["Little Brother", "Down and Out in the Magic Kingdom", "Walkaway"]', 1971, NULL),
('dan-simmons', 'Dan Simmons', 'American science fiction and horror writer.', 'American', '["Hyperion", "The Fall of Hyperion", "Endymion"]', 1948, NULL),
('greg-bear', 'Greg Bear', 'American science fiction author known for hard science fiction.', 'American', '["Blood Music", "Eon", "The Forge of God"]', 1951, 2022),
('james-s-a-corey', 'James S. A. Corey', 'Pen name used by collaborators Daniel Abraham and Ty Franck.', 'American', '["Leviathan Wakes", "Caliban''s War", "Abaddon''s Gate"]', NULL, NULL),
('jeff-vandermeer', 'Jeff VanderMeer', 'American author, editor, and literary critic known for weird fiction.', 'American', '["Annihilation", "Authority", "Acceptance"]', 1968, NULL),
('john-scalzi', 'John Scalzi', 'American science fiction author and former president of the Science Fiction and Fantasy Writers of America.', 'American', '["Old Man''s War", "The Ghost Brigades", "The Last Colony"]', 1969, NULL),
('liu-cixin', 'Liu Cixin', 'Chinese science fiction writer and engineer.', 'Chinese', '["The Three-Body Problem", "The Dark Forest", "Death''s End"]', 1963, NULL),
('martha-wells', 'Martha Wells', 'American writer of speculative fiction known for The Murderbot Diaries.', 'American', '["All Systems Red", "Artificial Condition", "Rogue Protocol"]', 1964, NULL),
('n-k-jemisin', 'N. K. Jemisin', 'American science fiction and fantasy writer known for The Broken Earth trilogy.', 'American', '["The Fifth Season", "The Obelisk Gate", "The Stone Sky"]', 1972, NULL)
ON CONFLICT (id) DO NOTHING;
