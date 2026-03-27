-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Tabla principal: connection_configs
-- =====================================================
CREATE TABLE IF NOT EXISTS public.connection_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Identificacion
    alias_email TEXT NOT NULL,

    -- Credenciales Supabase del proyecto registrado
    supabase_url TEXT NOT NULL,
    anon_key TEXT NOT NULL,
    service_role_key_encrypted TEXT,

    -- Configuracion del Keep-Alive
    keepalive_endpoint_url TEXT NOT NULL,
    keepalive_method TEXT NOT NULL DEFAULT 'GET'
        CHECK (keepalive_method IN ('GET', 'POST')),
    keepalive_headers JSONB DEFAULT '{}',
    keepalive_body JSONB,

    -- Control
    enabled BOOLEAN NOT NULL DEFAULT true,
    interval_seconds INTEGER NOT NULL DEFAULT 300
        CHECK (interval_seconds >= 60),

    -- Estado
    last_attempt_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,

    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cc_user_id ON public.connection_configs(user_id);
CREATE INDEX idx_cc_enabled ON public.connection_configs(enabled) WHERE enabled = true;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cc_updated_at
    BEFORE UPDATE ON public.connection_configs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- Tabla de logs: keepalive_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS public.keepalive_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES public.connection_configs(id) ON DELETE CASCADE,
    status_code INTEGER,
    response_excerpt TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    duration_ms INTEGER,
    error_message TEXT
);

CREATE INDEX idx_kal_config_id ON public.keepalive_logs(config_id);
CREATE INDEX idx_kal_attempted ON public.keepalive_logs(attempted_at DESC);

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE public.connection_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keepalive_logs ENABLE ROW LEVEL SECURITY;

-- connection_configs policies
CREATE POLICY "sel_own" ON public.connection_configs FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "ins_own" ON public.connection_configs FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd_own" ON public.connection_configs FOR UPDATE TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "del_own" ON public.connection_configs FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- keepalive_logs policies (via join)
CREATE POLICY "sel_own_logs" ON public.keepalive_logs FOR SELECT TO authenticated
    USING (config_id IN (
        SELECT id FROM public.connection_configs WHERE user_id = auth.uid()
    ));

-- Service role bypasses RLS automatically (no policy needed)
