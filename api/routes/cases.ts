/**
 * CRM Bancario - API Routes: Cases
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../../db';
import { cases } from '../../db/schema';
import { eq, and, desc, sql, lt } from 'drizzle-orm';
import {
    createCaseSchema,
    updateCaseSchema,
    assignCaseSchema,
    escalateCaseSchema,
    resolveCaseSchema,
    caseFiltersSchema,
} from '../schemas/cases.schema';
import { requirePermission, requireAnyPermission } from '../middleware/rbac';
import { NotFoundError } from '../middleware/errorHandler';

const app = new Hono();

/**
 * Calculate SLA due date based on priority
 */
function calculateSlaDue(priority: string): Date {
    const now = new Date();
    const hours = {
        critical: 4,
        high: 24,
        medium: 72, // 3 days
        low: 168, // 7 days
    }[priority] || 72;

    return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

/**
 * GET /cases
 * List cases with filtering
 */
app.get(
    '/',
    requirePermission('cases:read'),
    zValidator('query', caseFiltersSchema),
    async (c) => {
        const filters = c.req.valid('query');
        const { limit, offset, search, ...where } = filters;

        let query = db.select().from(cases);

        const conditions = [];

        if (where.contactId) conditions.push(eq(cases.contactId, where.contactId));
        if (where.accountId) conditions.push(eq(cases.accountId, where.accountId));
        if (where.ownerId) conditions.push(eq(cases.ownerId, where.ownerId));
        if (where.teamId) conditions.push(eq(cases.teamId, where.teamId));
        if (where.status) conditions.push(eq(cases.status, where.status));
        if (where.priority) conditions.push(eq(cases.priority, where.priority));
        if (where.channel) conditions.push(eq(cases.channel, where.channel));
        if (where.slaBreached !== undefined) conditions.push(eq(cases.slaBreached, where.slaBreached));

        if (search) {
            conditions.push(sql`${cases.subject} ILIKE ${'%' + search + '%'}`);
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        query = query.orderBy(desc(cases.createdAt)).limit(limit).offset(offset);

        const results = await query;

        let countQuery = db.select({ count: sql`count(*)` }).from(cases);
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
 * POST /cases
 * Create new case with auto-assignment
 */
app.post(
    '/',
    requirePermission('cases:write'),
    zValidator('json', createCaseSchema),
    async (c) => {
        const data = c.req.valid('json');
        const user = (c as any).get('user');

        // Calculate SLA
        const slaDueAt = calculateSlaDue(data.priority || 'medium');

        const [case_] = await db
            .insert(cases)
            .values({
                ...data,
                ownerId: user.id, // Auto-assign to creator
                teamId: user.teamId,
                slaDueAt,
                status: 'new',
            })
            .returning();

        return c.json(case_, 201);
    }
);

/**
 * GET /cases/:id
 * Get case with timeline
 */
app.get('/:id', requirePermission('cases:read'), async (c) => {
    const id = c.req.param('id');

    const case_ = await db.query.cases.findFirst({
        where: eq(cases.id, id),
        with: {
            contact: {
                columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                },
            },
            account: {
                columns: {
                    id: true,
                    name: true,
                    ndg: true,
                },
            },
            owner: {
                columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            team: true,
        },
    });

    if (!case_) {
        throw NotFoundError('Case');
    }

    // Fetch communications
    const [calls, emails, chats] = await Promise.all([
        db.query.telefonate.findMany({
            where: (telefonate, { eq }) => eq(telefonate.caseId, id),
            orderBy: (telefonate, { desc }) => [desc(telefonate.startedAt)],
        }),
        db.query.emails.findMany({
            where: (emails, { eq }) => eq(emails.caseId, id),
            orderBy: (emails, { desc }) => [desc(emails.createdAt)],
        }),
        db.query.chats.findMany({
            where: (chats, { eq }) => eq(chats.caseId, id),
            with: {
                messages: {
                    limit: 50,
                    orderBy: (messages, { asc }) => [asc(messages.createdAt)],
                },
            },
            orderBy: (chats, { desc }) => [desc(chats.createdAt)],
        }),
    ]);

    return c.json({
        ...case_,
        communications: { calls, emails, chats },
    });
});

/**
 * PUT /cases/:id
 * Update case
 */
app.put(
    '/:id',
    requirePermission('cases:write'),
    zValidator('json', updateCaseSchema),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const existing = await db.query.cases.findFirst({
            where: eq(cases.id, id),
        });

        if (!existing) {
            throw NotFoundError('Case');
        }

        // Recalculate SLA if priority changed
        let updateData: any = { ...data };
        if (data.priority && data.priority !== existing.priority) {
            updateData.slaDueAt = calculateSlaDue(data.priority);
        }

        const [updated] = await db
            .update(cases)
            .set(updateData)
            .where(eq(cases.id, id))
            .returning();

        return c.json(updated);
    }
);

/**
 * POST /cases/:id/assign
 * Assign case to user/team
 */
app.post(
    '/:id/assign',
    requireAnyPermission('cases:assign', 'cases:write'),
    zValidator('json', assignCaseSchema),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const existing = await db.query.cases.findFirst({
            where: eq(cases.id, id),
        });

        if (!existing) {
            throw NotFoundError('Case');
        }

        const [updated] = await db
            .update(cases)
            .set({
                ownerId: data.ownerId,
                teamId: data.teamId,
                status: 'open', // Auto-transition to open on assignment
            })
            .where(eq(cases.id, id))
            .returning();

        return c.json(updated);
    }
);

/**
 * POST /cases/:id/escalate
 * Escalate case
 */
app.post(
    '/:id/escalate',
    requireAnyPermission('cases:escalate', 'cases:write'),
    zValidator('json', escalateCaseSchema),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const existing = await db.query.cases.findFirst({
            where: eq(cases.id, id),
        });

        if (!existing) {
            throw NotFoundError('Case');
        }

        const updateData: any = {
            status: 'escalated',
            priority: existing.priority === 'critical' ? 'critical' : 'high', // Escalate priority
        };

        if (data.escalateTo) {
            updateData.ownerId = data.escalateTo;
        }

        const [updated] = await db
            .update(cases)
            .set(updateData)
            .where(eq(cases.id, id))
            .returning();

        return c.json(updated);
    }
);

/**
 * POST /cases/:id/resolve
 * Resolve case
 */
app.post(
    '/:id/resolve',
    requirePermission('cases:write'),
    zValidator('json', resolveCaseSchema),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const existing = await db.query.cases.findFirst({
            where: eq(cases.id, id),
        });

        if (!existing) {
            throw NotFoundError('Case');
        }

        const [updated] = await db
            .update(cases)
            .set({
                status: 'resolved',
                resolution: data.resolution,
                resolutionCode: data.resolutionCode,
                csatScore: data.csatScore,
                csatComment: data.csatComment,
                resolvedAt: new Date(),
            })
            .where(eq(cases.id, id))
            .returning();

        return c.json(updated);
    }
);

export default app;
