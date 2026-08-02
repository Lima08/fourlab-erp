-- =========================================================================
-- Schema completo consolidado (substitui todo o historico de migrations
-- anterior, ainda nao aplicado em nenhum ambiente remoto).
--
-- Consolida: 0001_sync_schema, 20260614000000_refatoracao_schema,
-- 20260614142637_controle_sync, 20260716181049_rbac_e_seguranca_rls,
-- 20260717200833_remote_schema, 20260718002542_setup_storage_and_policies,
-- 20260720175253_grants_estruturais_roles.
--
-- Conflitos corrigidos nesta consolidacao:
-- 1. RLS de "client" comparava role = 'client' (ingles), mas o enum
--    profile_role so define 'cliente'/'admin' -- corrigido para 'cliente'.
-- 2. Politicas permissivas "authenticated_all_*"/"authenticated_select_*"
--    (schema antigo) conflitavam com o RBAC estrito -- removidas; apenas
--    as politicas admin/cliente do RBAC valem.
-- 3. Grant citava tabela "user_roles" (nunca existiu) -- corrigido para
--    "profiles".
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- =========================================================================
-- tipos
-- =========================================================================

DO $$ BEGIN
  CREATE TYPE "public"."profile_role" AS ENUM ('cliente', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."profile_status" AS ENUM ('ativo', 'convite_pendente', 'suspenso');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =========================================================================
-- tabelas
-- =========================================================================

CREATE TABLE IF NOT EXISTS "public"."clients" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"         text NOT NULL,
  "phone"        text,
  "created_at"   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."profiles" (
  "id"         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "full_name"  text NOT NULL,
  "email"      text NOT NULL,
  "phone"      text,
  "role"       public.profile_role NOT NULL DEFAULT 'cliente',
  "status"     public.profile_status NOT NULL DEFAULT 'convite_pendente',
  "client_id"  uuid REFERENCES public.clients(id) ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_role_client_check"
    CHECK (
      (role = 'admin' AND client_id IS NULL) OR
      (role = 'cliente' AND client_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS "public"."projects" (
  "id"                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id"              uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  "responsible_profile_id" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  "name"                   text NOT NULL,
  "description"            text NOT NULL,
  "street"                 text NOT NULL,
  "number"                 text NOT NULL,
  "complement"             text,
  "neighborhood"           text NOT NULL,
  "city"                   text NOT NULL,
  "state"                  varchar(2) NOT NULL,
  "postal_code"            text NOT NULL,
  "status"                 text NOT NULL DEFAULT 'pending',
  "total_area"             numeric(10, 2),
  "document_type"          text NOT NULL,
  "document_storage_path"  text,
  "created_at"             timestamptz NOT NULL DEFAULT now(),
  "updated_at"             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "project_status_check"
    CHECK ("status" IN ('pending', 'in_progress', 'completed', 'canceled')),
  CONSTRAINT "project_document_type_check"
    CHECK ("document_type" IN ('PT_APPROVED', 'IPTU'))
);

CREATE TABLE IF NOT EXISTS "public"."locations" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  "name"       text NOT NULL,
  "type"       text NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "location_type_check"
    CHECK ("type" IN ('room', 'floor', 'building', 'outdoor', 'other'))
);

CREATE TABLE IF NOT EXISTS "public"."items" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id"    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  "location_id"   uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  "description"   text NOT NULL,
  "category"      text NOT NULL,
  "status"        text NOT NULL DEFAULT 'pending',
  "deleted_at"    timestamptz,
  "deleted_by_id" uuid REFERENCES auth.users(id),
  "updated_at"    timestamptz NOT NULL DEFAULT now(),
  "technician_id" uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  CONSTRAINT "item_status_check"
    CHECK ("status" IN ('pending', 'regular', 'irregular', 'absent'))
);

CREATE TABLE IF NOT EXISTS "public"."evidence" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "item_id"       uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  "type"          text NOT NULL,
  "blob_url"      text,
  "comment"       text,
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  "updated_at"    timestamptz NOT NULL DEFAULT now(),
  "technician_id" uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- =========================================================================
-- upgrade idempotente (tabelas já criadas por migrations anteriores)
-- =========================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS client_id uuid;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS responsible_profile_id uuid,
  ADD COLUMN IF NOT EXISTS total_area numeric(10, 2),
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS document_storage_path text;

-- =========================================================================
-- indices
-- =========================================================================

CREATE INDEX IF NOT EXISTS "projects_client_id_idx" ON "public"."projects" USING btree ("client_id");
CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "public"."projects" USING btree ("status");
CREATE INDEX IF NOT EXISTS "projects_city_state_idx" ON "public"."projects" USING btree ("city", "state");
CREATE INDEX IF NOT EXISTS "projects_postal_code_idx" ON "public"."projects" USING btree ("postal_code");

CREATE INDEX IF NOT EXISTS "locations_project_id_idx" ON "public"."locations" USING btree ("project_id");

CREATE INDEX IF NOT EXISTS "items_project_id_idx" ON "public"."items" USING btree ("project_id");
CREATE INDEX IF NOT EXISTS "items_location_id_idx" ON "public"."items" USING btree ("location_id");
CREATE INDEX IF NOT EXISTS "items_status_idx" ON "public"."items" USING btree ("status") WHERE ("deleted_at" IS NULL);

CREATE INDEX IF NOT EXISTS "evidence_item_id_idx" ON "public"."evidence" USING btree ("item_id");

CREATE INDEX IF NOT EXISTS "profiles_email_idx" ON "public"."profiles" USING btree ("email");
CREATE INDEX IF NOT EXISTS "profiles_role_idx" ON "public"."profiles" USING btree ("role");
CREATE INDEX IF NOT EXISTS "profiles_status_idx" ON "public"."profiles" USING btree ("status");

-- =========================================================================
-- funcoes
-- =========================================================================

CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path TO 'public'
  AS $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path TO 'public'
  AS $$
  select role::text from public.profiles where id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION "public"."get_profile_counts"() RETURNS json
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path TO 'public'
  AS $$
  select json_build_object(
    'all',              count(*),
    'ativo',             count(*) filter (where status = 'ativo'),
    'convite_pendente',  count(*) filter (where status = 'convite_pendente'),
    'suspenso',          count(*) filter (where status = 'suspenso'),
    'admin',             count(*) filter (where role = 'admin')
  )
  from public.profiles
  where public.is_admin();
$$;

CREATE OR REPLACE FUNCTION "public"."assert_not_last_admin"(
  "target_id" uuid,
  "new_role" public.profile_role DEFAULT NULL::public.profile_role
) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
  AS $$
declare admin_count int;
begin
  if new_role is not null and new_role != 'admin' then
    select count(*) into admin_count from public.profiles where role = 'admin';
    if admin_count <= 1 and exists (select 1 from public.profiles where id = target_id and role = 'admin') then
      raise exception 'LAST_ADMIN';
    end if;
  end if;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."profiles_guard_last_admin"() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
  AS $$
begin
  perform public.assert_not_last_admin(old.id, new.role);
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS event_trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS "rls_auto_enable_trigger";
CREATE EVENT TRIGGER "rls_auto_enable_trigger" ON ddl_command_end
  EXECUTE FUNCTION public.rls_auto_enable();

-- =========================================================================
-- view
-- =========================================================================

CREATE OR REPLACE VIEW "public"."project_sync_state" WITH (security_invoker = true) AS
SELECT
  p.id AS project_id,
  GREATEST(
    p.updated_at,
    max(l.updated_at),
    max(i.updated_at),
    max(e.updated_at)
  ) AS last_modified_at,
  count(i.id) FILTER (WHERE i.deleted_at IS NULL) AS total_items,
  count(i.id) FILTER (
    WHERE i.status != 'pending'
    AND   i.deleted_at IS NULL
  ) AS completed_items
FROM public.projects p
LEFT JOIN public.locations l ON l.project_id = p.id
LEFT JOIN public.items     i ON i.project_id = p.id
LEFT JOIN public.evidence  e ON e.item_id    = i.id
GROUP BY p.id, p.updated_at;

-- =========================================================================
-- triggers
-- =========================================================================

CREATE OR REPLACE TRIGGER "trg_projects_updated_at"
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER "trg_locations_updated_at"
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER "trg_items_updated_at"
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER "trg_evidence_updated_at"
  BEFORE UPDATE ON public.evidence
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER "profiles_updated_at"
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER "profiles_guard_last_admin"
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_last_admin();

-- =========================================================================
-- RLS
-- =========================================================================

ALTER TABLE public.clients   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;

-- remove politicas permissivas do schema antigo
DROP POLICY IF EXISTS "authenticated_select_clients" ON public.clients;
DROP POLICY IF EXISTS "authenticated_all_clients" ON public.clients;
DROP POLICY IF EXISTS "authenticated_select_projects" ON public.projects;
DROP POLICY IF EXISTS "authenticated_all_projects" ON public.projects;
DROP POLICY IF EXISTS "authenticated_select_locations" ON public.locations;
DROP POLICY IF EXISTS "authenticated_all_locations" ON public.locations;
DROP POLICY IF EXISTS "authenticated_select_items" ON public.items;
DROP POLICY IF EXISTS "authenticated_all_items" ON public.items;
DROP POLICY IF EXISTS "authenticated_select_evidence" ON public.evidence;
DROP POLICY IF EXISTS "authenticated_all_evidence" ON public.evidence;

-- admin: CRUD total
DROP POLICY IF EXISTS "admin_all_clients" ON public.clients;
CREATE POLICY "admin_all_clients" ON public.clients FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_all_projects" ON public.projects;
CREATE POLICY "admin_all_projects" ON public.projects FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_all_locations" ON public.locations;
CREATE POLICY "admin_all_locations" ON public.locations FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_all_items" ON public.items;
CREATE POLICY "admin_all_items" ON public.items FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_all_evidence" ON public.evidence;
CREATE POLICY "admin_all_evidence" ON public.evidence FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

-- cliente: somente leitura restrita ao proprio cliente/projeto
DROP POLICY IF EXISTS "client_select_clients" ON public.clients;
CREATE POLICY "client_select_clients" ON public.clients FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'cliente' AND id = (
      SELECT client_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "client_select_projects" ON public.projects;
CREATE POLICY "client_select_projects" ON public.projects FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'cliente' AND client_id = (
      SELECT client_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "client_select_locations" ON public.locations;
CREATE POLICY "client_select_locations" ON public.locations FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'cliente' AND project_id IN (
      SELECT id FROM public.projects WHERE client_id = (
        SELECT client_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "client_select_items" ON public.items;
CREATE POLICY "client_select_items" ON public.items FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'cliente' AND project_id IN (
      SELECT id FROM public.projects WHERE client_id = (
        SELECT client_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "client_select_evidence" ON public.evidence;
CREATE POLICY "client_select_evidence" ON public.evidence FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'cliente' AND item_id IN (
      SELECT id FROM public.items WHERE project_id IN (
        SELECT id FROM public.projects WHERE client_id = (
          SELECT client_id FROM public.profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- profiles: proprio perfil + administracao por admin
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_admin" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own_activate" ON public.profiles;
CREATE POLICY "profiles_update_own_activate" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() AND status = 'convite_pendente')
  WITH CHECK (id = auth.uid() AND status = 'ativo');

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());

-- =========================================================================
-- storage
-- =========================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "admin_all_storage" ON storage.objects;
CREATE POLICY "admin_all_storage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'evidence' AND public.get_user_role() = 'admin')
  WITH CHECK (bucket_id = 'evidence' AND public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "client_select_storage" ON storage.objects;
CREATE POLICY "client_select_storage" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'evidence' AND
    public.get_user_role() = 'cliente' AND
    (string_to_array(name, '/'))[1] IN (
      SELECT id::text FROM public.projects WHERE client_id = (
        SELECT client_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'image/vnd.dwg',
    'application/acad',
    'application/x-dwg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "admin_all_project_documents_storage" ON storage.objects;
CREATE POLICY "admin_all_project_documents_storage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'project-documents' AND public.get_user_role() = 'admin')
  WITH CHECK (bucket_id = 'project-documents' AND public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "client_select_project_documents_storage" ON storage.objects;
CREATE POLICY "client_select_project_documents_storage" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-documents' AND
    public.get_user_role() = 'cliente' AND
    (string_to_array(name, '/'))[1] IN (
      SELECT id::text FROM public.projects WHERE client_id = (
        SELECT client_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- =========================================================================
-- grants estruturais
-- =========================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles  TO authenticated;
GRANT SELECT ON public.project_sync_state TO authenticated;

DROP EXTENSION IF EXISTS "pg_net";
