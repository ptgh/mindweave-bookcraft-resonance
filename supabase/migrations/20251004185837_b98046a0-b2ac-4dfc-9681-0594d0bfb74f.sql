-- Move pg_cron extension to extensions schema (best practice)
DROP EXTENSION IF EXISTS pg_cron CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Ensure pg_net is also in extensions schema
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a cron job to run author enrichment every 6 hours
-- Runs at 00:00, 06:00, 12:00, 18:00 UTC
SELECT cron.schedule(
  'author-enrichment-scheduled',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://mmnfjeukxandnhdaovzx.supabase.co/functions/v1/enrich-author-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbmZqZXVreGFuZG5oZGFvdnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTE3NTgsImV4cCI6MjA2NjE2Nzc1OH0.p8NPVC-MHX_pn9_2BHEQODSG6JVPOORXPTVkmtVxc1E'
      ),
      body := jsonb_build_object(
        'scheduled', true
      )
    ) as request_id;
  $$
);
