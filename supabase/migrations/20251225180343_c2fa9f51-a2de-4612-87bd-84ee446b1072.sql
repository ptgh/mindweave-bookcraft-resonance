-- Create user_follows table for social following feature
CREATE TABLE public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Users can see who they follow
CREATE POLICY "Users can view their own follows"
ON public.user_follows FOR SELECT
USING (follower_id = auth.uid());

-- Users can see who follows them
CREATE POLICY "Users can view their followers"
ON public.user_follows FOR SELECT
USING (following_id = auth.uid());

-- Users can follow others
CREATE POLICY "Users can follow others"
ON public.user_follows FOR INSERT
WITH CHECK (follower_id = auth.uid());

-- Users can unfollow
CREATE POLICY "Users can unfollow"
ON public.user_follows FOR DELETE
USING (follower_id = auth.uid());

-- Add policy to profiles table for profile discoverability (display_name and avatar only)
CREATE POLICY "Authenticated users can search profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Add policy to transmissions for viewing followed users' books
CREATE POLICY "Users can view followed users transmissions"
ON public.transmissions FOR SELECT
USING (
  user_id IN (
    SELECT following_id::text FROM public.user_follows WHERE follower_id = auth.uid()
  )
);