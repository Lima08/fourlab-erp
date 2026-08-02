-- =========================================================================
-- 1. CRIAÇÃO/ATUALIZAÇÃO DO BUCKET PRIVADO
-- =========================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- =========================================================================
-- 2. POLÍTICAS DE RLS PARA O STORAGE (storage.objects)
-- Executado apenas se o schema base (profiles) já existir.
-- =========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
  ) THEN
    RAISE NOTICE '20260718002542_storage: skip policies — public.profiles não existe';
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

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'clients'
  ) THEN
    ALTER TABLE public.clients
      ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS "admin_all_storage" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "client_all_storage" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "client_select_storage" ON storage.objects';

  EXECUTE $policy$
    CREATE POLICY "admin_all_storage" ON storage.objects FOR ALL TO authenticated
      USING (bucket_id = 'evidence' AND public.get_user_role() = 'admin')
      WITH CHECK (bucket_id = 'evidence' AND public.get_user_role() = 'admin')
  $policy$;

  EXECUTE $policy$
    CREATE POLICY "client_select_storage" ON storage.objects FOR SELECT TO authenticated
      USING (
        bucket_id = 'evidence' AND
        public.get_user_role() = 'client' AND
        (string_to_array(name, '/'))[1] IN (
          SELECT id::text FROM public.projects WHERE client_id IN (
            SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
          )
        )
      )
  $policy$;
END $$;
