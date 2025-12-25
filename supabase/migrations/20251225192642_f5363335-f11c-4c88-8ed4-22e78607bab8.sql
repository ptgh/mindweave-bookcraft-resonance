-- Drop existing function and recreate with enhanced data
DROP FUNCTION IF EXISTS public.get_community_featured();

CREATE FUNCTION public.get_community_featured()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  featured_author_data JSON;
  featured_book_data JSON;
  featured_post_data JSON;
BEGIN
  -- Get featured author with notable works from scifi_authors joined with transmission data
  SELECT json_build_object(
    'name', sa.name,
    'transmission_count', COALESCE(tc.count, 0),
    'nationality', sa.nationality,
    'notable_works', sa.notable_works,
    'bio', sa.bio,
    'wikipedia_url', sa.wikipedia_url
  ) INTO featured_author_data
  FROM scifi_authors sa
  LEFT JOIN (
    SELECT author, COUNT(*) as count
    FROM transmissions
    WHERE author IS NOT NULL
    GROUP BY author
  ) tc ON LOWER(TRIM(sa.name)) = LOWER(TRIM(tc.author))
  WHERE sa.notable_works IS NOT NULL 
    AND array_length(sa.notable_works, 1) > 0
    AND sa.bio IS NOT NULL
  ORDER BY tc.count DESC NULLS LAST, sa.data_quality_score DESC NULLS LAST
  LIMIT 1;

  -- Get featured book with cover - ensure different author
  SELECT json_build_object(
    'title', t.title,
    'author', t.author,
    'cover_url', t.cover_url,
    'post_count', COALESCE(pc.count, 0)
  ) INTO featured_book_data
  FROM transmissions t
  LEFT JOIN (
    SELECT book_title, book_author, COUNT(*) as count
    FROM book_posts
    GROUP BY book_title, book_author
  ) pc ON t.title = pc.book_title AND t.author = pc.book_author
  WHERE t.cover_url IS NOT NULL 
    AND t.title IS NOT NULL
    AND t.author IS NOT NULL
    AND (featured_author_data IS NULL OR t.author != (featured_author_data->>'name'))
  ORDER BY pc.count DESC NULLS LAST, t.created_at DESC
  LIMIT 1;

  -- Get featured post (most liked)
  SELECT json_build_object(
    'id', bp.id,
    'content', LEFT(bp.content, 100),
    'book_title', bp.book_title,
    'likes_count', COALESCE(bp.likes_count, 0),
    'user_id', bp.user_id
  ) INTO featured_post_data
  FROM book_posts bp
  WHERE bp.is_featured = true OR bp.likes_count > 0
  ORDER BY bp.likes_count DESC NULLS LAST, bp.created_at DESC
  LIMIT 1;

  result := json_build_object(
    'featured_author', COALESCE(featured_author_data, '{}'::json),
    'featured_book', COALESCE(featured_book_data, '{}'::json),
    'featured_post', COALESCE(featured_post_data, '{}'::json)
  );

  RETURN result;
END;
$$;