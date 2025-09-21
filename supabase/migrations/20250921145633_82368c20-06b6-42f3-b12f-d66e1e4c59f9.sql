-- Create storage buckets for user content
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('book-covers', 'book-covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('user-uploads', 'user-uploads', false, 52428800, ARRAY['image/*', 'application/pdf', 'text/*'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for book covers
CREATE POLICY "Book covers are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'book-covers');

CREATE POLICY "Authenticated users can upload book covers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'book-covers' 
  AND auth.role() = 'authenticated'
);

-- Storage policies for user uploads
CREATE POLICY "Users can view their own uploads" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enhanced transmissions table with better user linking
ALTER TABLE public.transmissions 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update existing transmissions to link to profiles (only where profiles exist)
UPDATE public.transmissions 
SET profile_id = user_id::uuid 
WHERE profile_id IS NULL 
  AND user_id IS NOT NULL 
  AND user_id::uuid IN (SELECT id FROM public.profiles);

-- Add reading sessions tracking
CREATE TABLE public.reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  pages_read INTEGER DEFAULT 0,
  notes TEXT,
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reading sessions"
ON public.reading_sessions
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create book collections/lists
CREATE TABLE public.book_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.collection_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.book_collections(id) ON DELETE CASCADE NOT NULL,
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  book_isbn TEXT,
  cover_url TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  personal_notes TEXT,
  UNIQUE(collection_id, book_title, book_author)
);

ALTER TABLE public.book_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_books ENABLE ROW LEVEL SECURITY;

-- Collection policies
CREATE POLICY "Users can manage their own collections"
ON public.book_collections
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public collections are viewable by everyone"
ON public.book_collections
FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can manage books in their collections"
ON public.collection_books
FOR ALL
USING (
  collection_id IN (
    SELECT id FROM public.book_collections WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  collection_id IN (
    SELECT id FROM public.book_collections WHERE user_id = auth.uid()
  )
);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_book_collections_updated_at
  BEFORE UPDATE ON public.book_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transmissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reading_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_collections;

-- Set replica identity for realtime updates
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.transmissions REPLICA IDENTITY FULL;
ALTER TABLE public.reading_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.book_collections REPLICA IDENTITY FULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_transmissions_profile_id ON public.transmissions(profile_id);
CREATE INDEX IF NOT EXISTS idx_transmissions_created_at ON public.transmissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book ON public.reading_sessions(book_title, book_author);
CREATE INDEX IF NOT EXISTS idx_book_collections_user_id ON public.book_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_book_collections_public ON public.book_collections(is_public) WHERE is_public = true;