-- =====================================================
-- Log retention, indexes, health_checks, and keepalive_logs updated_at
-- =====================================================

-- =====================================================
-- 1. Add updated_at column to keepalive_logs
-- =====================================================
ALTER TABLE public.keepalive_logs
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER trg_kal_updated_at
    BEFORE UPDATE ON public.keepalive_logs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 2. Add missing indexes
-- =====================================================

-- Composite index for faster log queries by config
CREATE INDEX IF NOT EXISTS idx_kal_config_id_attempted
    ON public.keepalive_logs(config_id, attempted_at DESC);

-- Index for health status queries
CREATE INDEX IF NOT EXISTS idx_cc_last_success_at
    ON public.connection_configs(last_success_at);

-- Index for cron job filtering
CREATE INDEX IF NOT EXISTS idx_cc_last_attempt_at
    ON public.connection_configs(last_attempt_at);

-- Index for stats queries
CREATE INDEX IF NOT EXISTS idx_kal_status_code
    ON public.keepalive_logs(status_code);

-- =====================================================
-- 3. health_checks table (for monitoring the monitoring app)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hc_checked_at ON public.health_checks(checked_at DESC);

ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sel_health_checks" ON public.health_checks FOR SELECT TO authenticated
    USING (true);
CREATE POLICY "ins_health_checks" ON public.health_checks FOR INSERT TO authenticated
    WITH CHECK (true);

-- =====================================================
-- 4. Log retention policy function
-- =====================================================
CREATE OR REPLACE FUNCTION public.purge_old_keepalive_logs(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
    cutoff TIMESTAMPTZ;
BEGIN
    cutoff := now() - (retention_days || ' days')::INTERVAL;

    DELETE FROM public.keepalive_logs
    WHERE attempted_at < cutoff;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;
