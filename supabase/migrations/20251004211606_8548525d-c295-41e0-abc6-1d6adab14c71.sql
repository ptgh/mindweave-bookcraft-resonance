-- Add "Cyteen" by C.J. Cherryh to author_books
INSERT INTO public.author_books (
  author_id,
  title,
  subtitle,
  description,
  published_date,
  page_count,
  categories,
  cover_url,
  google_books_id
)
SELECT 
  sa.id,
  'Cyteen',
  NULL,
  'A brilliant exploration of psychology, politics, and identity in a far-future universe. Hugo Award winner for Best Novel.',
  '1988',
  680,
  ARRAY['Science Fiction', 'Space Opera', 'Political Science Fiction'],
  'http://books.google.com/books/content?id=ixhfAAAAMAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
  'ixhfAAAAMAAJ'
FROM public.scifi_authors sa
WHERE sa.name = 'C.J. Cherryh'
ON CONFLICT DO NOTHING;