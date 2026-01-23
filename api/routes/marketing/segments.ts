/**
 * Marketing - Segments API Routes
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { requirePermission } from '../middleware/rbac';

const app = new Hono();

// Schema for segment conditions
const segmentConditionSchema = z.object({
    operator: z.enum(['AND', 'OR']),
    rules: z.array(z.object({
        type: z.enum(['attribute', 'event', 'segment']),
        field: z.string().optional(),
        operator: z.string().optional(),
        value: z.any().optional(),
        event: z.string().optional(),
        within: z.object({
            value: z.number(),
            unit: z.string()
        }).optional(),
        segmentId: z.string().uuid().optional()
    }))
});

const createSegmentSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    conditions: segmentConditionSchema,
    isDynamic: z.boolean().default(true)
});

/**
 * GET /segments
 * List all segments
 */
app.get('/', requirePermission('marketing:read'), async (c) => {
    const result = await db.execute(sql`
        SELECT 
            id,
            name,
            description,
            is_dynamic,
            member_count,
            last_calculated_at,
            created_at
        FROM marketing_segments
        ORDER BY created_at DESC
    `);

    return c.json({ data: result });
});

/**
 * GET /segments/:id
 * Get segment details
 */
app.get('/:id', requirePermission('marketing:read'), async (c) => {
    const id = c.req.param('id');

    const result = await db.execute(sql`
        SELECT * FROM marketing_segments WHERE id = ${id}
    `);

    if (!result.length) {
        return c.json({ error: 'Segment not found' }, 404);
    }

    return c.json(result[0]);
});

/**
 * POST /segments
 * Create new segment
 */
app.post('/', requirePermission('marketing:write'), zValidator('json', createSegmentSchema), async (c) => {
    const data = c.req.valid('json');
    const user = c.get('user');

    const result = await db.execute(sql`
        INSERT INTO marketing_segments (
            name, description, conditions, is_dynamic, created_by
        ) VALUES (
            ${data.name},
            ${data.description || null},
            ${JSON.stringify(data.conditions)},
            ${data.isDynamic},
            ${user.id}
        )
        RETURNING *
    `);

    // Trigger initial calculation for dynamic segments
    if (data.isDynamic) {
        // TODO: Queue segment calculation job
    }

    return c.json(result[0], 201);
});

/**
 * PUT /segments/:id
 * Update segment
 */
app.put('/:id', requirePermission('marketing:write'), zValidator('json', createSegmentSchema.partial()), async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');

    const updates: any = { updated_at: sql`NOW()` };

    if (data.name) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.conditions) updates.conditions = JSON.stringify(data.conditions);
    if (data.isDynamic !== undefined) updates.is_dynamic = data.isDynamic;

    const result = await db.execute(sql`
        UPDATE marketing_segments
        SET ${sql.join(Object.entries(updates).map(([k, v]) => sql`${sql.raw(k)} = ${v}`), sql`, `)}
        WHERE id = ${id}
        RETURNING *
    `);

    if (!result.length) {
        return c.json({ error: 'Segment not found' }, 404);
    }

    // Trigger recalculation if conditions changed
    if (data.conditions) {
        // TODO: Queue segment calculation job
    }

    return c.json(result[0]);
});

/**
 * POST /segments/:id/calculate
 * Manually trigger segment calculation
 */
app.post('/:id/calculate', requirePermission('marketing:write'), async (c) => {
    const id = c.req.param('id');

    // TODO: Implement actual segment calculation logic
    // For now, return mock result

    await db.execute(sql`
        UPDATE marketing_segments
        SET 
            last_calculated_at = NOW(),
            member_count = 0
        WHERE id = ${id}
    `);

    return c.json({
        message: 'Segment calculation queued',
        estimatedTime: '30 seconds'
    });
});

/**
 * GET /segments/:id/members
 * Get segment members (preview)
 */
app.get('/:id/members', requirePermission('marketing:read'), async (c) => {
    const id = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '50');

    const result = await db.execute(sql`
        SELECT 
            c.id,
            c.first_name,
            c.last_name,
            c.email,
            c.company
        FROM marketing_segment_memberships m
        JOIN contacts c ON m.contact_id = c.id
        WHERE m.segment_id = ${id}
        LIMIT ${limit}
    `);

    return c.json({ data: result });
});

/**
 * DELETE /segments/:id
 * Delete segment
 */
app.delete('/:id', requirePermission('marketing:delete'), async (c) => {
    const id = c.req.param('id');

    // Check if segment is used in active campaigns
    const usage = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM marketing_campaigns
        WHERE segment_id = ${id} AND status IN ('active', 'scheduled')
    `);

    if ((usage[0] as any).count > 0) {
        return c.json({
            error: 'Segment is used in active campaigns',
            message: 'Please pause or complete campaigns using this segment first'
        }, 400);
    }

    await db.execute(sql`DELETE FROM marketing_segments WHERE id = ${id}`);

    return c.json({ message: 'Segment deleted' });
});

export default app;
