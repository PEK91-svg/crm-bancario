/**
 * Marketing - Journeys API Routes
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { requirePermission } from '../middleware/rbac';

const app = new Hono();

// Schema for journey definition
const journeyDefinitionSchema = z.object({
    nodes: z.array(z.object({
        id: z.string(),
        type: z.string(),
        config: z.record(z.any())
    })),
    edges: z.array(z.object({
        source: z.string(),
        target: z.string()
    }))
});

const createJourneySchema = z.object({
    campaignId: z.string().uuid(),
    name: z.string().min(1).max(255),
    definition: journeyDefinitionSchema
});

/**
 * GET /journeys
 * List all journeys
 */
app.get('/', requirePermission('marketing:read'), async (c) => {
    const campaignId = c.req.query('campaignId');

    let query = sql`
        SELECT 
            j.*,
            c.name as campaign_name,
            (SELECT COUNT(*) FROM marketing_journey_executions WHERE journey_id = j.id) as active_executions
        FROM marketing_journeys j
        LEFT JOIN marketing_campaigns c ON j.campaign_id = c.id
        ${campaignId ? sql`WHERE j.campaign_id = ${campaignId}` : sql``}
        ORDER BY j.created_at DESC
    `;

    const journeys = await db.execute(query);

    return c.json({ data: journeys });
});

/**
 * GET /journeys/:id
 * Get journey details
 */
app.get('/:id', requirePermission('marketing:read'), async (c) => {
    const id = c.req.param('id');

    const result = await db.execute(sql`
        SELECT * FROM marketing_journeys WHERE id = ${id}
    `);

    if (!result.length) {
        return c.json({ error: 'Journey not found' }, 404);
    }

    return c.json(result[0]);
});

/**
 * POST /journeys
 * Create new journey
 */
app.post('/', requirePermission('marketing:write'), zValidator('json', createJourneySchema), async (c) => {
    const data = c.req.valid('json');

    const result = await db.execute(sql`
        INSERT INTO marketing_journeys (campaign_id, name, definition, version)
        VALUES (${data.campaignId}, ${data.name}, ${JSON.stringify(data.definition)}, 1)
        RETURNING *
    `);

    return c.json(result[0], 201);
});

/**
 * POST /journeys/:id/version
 * Create new version of journey
 */
app.post('/:id/version', requirePermission('marketing:write'), zValidator('json', z.object({
    definition: journeyDefinitionSchema
})), async (c) => {
    const id = c.req.param('id');
    const { definition } = c.req.valid('json');

    // Get current journey
    const current = await db.execute(sql`
        SELECT * FROM marketing_journeys WHERE id = ${id}
    `);

    if (!current.length) {
        return c.json({ error: 'Journey not found' }, 404);
    }

    const journey = current[0] as any;

    // Deactivate current version
    await db.execute(sql`
        UPDATE marketing_journeys
        SET is_active = false, deactivated_at = NOW()
        WHERE id = ${id}
    `);

    // Create new version
    const newVersion = await db.execute(sql`
        INSERT INTO marketing_journeys (
            campaign_id, name, definition, version, is_active
        ) VALUES (
            ${journey.campaign_id},
            ${journey.name},
            ${JSON.stringify(definition)},
            ${journey.version + 1},
            false
        )
        RETURNING *
    `);

    return c.json({
        message: 'New version created',
        journey: newVersion[0]
    }, 201);
});

/**
 * POST /journeys/:id/activate
 * Activate journey (new users start entering)
 */
app.post('/:id/activate', requirePermission('marketing:write'), async (c) => {
    const id = c.req.param('id');

    // Deactivate any other active versions of same campaign
    const journey = await db.execute(sql`
        SELECT campaign_id FROM marketing_journeys WHERE id = ${id}
    `);

    if (!journey.length) {
        return c.json({ error: 'Journey not found' }, 404);
    }

    const campaignId = (journey[0] as any).campaign_id;

    await db.execute(sql`
        UPDATE marketing_journeys
        SET is_active = false, deactivated_at = NOW()
        WHERE campaign_id = ${campaignId} AND is_active = true
    `);

    // Activate this journey
    const result = await db.execute(sql`
        UPDATE marketing_journeys
        SET is_active = true, activated_at = NOW()
        WHERE id = ${id}
        RETURNING *
    `);

    return c.json({
        message: 'Journey activated',
        journey: result[0]
    });
});

/**
 * GET /journeys/:id/executions
 * Get journey executions (users in journey)
 */
app.get('/:id/executions', requirePermission('marketing:read'), async (c) => {
    const id = c.req.param('id');
    const status = c.req.query('status'); // 'active', 'completed', 'exited'
    const limit = parseInt(c.req.query('limit') || '50');

    const result = await db.execute(sql`
        SELECT 
            e.*,
            c.first_name,
            c.last_name,
            c.email
        FROM marketing_journey_executions e
        LEFT JOIN contacts c ON e.contact_id = c.id
        WHERE e.journey_id = ${id}
        ${status ? sql`AND e.status = ${status}` : sql``}
        ORDER BY e.entered_at DESC
        LIMIT ${limit}
    `);

    return c.json({ data: result });
});

/**
 * POST /journeys/:id/simulate
 * Simulate journey for test contact
 */
app.post('/:id/simulate', requirePermission('marketing:write'), zValidator('json', z.object({
    contactId: z.string().uuid(),
    speed: z.enum(['instant', 'realtime']).optional()
})), async (c) => {
    const id = c.req.param('id');
    const { contactId, speed = 'instant' } = c.req.valid('json');

    // TODO: Implement simulation logic
    // For now, return mock simulation result

    return c.json({
        message: 'Simulation completed',
        path: ['trigger_1', 'wait_1', 'email_1', 'condition_1', 'email_2', 'exit'],
        actions: [
            { step: 'email_1', action: 'Would send: Welcome Email', timestamp: new Date() },
            { step: 'email_2', action: 'Would send: Follow-up Email', timestamp: new Date() }
        ],
        finalState: 'completed'
    });
});

/**
 * GET /journeys/:id/stats
 * Get journey performance stats
 */
app.get('/:id/stats', requirePermission('marketing:read'), async (c) => {
    const id = c.req.param('id');

    const stats = await db.execute(sql`
        SELECT
            COUNT(*) as total_entered,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'exited' THEN 1 END) as exited,
            AVG(EXTRACT(EPOCH FROM (completed_at - entered_at))) / 3600 as avg_completion_hours
        FROM marketing_journey_executions
        WHERE journey_id = ${id}
    `);

    const stepStats = await db.execute(sql`
        SELECT
            step_id,
            step_type,
            COUNT(*) as executions,
            COUNT(CASE WHEN outcome = 'success' THEN 1 END) as successes,
            COUNT(CASE WHEN outcome = 'error' THEN 1 END) as errors
        FROM marketing_journey_steps
        WHERE execution_id IN (
            SELECT id FROM marketing_journey_executions WHERE journey_id = ${id}
        )
        GROUP BY step_id, step_type
        ORDER BY executions DESC
    `);

    return c.json({
        overview: stats[0],
        stepPerformance: stepStats
    });
});

export default app;
