-- Garante permissões estruturais básicas para as roles da API
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Libera o acesso estrutural às tabelas para usuários logados (somente se existirem)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'projects'
  ) THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'locations'
  ) THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'items'
  ) THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'evidence'
  ) THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence TO authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'project_sync_state'
  ) THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_sync_state TO authenticated;
  END IF;
END $$;
