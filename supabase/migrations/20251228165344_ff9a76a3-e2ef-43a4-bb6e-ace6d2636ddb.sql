-- Add book_id foreign key and match_confidence columns to sf_film_adaptations
ALTER TABLE sf_film_adaptations ADD COLUMN book_id UUID REFERENCES publisher_books(id);
ALTER TABLE sf_film_adaptations ADD COLUMN match_confidence INT DEFAULT 0;

-- Create index for efficient joins on book_id
CREATE INDEX idx_film_book_id ON sf_film_adaptations(book_id);