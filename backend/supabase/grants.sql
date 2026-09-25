-- Fix signup "permission denied for table employees" + Security Advisor ERRORS.
-- Run ALL of this in Supabase Dashboard → SQL Editor → Run
-- Then retry Sign Up in the app.

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

-- 3) Table-level privileges (column-only INSERT grants break signup with defaults)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

REVOKE ALL ON TABLE public.employees FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.employees TO anon, authenticated;
-- Hide password from Data API reads (signup/login use RPCs below)
REVOKE SELECT (password) ON public.employees FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.repairs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.attendance TO anon, authenticated;

-- 4) Login RPC (password never leaves the server)
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

-- 5) Signup RPC (avoids client INSERT privilege edge cases)
CREATE OR REPLACE FUNCTION public.signup_employee(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  emp public.employees%ROWTYPE;
BEGIN
  IF p_username IS NULL OR length(trim(p_username)) = 0 OR p_password IS NULL OR length(p_password) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Username and password required');
  END IF;

  IF EXISTS (SELECT 1 FROM public.employees WHERE username = trim(p_username)) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Username already exists');
  END IF;

  INSERT INTO public.employees (username, password, is_approved)
  VALUES (trim(p_username), p_password, false)
  RETURNING * INTO emp;

  RETURN jsonb_build_object(
    'ok', true,
    'id', emp.id,
    'username', emp.username,
    'is_approved', emp.is_approved
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Username already exists');
END;
$$;

REVOKE ALL ON FUNCTION public.login_employee(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_employee(text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.signup_employee(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.signup_employee(text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

-- 6) Verify
SELECT c.relname AS table_name, c.relrowsecurity AS rls_on
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('employees', 'repairs', 'attendance')
ORDER BY 1;

SELECT
  has_table_privilege('anon', 'public.employees', 'INSERT') AS anon_can_insert,
  has_table_privilege('anon', 'public.employees', 'SELECT') AS anon_can_select,
  has_column_privilege('anon', 'public.employees', 'password', 'SELECT') AS anon_can_select_password;
