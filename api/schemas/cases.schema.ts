/**
 * CRM Bancario - Zod Validation Schemas: Cases
 */

import { z } from 'zod';

/**
 * Case creation schema
 */
export const createCaseSchema = z.object({
    contactId: z.string().uuid(),
    accountId: z.string().uuid().optional(),
    subject: z.string().min(1).max(500),
    description: z.string().optional(),
    type: z.string().max(50).optional(),
    category: z.string().max(50).optional(),
    subcategory: z.string().max(50).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    channel: z.enum(['phone', 'email', 'chat', 'web', 'branch', 'app']),
    tags: z.array(z.string()).optional(),
    customFields: z.record(z.any()).optional(),
});

/**
 * Case update schema
 */
export const updateCaseSchema = z.object({
    subject: z.string().min(1).max(500).optional(),
    description: z.string().optional(),
    type: z.string().max(50).optional(),
    category: z.string().max(50).optional(),
    subcategory: z.string().max(50).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    status: z.enum([
        'new',
        'open',
        'pending',
        'waiting_customer',
        'escalated',
        'resolved',
        'closed',
    ]).optional(),
    tags: z.array(z.string()).optional(),
    customFields: z.record(z.any()).optional(),
});

/**
 * Case assignment schema
 */
export const assignCaseSchema = z.object({
    ownerId: z.string().uuid(),
    teamId: z.string().uuid().optional(),
});

/**
 * Case escalation schema
 */
export const escalateCaseSchema = z.object({
    reason: z.string().min(1),
    escalateTo: z.string().uuid().optional(), // User ID
});

/**
 * Case resolution schema
 */
export const resolveCaseSchema = z.object({
    resolution: z.string().min(1),
    resolutionCode: z.string().max(50).optional(),
    csatScore: z.number().int().min(1).max(5).optional(),
    csatComment: z.string().optional(),
});

/**
 * Case query filters
 */
export const caseFiltersSchema = z.object({
    contactId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    ownerId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
    status: z.enum([
        'new',
        'open',
        'pending',
        'waiting_customer',
        'escalated',
        'resolved',
        'closed',
    ]).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    channel: z.enum(['phone', 'email', 'chat', 'web', 'branch', 'app']).optional(),
    slaBreached: z.boolean().optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});
