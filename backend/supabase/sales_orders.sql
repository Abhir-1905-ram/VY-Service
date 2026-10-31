-- Sales person orders. Run once in Supabase Dashboard → SQL Editor.

CREATE TABLE IF NOT EXISTS public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  place TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  total_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Delivered')),
  created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_by_name TEXT DEFAULT '',
  viewed_by_name TEXT DEFAULT '',
  approved_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS viewed_by_name TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON public.sales_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_by ON public.sales_orders(created_by);

DROP TRIGGER IF EXISTS sales_orders_updated_at ON public.sales_orders;
CREATE TRIGGER sales_orders_updated_at
  BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders NO FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sales_orders_app_all ON public.sales_orders;
CREATE POLICY sales_orders_app_all ON public.sales_orders
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sales_orders TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
