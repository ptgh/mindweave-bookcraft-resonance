-- Add unique constraint for the upsert functionality to work properly
ALTER TABLE public.free_ebook_links 
ADD CONSTRAINT unique_book_title_author UNIQUE (book_title, book_author);