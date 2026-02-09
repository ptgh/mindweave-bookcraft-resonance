
-- Add protagonist_intro column to transmissions table
ALTER TABLE public.transmissions ADD COLUMN IF NOT EXISTS protagonist_intro TEXT;

-- Clear bad protagonist data for "Brave New World Revisited" (non-fiction)
UPDATE public.transmissions SET protagonist = NULL WHERE id = 91;
