-- =====================================================
-- Cap keepalive interval at 4 hours and set the new default
-- =====================================================

ALTER TABLE public.connection_configs
    ALTER COLUMN interval_seconds SET DEFAULT 14400;

ALTER TABLE public.connection_configs
    DROP CONSTRAINT IF EXISTS connection_configs_interval_seconds_check;

UPDATE public.connection_configs
SET interval_seconds = 14400
WHERE interval_seconds = 300;

UPDATE public.connection_configs
SET interval_seconds = 14400
WHERE interval_seconds > 14400;

ALTER TABLE public.connection_configs
    ADD CONSTRAINT connection_configs_interval_seconds_check
    CHECK (interval_seconds >= 60 AND interval_seconds <= 14400);
