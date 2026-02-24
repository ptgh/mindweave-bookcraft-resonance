
-- Fix Martian Chronicles - Guy Montag is from Fahrenheit 451, not Martian Chronicles
-- The most recurring character is Captain Wilder
UPDATE transmissions SET protagonist = 'Captain Wilder' WHERE id = 59;
UPDATE transmissions SET protagonist = 'Captain Wilder' WHERE id = 97;

-- Fix Masters of Space - the protagonist is Richard Dodd Seaton (not "Dodd Dodd")
UPDATE transmissions SET protagonist = 'Richard Ballinger Seaton', author = 'E.E. Smith' WHERE id = 92;

-- Fix Transgalactic protagonist name - it's Dodd in the novel but let's use full name
UPDATE transmissions SET protagonist = 'Dodd' WHERE title = 'Transgalactic';
