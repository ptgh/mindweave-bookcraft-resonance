-- Update The Ark Sakura with correct cover and link
UPDATE public.publisher_books 
SET cover_url = '/lovable-uploads/8e362777-a70a-49d6-9e82-54254698b5ae.png',
    editorial_note = 'A surreal masterpiece about survival and human nature in post-apocalyptic Japan'
WHERE title = 'The Ark Sakura';

-- Add the Penguin URL as a new column and update it
ALTER TABLE public.publisher_books ADD COLUMN IF NOT EXISTS penguin_url text;

UPDATE public.publisher_books 
SET penguin_url = 'https://www.penguin.co.uk/books/317662/the-ark-sakura-by-abe-kobo/9780241454589'
WHERE title = 'The Ark Sakura';