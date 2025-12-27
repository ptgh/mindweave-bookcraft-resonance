-- Insert additional original screenplays into sf_film_adaptations
INSERT INTO public.sf_film_adaptations (film_title, book_title, book_author, director, film_year, adaptation_type, imdb_rating, notable_differences)
VALUES
  ('Inception', 'Original Screenplay', 'Christopher Nolan', 'Christopher Nolan', 2010, 'original', 8.8, 'Mind-bending heist film exploring dreams within dreams'),
  ('The Matrix', 'Original Screenplay', 'The Wachowskis', 'The Wachowskis', 1999, 'original', 8.7, 'Revolutionary cyberpunk action that redefined visual effects'),
  ('Interstellar', 'Original Screenplay', 'Christopher Nolan', 'Christopher Nolan', 2014, 'original', 8.7, 'Epic space exploration with scientifically accurate black hole visualization'),
  ('Avatar', 'Original Screenplay', 'James Cameron', 'James Cameron', 2009, 'original', 7.9, 'Groundbreaking 3D technology and motion capture'),
  ('Ex Machina', 'Original Screenplay', 'Alex Garland', 'Alex Garland', 2014, 'original', 7.7, 'Intimate AI thriller exploring consciousness and manipulation'),
  ('District 9', 'Original Screenplay', 'Neill Blomkamp', 'Neill Blomkamp', 2009, 'original', 7.9, 'Documentary-style alien apartheid allegory'),
  ('Looper', 'Original Screenplay', 'Rian Johnson', 'Rian Johnson', 2012, 'original', 7.4, 'Time-travel noir with moral complexity'),
  ('Moon', 'Original Screenplay', 'Duncan Jones', 'Duncan Jones', 2009, 'original', 7.8, 'Intimate one-man psychological sci-fi drama'),
  ('Gravity', 'Original Screenplay', 'Alfonso Cuarón', 'Alfonso Cuarón', 2013, 'original', 7.7, 'Survival thriller with groundbreaking long-take cinematography'),
  ('Primer', 'Original Screenplay', 'Shane Carruth', 'Shane Carruth', 2004, 'original', 6.8, 'Ultra-low budget time travel puzzle box'),
  ('Dark City', 'Original Screenplay', 'Alex Proyas', 'Alex Proyas', 1998, 'original', 7.6, 'Neo-noir mystery in a perpetually dark metropolis'),
  ('Her', 'Original Screenplay', 'Spike Jonze', 'Spike Jonze', 2013, 'original', 8.0, 'Tender romance between man and AI operating system'),
  ('WALL-E', 'Original Screenplay', 'Andrew Stanton', 'Andrew Stanton', 2008, 'original', 8.4, 'Silent film inspired robot love story'),
  ('Close Encounters of the Third Kind', 'Original Screenplay', 'Steven Spielberg', 'Steven Spielberg', 1977, 'original', 7.6, 'First contact story driven by obsession and wonder'),
  ('Back to the Future', 'Original Screenplay', 'Robert Zemeckis', 'Robert Zemeckis', 1985, 'original', 8.5, 'Iconic time-travel adventure comedy'),
  ('The Terminator', 'Original Screenplay', 'James Cameron', 'James Cameron', 1984, 'original', 8.1, 'Relentless AI apocalypse thriller'),
  ('E.T. the Extra-Terrestrial', 'Original Screenplay', 'Steven Spielberg', 'Steven Spielberg', 1982, 'original', 7.9, 'Heartwarming tale of childhood friendship with an alien'),
  ('Coherence', 'Original Screenplay', 'James Ward Byrkit', 'James Ward Byrkit', 2013, 'original', 7.2, 'Low-budget quantum reality thriller'),
  ('Arrival', 'Original Screenplay', 'Denis Villeneuve', 'Denis Villeneuve', 2016, 'original', 7.9, 'Linguistic first contact exploring time perception'),
  ('Annihilation', 'Original Screenplay', 'Alex Garland', 'Alex Garland', 2018, 'original', 6.8, 'Cosmic horror expedition into the unknown')
ON CONFLICT DO NOTHING;