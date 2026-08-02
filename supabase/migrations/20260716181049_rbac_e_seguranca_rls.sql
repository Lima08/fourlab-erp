-- =========================================================================
-- RBAC e RLS — executado apenas se o schema base já existir.
-- Em fresh install / shadow DB, public.clients é criado por migration posterior;
-- o RBAC consolidado está em 20260721000000_schema_completo_consolidado.sql.
-- =========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'clients'
  ) THEN
    RAISE NOTICE '20260716181049_rbac: skip — public.clients não existe';
    RETURN;
  END IF;

  -- =========================================================================
  -- 1. ESTRUTURA DE PAPÉIS (ROLES) E VÍNCULO DE AUTENTICAÇÃO
  -- =========================================================================

  ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
  ) THEN
    RAISE NOTICE '20260716181049_rbac: skip policies — public.profiles não existe';
    RETURN;
  END IF;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.get_user_role()
    RETURNS text
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $body$
      SELECT role::text FROM public.profiles WHERE id = auth.uid();
    $body$;
  $fn$;

  -- =========================================================================
  -- 2. REMOÇÃO DAS POLÍTICAS ANTIGAS (PERMISSIVAS)
  -- =========================================================================

  EXECUTE 'DROP POLICY IF EXISTS "authenticated_select_clients" ON public.clients';
  EXECUTE 'DROP POLICY IF EXISTS "authenticated_all_clients" ON public.clients';

  EXECUTE 'DROP POLICY IF EXISTS "authenticated_select_projects" ON public.projects';
  EXECUTE 'DROP POLICY IF EXISTS "authenticated_all_projects" ON public.projects';

  EXECUTE 'DROP POLICY IF EXISTS "authenticated_select_locations" ON public.locations';
  EXECUTE 'DROP POLICY IF EXISTS "authenticated_all_locations" ON public.locations';

  EXECUTE 'DROP POLICY IF EXISTS "authenticated_select_items" ON public.items';
  EXECUTE 'DROP POLICY IF EXISTS "authenticated_all_items" ON public.items';

  EXECUTE 'DROP POLICY IF EXISTS "authenticated_select_evidence" ON public.evidence';
  EXECUTE 'DROP POLICY IF EXISTS "authenticated_all_evidence" ON public.evidence';

  -- =========================================================================
  -- 3. NOVAS POLÍTICAS: ADMIN (ACESSO TOTAL CRUD)
  -- =========================================================================

  EXECUTE $policy$
    CREATE POLICY "admin_all_clients" ON public.clients FOR ALL TO authenticated
      USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin')
  $policy$;

  EXECUTE $policy$
    CREATE POLICY "admin_all_projects" ON public.projects FOR ALL TO authenticated
      USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin')
  $policy$;

  EXECUTE $policy$
    CREATE POLICY "admin_all_locations" ON public.locations FOR ALL TO authenticated
      USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin')
  $policy$;

  EXECUTE $policy$
    CREATE POLICY "admin_all_items" ON public.items FOR ALL TO authenticated
      USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin')
  $policy$;

  EXECUTE $policy$
    CREATE POLICY "admin_all_evidence" ON public.evidence FOR ALL TO authenticated
      USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin')
  $policy$;

  -- =========================================================================
  -- 4. NOVAS POLÍTICAS: CLIENTE (ACESSO RESTRITO SOMENTE LEITURA)
  -- =========================================================================

  EXECUTE $policy$
    CREATE POLICY "client_select_clients" ON public.clients FOR SELECT TO authenticated
      USING (public.get_user_role() = 'client' AND auth_user_id = auth.uid())
  $policy$;

  EXECUTE $policy$
    CREATE POLICY "client_select_projects" ON public.projects FOR SELECT TO authenticated
      USING (
        public.get_user_role() = 'client' AND client_id IN (
          SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
        )
      )
  $policy$;

  EXECUTE $policy$
    CREATE POLICY "client_select_locations" ON public.locations FOR SELECT TO authenticated
      USING (
        public.get_user_role() = 'client' AND project_id IN (
          SELECT id FROM public.projects WHERE client_id IN (
            SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
          )
        )
      )
  $policy$;

  EXECUTE $policy$
    CREATE POLICY "client_select_items" ON public.items FOR SELECT TO authenticated
      USING (
        public.get_user_role() = 'client' AND project_id IN (
          SELECT id FROM public.projects WHERE client_id IN (
            SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
          )
        )
      )
  $policy$;

  EXECUTE $policy$
    CREATE POLICY "client_select_evidence" ON public.evidence FOR SELECT TO authenticated
      USING (
        public.get_user_role() = 'client' AND item_id IN (
          SELECT id FROM public.items WHERE project_id IN (
            SELECT id FROM public.projects WHERE client_id IN (
              SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
            )
          )
        )
      )
  $policy$;
END $$;
