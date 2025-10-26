-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  preferences JSONB DEFAULT '{"weekly_digest": true, "new_features": true, "curated_lists": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX idx_newsletter_status ON public.newsletter_subscribers(status);
CREATE INDEX idx_newsletter_user_id ON public.newsletter_subscribers(user_id);
CREATE INDEX idx_newsletter_token ON public.newsletter_subscribers(unsubscribe_token);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (true);

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.newsletter_subscribers
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Users can update their own subscription (preferences, unsubscribe)
CREATE POLICY "Users can update their own subscription"
ON public.newsletter_subscribers
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Service role has full access
CREATE POLICY "Service role has full access to newsletter"
ON public.newsletter_subscribers
FOR ALL
USING (auth.role() = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER update_newsletter_subscribers_updated_at
BEFORE UPDATE ON public.newsletter_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();