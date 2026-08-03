-- =========================================================================
-- Flatten financial model: title = one obligation (no installments table)
-- Also rewrites sales RPCs that depended on financial_installments.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Schema: rename enum, extend titles, drop installments
-- -------------------------------------------------------------------------

ALTER TYPE public.financial_installment_status RENAME TO financial_title_status;

ALTER TABLE public.financial_titles
  ADD COLUMN due_date date,
  ADD COLUMN payment_date date,
  ADD COLUMN status public.financial_title_status NOT NULL DEFAULT 'pending',
  ADD COLUMN payment_method public.payment_method,
  ADD COLUMN installment_no integer;

-- Drop sale_activities → installments FK before remapping UUIDs to titles.
ALTER TABLE public.sale_activities
  DROP CONSTRAINT IF EXISTS sale_activities_installment_id_fkey;

-- Best-effort backfill: first installment updates parent title; extras become new titles.
-- Also retarget sale_activities.installment_id → the title that now represents that obligation.
DO $$
DECLARE
  r record;
  v_parent public.financial_titles%ROWTYPE;
  v_touched boolean;
  v_title_id uuid;
BEGIN
  FOR r IN
    SELECT
      fi.id AS installment_id,
      fi.title_id,
      fi.due_date,
      fi.payment_date,
      fi.status,
      fi.payment_method,
      fi.installment_no,
      fi.amount
    FROM public.financial_installments fi
    ORDER BY fi.title_id, fi.installment_no
  LOOP
    SELECT * INTO v_parent FROM public.financial_titles WHERE id = r.title_id;

    SELECT (due_date IS NOT NULL) INTO v_touched
    FROM public.financial_titles
    WHERE id = r.title_id;

    IF NOT COALESCE(v_touched, false) THEN
      UPDATE public.financial_titles t
      SET
        due_date = r.due_date,
        payment_date = r.payment_date,
        status = r.status,
        payment_method = r.payment_method,
        installment_no = r.installment_no,
        total_amount = r.amount
      WHERE t.id = r.title_id;
      v_title_id := r.title_id;
    ELSE
      INSERT INTO public.financial_titles (
        category_id, order_id, customer_id, kind, description, total_amount,
        issue_date, notes, due_date, payment_date, status, payment_method, installment_no
      ) VALUES (
        v_parent.category_id,
        v_parent.order_id,
        v_parent.customer_id,
        v_parent.kind,
        format('%s — Parcela %s', v_parent.description, r.installment_no),
        r.amount,
        v_parent.issue_date,
        v_parent.notes,
        r.due_date,
        r.payment_date,
        r.status,
        r.payment_method,
        r.installment_no
      )
      RETURNING id INTO v_title_id;
    END IF;

    UPDATE public.sale_activities
    SET installment_id = v_title_id
    WHERE installment_id = r.installment_id;
  END LOOP;
END;
$$;

UPDATE public.financial_titles
SET due_date = COALESCE(due_date, issue_date, CURRENT_DATE)
WHERE due_date IS NULL;

ALTER TABLE public.financial_titles
  ALTER COLUMN due_date SET NOT NULL,
  ALTER COLUMN due_date SET DEFAULT CURRENT_DATE;

ALTER TABLE public.financial_titles
  ADD CONSTRAINT financial_titles_paid_requires_payment_date
    CHECK (status <> 'paid' OR payment_date IS NOT NULL);

ALTER TABLE public.financial_titles
  ADD CONSTRAINT financial_titles_installment_no_positive
    CHECK (installment_no IS NULL OR installment_no > 0);

-- Orphan activity refs (installment already gone / unmatched) → NULL before FK.
UPDATE public.sale_activities sa
SET installment_id = NULL
WHERE sa.installment_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.financial_titles ft WHERE ft.id = sa.installment_id
  );

ALTER TABLE public.sale_activities
  RENAME COLUMN installment_id TO title_id;

ALTER TABLE public.sale_activities
  ADD CONSTRAINT sale_activities_title_id_fkey
    FOREIGN KEY (title_id) REFERENCES public.financial_titles(id) ON DELETE SET NULL;

DROP TABLE public.financial_installments CASCADE;

CREATE INDEX financial_titles_status_idx ON public.financial_titles USING btree (status);
CREATE INDEX financial_titles_due_date_idx ON public.financial_titles USING btree (due_date);
CREATE INDEX financial_titles_payment_date_idx ON public.financial_titles USING btree (payment_date);
CREATE INDEX financial_titles_kind_status_payment_date_idx
  ON public.financial_titles USING btree (kind, status, payment_date);

-- -------------------------------------------------------------------------
-- 2. Sales RPC rewrite — one title per obligation
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._sales_materialize_receivable(p_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_category_id uuid;
  v_title_id uuid;
  v_existing uuid;
  v_count integer;
  v_base numeric(12, 4);
  v_remainder numeric(12, 4);
  v_due date;
  v_status public.financial_title_status;
  v_paid_date date;
  i integer;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found' USING ERRCODE = 'P0001';
  END IF;

  SELECT id INTO v_existing
  FROM public.financial_titles
  WHERE order_id = p_order_id
  LIMIT 1;

  -- Idempotent: already materialized
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  IF v_order.payment_plan_type IS NULL THEN
    RAISE EXCEPTION 'payment_plan_required' USING ERRCODE = 'P0001';
  END IF;

  IF v_order.total_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_total_amount' USING ERRCODE = 'P0001';
  END IF;

  v_category_id := public._sales_resolve_vendas_category();

  IF v_order.payment_plan_type = 'installments' THEN
    v_count := COALESCE(v_order.installment_count, 1);
    IF v_count < 1 OR v_count > 12 THEN
      RAISE EXCEPTION 'invalid_installment_count' USING ERRCODE = 'P0001';
    END IF;
    IF v_order.first_due_date IS NULL THEN
      RAISE EXCEPTION 'first_due_date_required' USING ERRCODE = 'P0001';
    END IF;

    v_base := trunc((v_order.total_amount / v_count) * 10000) / 10000;
    v_remainder := v_order.total_amount - (v_base * (v_count - 1));
    v_title_id := NULL;

    FOR i IN 1..v_count LOOP
      v_due := (v_order.first_due_date + ((i - 1) || ' months')::interval)::date;
      INSERT INTO public.financial_titles (
        category_id, order_id, customer_id, kind, description, total_amount,
        issue_date, due_date, payment_date, status, payment_method, installment_no
      ) VALUES (
        v_category_id,
        v_order.id,
        v_order.customer_id,
        'receivable',
        format(
          '%s — Parcela %s/%s',
          COALESCE(v_order.description, 'Venda'),
          i,
          v_count
        ),
        CASE WHEN i = v_count THEN v_remainder ELSE v_base END,
        (v_order.issue_date AT TIME ZONE 'UTC')::date,
        v_due,
        NULL,
        'pending',
        v_order.payment_method,
        i
      )
      RETURNING id INTO v_title_id;
    END LOOP;

    RETURN v_title_id;
  END IF;

  v_due := COALESCE(
    v_order.first_due_date,
    (v_order.issue_date AT TIME ZONE 'UTC')::date
  );
  IF v_order.payment_plan_type = 'cash_paid' THEN
    v_status := 'paid';
    v_paid_date := v_due;
  ELSE
    v_status := 'pending';
    v_paid_date := NULL;
  END IF;

  INSERT INTO public.financial_titles (
    category_id, order_id, customer_id, kind, description, total_amount,
    issue_date, due_date, payment_date, status, payment_method, installment_no
  ) VALUES (
    v_category_id,
    v_order.id,
    v_order.customer_id,
    'receivable',
    COALESCE(v_order.description, 'Venda'),
    v_order.total_amount,
    (v_order.issue_date AT TIME ZONE 'UTC')::date,
    v_due,
    v_paid_date,
    v_status,
    v_order.payment_method,
    1
  )
  RETURNING id INTO v_title_id;

  RETURN v_title_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_sale(payload jsonb)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_sale_kind public.sale_kind;
  v_plan public.payment_plan_type;
  v_order public.orders;
  v_status public.order_status;
  v_user uuid := auth.uid();
BEGIN
  v_sale_kind := (payload->>'sale_kind')::public.sale_kind;
  v_plan := (payload->>'payment_plan_type')::public.payment_plan_type;

  IF v_sale_kind = 'direct' THEN
    v_status := 'approved';
  ELSE
    v_status := 'quote';
  END IF;

  IF (payload->>'total_amount')::numeric <= 0 THEN
    RAISE EXCEPTION 'invalid_total_amount' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.orders (
    customer_id,
    status,
    total_amount,
    issue_date,
    approval_date,
    notes,
    sale_kind,
    payment_plan_type,
    payment_method,
    installment_count,
    first_due_date,
    description
  ) VALUES (
    (payload->>'customer_id')::uuid,
    v_status,
    (payload->>'total_amount')::numeric,
    COALESCE((payload->>'issue_date')::timestamptz, now()),
    CASE WHEN v_status = 'approved' THEN now() ELSE NULL END,
    payload->>'notes',
    v_sale_kind,
    v_plan,
    NULLIF(payload->>'payment_method', '')::public.payment_method,
    NULLIF(payload->>'installment_count', '')::integer,
    NULLIF(payload->>'first_due_date', '')::date,
    NULLIF(payload->>'description', '')
  )
  RETURNING * INTO v_order;

  IF v_sale_kind = 'direct' THEN
    PERFORM public._sales_materialize_receivable(v_order.id);
  END IF;

  INSERT INTO public.sale_activities (
    order_id, activity_type, from_status, to_status, comment, created_by
  ) VALUES (
    v_order.id,
    'order_status_changed',
    NULL,
    v_order.status::text,
    'Venda criada',
    v_user
  );

  IF v_sale_kind = 'direct' AND v_plan = 'cash_paid' THEN
    INSERT INTO public.sale_activities (
      order_id,
      title_id,
      activity_type,
      from_status,
      to_status,
      comment,
      created_by
    )
    SELECT
      v_order.id,
      ft.id,
      'installment_paid',
      'pending',
      'paid',
      'Pagamento à vista no lançamento',
      v_user
    FROM public.financial_titles ft
    WHERE ft.order_id = v_order.id
    ORDER BY ft.installment_no NULLS LAST, ft.created_at
    LIMIT 1;
  END IF;

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_order_status(
  p_order_id uuid,
  p_to_status public.order_status,
  p_comment text DEFAULT NULL,
  p_attachment_path text DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_order public.orders;
  v_allowed public.order_status[];
  v_user uuid := auth.uid();
  v_from public.order_status;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found' USING ERRCODE = 'P0001';
  END IF;

  v_from := v_order.status;

  IF v_from = 'quote' AND p_to_status = 'approved' THEN
    RETURN public.approve_order(p_order_id);
  END IF;

  v_allowed := public._sales_allowed_transitions(v_order.sale_kind, v_from);
  IF NOT (p_to_status = ANY (v_allowed)) THEN
    RAISE EXCEPTION 'invalid_transition' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.orders
  SET status = p_to_status
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  IF p_to_status = 'canceled' THEN
    UPDATE public.financial_titles
    SET status = 'canceled'
    WHERE order_id = p_order_id
      AND status = 'pending';

    INSERT INTO public.sale_activities (
      order_id, activity_type, from_status, to_status, comment, attachment_path, created_by
    ) VALUES (
      p_order_id,
      'order_canceled',
      v_from::text,
      'canceled',
      p_comment,
      p_attachment_path,
      v_user
    );
  ELSE
    INSERT INTO public.sale_activities (
      order_id, activity_type, from_status, to_status, comment, attachment_path, created_by
    ) VALUES (
      p_order_id,
      'order_status_changed',
      v_from::text,
      p_to_status::text,
      p_comment,
      p_attachment_path,
      v_user
    );
  END IF;

  RETURN v_order;
END;
$$;

DROP FUNCTION IF EXISTS public.mark_installment_paid(uuid, date, text, public.payment_method, text);
DROP FUNCTION IF EXISTS public.reverse_installment(uuid, text);

CREATE OR REPLACE FUNCTION public.mark_title_paid(
  p_title_id uuid,
  p_payment_date date DEFAULT CURRENT_DATE,
  p_comment text DEFAULT NULL,
  p_payment_method public.payment_method DEFAULT NULL,
  p_attachment_path text DEFAULT NULL
)
RETURNS public.financial_titles
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_title public.financial_titles;
  v_order_id uuid;
  v_user uuid := auth.uid();
BEGIN
  SELECT ft.* INTO v_title
  FROM public.financial_titles ft
  WHERE ft.id = p_title_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'title_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF v_title.status = 'canceled' THEN
    RAISE EXCEPTION 'title_canceled' USING ERRCODE = 'P0001';
  END IF;

  IF v_title.status = 'paid' THEN
    RETURN v_title;
  END IF;

  UPDATE public.financial_titles
  SET
    status = 'paid',
    payment_date = COALESCE(p_payment_date, CURRENT_DATE),
    payment_method = COALESCE(p_payment_method, payment_method)
  WHERE id = p_title_id
  RETURNING * INTO v_title;

  v_order_id := v_title.order_id;

  INSERT INTO public.sale_activities (
    order_id, title_id, activity_type, from_status, to_status,
    comment, attachment_path, created_by
  ) VALUES (
    v_order_id,
    v_title.id,
    'installment_paid',
    'pending',
    'paid',
    p_comment,
    p_attachment_path,
    v_user
  );

  RETURN v_title;
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_title_payment(
  p_title_id uuid,
  p_comment text
)
RETURNS public.financial_titles
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_title public.financial_titles;
  v_order_id uuid;
  v_user uuid := auth.uid();
BEGIN
  IF p_comment IS NULL OR btrim(p_comment) = '' THEN
    RAISE EXCEPTION 'comment_required' USING ERRCODE = 'P0001';
  END IF;

  SELECT ft.* INTO v_title
  FROM public.financial_titles ft
  WHERE ft.id = p_title_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'title_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF v_title.status <> 'paid' THEN
    RAISE EXCEPTION 'title_not_paid' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.financial_titles
  SET status = 'pending', payment_date = NULL
  WHERE id = p_title_id
  RETURNING * INTO v_title;

  v_order_id := v_title.order_id;

  INSERT INTO public.sale_activities (
    order_id, title_id, activity_type, from_status, to_status,
    comment, created_by
  ) VALUES (
    v_order_id,
    v_title.id,
    'installment_reversed',
    'paid',
    'pending',
    p_comment,
    v_user
  );

  RETURN v_title;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_title_paid(uuid, date, text, public.payment_method, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_title_payment(uuid, text) TO authenticated;

-- -------------------------------------------------------------------------
-- 3. Consistency helpers (dashboard + sales)
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._orders_ensure_simple_receivable(p_order public.orders)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_category_id uuid;
  v_due date;
BEGIN
  IF EXISTS (SELECT 1 FROM public.financial_titles WHERE order_id = p_order.id) THEN
    RETURN;
  END IF;

  -- Prefer sales materialize when payment plan is present
  IF p_order.payment_plan_type IS NOT NULL THEN
    PERFORM public._sales_materialize_receivable(p_order.id);
    RETURN;
  END IF;

  v_category_id := public._sales_resolve_vendas_category();
  v_due := COALESCE(
    (p_order.approval_date AT TIME ZONE 'America/Sao_Paulo')::date,
    (now() AT TIME ZONE 'America/Sao_Paulo')::date
  );

  INSERT INTO public.financial_titles (
    category_id, order_id, customer_id, kind, description, total_amount,
    issue_date, due_date, status, installment_no
  ) VALUES (
    v_category_id,
    p_order.id,
    p_order.customer_id,
    'receivable',
    COALESCE(p_order.description, 'Venda'),
    GREATEST(p_order.total_amount, 0.0001),
    COALESCE((p_order.issue_date AT TIME ZONE 'UTC')::date, CURRENT_DATE),
    v_due,
    'pending',
    1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.orders_financial_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  -- Set approval_date when entering approved
  IF NEW.status = 'approved'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved')
     AND NEW.approval_date IS NULL THEN
    NEW.approval_date := now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.orders_financial_consistency_after()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_pending_count integer;
  v_single boolean;
BEGIN
  IF NEW.status = 'approved'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public._orders_ensure_simple_receivable(NEW);
  END IF;

  IF NEW.status = 'canceled'
     AND (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'canceled') THEN
    UPDATE public.financial_titles
    SET status = 'canceled'
    WHERE order_id = NEW.id
      AND status = 'pending';
  END IF;

  -- Sync pending title amounts when order total changes (single-title only)
  IF TG_OP = 'UPDATE'
     AND NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
    SELECT count(*) INTO v_pending_count
    FROM public.financial_titles
    WHERE order_id = NEW.id AND status = 'pending';

    SELECT (count(*) = 1) INTO v_single
    FROM public.financial_titles
    WHERE order_id = NEW.id;

    IF v_single AND v_pending_count = 1 THEN
      UPDATE public.financial_titles
      SET total_amount = NEW.total_amount
      WHERE order_id = NEW.id
        AND status = 'pending';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_financial_consistency_before ON public.orders;
CREATE TRIGGER orders_financial_consistency_before
  BEFORE INSERT OR UPDATE OF status, total_amount, approval_date
  ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_financial_consistency();

DROP TRIGGER IF EXISTS orders_financial_consistency_after ON public.orders;
CREATE TRIGGER orders_financial_consistency_after
  AFTER INSERT OR UPDATE OF status, total_amount
  ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_financial_consistency_after();
