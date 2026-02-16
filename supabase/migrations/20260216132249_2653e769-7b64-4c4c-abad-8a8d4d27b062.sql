
-- Add protagonist_portrait_url column to transmissions
ALTER TABLE public.transmissions ADD COLUMN IF NOT EXISTS protagonist_portrait_url TEXT;

-- Create protagonist-portraits storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('protagonist-portraits', 'protagonist-portraits', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to protagonist portraits
CREATE POLICY "Protagonist portraits are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'protagonist-portraits');

-- Allow authenticated users to upload protagonist portraits
CREATE POLICY "Authenticated users can upload protagonist portraits"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'protagonist-portraits' AND auth.role() = 'authenticated');

-- Allow service role to update/delete portraits
CREATE POLICY "Service role can manage protagonist portraits"
ON storage.objects FOR ALL
USING (bucket_id = 'protagonist-portraits')
WITH CHECK (bucket_id = 'protagonist-portraits');
