-- Update book covers for Publisher Resonance page
UPDATE publisher_books 
SET cover_url = '/lovable-uploads/9781399607766-original.jpg.webp'
WHERE id = '44444444-4444-4444-4444-444444444444' AND title = 'Flowers for Algernon';

UPDATE publisher_books 
SET cover_url = '/lovable-uploads/9780241454589-jacket-large.webp' 
WHERE id = '33333333-3333-3333-3333-333333333333' AND title = 'The Ark Sakura';