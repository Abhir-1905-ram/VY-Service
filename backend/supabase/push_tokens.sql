-- Phone push tokens for admin and normal employees.
-- Run once in Supabase Dashboard → SQL Editor.

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('admin', 'employee')),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  username TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_role ON public.push_tokens(recipient_role);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens NO FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_tokens_app_all ON public.push_tokens;
CREATE POLICY push_tokens_app_all ON public.push_tokens
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.push_tokens TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
