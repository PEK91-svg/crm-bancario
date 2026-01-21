/**
 * CRM Bancario - Zod Validation Schemas: Communications
 */

import { z } from 'zod';

/**
 * Phone call creation schema
 */
export const createCallSchema = z.object({
    contactId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    caseId: z.string().uuid().optional(),
    direction: z.enum(['inbound', 'outbound']),
    phoneNumber: z.string().max(20),
    duration: z.number().int().min(0), // seconds
    outcome: z.enum(['answered', 'no_answer', 'voicemail', 'busy', 'failed', 'resolved', 'escalated']),
    notes: z.string().optional(),
    recordingUrl: z.string().url().optional(),
    twilioSid: z.string().optional(),
    sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
});

/**
 * Call update schema
 */
export const updateCallSchema = createCallSchema.partial();

/**
 * Email creation schema
 */
export const createEmailSchema = z.object({
    contactId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    caseId: z.string().uuid().optional(),
    direction: z.enum(['inbound', 'outbound']),
    from: z.string().email(),
    to: z.string().email(),
    cc: z.array(z.string().email()).optional(),
    subject: z.string().max(255),
    body: z.string(),
    htmlBody: z.string().optional(),
    attachments: z.array(z.object({
        filename: z.string(),
        url: z.string().url(),
        size: z.number().int(),
        mimeType: z.string(),
    })).optional(),
    sentAt: z.string().datetime().optional(),
    deliveredAt: z.string().datetime().optional(),
    openedAt: z.string().datetime().optional(),
    sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
});

/**
 * Email update schema
 */
export const updateEmailSchema = createEmailSchema.partial();

/**
 * Chat session creation schema
 */
export const createChatSchema = z.object({
    contactId: z.string().uuid(),
    accountId: z.string().uuid().optional(),
    caseId: z.string().uuid().optional(),
    channel: z.enum(['whatsapp', 'messenger', 'webchat', 'instagram']).default('webchat'),
    status: z.enum(['active', 'waiting', 'closed']).default('active'),
});

/**
 * Chat message creation schema
 */
export const addChatMessageSchema = z.object({
    sender: z.enum(['agent', 'contact', 'bot']),
    message: z.string().min(1),
    messageType: z.enum(['text', 'image', 'file', 'carousel']).default('text'),
    metadata: z.record(z.any()).optional(),
});

/**
 * Communications query filters
 */
export const communicationsFiltersSchema = z.object({
    contactId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    caseId: z.string().uuid().optional(),
    channel: z.enum(['phone', 'email', 'chat']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});
