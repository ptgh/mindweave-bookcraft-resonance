-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule book cover enrichment to run every 6 hours
SELECT cron.schedule(
  'enrich-book-covers-every-6-hours',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://mmnfjeukxandnhdaovzx.supabase.co/functions/v1/enrich-book-covers',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbmZqZXVreGFuZG5oZGFvdnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTE3NTgsImV4cCI6MjA2NjE2Nzc1OH0.p8NPVC-MHX_pn9_2BHEQODSG6JVPOORXPTVkmtVxc1E"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
