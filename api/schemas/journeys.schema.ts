/**
 * CRM Bancario - Zod Validation Schemas: Marketing Journeys
 */

import { z } from 'zod';

/**
 * Journey creation schema
 */
export const createJourneySchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    triggerType: z.enum(['manual', 'event_based', 'scheduled']),
    triggerConfig: z.record(z.any()).optional(),
    steps: z.array(z.object({
        name: z.string(),
        type: z.enum(['email', 'sms', 'wait', 'webhook']),
        config: z.record(z.any()),
        delayHours: z.number().int().min(0).optional(),
    })).optional(),
    tags: z.array(z.string()).optional(),
    goalMetric: z.string().optional(),
});

/**
 * Journey update schema (all fields optional)
 */
export const updateJourneySchema = createJourneySchema.partial();

/**
 * Journey filters schema
 */
export const journeyFiltersSchema = z.object({
    status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
    tags: z.string().optional(), // Comma-separated
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Enroll contact schema
 */
export const enrollContactSchema = z.object({
    contactId: z.string().uuid(),
    metadata: z.record(z.any()).optional(),
});

/**
 * Bulk enroll schema
 */
export const bulkEnrollSchema = z.object({
    contactIds: z.array(z.string().uuid()).min(1).max(1000),
    metadata: z.record(z.any()).optional(),
});
