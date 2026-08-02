-- Remote schema dumps recriam project_sync_state sem security_invoker → Security Definer no Studio.
-- Com invoker=true, RLS das tabelas base (projects, locations, items, evidence) filtra por role.

CREATE OR REPLACE VIEW public.project_sync_state
WITH (security_invoker = true)
AS
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
    WHERE i.status <> 'pending'
      AND i.deleted_at IS NULL
  ) AS completed_items
FROM public.projects p
LEFT JOIN public.locations l ON l.project_id = p.id
LEFT JOIN public.items i ON i.project_id = p.id
LEFT JOIN public.evidence e ON e.item_id = i.id
GROUP BY p.id, p.updated_at;

REVOKE ALL ON public.project_sync_state FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.project_sync_state FROM authenticated;
GRANT SELECT ON public.project_sync_state TO authenticated;
