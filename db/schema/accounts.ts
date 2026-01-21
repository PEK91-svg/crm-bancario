/**
 * CRM Bancario - Database Schema: Accounts & Contacts
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
    index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { accountTypeEnum, accountSegmentEnum, caseChannelEnum, genderEnum } from './enums';
import { users } from './users';

/**
 * ACCOUNTS - Cliente anagrafica (persona fisica o giuridica)
 * PII fields: fiscal_code, vat_number, name, billing_address, shipping_address
 */
export const accounts = pgTable(
    'accounts',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        // Banking identifiers
        ndg: varchar('ndg', { length: 20 }).unique(), // Numero Di Gestione (PII)
        fiscalCode: varchar('fiscal_code', { length: 16 }), // Codice Fiscale (CRITICAL PII)
        vatNumber: varchar('vat_number', { length: 11 }), // P.IVA (PII)

        name: varchar('name', { length: 255 }).notNull(), // PII
        type: accountTypeEnum('type').notNull().default('retail'),
        segment: accountSegmentEnum('segment').default('mass_market'),

        // Addresses (JSONB for flexibility) (PII)
        billingAddress: jsonb('billing_address').$type<{
            street?: string;
            city?: string;
            province?: string;
            postalCode?: string;
            country?: string;
        }>(),
        shippingAddress: jsonb('shipping_address').$type<{
            street?: string;
            city?: string;
            province?: string;
            postalCode?: string;
            country?: string;
        }>(),

        // Relations
        ownerId: uuid('owner_id').references(() => users.id), // Account manager
        parentAccountId: uuid('parent_account_id').references((): any => accounts.id), // For hierarchies

        // Scoring & Metrics
        riskScore: integer('risk_score'), // 1-100
        lifetimeValue: decimal('lifetime_value', { precision: 15, scale: 2 }),
        npsScore: integer('nps_score'), // -100 to +100

        isActive: boolean('is_active').default(true),
        onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        ndgIdx: index('idx_accounts_ndg').on(table.ndg),
        segmentIdx: index('idx_accounts_segment').on(table.segment),
        ownerIdx: index('idx_accounts_owner').on(table.ownerId),
    })
);

export const accountsRelations = relations(accounts, ({ one, many }) => ({
    owner: one(users, {
        fields: [accounts.ownerId],
        references: [users.id],
    }),
    parentAccount: one(accounts, {
        fields: [accounts.parentAccountId],
        references: [accounts.id],
        relationName: 'accountHierarchy',
    }),
    childAccounts: many(accounts, { relationName: 'accountHierarchy' }),
    // contacts: many(contacts), // Defined below
    // cases: many(cases), // Defined in cases.ts
}));

/**
 * CONTACTS - Persone fisiche associate ad account
 * CRITICAL PII: fiscal_code, first_name, last_name, email, phone, mobile, birth_date
 */
export const contacts = pgTable(
    'contacts',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }),

        // Personal info (ALL PII)
        firstName: varchar('first_name', { length: 100 }).notNull(), // PII
        lastName: varchar('last_name', { length: 100 }).notNull(), // PII
        fiscalCode: varchar('fiscal_code', { length: 16 }), // CRITICAL PII
        birthDate: timestamp('birth_date', { mode: 'date' }), // PII
        gender: genderEnum('gender'), // PII

        // Contact info (PII)
        email: varchar('email', { length: 255 }), // PII
        phone: varchar('phone', { length: 20 }), // PII
        mobile: varchar('mobile', { length: 20 }), // PII

        jobTitle: varchar('job_title', { length: 100 }),
        isPrimary: boolean('is_primary').default(false), // Primary contact for account
        isDecisionMaker: boolean('is_decision_maker').default(false),

        // Communication preferences
        preferredChannel: caseChannelEnum('preferred_channel').default('email'),
        consentMarketing: boolean('consent_marketing').default(false), // GDPR
        consentProfiling: boolean('consent_profiling').default(false), // GDPR

        isActive: boolean('is_active').default(true),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        accountIdx: index('idx_contacts_account').on(table.accountId),
        emailIdx: index('idx_contacts_email').on(table.email),
        primaryIdx: index('idx_contacts_primary').on(table.accountId, table.isPrimary).where(
            sql`${table.isPrimary} = true`
        ),
    })
);

export const contactsRelations = relations(contacts, ({ one, many }) => ({
    account: one(accounts, {
        fields: [contacts.accountId],
        references: [accounts.id],
    }),
    // contiCorrenti: many(contiCorrenti), // Defined in banking.ts
    // progettiSpesa: many(progettiSpesa), // Defined in banking.ts
    // cases: many(cases), // Defined in cases.ts
}));
