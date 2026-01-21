/**
 * CRM Bancario - Database Schema: Marketing Journeys
 */

import {
    pgTable,
    uuid,
    varchar,
    text,
    integer,
    decimal,
    boolean,
    timestamp,
    jsonb,
    unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { contacts } from './accounts';
import { users } from './users';

/**
 * MARKETING_JOURNEYS - Customer journey automation campaigns
 */
export const marketingJourneys = pgTable('marketing_journeys', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),

    // Trigger configuration
    triggerType: varchar('trigger_type', { length: 50 }).notNull(), // signup, product_purchase, inactivity, birthday
    triggerConfig: jsonb('trigger_config').$type<Record<string, any>>().default({}),

    // Journey steps (JSONB array)
    steps: jsonb('steps').$type<Array<{
        id: string;
        type: 'email' | 'sms' | 'wait' | 'conditional';
        templateId?: string;
        delayHours?: number;
        condition?: Record<string, any>;
    }>>().notNull().default([]),

    // Segmentation
    segmentFilter: jsonb('segment_filter').$type<{
        accountType?: string[];
        segment?: string[];
        customFilters?: Record<string, any>;
    }>(),

    // Status & lifecycle
    status: varchar('status', { length: 20 }).default('draft'), // draft, active, paused, completed
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),

    // Analytics
    enrolledCount: integer('enrolled_count').default(0),
    completedCount: integer('completed_count').default(0),
    conversionCount: integer('conversion_count').default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
});

export const marketingJourneysRelations = relations(marketingJourneys, ({ one, many }) => ({
    creator: one(users, {
        fields: [marketingJourneys.createdBy],
        references: [users.id],
    }),
    // enrollments: many(journeyEnrollments), // Defined below
}));

/**
 * JOURNEY_ENROLLMENTS - Contact enrollments in journeys
 */
export const journeyEnrollments = pgTable(
    'journey_enrollments',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        journeyId: uuid('journey_id').references(() => marketingJourneys.id, { onDelete: 'cascade' }),
        contactId: uuid('contact_id').references(() => contacts.id),

        // Journey progress
        currentStep: varchar('current_step', { length: 50 }),
        status: varchar('status', { length: 20 }).default('active'), // active, completed, exited

        // Timing
        enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow(),
        completedAt: timestamp('completed_at', { withTimezone: true }),
        exitedAt: timestamp('exited_at', { withTimezone: true }),
        exitReason: varchar('exit_reason', { length: 100 }),

        // Conversion tracking
        converted: boolean('converted').default(false),
        conversionValue: decimal('conversion_value', { precision: 15, scale: 2 }),
    },
    (table) => ({
        // Unique constraint: one contact can be enrolled in a journey only once
        uniqueEnrollment: unique().on(table.journeyId, table.contactId),
    })
);

export const journeyEnrollmentsRelations = relations(journeyEnrollments, ({ one }) => ({
    journey: one(marketingJourneys, {
        fields: [journeyEnrollments.journeyId],
        references: [marketingJourneys.id],
    }),
    contact: one(contacts, {
        fields: [journeyEnrollments.contactId],
        references: [contacts.id],
    }),
}));
