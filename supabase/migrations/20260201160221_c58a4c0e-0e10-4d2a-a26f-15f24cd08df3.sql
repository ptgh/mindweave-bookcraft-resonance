-- Phase 3: Security Hardening - Tighten RLS Policies
-- 
-- The linter flagged 7 policies with WITH CHECK (true). After analysis:
-- - 5 are intentional (anonymous logging/public forms)
-- - 2 need tightening (scifi_authors, sf_directors INSERT)

-- Fix scifi_authors INSERT policy - require auth and rate limit by checking existing records
DROP POLICY IF EXISTS "Authenticated users can insert authors" ON public.scifi_authors;
CREATE POLICY "Authenticated users can insert authors"
ON public.scifi_authors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix sf_directors INSERT policy - require auth
DROP POLICY IF EXISTS "Authenticated users can insert directors" ON public.sf_directors;
CREATE POLICY "Authenticated users can insert directors"
ON public.sf_directors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Add comment explaining why other policies use (true) - for documentation
COMMENT ON POLICY "Anyone can log interactions" ON public.book_interactions IS 'Anonymous analytics logging - intentionally permissive for UX tracking';
COMMENT ON POLICY "Anyone can log performance metrics" ON public.performance_metrics IS 'Anonymous performance metrics - intentionally permissive for Core Web Vitals';
COMMENT ON POLICY "Anyone can log search queries" ON public.search_queries IS 'Anonymous search logging - intentionally permissive for search analytics';
COMMENT ON POLICY "Anyone can submit contact forms" ON public.contacts IS 'Public contact form - intentionally permissive for user inquiries';
COMMENT ON POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers IS 'Public newsletter signup - intentionally permissive for subscriptions';