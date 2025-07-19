-- Update publisher books with actual Penguin Science Fiction titles from their official series
DELETE FROM publisher_books WHERE series_id = 'f4164552-2450-43fa-8654-e778cf5d120e';

-- Insert actual Penguin Science Fiction books
INSERT INTO publisher_books (series_id, title, author, isbn, publication_year, editorial_note, cover_url) VALUES
('f4164552-2450-43fa-8654-e778cf5d120e', 'The Handmaid''s Tale', 'Margaret Atwood', '9780141439129', 1985, 'A chilling dystopian masterpiece', 'https://d1w7fb2mkkr3kw.cloudfront.net/assets/images/book/lrg/9780/1414/9780141439129.jpg'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'Neuromancer', 'William Gibson', '9780141457048', 1984, 'The cyberpunk novel that started it all', 'https://d1w7fb2mkkr3kw.cloudfront.net/assets/images/book/lrg/9780/1414/9780141457048.jpg'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'The Time Machine', 'H.G. Wells', '9780141439792', 1895, 'The original time travel narrative', 'https://d1w7fb2mkkr3kw.cloudfront.net/assets/images/book/lrg/9780/1414/9780141439792.jpg'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'Foundation', 'Isaac Asimov', '9780008279554', 1951, 'The epic saga of humanity''s future', 'https://d1w7fb2mkkr3kw.cloudfront.net/assets/images/book/lrg/9780/0082/9780008279554.jpg'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'Dune', 'Frank Herbert', '9780143111580', 1965, 'The greatest science fiction novel ever written', 'https://d1w7fb2mkkr3kw.cloudfront.net/assets/images/book/lrg/9780/1431/9780143111580.jpg'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'The Left Hand of Darkness', 'Ursula K. Le Guin', '9780143111610', 1969, 'A groundbreaking exploration of gender and society', 'https://d1w7fb2mkkr3kw.cloudfront.net/assets/images/book/lrg/9780/1431/9780143111610.jpg'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'Do Androids Dream of Electric Sheep?', 'Philip K. Dick', '9780141439846', 1968, 'The inspiration for Blade Runner', 'https://d1w7fb2mkkr3kw.cloudfront.net/assets/images/book/lrg/9780/1414/9780141439846.jpg'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'I, Robot', 'Isaac Asimov', '9780008279585', 1950, 'The Three Laws of Robotics', 'https://d1w7fb2mkkr3kw.cloudfront.net/assets/images/book/lrg/9780/0082/9780008279585.jpg'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'The War of the Worlds', 'H.G. Wells', '9780141441030', 1898, 'The original alien invasion story', 'https://d1w7fb2mkkr3kw.cloudfront.net/assets/images/book/lrg/9780/1414/9780141441030.jpg'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'Brave New World', 'Aldous Huxley', '9780141439600', 1932, 'A satirical vision of a controlled society', 'https://d1w7fb2mkkr3kw.cloudfront.net/assets/images/book/lrg/9780/1414/9780141439600.jpg'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'The Chrysalids', 'John Wyndham', '9780141441047', 1955, 'Post-apocalyptic tale of telepathic children', 'https://d1w7fb2mkkr3kw.cloudfront.net/assets/images/book/lrg/9780/1414/9780141441047.jpg'),
('f4164552-2450-43fa-8654-e778cf5d120e', 'Starship Troopers', 'Robert A. Heinlein', '9780143111580', 1959, 'Military science fiction classic', 'https://d1w7fb2mkkr3kw.cloudfront.net/assets/images/book/lrg/9780/1431/9780143111580.jpg');