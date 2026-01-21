/**
 * CRM Bancario - Marketing API Routes
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db';
import { marketingJourneys, journeyEnrollments } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { requirePermission } from '../middleware/rbac';
import { enrollContact, getJourneyStats, triggerJourneysByEvent } from '../services/marketingService';
import { NotFoundError } from '../middleware/errorHandler';

const app = new Hono();

// Schema
const createJourneySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['onboarding', 'cross_sell', 'retention', 'nps']),
    triggerType: z.enum(['manual', 'segment', 'event']),
    configuration: z.record(z.any()), // Simplified for MVP
});

const enrollSchema = z.object({
    contactId: z.string().uuid(),
});

/**
 * GET /journeys
 * List all journeys
 */
app.get('/', requirePermission('journeys:read'), async (c) => {
    const journeys = await db.query.marketingJourneys.findMany({
        orderBy: [desc(marketingJourneys.createdAt)],
    });
    return c.json({ data: journeys });
});

/**
 * POST /journeys
 * Create new journey
 */
app.post(
    '/',
    requirePermission('journeys:write'),
    zValidator('json', createJourneySchema),
    async (c) => {
        const data = c.req.valid('json');
        const user = c.get('user');

        const [journey] = await db
            .insert(marketingJourneys)
            .values({
                ...data,
                status: 'draft',
                createdBy: user.id,
            })
            .returning();

        return c.json(journey, 201);
    }
);

/**
 * GET /journeys/:id
 * Get journey details + stats
 */
app.get('/:id', requirePermission('journeys:read'), async (c) => {
    const id = c.req.param('id');

    const journey = await db.query.marketingJourneys.findFirst({
        where: eq(marketingJourneys.id, id),
    });

    if (!journey) throw NotFoundError('Journey');

    const stats = await getJourneyStats(id);

    return c.json({ ...journey, stats });
});

/**
 * POST /journeys/:id/activate
 */
app.post('/:id/activate', requirePermission('journeys:activate'), async (c) => {
    const id = c.req.param('id');

    const [updated] = await db
        .update(marketingJourneys)
        .set({ status: 'active' })
        .where(eq(marketingJourneys.id, id))
        .returning();

    if (!updated) throw NotFoundError('Journey');

    return c.json(updated);
});

/**
 * POST /journeys/:id/enroll
 * Manually enroll a contact
 */
app.post(
    '/:id/enroll',
    requirePermission('journeys:write'),
    zValidator('json', enrollSchema),
    async (c) => {
        const id = c.req.param('id');
        const { contactId } = c.req.valid('json');
        const user = c.get('user');

        const result = await enrollContact(id, contactId, user.id);

        if (!result.success) {
            return c.json({ error: result.reason }, 400);
        }

        return c.json(result.enrollment);
    }
);

export default app;
