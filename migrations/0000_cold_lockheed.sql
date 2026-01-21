CREATE TYPE "public"."account_segment" AS ENUM('mass_market', 'affluent', 'hnwi', 'uhnwi');--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('retail', 'premium', 'private', 'business');--> statement-breakpoint
CREATE TYPE "public"."activity_status" AS ENUM('todo', 'in_progress', 'completed', 'blocked', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."call_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."case_channel" AS ENUM('phone', 'email', 'chat', 'web', 'branch', 'app');--> statement-breakpoint
CREATE TYPE "public"."case_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('new', 'open', 'pending', 'waiting_customer', 'escalated', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."chat_channel" AS ENUM('webchat', 'whatsapp', 'telegram', 'app');--> statement-breakpoint
CREATE TYPE "public"."conto_status" AS ENUM('active', 'dormant', 'blocked', 'closed');--> statement-breakpoint
CREATE TYPE "public"."conto_type" AS ENUM('conto_corrente', 'conto_deposito', 'conto_titoli', 'carta_credito');--> statement-breakpoint
CREATE TYPE "public"."email_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('M', 'F', 'O');--> statement-breakpoint
CREATE TYPE "public"."onboarding_status" AS ENUM('pending', 'in_progress', 'waiting_docs', 'review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."progetto_status" AS ENUM('draft', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."team_type" AS ENUM('customer_service', 'backoffice', 'marketing', 'sales', 'compliance');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'agent', 'backoffice', 'marketing', 'readonly');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ndg" varchar(20),
	"fiscal_code" varchar(16),
	"vat_number" varchar(11),
	"name" varchar(255) NOT NULL,
	"type" "account_type" DEFAULT 'retail' NOT NULL,
	"segment" "account_segment" DEFAULT 'mass_market',
	"billing_address" jsonb,
	"shipping_address" jsonb,
	"owner_id" uuid,
	"parent_account_id" uuid,
	"risk_score" integer,
	"lifetime_value" numeric(15, 2),
	"nps_score" integer,
	"is_active" boolean DEFAULT true,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "accounts_ndg_unique" UNIQUE("ndg")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"fiscal_code" varchar(16),
	"birth_date" timestamp,
	"gender" "gender",
	"email" varchar(255),
	"phone" varchar(20),
	"mobile" varchar(20),
	"job_title" varchar(100),
	"is_primary" boolean DEFAULT false,
	"is_decision_maker" boolean DEFAULT false,
	"preferred_channel" "case_channel" DEFAULT 'email',
	"consent_marketing" boolean DEFAULT false,
	"consent_profiling" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_email" varchar(255),
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"changes" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"request_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conti_correnti" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid,
	"account_id" uuid,
	"iban" varchar(34) NOT NULL,
	"account_number" varchar(20),
	"type" "conto_type" DEFAULT 'conto_corrente' NOT NULL,
	"name" varchar(100),
	"currency" varchar(3) DEFAULT 'EUR',
	"balance" numeric(15, 2) DEFAULT '0',
	"available_balance" numeric(15, 2) DEFAULT '0',
	"balance_updated_at" timestamp with time zone,
	"status" "conto_status" DEFAULT 'active',
	"opened_at" date,
	"closed_at" date,
	"product_code" varchar(20),
	"product_name" varchar(100),
	"interest_rate" numeric(5, 4),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "conti_correnti_iban_unique" UNIQUE("iban")
);
--> statement-breakpoint
CREATE TABLE "progetti_spesa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid,
	"account_id" uuid,
	"conto_id" uuid,
	"name" varchar(200) NOT NULL,
	"description" text,
	"category" varchar(50),
	"target_amount" numeric(15, 2) NOT NULL,
	"current_amount" numeric(15, 2) DEFAULT '0',
	"monthly_contribution" numeric(15, 2),
	"start_date" date NOT NULL,
	"target_date" date,
	"completed_at" timestamp with time zone,
	"status" "progetto_status" DEFAULT 'draft',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_number" serial NOT NULL,
	"contact_id" uuid,
	"account_id" uuid,
	"owner_id" uuid,
	"team_id" uuid,
	"subject" varchar(500) NOT NULL,
	"description" text,
	"type" varchar(50),
	"category" varchar(50),
	"subcategory" varchar(50),
	"priority" "case_priority" DEFAULT 'medium',
	"status" "case_status" DEFAULT 'new',
	"channel" "case_channel" NOT NULL,
	"sla_due_at" timestamp with time zone,
	"sla_first_response_at" timestamp with time zone,
	"sla_breached" boolean DEFAULT false,
	"resolution" text,
	"resolved_at" timestamp with time zone,
	"resolution_code" varchar(50),
	"csat_score" integer,
	"csat_comment" text,
	"parent_case_id" uuid,
	"tags" text[],
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"closed_at" timestamp with time zone,
	CONSTRAINT "cases_case_number_unique" UNIQUE("case_number")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid,
	"sender_type" varchar(20) NOT NULL,
	"sender_id" uuid,
	"message_type" varchar(20) DEFAULT 'text',
	"content" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp with time zone,
	"intent" varchar(50),
	"entities" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"contact_id" uuid,
	"user_id" uuid,
	"channel" "chat_channel" NOT NULL,
	"external_chat_id" varchar(100),
	"status" varchar(20) DEFAULT 'active',
	"started_at" timestamp with time zone DEFAULT now(),
	"ended_at" timestamp with time zone,
	"last_message_at" timestamp with time zone,
	"message_count" integer DEFAULT 0,
	"first_response_time_seconds" integer,
	"rating" integer,
	"rating_comment" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"contact_id" uuid,
	"user_id" uuid,
	"thread_id" varchar(100),
	"parent_email_id" uuid,
	"message_id" varchar(255),
	"direction" "email_direction" NOT NULL,
	"from_address" varchar(255) NOT NULL,
	"to_addresses" text[] NOT NULL,
	"cc_addresses" text[],
	"subject" varchar(500),
	"body_text" text,
	"body_html" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"is_read" boolean DEFAULT false,
	"is_starred" boolean DEFAULT false,
	"category" varchar(50),
	"intent" varchar(50),
	"sentiment_score" numeric(3, 2),
	"sent_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "emails_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "telefonate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"contact_id" uuid,
	"user_id" uuid,
	"twilio_call_sid" varchar(50),
	"twilio_recording_sid" varchar(50),
	"twilio_recording_url" text,
	"direction" "call_direction" NOT NULL,
	"from_number" varchar(20),
	"to_number" varchar(20),
	"started_at" timestamp with time zone NOT NULL,
	"answered_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"wait_time_seconds" integer,
	"ivr_path" text[],
	"ivr_reason" varchar(100),
	"status" varchar(20),
	"disposition" varchar(50),
	"transcription" text,
	"transcription_summary" text,
	"sentiment_score" numeric(3, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "telefonate_twilio_call_sid_unique" UNIQUE("twilio_call_sid")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"type" "team_type" NOT NULL,
	"manager_id" uuid,
	"parent_team_id" uuid,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255),
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"avatar_url" text,
	"team_id" uuid,
	"role_id" uuid NOT NULL,
	"twilio_worker_sid" varchar(100),
	"extension" varchar(10),
	"is_active" boolean DEFAULT true,
	"is_online" boolean DEFAULT false,
	"last_login_at" timestamp with time zone,
	"preferences" jsonb DEFAULT '{"theme":"light","notifications":true,"language":"it"}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "onboarding_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pratica_id" uuid,
	"name" varchar(200) NOT NULL,
	"description" text,
	"type" varchar(50),
	"sequence_order" integer NOT NULL,
	"is_mandatory" boolean DEFAULT true,
	"depends_on" uuid[],
	"assignee_id" uuid,
	"team_id" uuid,
	"status" "activity_status" DEFAULT 'todo',
	"due_date" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"outcome" varchar(50),
	"outcome_notes" text,
	"documents" jsonb DEFAULT '[]'::jsonb,
	"checklist" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pratiche_onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pratica_number" serial NOT NULL,
	"contact_id" uuid,
	"account_id" uuid,
	"assigned_to" uuid,
	"team_id" uuid,
	"type" varchar(50) NOT NULL,
	"product_type" varchar(50),
	"status" "onboarding_status" DEFAULT 'pending',
	"current_step" varchar(50),
	"workflow_definition_id" uuid,
	"submitted_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"sla_hours" integer DEFAULT 48,
	"sla_breached" boolean DEFAULT false,
	"required_documents" jsonb DEFAULT '[]'::jsonb,
	"kyc_status" varchar(20),
	"aml_status" varchar(20),
	"credit_check_status" varchar(20),
	"outcome" varchar(20),
	"rejection_reason" text,
	"notes" text,
	"internal_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "pratiche_onboarding_pratica_number_unique" UNIQUE("pratica_number")
);
--> statement-breakpoint
CREATE TABLE "journey_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid,
	"contact_id" uuid,
	"current_step" varchar(50),
	"status" varchar(20) DEFAULT 'active',
	"enrolled_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"exited_at" timestamp with time zone,
	"exit_reason" varchar(100),
	"converted" boolean DEFAULT false,
	"conversion_value" numeric(15, 2),
	CONSTRAINT "journey_enrollments_journey_id_contact_id_unique" UNIQUE("journey_id","contact_id")
);
--> statement-breakpoint
CREATE TABLE "marketing_journeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"trigger_type" varchar(50) NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"segment_filter" jsonb,
	"status" varchar(20) DEFAULT 'draft',
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"enrolled_count" integer DEFAULT 0,
	"completed_count" integer DEFAULT 0,
	"conversion_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_account_id_accounts_id_fk" FOREIGN KEY ("parent_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conti_correnti" ADD CONSTRAINT "conti_correnti_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conti_correnti" ADD CONSTRAINT "conti_correnti_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progetti_spesa" ADD CONSTRAINT "progetti_spesa_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progetti_spesa" ADD CONSTRAINT "progetti_spesa_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progetti_spesa" ADD CONSTRAINT "progetti_spesa_conto_id_conti_correnti_id_fk" FOREIGN KEY ("conto_id") REFERENCES "public"."conti_correnti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_parent_case_id_cases_id_fk" FOREIGN KEY ("parent_case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_parent_email_id_emails_id_fk" FOREIGN KEY ("parent_email_id") REFERENCES "public"."emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telefonate" ADD CONSTRAINT "telefonate_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telefonate" ADD CONSTRAINT "telefonate_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telefonate" ADD CONSTRAINT "telefonate_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_parent_team_id_teams_id_fk" FOREIGN KEY ("parent_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_activities" ADD CONSTRAINT "onboarding_activities_pratica_id_pratiche_onboarding_id_fk" FOREIGN KEY ("pratica_id") REFERENCES "public"."pratiche_onboarding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_activities" ADD CONSTRAINT "onboarding_activities_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_activities" ADD CONSTRAINT "onboarding_activities_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pratiche_onboarding" ADD CONSTRAINT "pratiche_onboarding_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pratiche_onboarding" ADD CONSTRAINT "pratiche_onboarding_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pratiche_onboarding" ADD CONSTRAINT "pratiche_onboarding_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pratiche_onboarding" ADD CONSTRAINT "pratiche_onboarding_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pratiche_onboarding" ADD CONSTRAINT "pratiche_onboarding_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_enrollments" ADD CONSTRAINT "journey_enrollments_journey_id_marketing_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."marketing_journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_enrollments" ADD CONSTRAINT "journey_enrollments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_journeys" ADD CONSTRAINT "marketing_journeys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounts_ndg" ON "accounts" USING btree ("ndg");--> statement-breakpoint
CREATE INDEX "idx_accounts_segment" ON "accounts" USING btree ("segment");--> statement-breakpoint
CREATE INDEX "idx_accounts_owner" ON "accounts" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_contacts_account" ON "contacts" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_contacts_email" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_contacts_primary" ON "contacts" USING btree ("account_id","is_primary") WHERE "contacts"."is_primary" = true;--> statement-breakpoint
CREATE INDEX "idx_audit_entity" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_date" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conti_contact" ON "conti_correnti" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "idx_conti_iban" ON "conti_correnti" USING btree ("iban");--> statement-breakpoint
CREATE INDEX "idx_conti_status" ON "conti_correnti" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_progetti_contact" ON "progetti_spesa" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "idx_progetti_status" ON "progetti_spesa" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cases_number" ON "cases" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "idx_cases_contact" ON "cases" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "idx_cases_owner" ON "cases" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_cases_status" ON "cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cases_priority" ON "cases" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_cases_sla" ON "cases" USING btree ("sla_due_at") WHERE "cases"."status" NOT IN ('resolved', 'closed');--> statement-breakpoint
CREATE INDEX "idx_chats_case" ON "chats" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "idx_chats_active" ON "chats" USING btree ("status") WHERE "chats"."status" = 'active';--> statement-breakpoint
CREATE INDEX "idx_emails_case" ON "emails" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "idx_emails_thread" ON "emails" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "idx_telefonate_case" ON "telefonate" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "idx_telefonate_twilio" ON "telefonate" USING btree ("twilio_call_sid");--> statement-breakpoint
CREATE INDEX "idx_onb_activities_pratica" ON "onboarding_activities" USING btree ("pratica_id");--> statement-breakpoint
CREATE INDEX "idx_onb_activities_status" ON "onboarding_activities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pratiche_status" ON "pratiche_onboarding" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pratiche_assigned" ON "pratiche_onboarding" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_pratiche_due" ON "pratiche_onboarding" USING btree ("due_date") WHERE "pratiche_onboarding"."status" NOT IN ('approved', 'rejected');