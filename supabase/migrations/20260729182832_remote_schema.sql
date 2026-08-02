drop view if exists "public"."project_sync_state";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.assert_not_last_admin(target_id uuid, new_role public.profile_role DEFAULT NULL::public.profile_role)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare admin_count int;
begin
  if new_role is not null and new_role != 'admin' then
    select count(*) into admin_count from public.profiles where role = 'admin';
    if admin_count <= 1 and exists (select 1 from public.profiles where id = target_id and role = 'admin') then
      raise exception 'LAST_ADMIN';
    end if;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_profile_counts()
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select json_build_object(
    'all',              count(*),
    'ativo',             count(*) filter (where status = 'ativo'),
    'convite_pendente',  count(*) filter (where status = 'convite_pendente'),
    'suspenso',          count(*) filter (where status = 'suspenso'),
    'admin',             count(*) filter (where role = 'admin')
  )
  from public.profiles
  where public.is_admin();
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role::text from public.profiles where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.profiles_guard_last_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.assert_not_last_admin(old.id, new.role);
  return new;
end;
$function$
;

create or replace view "public"."project_sync_state" as  SELECT p.id AS project_id,
    GREATEST(p.updated_at, max(l.updated_at), max(i.updated_at), max(e.updated_at)) AS last_modified_at,
    count(i.id) FILTER (WHERE (i.deleted_at IS NULL)) AS total_items,
    count(i.id) FILTER (WHERE ((i.status <> 'pending'::text) AND (i.deleted_at IS NULL))) AS completed_items
   FROM (((public.projects p
     LEFT JOIN public.locations l ON ((l.project_id = p.id)))
     LEFT JOIN public.items i ON ((i.project_id = p.id)))
     LEFT JOIN public.evidence e ON ((e.item_id = i.id)))
  GROUP BY p.id, p.updated_at;


CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;


