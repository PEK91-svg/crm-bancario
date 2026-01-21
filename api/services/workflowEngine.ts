/**
 * CRM Bancario - Workflow Engine
 * Executes workflow templates for onboarding pratiche
 */

import { db } from '../../db';
import { praticheOnboarding, onboardingActivities, users } from '../../db/schema';
import { eq, sql, inArray } from 'drizzle-orm';
import { getWorkflowTemplate, WorkflowTemplate, WorkflowActivity } from '../workflows/templates';

/**
 * Create activities from template
 */
export async function createActivitiesFromTemplate(
    praticaId: string,
    templateType: string,
    assignedTeamId?: string
): Promise<number> {
    const template = getWorkflowTemplate(templateType);

    if (!template) {
        throw new Error(`Workflow template '${templateType}' not found`);
    }

    // Find users by role in team
    const teamUsers = assignedTeamId
        ? await db.query.users.findMany({
            where: eq(users.teamId, assignedTeamId),
            with: { role: true },
        })
        : [];

    // Create activities
    const activities = template.activities.map((activity) => ({
        praticaId,
        name: activity.name,
        description: activity.description,
        type: activity.type,
        sequenceOrder: activity.sequenceOrder,
        isMandatory: activity.isMandatory,
        dependsOn: activity.dependsOn || [],
        assigneeId: findAssigneeByRole(teamUsers, activity.assignToRole),
        teamId: assignedTeamId,
        status: activity.sequenceOrder === 1 ? ('todo' as const) : ('blocked' as const), // First activity is todo, rest blocked
        dueDate: calculateDueDate(activity.estimatedDurationHours),
        checklist: activity.checklist || [],
    }));

    await db.insert(onboardingActivities).values(activities);

    // Auto-execute first activity if needed
    const firstActivity = template.activities.find(a => a.sequenceOrder === 1);
    if (firstActivity?.autoExecute) {
        // TODO: Trigger auto-execution
    }

    return activities.length;
}

/**
 * Find user by role in team
 */
function findAssigneeByRole(
    teamUsers: any[],
    role?: string
): string | undefined {
    if (!role) return undefined;

    const user = teamUsers.find(u => u.role?.name === role);
    return user?.id;
}

/**
 * Calculate due date from estimated hours
 */
function calculateDueDate(hours?: number): Date {
    if (!hours) return new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24h
    return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Check and unlock dependent activities
 */
export async function unlockDependentActivities(
    praticaId: string,
    completedActivityId: string
): Promise<number> {
    // Get completed activity
    const completed = await db.query.onboardingActivities.findFirst({
        where: eq(onboardingActivities.id, completedActivityId),
    });

    if (!completed) return 0;

    // Get all activities for this pratica
    const allActivities = await db.query.onboardingActivities.findMany({
        where: eq(onboardingActivities.praticaId, praticaId),
    });

    // Build dependency map
    const activityMap = new Map(allActivities.map(a => [a.id, a]));

    // Find activities that depend on this one
    const toUnlock = allActivities.filter(activity => {
        if (activity.status !== 'blocked') return false;

        const deps = activity.dependsOn || [];
        if (!deps.length) return false;

        // Check if completed activity is in dependencies
        return deps.some(depId => {
            // Find activity by sequence (since we use string IDs in template)
            const depActivity = allActivities.find(a =>
                a.sequenceOrder.toString() === depId || a.id === depId
            );
            return depActivity?.id === completedActivityId;
        });
    });

    // Check if all dependencies are met for each activity
    const readyToUnlock = toUnlock.filter(activity => {
        const deps = activity.dependsOn || [];
        return deps.every(depId => {
            const depActivity = allActivities.find(a =>
                a.sequenceOrder.toString() === depId || a.id === depId
            );
            return depActivity?.status === 'completed';
        });
    });

    if (readyToUnlock.length === 0) return 0;

    // Unlock activities (set to 'todo')
    await db
        .update(onboardingActivities)
        .set({ status: 'todo' })
        .where(
            sql`${onboardingActivities.id} IN (${sql.join(readyToUnlock.map(a => sql`${a.id}`), sql`, `)})`
        );

    // Auto-execute if needed
    for (const activity of readyToUnlock) {
        if (activity.type === 'system_action') {
            // TODO: Trigger auto-execution
            console.log(`Auto-executing: ${activity.name}`);
        }
    }

    return readyToUnlock.length;
}

/**
 * Get workflow progress
 */
export async function getWorkflowProgress(praticaId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
    percentage: number;
}> {
    const [stats] = await db
        .select({
            total: sql<number>`count(*)::int`,
            completed: sql<number>`count(*) FILTER (WHERE ${onboardingActivities.status} = 'completed')::int`,
            inProgress: sql<number>`count(*) FILTER (WHERE ${onboardingActivities.status} = 'in_progress')::int`,
            blocked: sql<number>`count(*) FILTER (WHERE ${onboardingActivities.status} = 'blocked')::int`,
        })
        .from(onboardingActivities)
        .where(eq(onboardingActivities.praticaId, praticaId));

    const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return {
        total: stats.total,
        completed: stats.completed,
        inProgress: stats.inProgress,
        blocked: stats.blocked,
        percentage,
    };
}

/**
 * Auto-complete system actions (mock implementation)
 */
export async function executeSystemAction(
    activityId: string,
    actionType: string
): Promise<{ success: boolean; result?: any }> {
    console.log(`Executing system action: ${actionType} for activity ${activityId}`);

    // Mock implementation - replace with real integrations
    switch (actionType) {
        case 'kyc_check':
            // TODO: Call external KYC service
            await new Promise(resolve => setTimeout(resolve, 100));
            return { success: true, result: { status: 'passed', score: 95 } };

        case 'aml_check':
            // TODO: Call AML screening service
            await new Promise(resolve => setTimeout(resolve, 100));
            return { success: true, result: { status: 'clear', risk: 'low' } };

        case 'credit_check':
            // TODO: Call CRIF or similar
            await new Promise(resolve => setTimeout(resolve, 100));
            return { success: true, result: { score: 720, rating: 'good' } };

        case 'account_creation':
            // TODO: Call core banking API
            await new Promise(resolve => setTimeout(resolve, 100));
            return { success: true, result: { accountNumber: '123456789', iban: 'IT60X...' } };

        default:
            return { success: false };
    }
}

/**
 * Update pratica current step
 */
export async function updatePraticaCurrentStep(
    praticaId: string,
    stepName: string
) {
    await db
        .update(praticheOnboarding)
        .set({ currentStep: stepName })
        .where(eq(praticheOnboarding.id, praticaId));
}
