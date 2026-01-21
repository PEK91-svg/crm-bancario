/**
 * CRM Bancario - Database Schema: Communications
 * Telefonate (Twilio), Emails, Chats
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
import { callDirectionEnum, emailDirectionEnum, chatChannelEnum } from './enums';
import { cases } from './cases';
import { contacts } from './accounts';
import { users } from './users';

/**
 * TELEFONATE - Phone calls (Twilio integration)
 */
export const telefonate = pgTable(
    'telefonate',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        caseId: uuid('case_id').references(() => cases.id),
        contactId: uuid('contact_id').references(() => contacts.id),
        userId: uuid('user_id').references(() => users.id), // Agent who handled the call

        // Twilio integration
        twilioCallSid: varchar('twilio_call_sid', { length: 50 }).unique(),
        twilioRecordingSid: varchar('twilio_recording_sid', { length: 50 }),
        twilioRecordingUrl: text('twilio_recording_url'),

        // Call details
        direction: callDirectionEnum('direction').notNull(),
        fromNumber: varchar('from_number', { length: 20 }),
        toNumber: varchar('to_number', { length: 20 }),

        // Timing
        startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
        answeredAt: timestamp('answered_at', { withTimezone: true }),
        endedAt: timestamp('ended_at', { withTimezone: true }),
        durationSeconds: integer('duration_seconds'),
        waitTimeSeconds: integer('wait_time_seconds'),

        // IVR tracking
        ivrPath: text('ivr_path').array(), // ['main_menu', 'option_2', 'support_queue']
        ivrReason: varchar('ivr_reason', { length: 100 }),
        status: varchar('status', { length: 20 }),
        disposition: varchar('disposition', { length: 50 }),

        // AI Features
        transcription: text('transcription'),
        transcriptionSummary: text('transcription_summary'),
        sentimentScore: decimal('sentiment_score', { precision: 3, scale: 2 }), // -1.00 to 1.00

        notes: text('notes'),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        caseIdx: index('idx_telefonate_case').on(table.caseId),
        twilioIdx: index('idx_telefonate_twilio').on(table.twilioCallSid),
    })
);

export const telefonateRelations = relations(telefonate, ({ one }) => ({
    case: one(cases, {
        fields: [telefonate.caseId],
        references: [cases.id],
    }),
    contact: one(contacts, {
        fields: [telefonate.contactId],
        references: [contacts.id],
    }),
    user: one(users, {
        fields: [telefonate.userId],
        references: [users.id],
    }),
}));

/**
 * EMAILS - Email communications
 */
export const emails = pgTable(
    'emails',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        caseId: uuid('case_id').references(() => cases.id),
        contactId: uuid('contact_id').references(() => contacts.id),
        userId: uuid('user_id').references(() => users.id), // Agent who sent/handled

        // Email threading
        threadId: varchar('thread_id', { length: 100 }),
        parentEmailId: uuid('parent_email_id').references((): any => emails.id),
        messageId: varchar('message_id', { length: 255 }).unique(),

        // Email details
        direction: emailDirectionEnum('direction').notNull(),
        fromAddress: varchar('from_address', { length: 255 }).notNull(),
        toAddresses: text('to_addresses').array().notNull(),
        ccAddresses: text('cc_addresses').array(),

        subject: varchar('subject', { length: 500 }),
        bodyText: text('body_text'),
        bodyHtml: text('body_html'),
        attachments: jsonb('attachments').$type<Array<{
            filename: string;
            contentType: string;
            size: number;
            url?: string;
        }>>().default([]),

        // Status
        isRead: boolean('is_read').default(false),
        isStarred: boolean('is_starred').default(false),

        // AI categorization
        category: varchar('category', { length: 50 }),
        intent: varchar('intent', { length: 50 }),
        sentimentScore: decimal('sentiment_score', { precision: 3, scale: 2 }),

        sentAt: timestamp('sent_at', { withTimezone: true }),
        receivedAt: timestamp('received_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        caseIdx: index('idx_emails_case').on(table.caseId),
        threadIdx: index('idx_emails_thread').on(table.threadId),
    })
);

export const emailsRelations = relations(emails, ({ one, many }) => ({
    case: one(cases, {
        fields: [emails.caseId],
        references: [cases.id],
    }),
    contact: one(contacts, {
        fields: [emails.contactId],
        references: [contacts.id],
    }),
    user: one(users, {
        fields: [emails.userId],
        references: [users.id],
    }),
    parentEmail: one(emails, {
        fields: [emails.parentEmailId],
        references: [emails.id],
        relationName: 'emailThread',
    }),
    replies: many(emails, { relationName: 'emailThread' }),
}));

/**
 * CHATS - Chat sessions (webchat, WhatsApp, Telegram)
 */
export const chats = pgTable(
    'chats',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        caseId: uuid('case_id').references(() => cases.id),
        contactId: uuid('contact_id').references(() => contacts.id),
        userId: uuid('user_id').references(() => users.id), // Assigned agent

        channel: chatChannelEnum('channel').notNull(),
        externalChatId: varchar('external_chat_id', { length: 100 }),
        status: varchar('status', { length: 20 }).default('active'),

        // Session timing
        startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
        endedAt: timestamp('ended_at', { withTimezone: true }),
        lastMessageAt: timestamp('last_message_at', { withTimezone: true }),

        // Metrics
        messageCount: integer('message_count').default(0),
        firstResponseTimeSeconds: integer('first_response_time_seconds'),

        // Rating
        rating: integer('rating'), // 1-5
        ratingComment: text('rating_comment'),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        caseIdx: index('idx_chats_case').on(table.caseId),
        activeIdx: index('idx_chats_active').on(table.status).where(
            sql`${table.status} = 'active'`
        ),
    })
);

export const chatsRelations = relations(chats, ({ one, many }) => ({
    case: one(cases, {
        fields: [chats.caseId],
        references: [cases.id],
    }),
    contact: one(contacts, {
        fields: [chats.contactId],
        references: [contacts.id],
    }),
    user: one(users, {
        fields: [chats.userId],
        references: [users.id],
    }),
    messages: many(chatMessages),
}));

/**
 * CHAT_MESSAGES - Individual chat messages
 */
export const chatMessages = pgTable('chat_messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    chatId: uuid('chat_id').references(() => chats.id, { onDelete: 'cascade' }),

    senderType: varchar('sender_type', { length: 20 }).notNull(), // 'contact', 'user', 'bot'
    senderId: uuid('sender_id'), // Reference to contacts or users

    messageType: varchar('message_type', { length: 20 }).default('text'),
    content: text('content').notNull(),
    attachments: jsonb('attachments').$type<Array<{
        type: string;
        url: string;
        filename?: string;
    }>>().default([]),

    isRead: boolean('is_read').default(false),
    readAt: timestamp('read_at', { withTimezone: true }),

    // AI/Bot features
    intent: varchar('intent', { length: 50 }),
    entities: jsonb('entities').$type<Record<string, any>>(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
    chat: one(chats, {
        fields: [chatMessages.chatId],
        references: [chats.id],
    }),
}));
