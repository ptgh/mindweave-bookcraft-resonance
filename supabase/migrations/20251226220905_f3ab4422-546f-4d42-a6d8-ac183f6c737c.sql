-- Allow any authenticated user to insert into scifi_authors for the auto-create feature
CREATE POLICY "Authenticated users can insert authors" 
ON public.scifi_authors 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also allow for sf_directors
CREATE POLICY "Authenticated users can insert directors" 
ON public.sf_directors 
FOR INSERT 
TO authenticated
WITH CHECK (true);