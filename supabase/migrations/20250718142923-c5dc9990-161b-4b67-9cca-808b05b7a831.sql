-- Fix RLS policies for author enrichment queue to allow service operations
DROP POLICY IF EXISTS "Allow public read access to author_enrichment_queue" ON public.author_enrichment_queue;

CREATE POLICY "Allow public read access to author_enrichment_queue" 
ON public.author_enrichment_queue FOR SELECT 
USING (true);

CREATE POLICY "Allow service operations on author_enrichment_queue" 
ON public.author_enrichment_queue FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Allow authenticated operations on author_enrichment_queue" 
ON public.author_enrichment_queue FOR ALL 
USING (auth.role() = 'authenticated');