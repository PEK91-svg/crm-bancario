/**
 * CRM Bancario - GDPR API Routes
 * Data export, anonymization, consent management
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requirePermission, requireAnyPermission } from '../middleware/rbac';
import { requireConfirmation } from '../middleware/security';
import {
    exportContactData,
    anonymizeContact,
    deleteContactData,
    getConsentHistory
} from '../services/gdprService';
import { NotFoundError } from '../middleware/errorHandler';

const app = new Hono();

/**
 * GET /gdpr/export/:contactId
 * Export all personal data for a contact (GDPR Article 15)
 */
app.get(
    '/export/:contactId',
    requireAnyPermission('contacts:export', 'admin:settings'),
    async (c) => {
        const contactId = c.req.param('contactId');
        const user = c.get('user');

        try {
            const exportData = await exportContactData(contactId, {
                userId: user.id,
                userEmail: user.email,
            });

            // Set headers for download
            c.header('Content-Type', 'application/json');
            c.header('Content-Disposition', `attachment; filename="contact-${contactId}-export-${Date.now()}.json"`);

            return c.json(exportData);
        } catch (error) {
            throw NotFoundError('Contact');
        }
    }
);

/**
 * POST /gdpr/anonymize/:contactId
 * Anonymize contact data (Right to be Forgotten - GDPR Article 17)
 */
app.post(
    '/anonymize/:contactId',
    requireAnyPermission('contacts:delete', 'admin:settings'),
    zValidator('json', z.object({
        reason: z.string().optional(),
    })),
    async (c) => {
        const contactId = c.req.param('contactId');
        const { reason } = c.req.valid('json');
        const user = c.get('user');

        const result = await anonymizeContact(contactId, {
            userId: user.id,
            userEmail: user.email,
            reason,
        });

        return c.json(result);
    }
);

/**
 * DELETE /gdpr/delete/:contactId
 * Hard delete contact and all data (WARNING: Irreversible)
 * Requires explicit confirmation
 */
app.delete(
    '/delete/:contactId',
    requirePermission('admin:settings'), // Admin only
    zValidator('json', z.object({
        confirmation: z.literal('I CONFIRM DELETE'),
    })),
    async (c) => {
        const contactId = c.req.param('contactId');
        const { confirmation } = c.req.valid('json');
        const user = c.get('user');

        const result = await deleteContactData(contactId, {
            userId: user.id,
            userEmail: user.email,
            confirmation,
        });

        return c.json(result);
    }
);

/**
 * GET /gdpr/consent-history/:contactId
 * Get consent change history
 */
app.get(
    '/consent-history/:contactId',
    requireAnyPermission('contacts:read', 'admin:audit'),
    async (c) => {
        const contactId = c.req.param('contactId');

        const history = await getConsentHistory(contactId);

        return c.json(history);
    }
);

export default app;
