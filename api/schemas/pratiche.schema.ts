/**
 * CRM Bancario - Zod Validation Schemas: Pratiche Onboarding
 */

import { z } from 'zod';

/**
 * Pratica creation schema
 */
export const createPraticaSchema = z.object({
    contactId: z.string().uuid(),
    accountId: z.string().uuid().optional(),
    type: z.string().max(50), // apertura_conto, kyc_refresh, nuovo_prodotto
    productType: z.string().max(50).optional(),
    dueDate: z.string().date().optional(),
    requiredDocuments: z.array(z.object({
        type: z.string(),
        name: z.string(),
    })).optional(),
});

/**
 * Pratica update schema
 */
export const updatePraticaSchema = z.object({
    status: z.enum(['pending', 'in_progress', 'waiting_docs', 'review', 'approved', 'rejected']).optional(),
    currentStep: z.string().max(50).optional(),
    kycStatus: z.string().max(20).optional(),
    amlStatus: z.string().max(20).optional(),
    creditCheckStatus: z.string().max(20).optional(),
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
});

/**
 * Complete activity schema
 */
export const completeActivitySchema = z.object({
    outcome: z.string().max(50),
    outcomeNotes: z.string().optional(),
    checklist: z.array(z.object({
        item: z.string(),
        checked: z.boolean(),
        checkedBy: z.string().uuid().optional(),
        checkedAt: z.string().datetime().optional(),
    })).optional(),
});

/**
 * Approve/Reject pratica schemas
 */
export const approvePraticaSchema = z.object({
    notes: z.string().optional(),
});

export const rejectPraticaSchema = z.object({
    rejectionReason: z.string().min(1),
    notes: z.string().optional(),
});
