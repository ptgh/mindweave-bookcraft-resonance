-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly newsletter to run every Monday at 9:00 AM UTC
SELECT cron.schedule(
  'weekly-newsletter-monday',
  '0 9 * * 1',
  $$
  SELECT
    net.http_post(
      url:='https://mmnfjeukxandnhdaovzx.supabase.co/functions/v1/newsletter-weekly',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbmZqZXVreGFuZG5oZGFvdnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTE3NTgsImV4cCI6MjA2NjE2Nzc1OH0.p8NPVC-MHX_pn9_2BHEQODSG6JVPOORXPTVkmtVxc1E"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
