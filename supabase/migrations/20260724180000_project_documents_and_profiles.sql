-- =========================================================================
-- Project documents storage + profiles.client_id (mantém clients)
-- Ordem CRITICAL — não reordenar
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. ADD profiles.client_id + backfill a partir de clients.auth_user_id
-- -------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS client_id uuid;

UPDATE public.profiles p
SET client_id = c.id
FROM public.clients c
WHERE c.auth_user_id = p.id
  AND p.role = 'cliente'
  AND p.client_id IS NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_client_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_client_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_client_check
    CHECK (
      (role = 'admin' AND client_id IS NULL) OR
      (role = 'cliente' AND client_id IS NOT NULL)
    );

CREATE INDEX IF NOT EXISTS profiles_client_id_idx
  ON public.profiles USING btree (client_id);

-- -------------------------------------------------------------------------
-- 2. RLS cliente — profiles.client_id (ANTES de dropar auth_user_id)
-- -------------------------------------------------------------------------

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

ALTER TABLE public.clients
  DROP COLUMN IF EXISTS auth_user_id;

-- -------------------------------------------------------------------------
-- 3. ADD novos campos em projects (sem client_profile_id)
-- -------------------------------------------------------------------------

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS responsible_profile_id uuid,
  ADD COLUMN IF NOT EXISTS total_area numeric(10, 2),
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS document_storage_path text;

-- -------------------------------------------------------------------------
-- 4. Backfill responsible_profile_id (primeiro admin)
-- -------------------------------------------------------------------------

UPDATE public.projects
SET responsible_profile_id = (
  SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1
)
WHERE responsible_profile_id IS NULL;

-- -------------------------------------------------------------------------
-- 5. Backfill document_type legado
-- -------------------------------------------------------------------------

UPDATE public.projects
SET document_type = 'PT_APPROVED'
WHERE document_type IS NULL;

-- -------------------------------------------------------------------------
-- 6. FK constraints + NOT NULL + CHECK (mantém projects.client_id)
-- -------------------------------------------------------------------------

ALTER TABLE public.projects
  ALTER COLUMN responsible_profile_id SET NOT NULL,
  ALTER COLUMN document_type SET NOT NULL;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS project_document_type_check;

ALTER TABLE public.projects
  ADD CONSTRAINT project_document_type_check
    CHECK (document_type IN ('PT_APPROVED', 'IPTU'));

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_responsible_profile_id_fkey;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_responsible_profile_id_fkey
    FOREIGN KEY (responsible_profile_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- -------------------------------------------------------------------------
-- 7. Bucket project-documents
-- -------------------------------------------------------------------------

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
