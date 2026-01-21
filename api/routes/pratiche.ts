/**
 * CRM Bancario - API Routes: Pratiche Onboarding
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../../db';
import { praticheOnboarding, onboardingActivities } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import {
    createPraticaSchema,
    updatePraticaSchema,
    completeActivitySchema,
    approvePraticaSchema,
    rejectPraticaSchema,
} from '../schemas/pratiche.schema';
import { requirePermission, requireAnyPermission } from '../middleware/rbac';
import { NotFoundError } from '../middleware/errorHandler';
import { logAudit } from '../middleware/audit';

const app = new Hono();

/**
 * GET /pratiche
 * List pratiche
 */
app.get('/', requirePermission('pratiche:read'), async (c) => {
    const pratiche = await db.query.praticheOnboarding.findMany({
        orderBy: [desc(praticheOnboarding.createdAt)],
        limit: 50,
        with: {
            contact: {
                columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            assignee: {
                columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    return c.json({ data: pratiche });
});

/**
 * POST /pratiche
 * Create new pratica
 */
app.post(
    '/',
    requirePermission('pratiche:write'),
    zValidator('json', createPraticaSchema),
    async (c) => {
        const data = c.req.valid('json');
        const user = (c as any).get('user');

        // Calculate due date if not provided (default 48h)
        const dueDate = data.dueDate
            ? new Date(data.dueDate)
            : new Date(Date.now() + 48 * 60 * 60 * 1000);

        const [pratica] = await db
            .insert(praticheOnboarding)
            .values({
                ...data,
                dueDate: dueDate.toISOString().split('T')[0],
                assignedTo: user.id,
                teamId: user.teamId,
                status: 'pending',
                submittedAt: new Date(),
                createdBy: user.id,
            })
            .returning();

        // Create activities from workflow template
        const { createActivitiesFromTemplate } = await import('../services/workflowEngine');

        try {
            // Map productType to workflow template type
            const templateType = data.productType === 'conto_corrente'
                ? 'apertura_conto'
                : 'kyc_refresh';

            const activityCount = await createActivitiesFromTemplate(
                pratica.id,
                templateType,
                user.teamId
            );

            console.log(`✅ Created ${activityCount} activities for pratica ${pratica.id}`);
        } catch (error) {
            console.error('Failed to create workflow activities:', error);
            // Don't fail the request if activities fail to create
        }

        return c.json(pratica, 201);
    }
);

/**
 * GET /pratiche/:id
 * Get pratica with activities
 */
app.get('/:id', requirePermission('pratiche:read'), async (c) => {
    const id = c.req.param('id');

    const pratica = await db.query.praticheOnboarding.findFirst({
        where: eq(praticheOnboarding.id, id),
        with: {
            contact: true,
            account: true,
            assignee: true,
            team: true,
            activities: {
                orderBy: (activities, { asc }) => [asc(activities.sequenceOrder)],
            },
        },
    });

    if (!pratica) {
        throw NotFoundError('Pratica');
    }

    return c.json(pratica);
});

/**
 * PUT /pratiche/:id
 * Update pratica
 */
app.put(
    '/:id',
    requirePermission('pratiche:write'),
    zValidator('json', updatePraticaSchema),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const existing = await db.query.praticheOnboarding.findFirst({
            where: eq(praticheOnboarding.id, id),
        });

        if (!existing) {
            throw NotFoundError('Pratica');
        }

        const [updated] = await db
            .update(praticheOnboarding)
            .set(data)
            .where(eq(praticheOnboarding.id, id))
            .returning();

        return c.json(updated);
    }
);

/**
 * GET /pratiche/:id/progress
 * Get workflow progress for pratica
 */
app.get(
    '/:id/progress',
    requirePermission('pratiche:read'),
    async (c) => {
        const id = c.req.param('id');

        const pratica = await db.query.praticheOnboarding.findFirst({
            where: eq(praticheOnboarding.id, id),
        });

        if (!pratica) {
            throw NotFoundError('Pratica');
        }

        const { getWorkflowProgress } = await import('../services/workflowEngine');
        const progress = await getWorkflowProgress(id);

        return c.json(progress);
    }
);

/**
 * POST /pratiche/:id/activities/:activityId/complete
 * Complete an activity
 */
app.post(
    '/:id/activities/:activityId/complete',
    requirePermission('pratiche:write'),
    zValidator('json', completeActivitySchema),
    async (c) => {
        const { id, activityId } = c.req.param();
        const data = c.req.valid('json');

        const activity = await db.query.onboardingActivities.findFirst({
            where: eq(onboardingActivities.id, activityId),
        });

        if (!activity || activity.praticaId !== id) {
            throw NotFoundError('Activity');
        }

        const [updated] = await db
            .update(onboardingActivities)
            .set({
                status: 'completed',
                outcome: data.outcome,
                outcomeNotes: data.outcomeNotes,
                checklist: data.checklist,
                completedAt: new Date(),
            })
            .where(eq(onboardingActivities.id, activityId))
            .returning();

        // Check dependencies and unlock next activities
        const { unlockDependentActivities, updatePraticaCurrentStep } = await import('../services/workflowEngine');

        try {
            const unlockedCount = await unlockDependentActivities(id, activityId);

            if (unlockedCount > 0) {
                console.log(`✅ Unlocked ${unlockedCount} dependent activities`);
            }

            // Update pratica current step
            await updatePraticaCurrentStep(id, updated.name);
        } catch (error) {
            console.error('Failed to unlock dependencies:', error);
        }

        return c.json(updated);
    }
);

/**
 * POST /pratiche/:id/approve
 * Approve pratica
 */
app.post(
    '/:id/approve',
    requirePermission('pratiche:approve'),
    zValidator('json', approvePraticaSchema),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const existing = await db.query.praticheOnboarding.findFirst({
            where: eq(praticheOnboarding.id, id),
        });

        if (!existing) {
            throw NotFoundError('Pratica');
        }

        const [updated] = await db
            .update(praticheOnboarding)
            .set({
                status: 'approved',
                outcome: 'approved',
                completedAt: new Date(),
                notes: data.notes,
            })
            .where(eq(praticheOnboarding.id, id))
            .returning();

        return c.json(updated);
    }
);

/**
 * POST /pratiche/:id/reject
 * Reject pratica
 */
app.post(
    '/:id/reject',
    requirePermission('pratiche:reject'),
    zValidator('json', rejectPraticaSchema),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const existing = await db.query.praticheOnboarding.findFirst({
            where: eq(praticheOnboarding.id, id),
        });

        if (!existing) {
            throw NotFoundError('Pratica');
        }

        const [updated] = await db
            .update(praticheOnboarding)
            .set({
                status: 'rejected',
                outcome: 'rejected',
                rejectionReason: data.rejectionReason,
                completedAt: new Date(),
                notes: data.notes,
            })
            .where(eq(praticheOnboarding.id, id))
            .returning();

        return c.json(updated);
    }
);

/**
 * DELETE /pratiche/:id
 * Soft delete a pratica (set isActive = false)
 */
app.delete(
    '/:id',
    requirePermission('pratiche:write'),
    async (c) => {
        const id = c.req.param('id');
        const user = c.get('user');

        const existing = await db.query.praticheOnboarding.findFirst({
            where: eq(praticheOnboarding.id, id),
        });

        if (!existing) {
            throw new NotFoundError('Pratica not found');
        }

        const [deleted] = await db
            .update(praticheOnboarding)
            .set({
                isActive: false,
                updatedAt: new Date()
            })
            .where(eq(praticheOnboarding.id, id))
            .returning();

        // Log deletion
        await logAudit({
            userId: user.id,
            userEmail: user.email,
            action: 'delete',
            entityType: 'pratica',
            entityId: id,
            metadata: { softDelete: true }
        });

        return c.json({ message: 'Pratica deleted successfully', id: deleted.id });
    }
);

export default app;
