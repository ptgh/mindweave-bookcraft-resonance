-- Create reading challenges table
CREATE TABLE IF NOT EXISTS public.reading_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_count INTEGER NOT NULL DEFAULT 1,
  current_progress INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  target_books JSONB,
  ai_encouragement TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.reading_challenges ENABLE ROW LEVEL SECURITY;

-- Users can view their own challenges
CREATE POLICY "Users can view their own challenges"
ON public.reading_challenges
FOR SELECT
USING (user_id = (auth.uid())::text);

-- Users can create their own challenges
CREATE POLICY "Users can create their own challenges"
ON public.reading_challenges
FOR INSERT
WITH CHECK (user_id = (auth.uid())::text);

-- Users can update their own challenges
CREATE POLICY "Users can update their own challenges"
ON public.reading_challenges
FOR UPDATE
USING (user_id = (auth.uid())::text);

-- Users can delete their own challenges
CREATE POLICY "Users can delete their own challenges"
ON public.reading_challenges
FOR DELETE
USING (user_id = (auth.uid())::text);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reading_challenges_user_id ON public.reading_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_challenges_status ON public.reading_challenges(status);