/**
 * CRM Bancario - Zod Validation Schemas: Conti Correnti
 */

import { z } from 'zod';

export const createContoCorrenteSchema = z.object({
    contactId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    iban: z.string().min(15).max(34),
    accountNumber: z.string().max(20).optional(),
    type: z.enum(['conto_corrente', 'conto_deposito', 'conto_titoli', 'carta_credito']).default('conto_corrente'),
    name: z.string().max(100).optional(),
    currency: z.string().length(3).default('EUR'),
    balance: z.string().optional(),
    availableBalance: z.string().optional(),
    status: z.enum(['active', 'dormant', 'blocked', 'closed']).default('active'),
    openedAt: z.string().optional(),
    productCode: z.string().max(20).optional(),
    productName: z.string().max(100).optional(),
    interestRate: z.string().optional(),
});

export const updateContoCorrenteSchema = createContoCorrenteSchema.partial();

export const contiCorrentiFiltersSchema = z.object({
    type: z.enum(['conto_corrente', 'conto_deposito', 'conto_titoli', 'carta_credito']).optional(),
    status: z.enum(['active', 'dormant', 'blocked', 'closed']).optional(),
    contactId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});
