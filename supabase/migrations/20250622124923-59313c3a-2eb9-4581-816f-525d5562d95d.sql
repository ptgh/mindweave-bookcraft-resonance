
-- Enable Row Level Security on the transmissions table
ALTER TABLE public.transmissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transmissions table
-- Policy for SELECT: Users can only view their own transmissions
CREATE POLICY "Users can view their own transmissions" 
ON public.transmissions 
FOR SELECT 
USING (auth.uid()::text = user_id);

-- Policy for INSERT: Users can only create transmissions with their own user_id
CREATE POLICY "Users can create their own transmissions" 
ON public.transmissions 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Policy for UPDATE: Users can only update their own transmissions
CREATE POLICY "Users can update their own transmissions" 
ON public.transmissions 
FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Policy for DELETE: Users can only delete their own transmissions
CREATE POLICY "Users can delete their own transmissions" 
ON public.transmissions 
FOR DELETE 
USING (auth.uid()::text = user_id);
