/**
 * CRM Bancario - Database Schema: Users (CRM Operators)
 */

import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teams } from './teams';
import { roles } from './teams';

/**
 * USERS - CRM operators/agents
 * PII fields: email, first_name, last_name, phone
 */
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Authentication (Clerk integration)
    clerkId: varchar('clerk_id', { length: 255 }).unique(), // Clerk user ID

    // Personal info (PII)
    email: varchar('email', { length: 255 }).notNull().unique(), // PII
    passwordHash: varchar('password_hash', { length: 255 }), // If not using Clerk
    firstName: varchar('first_name', { length: 100 }).notNull(), // PII
    lastName: varchar('last_name', { length: 100 }).notNull(), // PII
    phone: varchar('phone', { length: 20 }), // PII
    avatarUrl: text('avatar_url'),

    // Organization
    teamId: uuid('team_id').references(() => teams.id),
    roleId: uuid('role_id').references(() => roles.id).notNull(),

    // Twilio integration
    twilioWorkerSid: varchar('twilio_worker_sid', { length: 100 }),
    extension: varchar('extension', { length: 10 }),

    // Status
    isActive: boolean('is_active').default(true),
    isOnline: boolean('is_online').default(false),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),

    // Preferences
    preferences: jsonb('preferences').$type<{
        theme?: 'light' | 'dark';
        notifications?: boolean;
        language?: string;
    }>().default({ theme: 'light', notifications: true, language: 'it' }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
    team: one(teams, {
        fields: [users.teamId],
        references: [teams.id],
    }),
    role: one(roles, {
        fields: [users.roleId],
        references: [roles.id],
    }),
    // ownedAccounts: many(accounts), // Defined in accounts.ts
    // assignedCases: many(cases), // Defined in cases.ts
    // assignedPratiche: many(praticheOnboarding), // Defined in onboarding.ts
}));
