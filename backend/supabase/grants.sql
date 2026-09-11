-- Fix Security Advisor:
--   rls_disabled_in_public  (employees, repairs, attendance)
--   sensitive_columns_exposed (employees.password)
--
-- Run ALL of this in Supabase → SQL Editor → Run
-- The publishable key can still read/write app data; passwords are no longer selectable.

-- 1) RLS on
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.employees NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.repairs NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.attendance NO FORCE ROW LEVEL SECURITY;

-- 2) Replace policies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('employees', 'repairs', 'attendance')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY employees_app_all ON public.employees
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY repairs_app_all ON public.repairs
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY attendance_app_all ON public.attendance
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- 3) Table privileges (password is writable, not readable, via the Data API)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

REVOKE ALL ON TABLE public.employees FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, username, is_approved, allowed_cards, can_remove_repairs, created_at, updated_at
) ON public.employees TO anon, authenticated;
GRANT INSERT (
  username, password, is_approved, allowed_cards, can_remove_repairs
) ON public.employees TO anon, authenticated;
GRANT UPDATE (
  username, password, is_approved, allowed_cards, can_remove_repairs
) ON public.employees TO anon, authenticated;
GRANT DELETE ON public.employees TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.repairs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.attendance TO anon, authenticated;

-- 4) Login checks the password on the server so the column stays hidden
CREATE OR REPLACE FUNCTION public.login_employee(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  emp public.employees%ROWTYPE;
BEGIN
  SELECT * INTO emp
  FROM public.employees
  WHERE username = p_username
  LIMIT 1;

  IF NOT FOUND OR emp.password IS DISTINCT FROM p_password THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Invalid credentials');
  END IF;

  IF NOT COALESCE(emp.is_approved, false) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Admin has not approved your account yet.');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'id', emp.id,
    'username', emp.username,
    'is_approved', emp.is_approved,
    'allowed_cards', to_jsonb(COALESCE(emp.allowed_cards, ARRAY[]::text[])),
    'can_remove_repairs', COALESCE(emp.can_remove_repairs, false)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.login_employee(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_employee(text, text) TO anon, authenticated;

-- 5) Verify: rls_on must be true; password must not be selectable by anon
SELECT c.relname AS table_name, c.relrowsecurity AS rls_on
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('employees', 'repairs', 'attendance')
ORDER BY 1;
