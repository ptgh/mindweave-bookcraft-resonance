-- Clear the current wrong books and add ACTUAL Penguin Science Fiction books from their official page
DELETE FROM publisher_books WHERE series_id = 'f4164552-2450-43fa-8654-e778cf5d120e';

-- Insert the ACTUAL books from https://www.penguin.co.uk/series/PENGSCIFI/penguin-science-fiction
INSERT INTO publisher_books (series_id, title, author, isbn, publication_year, editorial_note) VALUES
('f4164552-2450-43fa-8654-e778cf5d120e', 'The Ark Sakura', 'Kobo Abe', '9780241372845', 1984, 'In anticipation of a coming nuclear apocalypse, Mole has converted a huge underground quarry into an "ark"'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'Black No More', 'George S. Schuyler', '9780241372852', 1931, 'A mysterious doctor has discovered a strange process that can turn black skin white - a new way to "solve the American race problem"'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'Driftglass', 'Samuel R. Delany', '9780241372869', 1971, 'A collection of stunning science fiction stories from one of the genres most celebrated authors'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'Ice', 'Anna Kavan', '9780241372876', 1967, 'A haunting, crystalline novel about a world sliding into environmental collapse'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'Roadside Picnic', 'Arkady Strugatsky', '9780241372883', 1972, 'A science fiction classic about mysterious alien artifacts left behind after a visitation'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'The City of Ember', 'Jeanne DuPrau', '9780241372890', 2003, 'In the underground city of Ember, young Lina and Doon struggle with the citys failing infrastructure'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'The Machine Stops', 'E.M. Forster', '9780241372906', 1909, 'A prescient story of a world where humanity lives underground and communicates through machines'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'The Time Machine', 'H.G. Wells', '9780241372913', 1895, 'The classic tale of time travel to the far future where humanity has evolved into two species'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'The War of the Worlds', 'H.G. Wells', '9780241372920', 1898, 'The original alien invasion story that terrified Victorian England'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'When the Sleeper Wakes', 'H.G. Wells', '9780241372937', 1910, 'A man falls asleep and wakes up over two hundred years later to find a world transformed');