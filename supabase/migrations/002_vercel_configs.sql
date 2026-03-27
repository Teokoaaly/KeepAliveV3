-- =====================================================
-- Tabla para configuraciones de Vercel
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vercel_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Credenciales encriptadas
    token_encrypted TEXT NOT NULL,
    team_id TEXT,
    
    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vc_user_id ON public.vercel_configs(user_id);

-- Trigger updated_at
CREATE TRIGGER trg_vc_updated_at
    BEFORE UPDATE ON public.vercel_configs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- RLS para vercel_configs
-- =====================================================
ALTER TABLE public.vercel_configs ENABLE ROW LEVEL SECURITY;

-- vercel_configs policies
CREATE POLICY "sel_own_vercel" ON public.vercel_configs FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "ins_own_vercel" ON public.vercel_configs FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd_own_vercel" ON public.vercel_configs FOR UPDATE TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "del_own_vercel" ON public.vercel_configs FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
