/**
 * CRM Bancario - Zod Validation Schemas: Linee Libere
 */

import { z } from 'zod';

export const createLineaLiberaSchema = z.object({
    contactId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    contoId: z.string().uuid().optional(),
    name: z.string().max(200).optional(),
    lineNumber: z.string().max(30).optional(),
    type: z.string().max(50).optional(),
    grantedAmount: z.string().min(1),
    usedAmount: z.string().optional(),
    availableAmount: z.string().optional(),
    interestRate: z.string().optional(),
    status: z.enum(['active', 'suspended', 'revoked', 'closed']).default('active'),
    grantedAt: z.string().optional(),
    expiresAt: z.string().optional(),
    renewalDate: z.string().optional(),
    notes: z.string().optional(),
});

export const updateLineaLiberaSchema = createLineaLiberaSchema.partial();

export const lineeLibereFiltersSchema = z.object({
    status: z.enum(['active', 'suspended', 'revoked', 'closed']).optional(),
    contactId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});
