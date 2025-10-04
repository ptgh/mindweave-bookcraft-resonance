-- Fix contacts table security: Remove public read access and restrict to admins only

-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.contacts;

-- Allow anyone to submit contact forms (INSERT only)
CREATE POLICY "Anyone can submit contact forms"
ON public.contacts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read contact form submissions
CREATE POLICY "Only admins can read contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update contact status (e.g., marking as "read" or "resolved")
CREATE POLICY "Only admins can update contacts"
ON public.contacts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete contact submissions
CREATE POLICY "Only admins can delete contacts"
ON public.contacts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service role retains full access (bypasses RLS)
CREATE POLICY "Service role has full access to contacts"
ON public.contacts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
