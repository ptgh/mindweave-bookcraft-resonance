-- Create admins table for admin access control
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Only service role can manage admins table
CREATE POLICY "Service role manages admins" ON public.admins
  FOR ALL USING (auth.role() = 'service_role');

-- Admins can view the admins table
CREATE POLICY "Admins can view admins list" ON public.admins
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()));

-- Create a helper function to check admin status (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = _user_id)
$$;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon;

-- Add write-protection policies to admin-modified tables
-- Note: We keep existing SELECT policies and only add INSERT/UPDATE/DELETE restrictions

-- transmissions: only admins can delete (users can insert/update their own via existing policies)
CREATE POLICY "Only admins can delete transmissions" ON public.transmissions
  FOR DELETE USING (public.is_admin());

-- sf_film_adaptations: already has admin-only policies via has_role, keep them

-- sf_directors: already has admin-only policies via has_role, keep them

-- scifi_authors: add admin-only UPDATE/DELETE policies
CREATE POLICY "Only admins can update authors" ON public.scifi_authors
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete authors" ON public.scifi_authors
  FOR DELETE USING (public.is_admin());

-- author_books: add admin-only write policies
CREATE POLICY "Only admins can insert author_books" ON public.author_books
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update author_books" ON public.author_books
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete author_books" ON public.author_books
  FOR DELETE USING (public.is_admin());

-- publisher_books: add admin-only write policies  
CREATE POLICY "Only admins can insert publisher_books" ON public.publisher_books
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update publisher_books" ON public.publisher_books
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete publisher_books" ON public.publisher_books
  FOR DELETE USING (public.is_admin());

-- criterion_films: add admin-only write policies
CREATE POLICY "Only admins can insert criterion_films" ON public.criterion_films
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update criterion_films" ON public.criterion_films
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete criterion_films" ON public.criterion_films
  FOR DELETE USING (public.is_admin());

-- cached_images: service role already has full access, add admin policy
CREATE POLICY "Admins can manage cached_images" ON public.cached_images
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- book_embeddings: add admin-only write policies
CREATE POLICY "Admins can manage book_embeddings" ON public.book_embeddings
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());