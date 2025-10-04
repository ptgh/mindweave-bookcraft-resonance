-- Make the foreign key constraint deferrable so it checks at transaction end
ALTER TABLE public.author_enrichment_queue 
  DROP CONSTRAINT IF EXISTS author_enrichment_queue_author_id_fkey;

ALTER TABLE public.author_enrichment_queue
  ADD CONSTRAINT author_enrichment_queue_author_id_fkey 
  FOREIGN KEY (author_id) 
  REFERENCES public.scifi_authors(id) 
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- Now add C.J. Cherryh
INSERT INTO public.scifi_authors (name, data_source, verification_status, needs_enrichment)
VALUES ('C.J. Cherryh', 'manual', 'pending', true);