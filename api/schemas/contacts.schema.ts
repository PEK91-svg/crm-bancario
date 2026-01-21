/**
 * CRM Bancario - Zod Validation Schemas: Contacts
 */

import { z } from 'zod';

/**
 * Contact creation schema
 */
export const createContactSchema = z.object({
    accountId: z.string().uuid().optional(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    fiscalCode: z.string().length(16).optional(),
    birthDate: z.string().datetime().or(z.date()).optional(),
    gender: z.enum(['M', 'F', 'O']).optional(),
    email: z.string().email().max(255).optional(),
    phone: z.string().max(20).optional(),
    mobile: z.string().max(20).optional(),
    jobTitle: z.string().max(100).optional(),
    isPrimary: z.boolean().default(false),
    isDecisionMaker: z.boolean().default(false),
    preferredChannel: z.enum(['phone', 'email', 'chat', 'web', 'branch', 'app']).default('email'),
    consentMarketing: z.boolean().default(false),
    consentProfiling: z.boolean().default(false),
});

/**
 * Contact update schema
 */
export const updateContactSchema = createContactSchema.partial();

/**
 * Contact query filters
 */
export const contactFiltersSchema = z.object({
    accountId: z.string().uuid().optional(),
    isPrimary: z.boolean().optional(),
    isActive: z.boolean().optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Consent update schema
 */
export const updateConsentSchema = z.object({
    consentMarketing: z.boolean(),
    consentProfiling: z.boolean(),
});
