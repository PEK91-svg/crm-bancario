/**
 * CRM Bancario - Database Schema: Banking Products
 * Carte, Linee Libere, illimity Connect
 */

import {
    pgTable,
    uuid,
    varchar,
    text,
    decimal,
    timestamp,
    date,
    boolean,
    index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
    cardTypeEnum,
    cardStatusEnum,
    cardCircuitEnum,
    lineaLiberaStatusEnum,
    illimityConnectStatusEnum,
} from './enums';
import { contacts } from './accounts';
import { accounts } from './accounts';
import { contiCorrenti } from './banking';

/**
 * CARTE - Cards (Credit, Debit, Prepaid, American Express)
 * CRITICAL PII: cardNumber, cvv
 */
export const cards = pgTable(
    'cards',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
        accountId: uuid('account_id').references(() => accounts.id),
        contoId: uuid('conto_id').references(() => contiCorrenti.id),

        // Card identifiers (CRITICAL PII)
        cardNumber: varchar('card_number', { length: 19 }), // CRITICAL PII - masked in responses
        lastFourDigits: varchar('last_four_digits', { length: 4 }),
        cardholderName: varchar('cardholder_name', { length: 100 }),

        // Card type and circuit
        type: cardTypeEnum('type').notNull(),
        circuit: cardCircuitEnum('circuit'),
        productName: varchar('product_name', { length: 100 }),
        productCode: varchar('product_code', { length: 20 }),

        // Limits
        creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }),
        availableCredit: decimal('available_credit', { precision: 15, scale: 2 }),
        monthlyLimit: decimal('monthly_limit', { precision: 15, scale: 2 }),
        dailyLimit: decimal('daily_limit', { precision: 15, scale: 2 }),

        // Status & lifecycle
        status: cardStatusEnum('status').default('pending_activation'),
        issuedAt: date('issued_at'),
        expiresAt: date('expires_at'),
        activatedAt: timestamp('activated_at', { withTimezone: true }),
        blockedAt: timestamp('blocked_at', { withTimezone: true }),
        blockReason: varchar('block_reason', { length: 255 }),

        // Settings
        contactlessEnabled: boolean('contactless_enabled').default(true),
        onlinePaymentsEnabled: boolean('online_payments_enabled').default(true),
        internationalEnabled: boolean('international_enabled').default(true),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        contactIdx: index('idx_cards_contact').on(table.contactId),
        typeIdx: index('idx_cards_type').on(table.type),
        statusIdx: index('idx_cards_status').on(table.status),
        circuitIdx: index('idx_cards_circuit').on(table.circuit),
    })
);

export const cardsRelations = relations(cards, ({ one }) => ({
    contact: one(contacts, {
        fields: [cards.contactId],
        references: [contacts.id],
    }),
    account: one(accounts, {
        fields: [cards.accountId],
        references: [accounts.id],
    }),
    conto: one(contiCorrenti, {
        fields: [cards.contoId],
        references: [contiCorrenti.id],
    }),
}));

/**
 * LINEE LIBERE - Credit Lines / Overdraft Facilities
 */
export const lineeLibere = pgTable(
    'linee_libere',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
        accountId: uuid('account_id').references(() => accounts.id),
        contoId: uuid('conto_id').references(() => contiCorrenti.id),

        // Line details
        name: varchar('name', { length: 200 }),
        lineNumber: varchar('line_number', { length: 30 }),
        type: varchar('type', { length: 50 }), // fido, apertura_credito, anticipo_fatture

        // Financial details
        grantedAmount: decimal('granted_amount', { precision: 15, scale: 2 }).notNull(),
        usedAmount: decimal('used_amount', { precision: 15, scale: 2 }).default('0'),
        availableAmount: decimal('available_amount', { precision: 15, scale: 2 }),
        interestRate: decimal('interest_rate', { precision: 5, scale: 4 }),

        // Status & lifecycle
        status: lineaLiberaStatusEnum('status').default('active'),
        grantedAt: date('granted_at'),
        expiresAt: date('expires_at'),
        renewalDate: date('renewal_date'),

        // Notes
        notes: text('notes'),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        contactIdx: index('idx_linee_libere_contact').on(table.contactId),
        statusIdx: index('idx_linee_libere_status').on(table.status),
    })
);

export const lineeLibereRelations = relations(lineeLibere, ({ one }) => ({
    contact: one(contacts, {
        fields: [lineeLibere.contactId],
        references: [contacts.id],
    }),
    account: one(accounts, {
        fields: [lineeLibere.accountId],
        references: [accounts.id],
    }),
    conto: one(contiCorrenti, {
        fields: [lineeLibere.contoId],
        references: [contiCorrenti.id],
    }),
}));

/**
 * ILLIMITY CONNECT - illimity Connect Products
 */
export const illimityConnect = pgTable(
    'illimity_connect',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
        accountId: uuid('account_id').references(() => accounts.id),

        // Product details
        productName: varchar('product_name', { length: 200 }),
        productCode: varchar('product_code', { length: 30 }),
        contractNumber: varchar('contract_number', { length: 50 }),

        // Financial details
        amount: decimal('amount', { precision: 15, scale: 2 }),
        interestRate: decimal('interest_rate', { precision: 5, scale: 4 }),

        // Status
        status: illimityConnectStatusEnum('status').default('pending'),
        activatedAt: timestamp('activated_at', { withTimezone: true }),
        expiresAt: date('expires_at'),

        // Notes
        notes: text('notes'),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        contactIdx: index('idx_illimity_connect_contact').on(table.contactId),
        statusIdx: index('idx_illimity_connect_status').on(table.status),
    })
);

export const illimityConnectRelations = relations(illimityConnect, ({ one }) => ({
    contact: one(contacts, {
        fields: [illimityConnect.contactId],
        references: [contacts.id],
    }),
    account: one(accounts, {
        fields: [illimityConnect.accountId],
        references: [accounts.id],
    }),
}));
