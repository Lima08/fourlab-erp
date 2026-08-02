-- =========================================================================
-- Fourlab ERP — baseline schema (greenfield)
-- Projeto: fihthjhpigwbaievvcay
--
-- Auth: Supabase Auth + public.profiles (sem RBAC)
-- RLS: authenticated = CRUD total; anon = sem acesso
-- =========================================================================

-- =========================================================================
-- enums
-- =========================================================================

CREATE TYPE public.customer_type AS ENUM ('pf', 'pj');
CREATE TYPE public.material_kind AS ENUM ('filament', 'resin');
CREATE TYPE public.order_status AS ENUM (
  'quote',
  'approved',
  'in_production',
  'completed',
  'delivered',
  'canceled'
);
CREATE TYPE public.printer_status AS ENUM ('idle', 'in_use', 'maintenance');
CREATE TYPE public.production_status AS ENUM (
  'waiting',
  'in_production',
  'assembly',
  'completed',
  'scrap'
);
CREATE TYPE public.stock_movement_type AS ENUM ('in', 'out', 'adjustment');
CREATE TYPE public.financial_category_type AS ENUM ('revenue', 'expense');
CREATE TYPE public.financial_title_kind AS ENUM ('receivable', 'payable');
CREATE TYPE public.financial_installment_status AS ENUM (
  'pending',
  'paid',
  'overdue',
  'canceled'
);

-- =========================================================================
-- functions
-- =========================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Aplica movimento de estoque ao saldo do material ou insumo geral.
-- in/out: quantity > 0; adjustment: quantity é o delta (pode ser negativo).
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  delta numeric(12, 4);
BEGIN
  IF (NEW.material_id IS NULL) = (NEW.general_supply_id IS NULL) THEN
    RAISE EXCEPTION 'stock_movements requires exactly one of material_id or general_supply_id';
  END IF;

  IF NEW.quantity IS NULL OR NEW.quantity = 0 THEN
    RAISE EXCEPTION 'stock_movements.quantity must be non-zero';
  END IF;

  IF NEW.movement_type = 'adjustment' THEN
    delta := NEW.quantity;
  ELSIF NEW.movement_type = 'in' THEN
    IF NEW.quantity < 0 THEN
      RAISE EXCEPTION 'stock_movements.quantity must be positive for type in';
    END IF;
    delta := NEW.quantity;
  ELSIF NEW.movement_type = 'out' THEN
    IF NEW.quantity < 0 THEN
      RAISE EXCEPTION 'stock_movements.quantity must be positive for type out';
    END IF;
    delta := -NEW.quantity;
  ELSE
    RAISE EXCEPTION 'unknown stock_movement_type: %', NEW.movement_type;
  END IF;

  IF NEW.material_id IS NOT NULL THEN
    UPDATE public.materials
    SET
      current_stock_g = current_stock_g + delta,
      updated_at = now()
    WHERE id = NEW.material_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'material % not found', NEW.material_id;
    END IF;
  ELSE
    UPDATE public.general_supplies
    SET
      current_stock = current_stock + delta,
      updated_at = now()
    WHERE id = NEW.general_supply_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'general_supply % not found', NEW.general_supply_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- =========================================================================
-- tables
-- =========================================================================

CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text NOT NULL,
  email         text NOT NULL,
  phone         text,
  is_active     boolean NOT NULL DEFAULT true,
  activated_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_type public.customer_type NOT NULL,
  document      text,
  full_name     text NOT NULL,
  trade_name    text,
  email         text,
  phone         text,
  zip_code      text,
  street        text,
  number        text,
  complement    text,
  neighborhood  text,
  city          text,
  state         varchar(2),
  instagram     text,
  facebook      text,
  linkedin      text,
  website       text,
  notes         text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX customers_document_unique
  ON public.customers (document)
  WHERE document IS NOT NULL;

CREATE TABLE public.materials (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  brand           text,
  kind            public.material_kind NOT NULL,
  type            text,
  color           text,
  current_stock_g numeric(12, 4) NOT NULL DEFAULT 0,
  min_stock_g     numeric(12, 4) NOT NULL DEFAULT 0,
  cost_per_g      numeric(12, 6) NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.general_supplies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  unit_of_measure  text NOT NULL DEFAULT 'unit',
  current_stock    numeric(12, 4) NOT NULL DEFAULT 0,
  min_stock        numeric(12, 4) NOT NULL DEFAULT 0,
  unit_price       numeric(12, 4) NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stock_movements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id       uuid REFERENCES public.materials(id) ON DELETE RESTRICT,
  general_supply_id uuid REFERENCES public.general_supplies(id) ON DELETE RESTRICT,
  movement_type     public.stock_movement_type NOT NULL,
  quantity          numeric(12, 4) NOT NULL,
  notes             text,
  created_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stock_movements_target_xor CHECK (
    (material_id IS NOT NULL AND general_supply_id IS NULL)
    OR (material_id IS NULL AND general_supply_id IS NOT NULL)
  ),
  CONSTRAINT stock_movements_quantity_nonzero CHECK (quantity <> 0)
);

CREATE TABLE public.products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku              text NOT NULL,
  name             text NOT NULL,
  stl_storage_path text,
  photo_storage_path text,
  weight_g         numeric(12, 4) NOT NULL DEFAULT 0,
  estimated_time_min integer NOT NULL DEFAULT 0,
  calculated_cost  numeric(12, 4) NOT NULL DEFAULT 0,
  selling_price    numeric(12, 4) NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_sku_unique UNIQUE (sku)
);

CREATE TABLE public.orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  status         public.order_status NOT NULL DEFAULT 'quote',
  total_amount   numeric(12, 4) NOT NULL DEFAULT 0,
  deadline_days  integer,
  issue_date     timestamptz NOT NULL DEFAULT now(),
  approval_date  timestamptz,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  material_id uuid REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity    integer NOT NULL,
  unit_price  numeric(12, 4) NOT NULL,
  subtotal    numeric(12, 4) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_items_quantity_positive CHECK (quantity > 0)
);

CREATE TABLE public.printers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  status             public.printer_status NOT NULL DEFAULT 'idle',
  total_usage_hours  numeric(12, 4) NOT NULL DEFAULT 0,
  maintenance_alert  boolean NOT NULL DEFAULT false,
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.production_orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id       uuid NOT NULL REFERENCES public.order_items(id) ON DELETE RESTRICT,
  printer_id          uuid REFERENCES public.printers(id) ON DELETE SET NULL,
  operator_id         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status              public.production_status NOT NULL DEFAULT 'waiting',
  estimated_time_min  integer NOT NULL DEFAULT 0,
  actual_time_min     integer,
  production_start    timestamptz,
  production_end      timestamptz,
  failure_reason      text,
  quality_photo_path  text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.financial_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  type       public.financial_category_type NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT financial_categories_name_type_unique UNIQUE (name, type)
);

CREATE TABLE public.financial_titles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.financial_categories(id) ON DELETE RESTRICT,
  order_id    uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  kind        public.financial_title_kind NOT NULL,
  description text NOT NULL,
  total_amount numeric(12, 4) NOT NULL,
  issue_date  date NOT NULL DEFAULT (CURRENT_DATE),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT financial_titles_total_positive CHECK (total_amount > 0)
);

CREATE TABLE public.financial_installments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id       uuid NOT NULL REFERENCES public.financial_titles(id) ON DELETE CASCADE,
  installment_no integer NOT NULL,
  amount         numeric(12, 4) NOT NULL,
  due_date       date NOT NULL,
  payment_date   date,
  status         public.financial_installment_status NOT NULL DEFAULT 'pending',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT financial_installments_amount_positive CHECK (amount > 0),
  CONSTRAINT financial_installments_no_positive CHECK (installment_no > 0),
  CONSTRAINT financial_installments_title_no_unique UNIQUE (title_id, installment_no)
);

-- =========================================================================
-- indexes
-- =========================================================================

CREATE INDEX profiles_email_idx ON public.profiles USING btree (email);
CREATE INDEX profiles_is_active_idx ON public.profiles USING btree (is_active);

CREATE INDEX customers_full_name_idx ON public.customers USING btree (full_name);
CREATE INDEX customers_is_active_idx ON public.customers USING btree (is_active);

CREATE INDEX materials_kind_idx ON public.materials USING btree (kind);
CREATE INDEX materials_is_active_idx ON public.materials USING btree (is_active);

CREATE INDEX general_supplies_is_active_idx ON public.general_supplies USING btree (is_active);

CREATE INDEX stock_movements_material_id_idx ON public.stock_movements USING btree (material_id);
CREATE INDEX stock_movements_general_supply_id_idx ON public.stock_movements USING btree (general_supply_id);
CREATE INDEX stock_movements_created_at_idx ON public.stock_movements USING btree (created_at);

CREATE INDEX products_is_active_idx ON public.products USING btree (is_active);

CREATE INDEX orders_customer_id_idx ON public.orders USING btree (customer_id);
CREATE INDEX orders_status_idx ON public.orders USING btree (status);
CREATE INDEX orders_issue_date_idx ON public.orders USING btree (issue_date);

CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);
CREATE INDEX order_items_product_id_idx ON public.order_items USING btree (product_id);

CREATE INDEX printers_status_idx ON public.printers USING btree (status);

CREATE INDEX production_orders_order_item_id_idx ON public.production_orders USING btree (order_item_id);
CREATE INDEX production_orders_printer_id_idx ON public.production_orders USING btree (printer_id);
CREATE INDEX production_orders_status_idx ON public.production_orders USING btree (status);

CREATE INDEX financial_titles_category_id_idx ON public.financial_titles USING btree (category_id);
CREATE INDEX financial_titles_order_id_idx ON public.financial_titles USING btree (order_id);
CREATE INDEX financial_titles_customer_id_idx ON public.financial_titles USING btree (customer_id);
CREATE INDEX financial_titles_kind_idx ON public.financial_titles USING btree (kind);

CREATE INDEX financial_installments_title_id_idx ON public.financial_installments USING btree (title_id);
CREATE INDEX financial_installments_due_date_idx ON public.financial_installments USING btree (due_date);
CREATE INDEX financial_installments_status_idx ON public.financial_installments USING btree (status);

-- =========================================================================
-- triggers
-- =========================================================================

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER general_supplies_updated_at
  BEFORE UPDATE ON public.general_supplies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER printers_updated_at
  BEFORE UPDATE ON public.printers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER production_orders_updated_at
  BEFORE UPDATE ON public.production_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER financial_categories_updated_at
  BEFORE UPDATE ON public.financial_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER financial_titles_updated_at
  BEFORE UPDATE ON public.financial_titles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER financial_installments_updated_at
  BEFORE UPDATE ON public.financial_installments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER stock_movements_apply
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

-- =========================================================================
-- RLS
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_all_profiles ON public.profiles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_customers ON public.customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_materials ON public.materials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_general_supplies ON public.general_supplies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_stock_movements ON public.stock_movements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_products ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_orders ON public.orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_order_items ON public.order_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_printers ON public.printers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_production_orders ON public.production_orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_financial_categories ON public.financial_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_financial_titles ON public.financial_titles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_financial_installments ON public.financial_installments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================================
-- storage
-- =========================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-files', 'product-files', false),
  ('quality-photos', 'quality-photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY authenticated_all_product_files ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'product-files')
  WITH CHECK (bucket_id = 'product-files');

CREATE POLICY authenticated_all_quality_photos ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'quality-photos')
  WITH CHECK (bucket_id = 'quality-photos');

-- =========================================================================
-- grants
-- =========================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
