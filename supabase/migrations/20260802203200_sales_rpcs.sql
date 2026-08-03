-- =========================================================================
-- Sales module — mutation RPCs
-- =========================================================================

CREATE OR REPLACE FUNCTION public._sales_resolve_vendas_category()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id
  FROM public.financial_categories
  WHERE name = 'Vendas' AND type = 'revenue' AND is_active = true
  LIMIT 1;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'financial_category_vendas_missing'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public._sales_allowed_transitions(
  p_sale_kind public.sale_kind,
  p_from public.order_status
)
RETURNS public.order_status[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  IF p_sale_kind = 'direct' THEN
    RETURN CASE p_from
      WHEN 'approved' THEN ARRAY['completed', 'delivered', 'canceled']::public.order_status[]
      WHEN 'completed' THEN ARRAY['delivered', 'canceled']::public.order_status[]
      WHEN 'delivered' THEN ARRAY['canceled']::public.order_status[]
      ELSE ARRAY[]::public.order_status[]
    END;
  END IF;

  RETURN CASE p_from
    WHEN 'quote' THEN ARRAY['approved', 'canceled']::public.order_status[]
    WHEN 'approved' THEN ARRAY['in_production', 'canceled']::public.order_status[]
    WHEN 'in_production' THEN ARRAY['completed', 'canceled']::public.order_status[]
    WHEN 'completed' THEN ARRAY['delivered', 'canceled']::public.order_status[]
    WHEN 'delivered' THEN ARRAY['canceled']::public.order_status[]
    ELSE ARRAY[]::public.order_status[]
  END;
END;
$$;

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
  v_status public.financial_installment_status;
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

  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'receivable_already_exists' USING ERRCODE = 'P0001';
  END IF;

  IF v_order.payment_plan_type IS NULL THEN
    RAISE EXCEPTION 'payment_plan_required' USING ERRCODE = 'P0001';
  END IF;

  IF v_order.total_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_total_amount' USING ERRCODE = 'P0001';
  END IF;

  v_category_id := public._sales_resolve_vendas_category();

  INSERT INTO public.financial_titles (
    category_id, order_id, customer_id, kind, description, total_amount, issue_date
  ) VALUES (
    v_category_id,
    v_order.id,
    v_order.customer_id,
    'receivable',
    COALESCE(v_order.description, 'Venda'),
    v_order.total_amount,
    (v_order.issue_date AT TIME ZONE 'UTC')::date
  )
  RETURNING id INTO v_title_id;

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

    FOR i IN 1..v_count LOOP
      v_due := (v_order.first_due_date + ((i - 1) || ' months')::interval)::date;
      INSERT INTO public.financial_installments (
        title_id, installment_no, amount, due_date, status, payment_method
      ) VALUES (
        v_title_id,
        i,
        CASE WHEN i = v_count THEN v_remainder ELSE v_base END,
        v_due,
        'pending',
        v_order.payment_method
      );
    END LOOP;
  ELSE
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

    INSERT INTO public.financial_installments (
      title_id, installment_no, amount, due_date, payment_date, status, payment_method
    ) VALUES (
      v_title_id, 1, v_order.total_amount, v_due, v_paid_date, v_status, v_order.payment_method
    );
  END IF;

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
      installment_id,
      activity_type,
      from_status,
      to_status,
      comment,
      created_by
    )
    SELECT
      v_order.id,
      fi.id,
      'installment_paid',
      'pending',
      'paid',
      'Pagamento à vista no lançamento',
      v_user
    FROM public.financial_titles ft
    JOIN public.financial_installments fi ON fi.title_id = ft.id
    WHERE ft.order_id = v_order.id
    LIMIT 1;
  END IF;

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_order(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_order public.orders;
  v_user uuid := auth.uid();
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF v_order.sale_kind <> 'quote' OR v_order.status <> 'quote' THEN
    RAISE EXCEPTION 'invalid_transition' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.orders
  SET status = 'approved', approval_date = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  PERFORM public._sales_materialize_receivable(v_order.id);

  INSERT INTO public.sale_activities (
    order_id, activity_type, from_status, to_status, comment, created_by
  ) VALUES (
    v_order.id, 'order_status_changed', 'quote', 'approved', 'Orçamento aprovado', v_user
  );

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

  -- approve_order path for quote → approved (materialize)
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
    UPDATE public.financial_installments fi
    SET status = 'canceled'
    FROM public.financial_titles ft
    WHERE fi.title_id = ft.id
      AND ft.order_id = p_order_id
      AND fi.status = 'pending';

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

CREATE OR REPLACE FUNCTION public.mark_installment_paid(
  p_installment_id uuid,
  p_payment_date date DEFAULT CURRENT_DATE,
  p_comment text DEFAULT NULL,
  p_payment_method public.payment_method DEFAULT NULL,
  p_attachment_path text DEFAULT NULL
)
RETURNS public.financial_installments
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_inst public.financial_installments;
  v_order_id uuid;
  v_user uuid := auth.uid();
BEGIN
  SELECT fi.* INTO v_inst
  FROM public.financial_installments fi
  WHERE fi.id = p_installment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'installment_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF v_inst.status = 'canceled' THEN
    RAISE EXCEPTION 'installment_canceled' USING ERRCODE = 'P0001';
  END IF;

  IF v_inst.status = 'paid' THEN
    RETURN v_inst;
  END IF;

  UPDATE public.financial_installments
  SET
    status = 'paid',
    payment_date = COALESCE(p_payment_date, CURRENT_DATE),
    payment_method = COALESCE(p_payment_method, payment_method)
  WHERE id = p_installment_id
  RETURNING * INTO v_inst;

  SELECT ft.order_id INTO v_order_id
  FROM public.financial_titles ft
  WHERE ft.id = v_inst.title_id;

  INSERT INTO public.sale_activities (
    order_id, installment_id, activity_type, from_status, to_status,
    comment, attachment_path, created_by
  ) VALUES (
    v_order_id,
    v_inst.id,
    'installment_paid',
    'pending',
    'paid',
    p_comment,
    p_attachment_path,
    v_user
  );

  RETURN v_inst;
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_installment(
  p_installment_id uuid,
  p_comment text
)
RETURNS public.financial_installments
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_inst public.financial_installments;
  v_order_id uuid;
  v_user uuid := auth.uid();
BEGIN
  IF p_comment IS NULL OR btrim(p_comment) = '' THEN
    RAISE EXCEPTION 'comment_required' USING ERRCODE = 'P0001';
  END IF;

  SELECT fi.* INTO v_inst
  FROM public.financial_installments fi
  WHERE fi.id = p_installment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'installment_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF v_inst.status <> 'paid' THEN
    RAISE EXCEPTION 'installment_not_paid' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.financial_installments
  SET status = 'pending', payment_date = NULL
  WHERE id = p_installment_id
  RETURNING * INTO v_inst;

  SELECT ft.order_id INTO v_order_id
  FROM public.financial_titles ft
  WHERE ft.id = v_inst.title_id;

  INSERT INTO public.sale_activities (
    order_id, installment_id, activity_type, from_status, to_status,
    comment, created_by
  ) VALUES (
    v_order_id,
    v_inst.id,
    'installment_reversed',
    'paid',
    'pending',
    p_comment,
    v_user
  );

  RETURN v_inst;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_sale(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_order_status(uuid, public.order_status, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_installment_paid(uuid, date, text, public.payment_method, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_installment(uuid, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public._sales_materialize_receivable(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._sales_resolve_vendas_category() TO authenticated;
GRANT EXECUTE ON FUNCTION public._sales_allowed_transitions(public.sale_kind, public.order_status) TO authenticated;
