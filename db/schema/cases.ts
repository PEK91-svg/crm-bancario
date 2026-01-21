/**
 * CRM Bancario - Database Schema: Cases (Tickets/Customer Service)
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
    jsonb,
    index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { caseStatusEnum, casePriorityEnum, caseChannelEnum } from './enums';
import { contacts } from './accounts';
import { accounts } from './accounts';
import { users } from './users';
import { teams } from './teams';

/**
 * CASES - Tickets/richieste customer service
 */
export const cases = pgTable(
    'cases',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        caseNumber: serial('case_number').notNull().unique(), // Auto-increment

        // Relationships
        contactId: uuid('contact_id').references(() => contacts.id),
        accountId: uuid('account_id').references(() => accounts.id),
        ownerId: uuid('owner_id').references(() => users.id), // Assigned agent
        teamId: uuid('team_id').references(() => teams.id),

        // Case details
        subject: varchar('subject', { length: 500 }).notNull(),
        description: text('description'),
        type: varchar('type', { length: 50 }),
        category: varchar('category', { length: 50 }),
        subcategory: varchar('subcategory', { length: 50 }),

        // Status & Priority
        priority: casePriorityEnum('priority').default('medium'),
        status: caseStatusEnum('status').default('new'),
        channel: caseChannelEnum('channel').notNull(),

        // SLA tracking
        slaDueAt: timestamp('sla_due_at', { withTimezone: true }),
        slaFirstResponseAt: timestamp('sla_first_response_at', { withTimezone: true }),
        slaBreached: boolean('sla_breached').default(false),

        // Resolution
        resolution: text('resolution'),
        resolvedAt: timestamp('resolved_at', { withTimezone: true }),
        resolutionCode: varchar('resolution_code', { length: 50 }),

        // Customer satisfaction
        csatScore: integer('csat_score'), // 1-5
        csatComment: text('csat_comment'),

        // Hierarchy & metadata
        parentCaseId: uuid('parent_case_id').references((): any => cases.id),
        tags: text('tags').array(),
        customFields: jsonb('custom_fields').$type<Record<string, any>>().default({}),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
        closedAt: timestamp('closed_at', { withTimezone: true }),
    },
    (table) => ({
        numberIdx: index('idx_cases_number').on(table.caseNumber),
        contactIdx: index('idx_cases_contact').on(table.contactId),
        ownerIdx: index('idx_cases_owner').on(table.ownerId),
        statusIdx: index('idx_cases_status').on(table.status),
        priorityIdx: index('idx_cases_priority').on(table.priority),
        slaIdx: index('idx_cases_sla').on(table.slaDueAt).where(
            sql`${table.status} NOT IN ('resolved', 'closed')`
        ),
    })
);

export const casesRelations = relations(cases, ({ one, many }) => ({
    contact: one(contacts, {
        fields: [cases.contactId],
        references: [contacts.id],
    }),
    account: one(accounts, {
        fields: [cases.accountId],
        references: [accounts.id],
    }),
    owner: one(users, {
        fields: [cases.ownerId],
        references: [users.id],
    }),
    team: one(teams, {
        fields: [cases.teamId],
        references: [teams.id],
    }),
    parentCase: one(cases, {
        fields: [cases.parentCaseId],
        references: [cases.id],
        relationName: 'caseHierarchy',
    }),
    childCases: many(cases, { relationName: 'caseHierarchy' }),
    // telefonate: many(telefonate), // Defined in communications.ts
    // emails: many(emails), // Defined in communications.ts
    //  chats: many(chats), // Defined in communications.ts
}));
