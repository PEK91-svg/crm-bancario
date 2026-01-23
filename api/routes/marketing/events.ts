/**
 * Marketing - Events API Routes
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { requirePermission } from '../middleware/rbac';

const app = new Hono();

const trackEventSchema = z.object({
    eventType: z.string(),
    contactId: z.string().uuid(),
    campaignId: z.string().uuid().optional(),
    journeyId: z.string().uuid().optional(),
    payload: z.record(z.any())
});

/**
 * POST /events/track
 * Track a marketing event
 */
app.post('/track', zValidator('json', trackEventSchema), async (c) => {
    const data = c.req.valid('json');

    await db.execute(sql`
        INSERT INTO marketing_events (
            event_type,
            contact_id,
            campaign_id,
            journey_id,
            payload,
            created_at
        ) VALUES (
            ${data.eventType},
            ${data.contactId},
            ${data.campaignId || null},
            ${data.journeyId || null},
            ${JSON.stringify(data.payload)},
            NOW()
        )
    `);

    // TODO: Emit event to message queue for async processing

    return c.json({ message: 'Event tracked' }, 201);
});

/**
 * GET /events
 * Query events
 */
app.get('/', requirePermission('marketing:read'), async (c) => {
    const contactId = c.req.query('contactId');
    const campaignId = c.req.query('campaignId');
    const eventType = c.req.query('eventType');
    const limit = parseInt(c.req.query('limit') || '100');

    let conditions = [];
    if (contactId) conditions.push(sql`contact_id = ${contactId}`);
    if (campaignId) conditions.push(sql`campaign_id = ${campaignId}`);
    if (eventType) conditions.push(sql`event_type = ${eventType}`);

    const whereClause = conditions.length > 0
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

    const result = await db.execute(sql`
        SELECT *
        FROM marketing_events
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit}
    `);

    return c.json({ data: result });
});

/**
 * GET /events/stats
 * Get event statistics
 */
app.get('/stats', requirePermission('marketing:read'), async (c) => {
    const campaignId = c.req.query('campaignId');
    const days = parseInt(c.req.query('days') || '30');

    const result = await db.execute(sql`
        SELECT
            event_type,
            COUNT(*) as count,
            COUNT(DISTINCT contact_id) as unique_contacts
        FROM marketing_events
        WHERE created_at >= NOW() - INTERVAL '${sql.raw(days.toString())} days'
        ${campaignId ? sql`AND campaign_id = ${campaignId}` : sql``}
        GROUP BY event_type
        ORDER BY count DESC
    `);

    return c.json({ data: result });
});

export default app;
