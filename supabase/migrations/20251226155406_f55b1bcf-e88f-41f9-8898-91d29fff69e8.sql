-- Add RLS policies to allow admin CRUD operations on sf_directors
CREATE POLICY "Only admins can insert directors" 
ON public.sf_directors 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update directors" 
ON public.sf_directors 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete directors" 
ON public.sf_directors 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role full access
CREATE POLICY "Service role manages sf_directors" 
ON public.sf_directors 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);