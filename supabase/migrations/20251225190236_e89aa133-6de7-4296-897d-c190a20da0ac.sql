-- Create book_posts table for community discussions
CREATE TABLE public.book_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_title text NOT NULL,
  book_author text NOT NULL,
  book_cover_url text,
  book_isbn text,
  transmission_id bigint,
  content text NOT NULL,
  post_type text DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'review', 'quote', 'recommendation')),
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create book_post_comments table
CREATE TABLE public.book_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.book_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create book_post_likes table
CREATE TABLE public.book_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.book_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_book_posts_user_id ON public.book_posts(user_id);
CREATE INDEX idx_book_posts_created_at ON public.book_posts(created_at DESC);
CREATE INDEX idx_book_posts_is_featured ON public.book_posts(is_featured) WHERE is_featured = true;
CREATE INDEX idx_book_post_comments_post_id ON public.book_post_comments(post_id);
CREATE INDEX idx_book_post_likes_post_id ON public.book_post_likes(post_id);

-- Enable RLS on all tables
ALTER TABLE public.book_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_posts
CREATE POLICY "Anyone can view book posts"
  ON public.book_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own posts"
  ON public.book_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.book_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.book_posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for book_post_comments
CREATE POLICY "Anyone can view comments"
  ON public.book_post_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.book_post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.book_post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for book_post_likes
CREATE POLICY "Anyone can view likes"
  ON public.book_post_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like posts"
  ON public.book_post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.book_post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update likes_count on book_posts
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.book_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.book_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Function to update comments_count on book_posts
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.book_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.book_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers
CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.book_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.book_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- RPC to get featured content (most read author, most discussed book)
CREATE OR REPLACE FUNCTION public.get_community_featured()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  featured_author jsonb;
  featured_book jsonb;
  featured_post jsonb;
BEGIN
  -- Get most read author (by transmission count in last 30 days)
  SELECT jsonb_build_object(
    'name', author,
    'transmission_count', COUNT(*)
  ) INTO featured_author
  FROM public.transmissions
  WHERE created_at > now() - interval '30 days'
    AND author IS NOT NULL
  GROUP BY author
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Get most discussed book (by post count)
  SELECT jsonb_build_object(
    'title', book_title,
    'author', book_author,
    'cover_url', book_cover_url,
    'post_count', COUNT(*)
  ) INTO featured_book
  FROM public.book_posts
  WHERE created_at > now() - interval '30 days'
  GROUP BY book_title, book_author, book_cover_url
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Get featured post (most liked recent post)
  SELECT jsonb_build_object(
    'id', bp.id,
    'content', LEFT(bp.content, 200),
    'book_title', bp.book_title,
    'likes_count', bp.likes_count,
    'user_id', bp.user_id
  ) INTO featured_post
  FROM public.book_posts bp
  WHERE bp.is_featured = true OR bp.likes_count > 0
  ORDER BY bp.is_featured DESC, bp.likes_count DESC, bp.created_at DESC
  LIMIT 1;

  result := jsonb_build_object(
    'featured_author', COALESCE(featured_author, '{}'::jsonb),
    'featured_book', COALESCE(featured_book, '{}'::jsonb),
    'featured_post', COALESCE(featured_post, '{}'::jsonb)
  );

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_community_featured() TO authenticated;

-- RPC to get community stats
CREATE OR REPLACE FUNCTION public.get_community_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_members', (SELECT COUNT(*) FROM public.profiles),
    'posts_today', (SELECT COUNT(*) FROM public.book_posts WHERE created_at > now() - interval '24 hours'),
    'active_discussions', (SELECT COUNT(*) FROM public.book_posts WHERE comments_count > 0 AND created_at > now() - interval '7 days')
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_community_stats() TO authenticated;