-- =====================================================
-- ADMIN AUDIT LOGGING TABLES
-- For job tracking and forensic data event logging
-- =====================================================

-- Admin Jobs Log: Track enrichment/populate job runs
CREATE TABLE IF NOT EXISTS public.admin_jobs_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  items_processed INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_inserted INTEGER DEFAULT 0,
  items_skipped INTEGER DEFAULT 0,
  error_message TEXT,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Admin Data Events: Forensic logging for all data operations
CREATE TABLE IF NOT EXISTS public.admin_data_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'info' CHECK (event_type IN ('info', 'warning', 'error', 'audit')),
  target_table TEXT,
  records_selected INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_deleted INTEGER DEFAULT 0, -- MUST ALWAYS BE 0 for enrich/populate
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.admin_jobs_log(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_jobs_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_data_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
CREATE POLICY "Admins can view admin_jobs_log"
  ON public.admin_jobs_log FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert admin_jobs_log"
  ON public.admin_jobs_log FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update admin_jobs_log"
  ON public.admin_jobs_log FOR UPDATE
  USING (is_admin());

CREATE POLICY "Service role manages admin_jobs_log"
  ON public.admin_jobs_log FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view admin_data_events"
  ON public.admin_data_events FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert admin_data_events"
  ON public.admin_data_events FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Service role manages admin_data_events"
  ON public.admin_data_events FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_jobs_log_job_name ON public.admin_jobs_log(job_name);
CREATE INDEX IF NOT EXISTS idx_admin_jobs_log_status ON public.admin_jobs_log(status);
CREATE INDEX IF NOT EXISTS idx_admin_jobs_log_started_at ON public.admin_jobs_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_data_events_event_name ON public.admin_data_events(event_name);
CREATE INDEX IF NOT EXISTS idx_admin_data_events_created_at ON public.admin_data_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_data_events_job_id ON public.admin_data_events(job_id);

-- Add comment for documentation
COMMENT ON TABLE public.admin_jobs_log IS 'Tracks all admin enrichment/populate job executions';
COMMENT ON TABLE public.admin_data_events IS 'Forensic audit log for data operations - records_deleted MUST be 0 for enrich/populate jobs';
COMMENT ON COLUMN public.admin_data_events.records_deleted IS 'MUST ALWAYS BE 0 for enrich/populate operations. Non-zero values indicate policy violation.';