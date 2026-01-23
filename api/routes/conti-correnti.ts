/**
 * CRM Bancario - API Routes: Conti Correnti
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../../db';
import { contiCorrenti } from '../../db/schema';
import { eq, and, like, or, sql } from 'drizzle-orm';
import {
    createContoCorrenteSchema,
    updateContoCorrenteSchema,
    contiCorrentiFiltersSchema,
} from '../schemas/conti-correnti.schema';
import { requirePermission } from '../middleware/rbac';
import { NotFoundError } from '../middleware/errorHandler';

const app = new Hono();

/**
 * GET /conti-correnti
 * List conti correnti with filtering and pagination
 */
app.get(
    '/',
    requirePermission('products:read'),
    zValidator('query', contiCorrentiFiltersSchema),
    async (c) => {
        const filters = c.req.valid('query');
        const { limit, offset, search, ...where } = filters;

        const conditions = [];

        if (where.type) {
            conditions.push(eq(contiCorrenti.type, where.type));
        }

        if (where.status) {
            conditions.push(eq(contiCorrenti.status, where.status));
        }

        if (where.contactId) {
            conditions.push(eq(contiCorrenti.contactId, where.contactId));
        }

        if (where.accountId) {
            conditions.push(eq(contiCorrenti.accountId, where.accountId));
        }

        if (search) {
            conditions.push(
                or(
                    like(contiCorrenti.iban, `%${search}%`),
                    like(contiCorrenti.name, `%${search}%`),
                    like(contiCorrenti.productName, `%${search}%`)
                )!
            );
        }

        let query = db.select().from(contiCorrenti);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        query = query.limit(limit).offset(offset);

        const results = await query;

        let countQuery = db.select({ count: sql`count(*)` }).from(contiCorrenti);
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
 * POST /conti-correnti
 * Create new conto corrente
 */
app.post(
    '/',
    requirePermission('products:write'),
    zValidator('json', createContoCorrenteSchema),
    async (c) => {
        const data = c.req.valid('json');

        const [conto] = await db
            .insert(contiCorrenti)
            .values(data)
            .returning();

        return c.json(conto, 201);
    }
);

/**
 * GET /conti-correnti/:id
 */
app.get('/:id', requirePermission('products:read'), async (c) => {
    const id = c.req.param('id');

    const conto = await db.query.contiCorrenti.findFirst({
        where: eq(contiCorrenti.id, id),
        with: {
            contact: true,
            account: true,
        },
    });

    if (!conto) {
        throw NotFoundError('Conto Corrente');
    }

    return c.json(conto);
});

/**
 * PUT /conti-correnti/:id
 */
app.put(
    '/:id',
    requirePermission('products:write'),
    zValidator('json', updateContoCorrenteSchema),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const existing = await db.query.contiCorrenti.findFirst({
            where: eq(contiCorrenti.id, id),
        });

        if (!existing) {
            throw NotFoundError('Conto Corrente');
        }

        const [updated] = await db
            .update(contiCorrenti)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(contiCorrenti.id, id))
            .returning();

        return c.json(updated);
    }
);

/**
 * DELETE /conti-correnti/:id
 */
app.delete('/:id', requirePermission('products:write'), async (c) => {
    const id = c.req.param('id');

    const existing = await db.query.contiCorrenti.findFirst({
        where: eq(contiCorrenti.id, id),
    });

    if (!existing) {
        throw NotFoundError('Conto Corrente');
    }

    const [updated] = await db
        .update(contiCorrenti)
        .set({ status: 'closed', updatedAt: new Date() })
        .where(eq(contiCorrenti.id, id))
        .returning();

    return c.json({ message: 'Conto corrente closed successfully', id: updated.id });
});

export default app;
