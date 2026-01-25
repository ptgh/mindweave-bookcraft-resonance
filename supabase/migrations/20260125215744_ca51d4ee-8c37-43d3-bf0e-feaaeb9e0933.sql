-- Update all event dates to 2026 since they were created with 2025 dates
UPDATE public.scifi_events SET 
  start_date = start_date + INTERVAL '1 year',
  end_date = CASE WHEN end_date IS NOT NULL THEN end_date + INTERVAL '1 year' ELSE NULL END
WHERE start_date < '2026-01-26';