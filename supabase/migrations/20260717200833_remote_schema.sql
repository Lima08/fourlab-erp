


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."profile_role" AS ENUM (
    'cliente',
    'admin'
);


ALTER TYPE "public"."profile_role" OWNER TO "postgres";


CREATE TYPE "public"."profile_status" AS ENUM (
    'ativo',
    'convite_pendente',
    'suspenso'
);


ALTER TYPE "public"."profile_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assert_not_last_admin"("target_id" "uuid", "new_role" "public"."profile_role" DEFAULT NULL::"public"."profile_role") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."assert_not_last_admin"("target_id" "uuid", "new_role" "public"."profile_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_counts"() RETURNS json
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_profile_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."profiles_guard_last_admin"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform public.assert_not_last_admin(old.id, new.role);
  return new;
end;
$$;


ALTER FUNCTION "public"."profiles_guard_last_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
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


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evidence" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "blob_url" "text",
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "technician_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."evidence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "location_id" "uuid",
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "technician_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    CONSTRAINT "item_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'regular'::"text", 'irregular'::"text", 'absent'::"text"])))
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "location_type_check" CHECK (("type" = ANY (ARRAY['room'::"text", 'floor'::"text", 'building'::"text", 'outdoor'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "role" "public"."profile_role" DEFAULT 'cliente'::"public"."profile_role" NOT NULL,
    "status" "public"."profile_status" DEFAULT 'convite_pendente'::"public"."profile_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "street" "text" NOT NULL,
    "number" "text" NOT NULL,
    "complement" "text",
    "neighborhood" "text" NOT NULL,
    "city" "text" NOT NULL,
    "state" character varying(2) NOT NULL,
    "postal_code" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "project_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."project_sync_state" WITH ("security_invoker"='true') AS
 SELECT "p"."id" AS "project_id",
    GREATEST("p"."updated_at", "max"("l"."updated_at"), "max"("i"."updated_at"), "max"("e"."updated_at")) AS "last_modified_at",
    "count"("i"."id") FILTER (WHERE ("i"."deleted_at" IS NULL)) AS "total_items",
    "count"("i"."id") FILTER (WHERE (("i"."status" <> 'pending'::"text") AND ("i"."deleted_at" IS NULL))) AS "completed_items"
   FROM ((("public"."projects" "p"
     LEFT JOIN "public"."locations" "l" ON (("l"."project_id" = "p"."id")))
     LEFT JOIN "public"."items" "i" ON (("i"."project_id" = "p"."id")))
     LEFT JOIN "public"."evidence" "e" ON (("e"."item_id" = "i"."id")))
  GROUP BY "p"."id", "p"."updated_at";


ALTER VIEW "public"."project_sync_state" OWNER TO "postgres";


ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evidence"
    ADD CONSTRAINT "evidence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



CREATE INDEX "evidence_item_id_idx" ON "public"."evidence" USING "btree" ("item_id");



CREATE INDEX "items_location_id_idx" ON "public"."items" USING "btree" ("location_id");



CREATE INDEX "items_project_id_idx" ON "public"."items" USING "btree" ("project_id");



CREATE INDEX "items_status_idx" ON "public"."items" USING "btree" ("status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "locations_project_id_idx" ON "public"."locations" USING "btree" ("project_id");



CREATE INDEX "profiles_email_idx" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "profiles_role_idx" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "profiles_status_idx" ON "public"."profiles" USING "btree" ("status");



CREATE INDEX "projects_city_state_idx" ON "public"."projects" USING "btree" ("city", "state");



CREATE INDEX "projects_client_id_idx" ON "public"."projects" USING "btree" ("client_id");



CREATE INDEX "projects_postal_code_idx" ON "public"."projects" USING "btree" ("postal_code");



CREATE INDEX "projects_status_idx" ON "public"."projects" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "profiles_guard_last_admin" BEFORE UPDATE OF "role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."profiles_guard_last_admin"();



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_evidence_updated_at" BEFORE UPDATE ON "public"."evidence" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_items_updated_at" BEFORE UPDATE ON "public"."items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_locations_updated_at" BEFORE UPDATE ON "public"."locations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."evidence"
    ADD CONSTRAINT "evidence_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evidence"
    ADD CONSTRAINT "evidence_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT;



CREATE POLICY "authenticated_all_clients" ON "public"."clients" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_evidence" ON "public"."evidence" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_items" ON "public"."items" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_locations" ON "public"."locations" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_projects" ON "public"."projects" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_select_clients" ON "public"."clients" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_evidence" ON "public"."evidence" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_items" ON "public"."items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_locations" ON "public"."locations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_projects" ON "public"."projects" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evidence" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_delete_admin" ON "public"."profiles" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "profiles_insert_admin" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "profiles_select_admin" ON "public"."profiles" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_update_admin" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "profiles_update_own_activate" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) AND ("status" = 'convite_pendente'::"public"."profile_status"))) WITH CHECK ((("id" = "auth"."uid"()) AND ("status" = 'ativo'::"public"."profile_status")));



ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."assert_not_last_admin"("target_id" "uuid", "new_role" "public"."profile_role") TO "anon";
GRANT ALL ON FUNCTION "public"."assert_not_last_admin"("target_id" "uuid", "new_role" "public"."profile_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assert_not_last_admin"("target_id" "uuid", "new_role" "public"."profile_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_profile_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."profiles_guard_last_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."profiles_guard_last_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."profiles_guard_last_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."evidence" TO "anon";
GRANT ALL ON TABLE "public"."evidence" TO "authenticated";
GRANT ALL ON TABLE "public"."evidence" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."project_sync_state" TO "anon";
GRANT ALL ON TABLE "public"."project_sync_state" TO "authenticated";
GRANT ALL ON TABLE "public"."project_sync_state" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";


