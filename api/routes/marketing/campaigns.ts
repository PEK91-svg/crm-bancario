/**
 * Marketing - Campaigns API Routes
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { requirePermission } from '../middleware/rbac';

const app = new Hono();

// Schemas
const createCampaignSchema = z.object({
    name: z.string().min(1).max(255),
    type: z.enum(['broadcast', 'journey', 'recurring']),
    segmentId: z.string().uuid().optional(),
    goalType: z.enum(['conversion', 'engagement', 'revenue']).optional(),
    goalEvent: z.string().optional(),
    goalTarget: z.number().optional(),
    metadata: z.record(z.any()).optional()
});

const updateCampaignSchema = createCampaignSchema.partial();

/**
 * GET /campaigns
 * List all campaigns
 */
app.get('/', requirePermission('marketing:read'), async (c) => {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status'); // 'draft', 'active', etc.

    const offset = (page - 1) * limit;

    let query = sql`
        SELECT * FROM marketing_campaigns
        ${status ? sql`WHERE status = ${status}` : sql``}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
    `;

    const campaigns = await db.execute(query);

    // Get total count
    const countQuery = sql`
        SELECT COUNT(*) as total FROM marketing_campaigns
        ${status ? sql`WHERE status = ${status}` : sql``}
    `;
    const { total } = (await db.execute(countQuery))[0] as any;

    return c.json({
        data: campaigns,
        pagination: {
            page,
            limit,
            total,
            hasMore: offset + campaigns.length < total
        }
    });
});

/**
 * GET /campaigns/:id
 * Get campaign details
 */
app.get('/:id', requirePermission('marketing:read'), async (c) => {
    const id = c.req.param('id');

    const result = await db.execute(sql`
        SELECT 
            c.*,
            s.name as segment_name,
            s.member_count as audience_size
        FROM marketing_campaigns c
        LEFT JOIN marketing_segments s ON c.segment_id = s.id
        WHERE c.id = ${id}
    `);

    if (!result.length) {
        return c.json({ error: 'Campaign not found' }, 404);
    }

    return c.json(result[0]);
});

/**
 * POST /campaigns
 * Create new campaign
 */
app.post('/', requirePermission('marketing:write'), zValidator('json', createCampaignSchema), async (c) => {
    const data = c.req.valid('json');
    const user = c.get('user');

    const result = await db.execute(sql`
        INSERT INTO marketing_campaigns (
            name, type, segment_id, goal_type, goal_event, goal_target,
            created_by, metadata
        ) VALUES (
            ${data.name}, ${data.type}, ${data.segmentId || null},
            ${data.goalType || null}, ${data.goalEvent || null}, ${data.goalTarget || null},
            ${user.id}, ${JSON.stringify(data.metadata || {})}
        )
        RETURNING *
    `);

    return c.json(result[0], 201);
});

/**
 * PUT /campaigns/:id
 * Update campaign
 */
app.put('/:id', requirePermission('marketing:write'), zValidator('json', updateCampaignSchema), async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');

    // Build dynamic UPDATE query
    const fields = Object.entries(data).filter(([_, v]) => v !== undefined);
    if (!fields.length) {
        return c.json({ error: 'No fields to update' }, 400);
    }

    const setClause = fields.map(([key, value]) => sql`${sql.raw(key)} = ${value}`).join(sql`, `);

    const result = await db.execute(sql`
        UPDATE marketing_campaigns
        SET ${sql.raw(setClause)}
        WHERE id = ${id}
        RETURNING *
    `);

    if (!result.length) {
        return c.json({ error: 'Campaign not found' }, 404);
    }

    return c.json(result[0]);
});

/**
 * POST /campaigns/:id/launch
 * Launch campaign (change status to active)
 */
app.post('/:id/launch', requirePermission('marketing:write'), async (c) => {
    const id = c.req.param('id');

    const result = await db.execute(sql`
        UPDATE marketing_campaigns
        SET 
            status = 'active',
            launched_at = NOW()
        WHERE id = ${id} AND status = 'draft'
        RETURNING *
    `);

    if (!result.length) {
        return c.json({ error: 'Campaign not found or already launched' }, 400);
    }

    // TODO: Trigger campaign execution (enqueue messages)

    return c.json({ message: 'Campaign launched', campaign: result[0] });
});

/**
 * POST /campaigns/:id/pause
 * Pause active campaign
 */
app.post('/:id/pause', requirePermission('marketing:write'), async (c) => {
    const id = c.req.param('id');

    const result = await db.execute(sql`
        UPDATE marketing_campaigns
        SET status = 'paused'
        WHERE id = ${id} AND status = 'active'
        RETURNING *
    `);

    if (!result.length) {
        return c.json({ error: 'Campaign not found or not active' }, 400);
    }

    return c.json({ message: 'Campaign paused', campaign: result[0] });
});

/**
 * DELETE /campaigns/:id
 * Delete campaign (soft delete by setting status)
 */
app.delete('/:id', requirePermission('marketing:delete'), async (c) => {
    const id = c.req.param('id');

    // Soft delete by marking as completed
    const result = await db.execute(sql`
        UPDATE marketing_campaigns
        SET 
            status = 'completed',
            completed_at = NOW()
        WHERE id = ${id}
        RETURNING *
    `);

    if (!result.length) {
        return c.json({ error: 'Campaign not found' }, 404);
    }

    return c.json({ message: 'Campaign deleted', campaign: result[0] });
});

/**
 * GET /campaigns/:id/stats
 * Get campaign performance stats
 */
app.get('/:id/stats', requirePermission('marketing:read'), async (c) => {
    const id = c.req.param('id');

    // Aggregate stats from events
    const stats = await db.execute(sql`
        SELECT
            COUNT(DISTINCT CASE WHEN event_type = 'email_sent' THEN contact_id END) as sent,
            COUNT(DISTINCT CASE WHEN event_type = 'email_delivered' THEN contact_id END) as delivered,
            COUNT(DISTINCT CASE WHEN event_type = 'email_opened' THEN contact_id END) as opened,
            COUNT(DISTINCT CASE WHEN event_type = 'email_clicked' THEN contact_id END) as clicked,
            COUNT(DISTINCT CASE WHEN event_type = 'email_bounced' THEN contact_id END) as bounced,
            COUNT(DISTINCT CASE WHEN event_type = 'email_unsubscribed' THEN contact_id END) as unsubscribed
        FROM marketing_events
        WHERE campaign_id = ${id}
    `);

    const result = stats[0] as any;

    // Calculate rates
    const sent = parseInt(result.sent) || 0;
    const delivered = parseInt(result.delivered) || 0;

    return c.json({
        sent,
        delivered,
        opened: parseInt(result.opened) || 0,
        clicked: parseInt(result.clicked) || 0,
        bounced: parseInt(result.bounced) || 0,
        unsubscribed: parseInt(result.unsubscribed) || 0,

        // Rates
        deliveryRate: sent > 0 ? (delivered / sent * 100).toFixed(2) : 0,
        openRate: delivered > 0 ? (parseInt(result.opened) / delivered * 100).toFixed(2) : 0,
        clickRate: delivered > 0 ? (parseInt(result.clicked) / delivered * 100).toFixed(2) : 0,
        bounceRate: sent > 0 ? (parseInt(result.bounced) / sent * 100).toFixed(2) : 0,
        unsubscribeRate: delivered > 0 ? (parseInt(result.unsubscribed) / delivered * 100).toFixed(2) : 0
    });
});

export default app;
