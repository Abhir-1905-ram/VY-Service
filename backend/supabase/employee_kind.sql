-- Split employees into sales and normal employee logins.
-- Run this once in Supabase Dashboard → SQL Editor.

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS employee_kind TEXT NOT NULL DEFAULT 'employee';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employees_employee_kind_check'
  ) THEN
    ALTER TABLE public.employees
      ADD CONSTRAINT employees_employee_kind_check
      CHECK (employee_kind IN ('sales', 'employee'));
  END IF;
END $$;

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
    'can_remove_repairs', COALESCE(emp.can_remove_repairs, false),
    'employee_kind', COALESCE(emp.employee_kind, 'employee')
  );
END;
$$;

DROP FUNCTION IF EXISTS public.signup_employee(text, text);

CREATE OR REPLACE FUNCTION public.signup_employee(p_username text, p_password text, p_kind text DEFAULT 'employee')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  emp public.employees%ROWTYPE;
  kind text;
BEGIN
  IF p_username IS NULL OR length(trim(p_username)) = 0 OR p_password IS NULL OR length(p_password) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Username and password required');
  END IF;

  kind := CASE WHEN lower(trim(COALESCE(p_kind, ''))) = 'sales' THEN 'sales' ELSE 'employee' END;

  IF EXISTS (SELECT 1 FROM public.employees WHERE username = trim(p_username)) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Username already exists');
  END IF;

  INSERT INTO public.employees (username, password, is_approved, employee_kind, allowed_cards, can_remove_repairs)
  VALUES (
    trim(p_username),
    p_password,
    false,
    kind,
    CASE WHEN kind = 'sales' THEN ARRAY['attendance']::text[] ELSE ARRAY['repair-service', 'repair-list', 'attendance']::text[] END,
    false
  )
  RETURNING * INTO emp;

  RETURN jsonb_build_object(
    'ok', true,
    'id', emp.id,
    'username', emp.username,
    'is_approved', emp.is_approved,
    'employee_kind', emp.employee_kind
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Username already exists');
END;
$$;

REVOKE ALL ON FUNCTION public.login_employee(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_employee(text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.signup_employee(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.signup_employee(text, text, text) TO anon, authenticated;

UPDATE public.employees
SET allowed_cards = ARRAY['attendance']::text[],
    can_remove_repairs = false
WHERE employee_kind = 'sales';

NOTIFY pgrst, 'reload schema';
