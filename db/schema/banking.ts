/**
 * CRM Bancario - Database Schema: Banking Products
 * Conti Correnti & Progetti di Spesa
 */

import {
    pgTable,
    uuid,
    varchar,
    text,
    decimal,
    timestamp,
    date,
    index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { contoTypeEnum, contoStatusEnum, progettoStatusEnum } from './enums';
import { contacts } from './accounts';
import { accounts } from './accounts';

/**
 * CONTI CORRENTI - Banking accounts
 * CRITICAL PII: iban, account_number, balance
 */
export const contiCorrenti = pgTable(
    'conti_correnti',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
        accountId: uuid('account_id').references(() => accounts.id),

        // Banking identifiers (CRITICAL PII - financial data)
        iban: varchar('iban', { length: 34 }).notNull().unique(), // CRITICAL PII
        accountNumber: varchar('account_number', { length: 20 }), // CRITICAL PII
        type: contoTypeEnum('type').notNull().default('conto_corrente'),
        name: varchar('name', { length: 100 }),
        currency: varchar('currency', { length: 3 }).default('EUR'),

        // Balances (SENSITIVE financial data)
        balance: decimal('balance', { precision: 15, scale: 2 }).default('0'), // SENSITIVE
        availableBalance: decimal('available_balance', { precision: 15, scale: 2 }).default('0'), // SENSITIVE
        balanceUpdatedAt: timestamp('balance_updated_at', { withTimezone: true }),

        // Status & lifecycle
        status: contoStatusEnum('status').default('active'),
        openedAt: date('opened_at'),
        closedAt: date('closed_at'),

        // Product info
        productCode: varchar('product_code', { length: 20 }),
        productName: varchar('product_name', { length: 100 }),
        interestRate: decimal('interest_rate', { precision: 5, scale: 4 }), // e.g., 3.5000%

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        contactIdx: index('idx_conti_contact').on(table.contactId),
        ibanIdx: index('idx_conti_iban').on(table.iban),
        statusIdx: index('idx_conti_status').on(table.status),
    })
);

export const contiCorrentiRelations = relations(contiCorrenti, ({ one, many }) => ({
    contact: one(contacts, {
        fields: [contiCorrenti.contactId],
        references: [contacts.id],
    }),
    account: one(accounts, {
        fields: [contiCorrenti.accountId],
        references: [accounts.id],
    }),
    // progettiSpesa: many(progettiSpesa), // Defined below
}));

/**
 * PROGETTI DI SPESA - Savings goals
 */
export const progettiSpesa = pgTable(
    'progetti_spesa',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
        accountId: uuid('account_id').references(() => accounts.id),
        contoId: uuid('conto_id').references(() => contiCorrenti.id),

        name: varchar('name', { length: 200 }).notNull(),
        description: text('description'),
        category: varchar('category', { length: 50 }), // auto, casa, vacanza, istruzione

        // Financial goals
        targetAmount: decimal('target_amount', { precision: 15, scale: 2 }).notNull(),
        currentAmount: decimal('current_amount', { precision: 15, scale: 2 }).default('0'),
        monthlyContribution: decimal('monthly_contribution', { precision: 15, scale: 2 }),

        // Timeline
        startDate: date('start_date').notNull(),
        targetDate: date('target_date'),
        completedAt: timestamp('completed_at', { withTimezone: true }),

        status: progettoStatusEnum('status').default('draft'),

        // Progress percentage (computed column)
        // progressPercentage: computed in application layer or via SQL view

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        contactIdx: index('idx_progetti_contact').on(table.contactId),
        statusIdx: index('idx_progetti_status').on(table.status),
    })
);

export const progettiSpesaRelations = relations(progettiSpesa, ({ one }) => ({
    contact: one(contacts, {
        fields: [progettiSpesa.contactId],
        references: [contacts.id],
    }),
    account: one(accounts, {
        fields: [progettiSpesa.accountId],
        references: [accounts.id],
    }),
    conto: one(contiCorrenti, {
        fields: [progettiSpesa.contoId],
        references: [contiCorrenti.id],
    }),
}));
