/**
 * CRM Bancario - Zod Validation Schemas: illimity Connect
 */

import { z } from 'zod';

export const createIllimityConnectSchema = z.object({
    contactId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    productName: z.string().max(200).optional(),
    productCode: z.string().max(30).optional(),
    contractNumber: z.string().max(50).optional(),
    amount: z.string().optional(),
    interestRate: z.string().optional(),
    status: z.enum(['active', 'pending', 'suspended', 'closed']).default('pending'),
    expiresAt: z.string().optional(),
    notes: z.string().optional(),
});

export const updateIllimityConnectSchema = createIllimityConnectSchema.partial();

export const illimityConnectFiltersSchema = z.object({
    status: z.enum(['active', 'pending', 'suspended', 'closed']).optional(),
    contactId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});
