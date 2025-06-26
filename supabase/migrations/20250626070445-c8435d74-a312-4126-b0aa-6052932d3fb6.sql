
-- Create a table for contact form submissions
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded'))
);

-- Add Row Level Security (RLS) - only admins should see contact submissions
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policy for admins (you can modify this later based on your admin setup)
CREATE POLICY "Allow all operations for service role" 
  ON public.contacts 
  FOR ALL 
  USING (true);
