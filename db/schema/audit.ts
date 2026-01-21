/**
 * CRM Bancario - Database Schema: Audit Log
 */

import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    jsonb,
    inet,
    index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * AUDIT_LOG - Complete audit trail for compliance
 * CRITICAL: This table is APPEND-ONLY. No UPDATE/DELETE allowed.
 */
export const auditLog = pgTable(
    'audit_log',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        // User attribution
        userId: uuid('user_id').references(() => users.id),
        userEmail: varchar('user_email', { length: 255 }),

        // Action details
        action: varchar('action', { length: 50 }).notNull(), // create, update, delete, read_pii, export, login, logout
        entityType: varchar('entity_type', { length: 50 }).notNull(), // contact, account, case, pratica, etc.
        entityId: uuid('entity_id'),

        // Change tracking
        oldValues: jsonb('old_values').$type<Record<string, any>>(),
        newValues: jsonb('new_values').$type<Record<string, any>>(),
        changes: jsonb('changes').$type<Array<{
            field: string;
            oldValue: any;
            newValue: any;
        }>>(),

        // Request context
        ipAddress: inet('ip_address'),
        userAgent: text('user_agent'),
        requestId: varchar('request_id', { length: 100 }),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        entityIdx: index('idx_audit_entity').on(table.entityType, table.entityId),
        dateIdx: index('idx_audit_date').on(table.createdAt),
        userIdx: index('idx_audit_user').on(table.userId),
    })
);

export const auditLogRelations = relations(auditLog, ({ one }) => ({
    user: one(users, {
        fields: [auditLog.userId],
        references: [users.id],
    }),
}));
