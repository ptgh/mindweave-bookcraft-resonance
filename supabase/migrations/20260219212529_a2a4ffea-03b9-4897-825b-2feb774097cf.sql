
-- Expand protagonist list for fiction titles missing protagonists
UPDATE public.transmissions SET protagonist = 'Winston Smith' WHERE id = 117;
UPDATE public.transmissions SET protagonist = 'Rushdi' WHERE id IN (50, 42);
UPDATE public.transmissions SET protagonist = 'Jeremy Stake' WHERE id IN (57, 37, 44);
UPDATE public.transmissions SET protagonist = 'John Craig' WHERE id = 43;
