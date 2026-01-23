/**
 * CRM Bancario - API Routes: illimity Connect
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../../db';
import { illimityConnect } from '../../db/schema';
import { eq, and, like, or, sql } from 'drizzle-orm';
import {
    createIllimityConnectSchema,
    updateIllimityConnectSchema,
    illimityConnectFiltersSchema,
} from '../schemas/illimity-connect.schema';
import { requirePermission } from '../middleware/rbac';
import { NotFoundError } from '../middleware/errorHandler';

const app = new Hono();

/**
 * GET /illimity-connect
 */
app.get(
    '/',
    requirePermission('products:read'),
    zValidator('query', illimityConnectFiltersSchema),
    async (c) => {
        const filters = c.req.valid('query');
        const { limit, offset, search, ...where } = filters;

        const conditions = [];

        if (where.status) {
            conditions.push(eq(illimityConnect.status, where.status));
        }

        if (where.contactId) {
            conditions.push(eq(illimityConnect.contactId, where.contactId));
        }

        if (where.accountId) {
            conditions.push(eq(illimityConnect.accountId, where.accountId));
        }

        if (search) {
            conditions.push(
                or(
                    like(illimityConnect.productName, `%${search}%`),
                    like(illimityConnect.contractNumber, `%${search}%`)
                )!
            );
        }

        let query = db.select().from(illimityConnect);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        query = query.limit(limit).offset(offset);

        const results = await query;

        let countQuery = db.select({ count: sql`count(*)` }).from(illimityConnect);
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
 * POST /illimity-connect
 */
app.post(
    '/',
    requirePermission('products:write'),
    zValidator('json', createIllimityConnectSchema),
    async (c) => {
        const data = c.req.valid('json');

        const [product] = await db
            .insert(illimityConnect)
            .values(data)
            .returning();

        return c.json(product, 201);
    }
);

/**
 * GET /illimity-connect/:id
 */
app.get('/:id', requirePermission('products:read'), async (c) => {
    const id = c.req.param('id');

    const product = await db.query.illimityConnect.findFirst({
        where: eq(illimityConnect.id, id),
        with: {
            contact: true,
            account: true,
        },
    });

    if (!product) {
        throw NotFoundError('illimity Connect');
    }

    return c.json(product);
});

/**
 * PUT /illimity-connect/:id
 */
app.put(
    '/:id',
    requirePermission('products:write'),
    zValidator('json', updateIllimityConnectSchema),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const existing = await db.query.illimityConnect.findFirst({
            where: eq(illimityConnect.id, id),
        });

        if (!existing) {
            throw NotFoundError('illimity Connect');
        }

        const [updated] = await db
            .update(illimityConnect)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(illimityConnect.id, id))
            .returning();

        return c.json(updated);
    }
);

/**
 * DELETE /illimity-connect/:id
 */
app.delete('/:id', requirePermission('products:write'), async (c) => {
    const id = c.req.param('id');

    const existing = await db.query.illimityConnect.findFirst({
        where: eq(illimityConnect.id, id),
    });

    if (!existing) {
        throw NotFoundError('illimity Connect');
    }

    const [updated] = await db
        .update(illimityConnect)
        .set({ status: 'closed', updatedAt: new Date() })
        .where(eq(illimityConnect.id, id))
        .returning();

    return c.json({ message: 'illimity Connect product closed successfully', id: updated.id });
});

export default app;
