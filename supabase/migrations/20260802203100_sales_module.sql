-- =========================================================================
-- Sales module — DDL (orders plan fields, timeline, storage)
-- =========================================================================

-- enums
CREATE TYPE public.sale_kind AS ENUM ('direct', 'quote');
CREATE TYPE public.payment_method AS ENUM ('pix', 'cash', 'card', 'transfer');
CREATE TYPE public.payment_plan_type AS ENUM ('cash_paid', 'cash_pending', 'installments');
CREATE TYPE public.sale_activity_type AS ENUM (
  'order_status_changed',
  'installment_paid',
  'installment_reversed',
  'order_canceled',
  'note'
);

-- draft payment plan + sale kind on orders
ALTER TABLE public.orders
  ADD COLUMN sale_kind public.sale_kind NOT NULL DEFAULT 'quote',
  ADD COLUMN payment_plan_type public.payment_plan_type,
  ADD COLUMN payment_method public.payment_method,
  ADD COLUMN installment_count integer,
  ADD COLUMN first_due_date date,
  ADD COLUMN description text;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_installment_count_range
    CHECK (installment_count IS NULL OR (installment_count BETWEEN 1 AND 12));

ALTER TABLE public.financial_installments
  ADD COLUMN payment_method public.payment_method;

-- timeline
CREATE TABLE public.sale_activities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  installment_id   uuid REFERENCES public.financial_installments(id) ON DELETE SET NULL,
  activity_type    public.sale_activity_type NOT NULL,
  from_status      text,
  to_status        text,
  comment          text,
  attachment_path  text,
  created_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sale_activities_order_id_created_at_idx
  ON public.sale_activities (order_id, created_at DESC);

CREATE INDEX orders_sale_kind_idx ON public.orders USING btree (sale_kind);

ALTER TABLE public.sale_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_all_sale_activities ON public.sale_activities
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_activities TO service_role;

-- storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('sale-attachments', 'sale-attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY authenticated_all_sale_attachments ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'sale-attachments')
  WITH CHECK (bucket_id = 'sale-attachments');
