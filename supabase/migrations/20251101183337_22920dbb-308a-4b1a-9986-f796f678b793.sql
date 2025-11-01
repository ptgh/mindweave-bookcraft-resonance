-- Create temporal analysis cache table
CREATE TABLE temporal_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  analysis jsonb NOT NULL,
  temporal_signature text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE temporal_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Users can view their own analysis
CREATE POLICY "Users can view their own analysis"
  ON temporal_analysis_cache
  FOR SELECT
  USING (user_id = (auth.uid())::text);

-- Users can insert their own analysis
CREATE POLICY "Users can insert their own analysis"
  ON temporal_analysis_cache
  FOR INSERT
  WITH CHECK (user_id = (auth.uid())::text);

-- Users can update their own analysis
CREATE POLICY "Users can update their own analysis"
  ON temporal_analysis_cache
  FOR UPDATE
  USING (user_id = (auth.uid())::text);

-- Add index for quick lookups
CREATE INDEX idx_temporal_analysis_user ON temporal_analysis_cache(user_id);
CREATE INDEX idx_temporal_analysis_generated ON temporal_analysis_cache(generated_at);