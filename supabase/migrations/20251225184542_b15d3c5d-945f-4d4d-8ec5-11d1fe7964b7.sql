-- Create a SECURITY DEFINER function to safely get user stats (follower count, transmission count)
CREATE OR REPLACE FUNCTION public.get_user_stats(user_ids uuid[])
RETURNS TABLE(
  user_id uuid,
  follower_count bigint,
  transmission_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    (SELECT COUNT(*) FROM public.user_follows WHERE following_id = p.id) as follower_count,
    (SELECT COUNT(*) FROM public.transmissions WHERE transmissions.user_id = p.id::text) as transmission_count
  FROM unnest(user_ids) AS uid
  JOIN public.profiles p ON p.id = uid;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_stats(uuid[]) TO authenticated;