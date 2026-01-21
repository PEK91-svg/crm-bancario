/**
 * CRM Bancario - Database Schema: Onboarding & Pratiche
 */

import {
    pgTable,
    uuid,
    varchar,
    text,
    integer,
    serial,
    boolean,
    timestamp,
    date,
    jsonb,
    index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { onboardingStatusEnum, activityStatusEnum } from './enums';
import { contacts } from './accounts';
import { accounts } from './accounts';
import { users } from './users';
import { teams } from './teams';

/**
 * PRATICHE_ONBOARDING - Onboarding workflows (apertura conto, KYC, etc.)
 */
export const praticheOnboarding = pgTable(
    'pratiche_onboarding',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        praticaNumber: serial('pratica_number').notNull().unique(), // Auto-increment starting from 100000

        // Relationships
        contactId: uuid('contact_id').references(() => contacts.id),
        accountId: uuid('account_id').references(() => accounts.id),
        assignedTo: uuid('assigned_to').references(() => users.id),
        teamId: uuid('team_id').references(() => teams.id),

        // Pratica details
        type: varchar('type', { length: 50 }).notNull(), // apertura_conto, kyc_refresh, nuovo_prodotto
        productType: varchar('product_type', { length: 50 }),

        // Status & workflow
        status: onboardingStatusEnum('status').default('pending'),
        currentStep: varchar('current_step', { length: 50 }),
        workflowDefinitionId: uuid('workflow_definition_id'), // Reference to workflow template

        // Timing
        submittedAt: timestamp('submitted_at', { withTimezone: true }),
        startedAt: timestamp('started_at', { withTimezone: true }),
        dueDate: date('due_date'),
        completedAt: timestamp('completed_at', { withTimezone: true }),

        // SLA tracking
        slaHours: integer('sla_hours').default(48),
        slaBreached: boolean('sla_breached').default(false),

        // Required documents (JSONB array)
        requiredDocuments: jsonb('required_documents').$type<Array<{
            type: string;
            name: string;
            uploaded?: boolean;
            uploadedAt?: string;
            url?: string;
        }>>().default([]),

        // Compliance checks
        kycStatus: varchar('kyc_status', { length: 20 }),
        amlStatus: varchar('aml_status', { length: 20 }),
        creditCheckStatus: varchar('credit_check_status', { length: 20 }),

        // Outcome
        outcome: varchar('outcome', { length: 20 }), // approved, rejected, cancelled
        rejectionReason: text('rejection_reason'),

        // Notes
        notes: text('notes'),
        internalNotes: text('internal_notes'),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
        createdBy: uuid('created_by').references(() => users.id),
    },
    (table) => ({
        statusIdx: index('idx_pratiche_status').on(table.status),
        assignedIdx: index('idx_pratiche_assigned').on(table.assignedTo),
        dueIdx: index('idx_pratiche_due').on(table.dueDate).where(
            sql`${table.status} NOT IN ('approved', 'rejected')`
        ),
    })
);

export const praticheOnboardingRelations = relations(praticheOnboarding, ({ one, many }) => ({
    contact: one(contacts, {
        fields: [praticheOnboarding.contactId],
        references: [contacts.id],
    }),
    account: one(accounts, {
        fields: [praticheOnboarding.accountId],
        references: [accounts.id],
    }),
    assignee: one(users, {
        fields: [praticheOnboarding.assignedTo],
        references: [users.id],
        relationName: 'assignedPratiche',
    }),
    team: one(teams, {
        fields: [praticheOnboarding.teamId],
        references: [teams.id],
    }),
    creator: one(users, {
        fields: [praticheOnboarding.createdBy],
        references: [users.id],
        relationName: 'createdPratiche',
    }),
    activities: many(onboardingActivities),
}));

/**
 * ONBOARDING_ACTIVITIES - Individual steps in onboarding workflow
 */
export const onboardingActivities = pgTable(
    'onboarding_activities',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        praticaId: uuid('pratica_id').references(() => praticheOnboarding.id, { onDelete: 'cascade' }),

        // Activity details
        name: varchar('name', { length: 200 }).notNull(),
        description: text('description'),
        type: varchar('type', { length: 50 }), // document_review, call_customer, verify_identity, system_action

        // Workflow sequencing
        sequenceOrder: integer('sequence_order').notNull(),
        isMandatory: boolean('is_mandatory').default(true),
        dependsOn: uuid('depends_on').array(), // Array of activity IDs that must complete first

        // Assignment
        assigneeId: uuid('assignee_id').references(() => users.id),
        teamId: uuid('team_id').references(() => teams.id),

        // Status
        status: activityStatusEnum('status').default('todo'),

        // Timing
        dueDate: timestamp('due_date', { withTimezone: true }),
        startedAt: timestamp('started_at', { withTimezone: true }),
        completedAt: timestamp('completed_at', { withTimezone: true }),

        // Outcome
        outcome: varchar('outcome', { length: 50 }),
        outcomeNotes: text('outcome_notes'),

        // Documents & checklist
        documents: jsonb('documents').$type<Array<{
            filename: string;
            url: string;
            uploadedAt: string;
            uploadedBy: string;
        }>>().default([]),
        checklist: jsonb('checklist').$type<Array<{
            item: string;
            checked: boolean;
            checkedBy?: string;
            checkedAt?: string;
        }>>().default([]),

        notes: text('notes'),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        praticaIdx: index('idx_onb_activities_pratica').on(table.praticaId),
        statusIdx: index('idx_onb_activities_status').on(table.status),
    })
);

export const onboardingActivitiesRelations = relations(onboardingActivities, ({ one }) => ({
    pratica: one(praticheOnboarding, {
        fields: [onboardingActivities.praticaId],
        references: [praticheOnboarding.id],
    }),
    assignee: one(users, {
        fields: [onboardingActivities.assigneeId],
        references: [users.id],
    }),
    team: one(teams, {
        fields: [onboardingActivities.teamId],
        references: [teams.id],
    }),
}));
