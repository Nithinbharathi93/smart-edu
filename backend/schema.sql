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
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger" LANGUAGE "plpgsql" SECURITY DEFINER AS $$ BEGIN
INSERT INTO public.profiles (id, full_name)
VALUES (new.id, new.raw_user_meta_data->>'full_name');
RETURN new;
END;
$$;
ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."match_document_sections"(
        "p_query_embedding" "extensions"."vector",
        "p_match_threshold" double precision,
        "p_match_count" integer,
        "p_filter_pdf_id" bigint,
        "p_user_id" "uuid"
    ) RETURNS TABLE(
        "id" bigint,
        "content" "text",
        "similarity" double precision
    ) LANGUAGE "plpgsql" AS $$ BEGIN RETURN QUERY
SELECT ds.id,
    ds.content,
    (1 - (ds.embedding <=> p_query_embedding))::float AS similarity
FROM document_sections ds
    JOIN documents d ON ds.document_id = d.id
WHERE ds.document_id = p_filter_pdf_id
    AND d.user_id = p_user_id -- SECURITY CHECK
    AND (1 - (ds.embedding <=> p_query_embedding)) > p_match_threshold
ORDER BY ds.embedding <=> p_query_embedding
LIMIT p_match_count;
END;
$$;
ALTER FUNCTION "public"."match_document_sections"(
    "p_query_embedding" "extensions"."vector",
    "p_match_threshold" double precision,
    "p_match_count" integer,
    "p_filter_pdf_id" bigint,
    "p_user_id" "uuid"
) OWNER TO "postgres";
SET default_tablespace = '';
SET default_table_access_method = "heap";
CREATE TABLE IF NOT EXISTS "public"."coding_problems" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "syllabus_id" bigint,
    "document_id" bigint,
    "week_number" integer NOT NULL,
    "concept" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "difficulty" "text",
    "topics" "text" [],
    "constraints" "text" [],
    "examples" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "hidden_test_cases" "jsonb" DEFAULT '[]'::"jsonb",
    "starter_code" "text",
    "solution_data" "jsonb"
);
ALTER TABLE "public"."coding_problems" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."document_sections" (
    "id" bigint NOT NULL,
    "document_id" bigint,
    "content" "text" NOT NULL,
    "embedding" "extensions"."vector"(384)
);
ALTER TABLE "public"."document_sections" OWNER TO "postgres";
ALTER TABLE "public"."document_sections"
ALTER COLUMN "id"
ADD GENERATED ALWAYS AS IDENTITY (
        SEQUENCE NAME "public"."document_sections_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1
    );
CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "filename" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."documents" OWNER TO "postgres";
ALTER TABLE "public"."documents"
ALTER COLUMN "id"
ADD GENERATED ALWAYS AS IDENTITY (
        SEQUENCE NAME "public"."documents_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1
    );
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "persona" "text",
    "goals" "text" [],
    "current_level" integer DEFAULT 1,
    "level_name" "text" DEFAULT 'Novice'::"text",
    "bio" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_assessed_at" timestamp with time zone,
    "default_language" "text" DEFAULT 'javascript'::"text",
    "socratic_level" integer DEFAULT 3,
    "editor_config" "jsonb" DEFAULT '{"theme": "dark", "font_size": 14}'::"jsonb",
    CONSTRAINT "profiles_persona_check" CHECK (
        (
            "persona" = ANY (
                ARRAY ['student'::"text", 'upskiller'::"text", 'casual'::"text", 'seasoned_dev'::"text"]
            )
        )
    ),
    CONSTRAINT "profiles_socratic_level_check" CHECK (
        (
            ("socratic_level" >= 1)
            AND ("socratic_level" <= 5)
        )
    )
);
ALTER TABLE "public"."profiles" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."syllabi" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "document_id" bigint,
    "syllabus_data" "jsonb" NOT NULL,
    "duration" "text",
    "level" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "syllabus_title" "text"
);
ALTER TABLE "public"."syllabi" OWNER TO "postgres";
ALTER TABLE "public"."syllabi"
ALTER COLUMN "id"
ADD GENERATED ALWAYS AS IDENTITY (
        SEQUENCE NAME "public"."syllabi_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1
    );
ALTER TABLE ONLY "public"."coding_problems"
ADD CONSTRAINT "coding_problems_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."document_sections"
ADD CONSTRAINT "document_sections_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."documents"
ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."profiles"
ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."syllabi"
ADD CONSTRAINT "syllabi_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."coding_problems"
ADD CONSTRAINT "coding_problems_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE
SET NULL;
ALTER TABLE ONLY "public"."coding_problems"
ADD CONSTRAINT "coding_problems_syllabus_id_fkey" FOREIGN KEY ("syllabus_id") REFERENCES "public"."syllabi"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."coding_problems"
ADD CONSTRAINT "coding_problems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."document_sections"
ADD CONSTRAINT "document_sections_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."documents"
ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."profiles"
ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."syllabi"
ADD CONSTRAINT "syllabi_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."syllabi"
ADD CONSTRAINT "syllabi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
CREATE POLICY "Allow individual insert" ON "public"."profiles" FOR
INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));
CREATE POLICY "Allow individual read" ON "public"."profiles" FOR
SELECT TO "authenticated" USING (("auth"."uid"() = "id"));
CREATE POLICY "Allow individual update" ON "public"."profiles" FOR
UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));
CREATE POLICY "Enable insert for authenticated users only" ON "public"."profiles" FOR
INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));
CREATE POLICY "Enable read access for own profile" ON "public"."profiles" FOR
SELECT TO "authenticated" USING (("auth"."uid"() = "id"));
CREATE POLICY "Enable update for users based on id" ON "public"."profiles" FOR
UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));
ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON TABLE "public"."coding_problems" TO "anon";
GRANT ALL ON TABLE "public"."coding_problems" TO "authenticated";
GRANT ALL ON TABLE "public"."coding_problems" TO "service_role";
GRANT ALL ON TABLE "public"."document_sections" TO "anon";
GRANT ALL ON TABLE "public"."document_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."document_sections" TO "service_role";
GRANT ALL ON SEQUENCE "public"."document_sections_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_sections_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_sections_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT ALL ON TABLE "public"."syllabi" TO "anon";
GRANT ALL ON TABLE "public"."syllabi" TO "authenticated";
GRANT ALL ON TABLE "public"."syllabi" TO "service_role";
GRANT ALL ON SEQUENCE "public"."syllabi_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."syllabi_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."syllabi_id_seq" TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "service_role";