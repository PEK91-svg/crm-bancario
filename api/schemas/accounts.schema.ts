/**
 * CRM Bancario - Zod Validation Schemas: Accounts
 */

import { z } from 'zod';

/**
 * Account creation schema
 */
export const createAccountSchema = z.object({
    ndg: z.string().max(20).optional(),
    fiscalCode: z.string().length(16).optional(),
    vatNumber: z.string().max(11).optional(),
    name: z.string().min(1).max(255),
    type: z.enum(['retail', 'premium', 'private', 'business']).default('retail'),
    segment: z.enum(['mass_market', 'affluent', 'hnwi', 'uhnwi']).default('mass_market'),
    billingAddress: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
    }).optional(),
    shippingAddress: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
    }).optional(),
    ownerId: z.string().uuid().optional(),
    parentAccountId: z.string().uuid().optional(),
    riskScore: z.number().int().min(1).max(100).optional(),
    lifetimeValue: z.number().optional(),
    npsScore: z.number().int().min(-100).max(100).optional(),
});

/**
 * Account update schema (all fields optional)
 */
export const updateAccountSchema = createAccountSchema.partial();

/**
 * Account query filters
 */
export const accountFiltersSchema = z.object({
    type: z.enum(['retail', 'premium', 'private', 'business']).optional(),
    segment: z.enum(['mass_market', 'affluent', 'hnwi', 'uhnwi']).optional(),
    ownerId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
    search: z.string().optional(), // Full-text search
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});
