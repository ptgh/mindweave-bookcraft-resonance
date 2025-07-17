-- Add temporal fields to transmissions table for Chrono Thread functionality
ALTER TABLE public.transmissions 
ADD COLUMN publication_year INTEGER,
ADD COLUMN narrative_time_period TEXT,
ADD COLUMN historical_context_tags TEXT[];

-- Add index for temporal queries
CREATE INDEX idx_transmissions_publication_year ON public.transmissions(publication_year);
CREATE INDEX idx_transmissions_narrative_time_period ON public.transmissions(narrative_time_period);
CREATE INDEX idx_transmissions_historical_context_tags ON public.transmissions USING GIN(historical_context_tags);

-- Update publisher_books table to include publication year if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'publisher_books' 
                   AND column_name = 'publication_year') THEN
        ALTER TABLE public.publisher_books ADD COLUMN publication_year INTEGER;
        CREATE INDEX idx_publisher_books_publication_year ON public.publisher_books(publication_year);
    END IF;
END $$;