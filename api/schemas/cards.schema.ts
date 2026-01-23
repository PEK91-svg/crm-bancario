/**
 * CRM Bancario - Zod Validation Schemas: Cards
 */

import { z } from 'zod';

export const createCardSchema = z.object({
    contactId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    contoId: z.string().uuid().optional(),
    cardNumber: z.string().max(19).optional(),
    lastFourDigits: z.string().length(4).optional(),
    cardholderName: z.string().max(100).optional(),
    type: z.enum(['credito', 'debito', 'prepagata', 'american_express']),
    circuit: z.enum(['visa', 'mastercard', 'american_express', 'maestro', 'vpay', 'bancomat']).optional(),
    productName: z.string().max(100).optional(),
    productCode: z.string().max(20).optional(),
    creditLimit: z.string().optional(),
    availableCredit: z.string().optional(),
    monthlyLimit: z.string().optional(),
    dailyLimit: z.string().optional(),
    status: z.enum(['active', 'blocked', 'expired', 'cancelled', 'pending_activation']).default('pending_activation'),
    issuedAt: z.string().optional(),
    expiresAt: z.string().optional(),
    blockReason: z.string().max(255).optional(),
    contactlessEnabled: z.boolean().default(true),
    onlinePaymentsEnabled: z.boolean().default(true),
    internationalEnabled: z.boolean().default(true),
});

export const updateCardSchema = createCardSchema.partial();

export const cardsFiltersSchema = z.object({
    type: z.enum(['credito', 'debito', 'prepagata', 'american_express']).optional(),
    status: z.enum(['active', 'blocked', 'expired', 'cancelled', 'pending_activation']).optional(),
    circuit: z.enum(['visa', 'mastercard', 'american_express', 'maestro', 'vpay', 'bancomat']).optional(),
    contactId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});
