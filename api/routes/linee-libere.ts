/**
 * CRM Bancario - API Routes: Linee Libere
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../../db';
import { lineeLibere } from '../../db/schema';
import { eq, and, like, or, sql } from 'drizzle-orm';
import {
    createLineaLiberaSchema,
    updateLineaLiberaSchema,
    lineeLibereFiltersSchema,
} from '../schemas/linee-libere.schema';
import { requirePermission } from '../middleware/rbac';
import { NotFoundError } from '../middleware/errorHandler';

const app = new Hono();

/**
 * GET /linee-libere
 */
app.get(
    '/',
    requirePermission('products:read'),
    zValidator('query', lineeLibereFiltersSchema),
    async (c) => {
        const filters = c.req.valid('query');
        const { limit, offset, search, ...where } = filters;

        const conditions = [];

        if (where.status) {
            conditions.push(eq(lineeLibere.status, where.status));
        }

        if (where.contactId) {
            conditions.push(eq(lineeLibere.contactId, where.contactId));
        }

        if (where.accountId) {
            conditions.push(eq(lineeLibere.accountId, where.accountId));
        }

        if (search) {
            conditions.push(
                or(
                    like(lineeLibere.name, `%${search}%`),
                    like(lineeLibere.lineNumber, `%${search}%`)
                )!
            );
        }

        let query = db.select().from(lineeLibere);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        query = query.limit(limit).offset(offset);

        const results = await query;

        let countQuery = db.select({ count: sql`count(*)` }).from(lineeLibere);
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
 * POST /linee-libere
 */
app.post(
    '/',
    requirePermission('products:write'),
    zValidator('json', createLineaLiberaSchema),
    async (c) => {
        const data = c.req.valid('json');

        const [linea] = await db
            .insert(lineeLibere)
            .values(data)
            .returning();

        return c.json(linea, 201);
    }
);

/**
 * GET /linee-libere/:id
 */
app.get('/:id', requirePermission('products:read'), async (c) => {
    const id = c.req.param('id');

    const linea = await db.query.lineeLibere.findFirst({
        where: eq(lineeLibere.id, id),
        with: {
            contact: true,
            account: true,
        },
    });

    if (!linea) {
        throw NotFoundError('Linea Libera');
    }

    return c.json(linea);
});

/**
 * PUT /linee-libere/:id
 */
app.put(
    '/:id',
    requirePermission('products:write'),
    zValidator('json', updateLineaLiberaSchema),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const existing = await db.query.lineeLibere.findFirst({
            where: eq(lineeLibere.id, id),
        });

        if (!existing) {
            throw NotFoundError('Linea Libera');
        }

        const [updated] = await db
            .update(lineeLibere)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(lineeLibere.id, id))
            .returning();

        return c.json(updated);
    }
);

/**
 * DELETE /linee-libere/:id
 */
app.delete('/:id', requirePermission('products:write'), async (c) => {
    const id = c.req.param('id');

    const existing = await db.query.lineeLibere.findFirst({
        where: eq(lineeLibere.id, id),
    });

    if (!existing) {
        throw NotFoundError('Linea Libera');
    }

    const [updated] = await db
        .update(lineeLibere)
        .set({ status: 'closed', updatedAt: new Date() })
        .where(eq(lineeLibere.id, id))
        .returning();

    return c.json({ message: 'Linea libera closed successfully', id: updated.id });
});

export default app;
