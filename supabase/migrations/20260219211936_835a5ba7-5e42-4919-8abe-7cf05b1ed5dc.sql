
-- Clear broken cached cover URLs for The Population Bomb and Event Horizon
UPDATE public.transmissions SET cover_url = NULL WHERE id IN (121, 122);

-- Remove the corrupted cached_images entries so they don't get reused
DELETE FROM public.cached_images WHERE id IN ('a2d3d258-efe4-424c-9002-e869a013fb52', 'ec5576d6-b5ed-4348-829a-32c62787a45e');
