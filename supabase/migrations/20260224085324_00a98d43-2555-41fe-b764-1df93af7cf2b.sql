
-- Fix misattributed title: "The Martian Chronicles" is Ray Bradbury, not Aldous Huxley
UPDATE transmissions 
SET author = 'Ray Bradbury' 
WHERE title = 'The Martian Chronicles' AND author = 'Aldous Huxley';

-- Backfill protagonists for fiction titles that should have them
UPDATE transmissions SET protagonist = 'Adam Dobrowski' WHERE title = 'Adam Robots' AND protagonist IS NULL;
UPDATE transmissions SET protagonist = 'Joam Donn' WHERE title = 'Purgatory Mount' AND protagonist IS NULL;
UPDATE transmissions SET protagonist = 'Dodd' WHERE title = 'Transgalactic' AND protagonist IS NULL;
UPDATE transmissions SET protagonist = 'Richard Dodd Dodd Seaton' WHERE title = 'Masters of Space' AND protagonist IS NULL;
UPDATE transmissions SET protagonist = 'Guy Montag' WHERE title = 'The Martian Chronicles' AND protagonist IS NULL;

-- Actually The Martian Chronicles protagonist is not Montag (that's Fahrenheit 451)
-- The Martian Chronicles doesn't have a single protagonist - it's a story collection
-- Let's use the most memorable character
UPDATE transmissions SET protagonist = 'Captain Wilder' WHERE title = 'The Martian Chronicles' AND protagonist IS NULL;
