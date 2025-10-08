-- Add explicit RLS policy to prevent anonymous access to profiles table
-- This prevents email harvesting by anonymous users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Ensure no public/anonymous access to profiles
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Add check for admin role in enrich-author-data edge function
-- Note: This will be enforced at the application level via the edge function

-- Add indexes for better performance on contact form submissions
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);

-- Add comment documenting the security policy
COMMENT ON POLICY "Users can view their own profile" ON public.profiles IS 
'Only authenticated users can view their own profile data. Prevents email harvesting.';

COMMENT ON POLICY "Deny anonymous access to profiles" ON public.profiles IS 
'Explicitly denies all anonymous access to profiles table for security.';