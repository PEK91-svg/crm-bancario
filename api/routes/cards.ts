/**
 * CRM Bancario - API Routes: Cards
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../../db';
import { cards } from '../../db/schema';
import { eq, and, like, or, sql } from 'drizzle-orm';
import {
    createCardSchema,
    updateCardSchema,
    cardsFiltersSchema,
} from '../schemas/cards.schema';
import { requirePermission } from '../middleware/rbac';
import { NotFoundError } from '../middleware/errorHandler';

const app = new Hono();

/**
 * GET /cards
 * List cards with filtering and pagination
 */
app.get(
    '/',
    requirePermission('products:read'),
    zValidator('query', cardsFiltersSchema),
    async (c) => {
        const filters = c.req.valid('query');
        const { limit, offset, search, ...where } = filters;

        const conditions = [];

        if (where.type) {
            conditions.push(eq(cards.type, where.type));
        }

        if (where.status) {
            conditions.push(eq(cards.status, where.status));
        }

        if (where.circuit) {
            conditions.push(eq(cards.circuit, where.circuit));
        }

        if (where.contactId) {
            conditions.push(eq(cards.contactId, where.contactId));
        }

        if (where.accountId) {
            conditions.push(eq(cards.accountId, where.accountId));
        }

        if (search) {
            conditions.push(
                or(
                    like(cards.cardholderName, `%${search}%`),
                    like(cards.lastFourDigits, `%${search}%`),
                    like(cards.productName, `%${search}%`)
                )!
            );
        }

        let query = db.select().from(cards);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        query = query.limit(limit).offset(offset);

        const results = await query;

        let countQuery = db.select({ count: sql`count(*)` }).from(cards);
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
 * POST /cards
 * Create new card
 */
app.post(
    '/',
    requirePermission('products:write'),
    zValidator('json', createCardSchema),
    async (c) => {
        const data = c.req.valid('json');

        const [card] = await db
            .insert(cards)
            .values(data)
            .returning();

        return c.json(card, 201);
    }
);

/**
 * GET /cards/:id
 */
app.get('/:id', requirePermission('products:read'), async (c) => {
    const id = c.req.param('id');

    const card = await db.query.cards.findFirst({
        where: eq(cards.id, id),
        with: {
            contact: true,
            account: true,
        },
    });

    if (!card) {
        throw NotFoundError('Card');
    }

    return c.json(card);
});

/**
 * PUT /cards/:id
 */
app.put(
    '/:id',
    requirePermission('products:write'),
    zValidator('json', updateCardSchema),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const existing = await db.query.cards.findFirst({
            where: eq(cards.id, id),
        });

        if (!existing) {
            throw NotFoundError('Card');
        }

        const [updated] = await db
            .update(cards)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(cards.id, id))
            .returning();

        return c.json(updated);
    }
);

/**
 * DELETE /cards/:id
 * Soft delete - set status to cancelled
 */
app.delete('/:id', requirePermission('products:write'), async (c) => {
    const id = c.req.param('id');

    const existing = await db.query.cards.findFirst({
        where: eq(cards.id, id),
    });

    if (!existing) {
        throw NotFoundError('Card');
    }

    const [updated] = await db
        .update(cards)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(cards.id, id))
        .returning();

    return c.json({ message: 'Card cancelled successfully', id: updated.id });
});

export default app;
