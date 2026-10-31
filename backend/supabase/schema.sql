-- Run this in Supabase Dashboard → SQL Editor

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  allowed_cards TEXT[] DEFAULT ARRAY['repair-service', 'repair-list', 'attendance'],
  can_remove_repairs BOOLEAN DEFAULT FALSE,
  employee_kind TEXT NOT NULL DEFAULT 'employee' CHECK (employee_kind IN ('sales', 'employee')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repairs
CREATE TABLE IF NOT EXISTS repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  type TEXT NOT NULL,
  brand TEXT DEFAULT '',
  adapter_given BOOLEAN,
  problem TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Not Completed')),
  remark TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  amount NUMERIC,
  expected_amount NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repairs_unique_id ON repairs(unique_id);
CREATE INDEX IF NOT EXISTS idx_repairs_created_at ON repairs(created_at DESC);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT,
  date TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);

-- Sales orders
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  place TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  total_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Delivered')),
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_by_name TEXT DEFAULT '',
  viewed_by_name TEXT DEFAULT '',
  approved_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON sales_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_by ON sales_orders(created_by);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS employees_updated_at ON employees;
CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

DROP TRIGGER IF EXISTS repairs_updated_at ON repairs;
CREATE TRIGGER repairs_updated_at
  BEFORE UPDATE ON repairs
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

DROP TRIGGER IF EXISTS attendance_updated_at ON attendance;
CREATE TRIGGER attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

DROP TRIGGER IF EXISTS sales_orders_updated_at ON sales_orders;
CREATE TRIGGER sales_orders_updated_at
  BEFORE UPDATE ON sales_orders
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

GRANT USAGE ON SCHEMA public TO anon, authenticated;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS employees_app_all ON public.employees;
DROP POLICY IF EXISTS repairs_app_all ON public.repairs;
DROP POLICY IF EXISTS attendance_app_all ON public.attendance;
DROP POLICY IF EXISTS sales_orders_app_all ON public.sales_orders;

CREATE POLICY employees_app_all ON public.employees
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY repairs_app_all ON public.repairs
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY attendance_app_all ON public.attendance
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY sales_orders_app_all ON public.sales_orders
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

REVOKE ALL ON TABLE public.employees FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.employees TO anon, authenticated;
REVOKE SELECT (password) ON public.employees FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.repairs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.attendance TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sales_orders TO anon, authenticated;

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

NOTIFY pgrst, 'reload schema';
