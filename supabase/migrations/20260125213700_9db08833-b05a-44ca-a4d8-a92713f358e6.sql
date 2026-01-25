-- Create table for sci-fi events (festivals, conventions, readings)
CREATE TABLE public.scifi_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'convention', -- convention, festival, reading, workshop, booklaunch
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  time TEXT, -- e.g. "10:00 - 18:00"
  venue TEXT,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'UK',
  website_url TEXT,
  ticket_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- e.g. "annual", "monthly"
  featured_authors TEXT[], -- array of author names appearing
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scifi_events ENABLE ROW LEVEL SECURITY;

-- Everyone can view active events
CREATE POLICY "Events are viewable by everyone" 
ON public.scifi_events 
FOR SELECT 
USING (is_active = true);

-- Admins can manage events
CREATE POLICY "Admins can manage events" 
ON public.scifi_events 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_scifi_events_updated_at
BEFORE UPDATE ON public.scifi_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial UK sci-fi events data
INSERT INTO public.scifi_events (name, event_type, description, start_date, end_date, venue, city, country, website_url, featured_authors, is_recurring, recurrence_pattern) VALUES
-- Cymera Festival 2025
('Cymera Festival 2025', 'festival', 'Scotland''s festival of science fiction, fantasy, and horror writing. A celebration of genre fiction featuring author panels, readings, and workshops.', '2025-06-06', '2025-06-08', 'Various Venues', 'Edinburgh', 'UK', 'https://www.cymerafestival.co.uk/cymera-2025', ARRAY['Various genre authors'], true, 'annual'),

-- London Science Fiction Research Community
('LSFRC Monthly Meeting', 'reading', 'Monthly meetings of the London Science Fiction Research Community featuring academic discussions, author talks, and readings.', '2025-02-15', NULL, 'Various London Venues', 'London', 'UK', 'https://www.lsfrc.co.uk/', ARRAY['Academic speakers', 'SF authors'], true, 'monthly'),

-- Eastercon 2025 (Conversation)
('Conversation - Eastercon 2025', 'convention', 'The British National Science Fiction Convention. The UK''s longest-running SF convention featuring panels, readings, dealers room, and art show.', '2025-04-18', '2025-04-21', 'Hilton Birmingham Metropole', 'Birmingham', 'UK', 'https://conversation2025.uk/', ARRAY['Guest of Honour TBA'], true, 'annual'),

-- FantasyCon
('FantasyCon 2025', 'convention', 'The annual convention of the British Fantasy Society, celebrating fantasy, horror, and science fiction literature.', '2025-09-19', '2025-09-21', 'TBA', 'TBA', 'UK', 'https://www.britishfantasysociety.org/', NULL, true, 'annual'),

-- Glasgow Worldcon 2024 follow-up events
('Glasgow SF Writers'' Circle', 'workshop', 'Regular meetings of Glasgow''s SF writers community. Open to all levels from beginners to published authors.', '2025-02-01', NULL, 'Various Venues', 'Glasgow', 'UK', NULL, NULL, true, 'monthly'),

-- Edge-Lit
('Edge-Lit 11', 'convention', 'A one-day celebration of genre fiction held in Derby. Features author panels, signings, and dealer tables.', '2025-07-12', NULL, 'QUAD', 'Derby', 'UK', 'https://www.derbyquad.co.uk/edge-lit', NULL, true, 'annual'),

-- BristolCon
('BristolCon 2025', 'convention', 'A friendly one-day science fiction and fantasy convention in Bristol featuring panels, readings, and workshops.', '2025-10-25', NULL, 'Hilton DoubleTree', 'Bristol', 'UK', 'https://www.bristolcon.org/', NULL, true, 'annual'),

-- Sci-Fi London Film Festival
('Sci-Fi London Film Festival', 'festival', 'London''s science fiction and fantastic film festival, the largest genre film festival in Europe.', '2025-05-01', '2025-05-06', 'Various Cinemas', 'London', 'UK', 'https://sci-fi-london.com/', NULL, true, 'annual'),

-- Nine Worlds
('Nine Worlds Geekfest', 'convention', 'A multi-genre fan convention celebrating SF, fantasy, gaming, and geek culture.', '2025-08-08', '2025-08-10', 'Novotel London West', 'London', 'UK', 'https://nineworlds.co.uk/', NULL, true, 'annual'),

-- Arthur C. Clarke Award ceremony
('Arthur C. Clarke Award Ceremony', 'booklaunch', 'The annual ceremony for the UK''s most prestigious science fiction literary award.', '2025-07-16', NULL, 'London Venue TBA', 'London', 'UK', 'https://www.clarkeaward.com/', ARRAY['Award nominees'], true, 'annual');

-- Create index for date-based queries
CREATE INDEX idx_scifi_events_dates ON public.scifi_events (start_date, end_date) WHERE is_active = true;