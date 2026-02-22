-- Add portrait_url column to scifi_authors for AI-generated author portraits
ALTER TABLE public.scifi_authors ADD COLUMN portrait_url TEXT;

-- Create storage bucket for author portraits if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('author-portraits', 'author-portraits', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to author portraits
CREATE POLICY "Author portraits are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'author-portraits');

-- Allow authenticated users to upload author portraits (admin will use service role)
CREATE POLICY "Service role can upload author portraits"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'author-portraits');

CREATE POLICY "Service role can update author portraits"
ON storage.objects FOR UPDATE
USING (bucket_id = 'author-portraits');
