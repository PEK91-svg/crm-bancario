/**
 * CRM Bancario - API Routes: Accounts
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../../db';
import { accounts } from '../../db/schema';
import { eq, and, like, or, sql } from 'drizzle-orm';
import {
    createAccountSchema,
    updateAccountSchema,
    accountFiltersSchema,
} from '../schemas/accounts.schema';
import { requirePermission } from '../middleware/rbac';
import { NotFoundError } from '../middleware/errorHandler';
import { logAudit } from '../middleware/audit';

const app = new Hono();

/**
 * GET /accounts
 * List accounts with filtering and pagination
 */
app.get(
    '/',
    requirePermission('accounts:read'),
    zValidator('query', accountFiltersSchema),
    async (c) => {
        const filters = c.req.valid('query');
        const { limit, offset, search, ...where } = filters;

        let query = db.select().from(accounts);

        // Apply filters
        const conditions = [];

        if (where.type) {
            conditions.push(eq(accounts.type, where.type));
        }

        if (where.segment) {
            conditions.push(eq(accounts.segment, where.segment));
        }

        if (where.ownerId) {
            conditions.push(eq(accounts.ownerId, where.ownerId));
        }

        if (where.isActive !== undefined) {
            conditions.push(eq(accounts.isActive, where.isActive));
        }

        // Full-text search
        if (search) {
            conditions.push(
                or(
                    like(accounts.name, `%${search}%`),
                    like(accounts.ndg, `%${search}%`)
                )!
            );
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        // Pagination
        query = query.limit(limit).offset(offset);

        const results = await query;

        // Count total (for pagination metadata)
        let countQuery = db.select({ count: sql`count(*)` }).from(accounts);
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
 * POST /accounts
 * Create new account
 */
app.post(
    '/',
    requirePermission('accounts:write'),
    zValidator('json', createAccountSchema),
    async (c) => {
        const data = c.req.valid('json');
        const user = (c as any).get('user');

        const [account] = await db
            .insert(accounts)
            .values({
                ...data,
                ownerId: data.ownerId || user.id, // Default to current user
            })
            .returning();

        return c.json(account, 201);
    }
);

/**
 * GET /accounts/:id
 * Get account by ID
 */
app.get('/:id', requirePermission('accounts:read'), async (c) => {
    const id = c.req.param('id');

    const account = await db.query.accounts.findFirst({
        where: eq(accounts.id, id),
        with: {
            owner: {
                columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            // contacts: true, // Could include related contacts
        },
    });

    if (!account) {
        throw NotFoundError('Account');
    }

    return c.json(account);
});

/**
 * PUT /accounts/:id
 * Update account
 */
app.put(
    '/:id',
    requirePermission('accounts:write'),
    zValidator('json', updateAccountSchema),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        // Check if account exists
        const existing = await db.query.accounts.findFirst({
            where: eq(accounts.id, id),
        });

        if (!existing) {
            throw NotFoundError('Account');
        }

        const [updated] = await db
            .update(accounts)
            .set(data)
            .where(eq(accounts.id, id))
            .returning();

        return c.json(updated);
    }
);

/**
 * GET /accounts/:id/contacts
 * Get contacts for an account
 */
app.get('/:id/contacts', requirePermission('contacts:read'), async (c) => {
    const accountId = c.req.param('id');

    const accountContacts = await db.query.contacts.findMany({
        where: (contacts, { eq }) => eq(contacts.accountId, accountId),
    });

    return c.json({ data: accountContacts });
});

/**
 * GET /accounts/:id/cases
 * Get cases for an account
 */
app.get('/:id/cases', requirePermission('cases:read'), async (c) => {
    const accountId = c.req.param('id');

    const accountCases = await db.query.cases.findMany({
        where: (cases, { eq }) => eq(cases.accountId, accountId),
        orderBy: (cases, { desc }) => [desc(cases.createdAt)],
        limit: 50,
    });

    return c.json({ data: accountCases });
});

/**
 * DELETE /accounts/:id
 * Soft delete an account (set isActive = false)
 */
app.delete(
    '/:id',
    requirePermission('accounts:write'),
    async (c) => {
        const id = c.req.param('id');
        const user = c.get('user');

        const existing = await db.query.accounts.findFirst({
            where: eq(accounts.id, id),
        });

        if (!existing) {
            throw new NotFoundError('Account not found');
        }

        const [deleted] = await db
            .update(accounts)
            .set({
                isActive: false,
                updatedAt: new Date()
            })
            .where(eq(accounts.id, id))
            .returning();

        // Log deletion
        await logAudit({
            userId: user.id,
            userEmail: user.email,
            action: 'delete',
            entityType: 'account',
            entityId: id,
            metadata: { softDelete: true }
        });

        return c.json({ message: 'Account deleted successfully', id: deleted.id });
    }
);

export default app;
