/**
 * CRM Bancario - API Routes: Contacts
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../../db';
import { contacts, contiCorrenti, progettiSpesa, cases, telefonate, emails, chats } from '../../db/schema';
import { eq, and, like, or, desc, sql } from 'drizzle-orm';
import {
    createContactSchema,
    updateContactSchema,
    contactFiltersSchema,
    updateConsentSchema,
} from '../schemas/contacts.schema';
import { requirePermission } from '../middleware/rbac';
import { NotFoundError } from '../middleware/errorHandler';
import { logAudit } from '../middleware/audit';

const app = new Hono();

/**
 * GET /contacts
 * List contacts with filtering
 */
app.get(
    '/',
    requirePermission('contacts:read'),
    zValidator('query', contactFiltersSchema),
    async (c) => {
        const filters = c.req.valid('query');
        const { limit, offset, search, ...where } = filters;

        let query = db.select().from(contacts);

        const conditions = [];

        if (where.accountId) {
            conditions.push(eq(contacts.accountId, where.accountId));
        }

        if (where.isPrimary !== undefined) {
            conditions.push(eq(contacts.isPrimary, where.isPrimary));
        }

        if (where.isActive !== undefined) {
            conditions.push(eq(contacts.isActive, where.isActive));
        }

        if (search) {
            conditions.push(
                or(
                    like(contacts.firstName, `%${search}%`),
                    like(contacts.lastName, `%${search}%`),
                    like(contacts.email, `%${search}%`)
                )!
            );
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        query = query.limit(limit).offset(offset);

        const results = await query;

        let countQuery = db.select({ count: sql`count(*)` }).from(contacts);
        if (conditions.length > 0) {
            countQuery = countQuery.where(and(...conditions));
        }
        const [{ count }] = await countQuery;

        return c.json({
            data: results,
            pagination: {
                limit,
                offset,
                total: Number(count),
                hasMore: offset + limit < Number(count),
            },
        });
    }
);

/**
 * POST /contacts
 * Create new contact
 */
app.post(
    '/',
    requirePermission('contacts:write'),
    zValidator('json', createContactSchema),
    async (c) => {
        const data = c.req.valid('json');

        const [contact] = await db.insert(contacts).values(data).returning();

        return c.json(contact, 201);
    }
);

/**
 * GET /contacts/:id
 * Get contact by ID
 */
app.get('/:id', requirePermission('contacts:read'), async (c) => {
    const id = c.req.param('id');

    const contact = await db.query.contacts.findFirst({
        where: eq(contacts.id, id),
        with: {
            account: {
                columns: {
                    id: true,
                    name: true,
                    ndg: true,
                    segment: true,
                },
            },
        },
    });

    if (!contact) {
        throw NotFoundError('Contact');
    }

    return c.json(contact);
});

/**
 * PUT /contacts/:id
 * Update contact
 */
app.put(
    '/:id',
    requirePermission('contacts:write'),
    zValidator('json', updateContactSchema),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const existing = await db.query.contacts.findFirst({
            where: eq(contacts.id, id),
        });

        if (!existing) {
            throw NotFoundError('Contact');
        }

        const [updated] = await db
            .update(contacts)
            .set(data)
            .where(eq(contacts.id, id))
            .returning();

        return c.json(updated);
    }
);

/**
 * GET /contacts/:id/360
 * Get 360° view of contact (all related data)
 */
app.get('/:id/360', requirePermission('contacts:read'), async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');

    const contact = await db.query.contacts.findFirst({
        where: eq(contacts.id, id),
        with: {
            account: true,
        },
    });

    if (!contact) {
        throw NotFoundError('Contact');
    }

    // Fetch related data in parallel
    const [conti, progetti, contactCases, recentCalls, recentEmails, recentChats] = await Promise.all([
        db.query.contiCorrenti.findMany({
            where: eq(contiCorrenti.contactId, id),
        }),
        db.query.progettiSpesa.findMany({
            where: eq(progettiSpesa.contactId, id),
        }),
        db.query.cases.findMany({
            where: eq(cases.contactId, id),
            orderBy: [desc(cases.createdAt)],
            limit: 10,
        }),
        db.query.telefonate.findMany({
            where: eq(telefonate.contactId, id),
            orderBy: [desc(telefonate.startedAt)],
            limit: 5,
        }),
        db.query.emails.findMany({
            where: eq(emails.contactId, id),
            orderBy: [desc(emails.createdAt)],
            limit: 5,
        }),
        db.query.chats.findMany({
            where: eq(chats.contactId, id),
            orderBy: [desc(chats.createdAt)],
            limit: 5,
        }),
    ]);

    // Log PII access
    await logAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'read_pii',
        entityType: 'contact',
        entityId: id,
    });

    return c.json({
        contact,
        conti,
        progetti,
        cases: contactCases,
        recentCommunications: {
            calls: recentCalls,
            emails: recentEmails,
            chats: recentChats,
        },
    });
});

/**
 * GET /contacts/:id/timeline
 * Get activity timeline for contact
 */
app.get('/:id/timeline', requirePermission('contacts:read'), async (c) => {
    const id = c.req.param('id');

    // Fetch all activities and merge into timeline
    const [contactCases, calls, contactEmails, contactChats] = await Promise.all([
        db.query.cases.findMany({
            where: eq(cases.contactId, id),
            orderBy: [desc(cases.createdAt)],
            limit: 20,
        }),
        db.query.telefonate.findMany({
            where: eq(telefonate.contactId, id),
            orderBy: [desc(telefonate.startedAt)],
            limit: 20,
        }),
        db.query.emails.findMany({
            where: eq(emails.contactId, id),
            orderBy: [desc(emails.createdAt)],
            limit: 20,
        }),
        db.query.chats.findMany({
            where: eq(chats.contactId, id),
            orderBy: [desc(chats.createdAt)],
            limit: 20,
        }),
    ]);

    // Merge and sort timeline
    const timeline = [
        ...contactCases.map((c) => ({ type: 'case', timestamp: c.createdAt, data: c })),
        ...calls.map((c) => ({ type: 'call', timestamp: c.startedAt, data: c })),
        ...contactEmails.map((e) => ({ type: 'email', timestamp: e.createdAt, data: e })),
        ...contactChats.map((ch) => ({ type: 'chat', timestamp: ch.createdAt, data: ch })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({ timeline });
});

/**
 * PATCH /contacts/:id/consent
 * Update GDPR consent
 */
app.patch(
    '/:id/consent',
    requirePermission('contacts:write'),
    zValidator('json', updateConsentSchema),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');
        const user = c.get('user');

        const existing = await db.query.contacts.findFirst({
            where: eq(contacts.id, id),
        });

        if (!existing) {
            throw NotFoundError('Contact');
        }

        const [updated] = await db
            .update(contacts)
            .set(data)
            .where(eq(contacts.id, id))
            .returning();

        // Log consent change
        await logAudit({
            userId: user.id,
            userEmail: user.email,
            action: 'update_consent',
            entityType: 'contact',
            entityId: id,
            oldValues: {
                consentMarketing: existing.consentMarketing,
                consentProfiling: existing.consentProfiling,
            },
            newValues: data,
        });

        return c.json(updated);
    }
);

/**
 * DELETE /contacts/:id
 * Soft delete a contact (set isActive = false)
 */
app.delete(
    '/:id',
    requirePermission('contacts:write'),
    async (c) => {
        const id = c.req.param('id');
        const user = c.get('user');

        const existing = await db.query.contacts.findFirst({
            where: eq(contacts.id, id),
        });

        if (!existing) {
            throw new NotFoundError('Contact not found');
        }

        const [deleted] = await db
            .update(contacts)
            .set({
                isActive: false,
                updatedAt: new Date()
            })
            .where(eq(contacts.id, id))
            .returning();

        // Log deletion
        await logAudit({
            userId: user.id,
            userEmail: user.email,
            action: 'delete',
            entityType: 'contact',
            entityId: id,
            metadata: { softDelete: true }
        });

        return c.json({ message: 'Contact deleted successfully', id: deleted.id });
    }
);

export default app;
