drop view if exists "public"."project_sync_state";

create or replace view "public"."project_sync_state" as  SELECT p.id AS project_id,
    GREATEST(p.updated_at, max(l.updated_at), max(i.updated_at), max(e.updated_at)) AS last_modified_at,
    count(i.id) FILTER (WHERE (i.deleted_at IS NULL)) AS total_items,
    count(i.id) FILTER (WHERE ((i.status <> 'pending'::text) AND (i.deleted_at IS NULL))) AS completed_items
   FROM (((public.projects p
     LEFT JOIN public.locations l ON ((l.project_id = p.id)))
     LEFT JOIN public.items i ON ((i.project_id = p.id)))
     LEFT JOIN public.evidence e ON ((e.item_id = i.id)))
  GROUP BY p.id, p.updated_at;



