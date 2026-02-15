-- Fix protagonist names to use full names

-- The Futurological Congress: "Idiot" is completely wrong, should be Ijon Tichy
UPDATE public.transmissions SET protagonist = 'Ijon Tichy' WHERE id = 123;

-- Kindred by Octavia Butler: Dana → Dana Franklin
UPDATE public.transmissions SET protagonist = 'Dana Franklin' WHERE id = 18 AND protagonist = 'Dana';

-- The Power by Naomi Alderman: Allie → Allie Montgomery-Taylor
UPDATE public.transmissions SET protagonist = 'Allie Montgomery-Taylor' WHERE id = 17 AND protagonist = 'Allie';

-- Neuromancer: Case → Henry Dorsett Case
UPDATE public.transmissions SET protagonist = 'Henry Dorsett Case' WHERE id = 87 AND protagonist = 'Case';

-- Red Rising: Darrow → Darrow au Andromedus  
UPDATE public.transmissions SET protagonist = 'Darrow au Andromedus' WHERE id = 93 AND protagonist = 'Darrow';

-- Roboteer: Xander → Xander Ludik
UPDATE public.transmissions SET protagonist = 'Xander Ludik' WHERE id = 38 AND protagonist = 'Xander';

-- Flatland: Arthur → A. Square
UPDATE public.transmissions SET protagonist = 'A. Square' WHERE id = 8 AND protagonist = 'Arthur';

-- In Conquest Born: Anzhelika → Anzha lyu Mitethe
UPDATE public.transmissions SET protagonist = 'Anzha lyu Mitethe' WHERE id = 39 AND protagonist = 'Anzhelika';

-- Cosmonaut Keep: Gagarin → Matt Cairns
UPDATE public.transmissions SET protagonist = 'Matt Cairns' WHERE id = 63 AND protagonist = 'Gagarin';