/**
 * CRM Bancario - Assignment Service
 * Smart assignment logic for cases and pratiche
 */

import { db } from '../../db';
import { cases, praticheOnboarding, users } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Get team workload (assigned cases count)
 */
export async function getTeamWorkload(teamId: string): Promise<{
    userId: string;
    name: string;
    assignedCases: number;
    assignedPratiche: number;
    totalWorkload: number;
}[]> {
    const teamUsers = await db.query.users.findMany({
        where: and(
            eq(users.teamId, teamId),
            eq(users.isActive, true)
        ),
    });

    const workloads = await Promise.all(
        teamUsers.map(async (user) => {
            const [caseCount] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(cases)
                .where(
                    and(
                        eq(cases.ownerId, user.id),
                        sql`${cases.status} NOT IN ('resolved', 'closed')`
                    )
                );

            const [praticheCount] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(praticheOnboarding)
                .where(
                    and(
                        eq(praticheOnboarding.assignedTo, user.id),
                        sql`${praticheOnboarding.status} NOT IN ('approved', 'rejected')`
                    )
                );

            return {
                userId: user.id,
                name: `${user.firstName} ${user.lastName}`,
                assignedCases: caseCount.count,
                assignedPratiche: praticheCount.count,
                totalWorkload: caseCount.count + praticheCount.count,
            };
        })
    );

    return workloads.sort((a, b) => a.totalWorkload - b.totalWorkload);
}

/**
 * Find best assignee using load balancing
 */
export async function findBestAssignee(
    teamId: string,
    type: 'case' | 'pratica' = 'case'
): Promise<{ userId: string; reason: string } | null> {
    const workloads = await getTeamWorkload(teamId);

    if (workloads.length === 0) {
        return null;
    }

    // Simple round-robin: assign to user with least workload
    const bestUser = workloads[0]; // Already sorted by totalWorkload

    return {
        userId: bestUser.userId,
        reason: `Load balanced: ${bestUser.name} has ${bestUser.totalWorkload} items (lowest in team)`,
    };
}

/**
 * Auto-assign case to team
 */
export async function autoAssignCase(
    caseId: string,
    teamId: string
): Promise<{ success: boolean; assignedTo?: string; reason?: string }> {
    const assignment = await findBestAssignee(teamId, 'case');

    if (!assignment) {
        return { success: false, reason: 'No available agents in team' };
    }

    await db
        .update(cases)
        .set({
            ownerId: assignment.userId,
            teamId,
            status: 'open',
        })
        .where(eq(cases.id, caseId));

    return {
        success: true,
        assignedTo: assignment.userId,
        reason: assignment.reason,
    };
}

/**
 * Auto-assign pratica to team
 */
export async function autoAssignPratica(
    praticaId: string,
    teamId: string
): Promise<{ success: boolean; assignedTo?: string; reason?: string }> {
    const assignment = await findBestAssignee(teamId, 'pratica');

    if (!assignment) {
        return { success: false, reason: 'No available operators in team' };
    }

    await db
        .update(praticheOnboarding)
        .set({
            assignedTo: assignment.userId,
            teamId,
            status: 'in_progress',
        })
        .where(eq(praticheOnboarding.id, praticaId));

    return {
        success: true,
        assignedTo: assignment.userId,
        reason: assignment.reason,
    };
}

/**
 * Reassign based on priority escalation
 */
export async function escalateToManager(
    caseId: string
): Promise<{ success: boolean; managerId?: string }> {
    // Get case with current owner
    const case_ = await db.query.cases.findFirst({
        where: eq(cases.id, caseId),
        with: {
            owner: {
                with: {
                    team: true,
                },
            },
        },
    });

    if (!case_ || !case_.owner?.team) {
        return { success: false };
    }

    const managerId = case_.owner.team.managerId;

    if (!managerId) {
        return { success: false };
    }

    await db
        .update(cases)
        .set({
            ownerId: managerId,
            status: 'escalated',
            priority: case_.priority === 'critical' ? 'critical' : 'high',
        })
        .where(eq(cases.id, caseId));

    return { success: true, managerId };
}

/**
 * Get user statistics (for skills-based routing - future)
 */
export async function getUserStats(userId: string) {
    const [caseStats] = await db
        .select({
            total: sql<number>`count(*)::int`,
            resolved: sql<number>`count(*) FILTER (WHERE ${cases.status} = 'resolved')::int`,
            avgCsatScore: sql<number>`avg(${cases.csatScore})`,
        })
        .from(cases)
        .where(eq(cases.ownerId, userId));

    const resolutionRate = caseStats.total > 0
        ? Math.round((caseStats.resolved / caseStats.total) * 100)
        : 0;

    return {
        totalCases: caseStats.total,
        resolvedCases: caseStats.resolved,
        resolutionRate,
        avgCsatScore: caseStats.avgCsatScore ? Math.round(caseStats.avgCsatScore * 10) / 10 : null,
    };
}
