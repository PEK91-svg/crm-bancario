/**
 * CRM Bancario - SLA Service
 * Service Layer Optimization and Management
 */

import { db } from '../../db';
import { cases } from '../../db/schema';
import { lt, and, eq, sql, notInArray } from 'drizzle-orm';

/**
 * SLA configuration by priority
 */
export const SLA_CONFIG = {
    critical: { hours: 4, warningThreshold: 0.8 }, // Alert at 80% (3.2h)
    high: { hours: 24, warningThreshold: 0.8 },
    medium: { hours: 72, warningThreshold: 0.8 },
    low: { hours: 168, warningThreshold: 0.8 }, // 7 days
} as const;

/**
 * Calculate SLA due date from priority
 */
export function calculateSlaDue(priority: keyof typeof SLA_CONFIG): Date {
    const hours = SLA_CONFIG[priority].hours;
    return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Calculate remaining time until SLA breach
 */
export function getRemainingTime(slaDueAt: Date): {
    hours: number;
    minutes: number;
    isBreached: boolean;
    isWarning: boolean;
} {
    const now = new Date();
    const diff = slaDueAt.getTime() - now.getTime();

    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

    return {
        hours: Math.abs(hours),
        minutes: Math.abs(minutes),
        isBreached: diff < 0,
        isWarning: diff > 0 && diff < (4 * 60 * 60 * 1000), // < 4 hours
    };
}

/**
 * Check for breached SLAs and update cases
 */
export async function checkSlaBreaches(): Promise<{
    breached: number;
    warned: number;
}> {
    const now = new Date();

    // Find cases with breached SLA (past due, not already marked)
    const breachedCases = await db
        .select()
        .from(cases)
        .where(
            and(
                lt(cases.slaDueAt, now),
                eq(cases.slaBreached, false),
                notInArray(cases.status, ['resolved', 'closed'])
            )
        );

    // Mark as breached
    if (breachedCases.length > 0) {
        await db
            .update(cases)
            .set({ slaBreached: true })
            .where(
                sql`${cases.id} IN (${sql.join(breachedCases.map(c => sql`${c.id}`), sql`, `)})`
            );
    }

    // Find cases approaching SLA (warning threshold)
    const warningThreshold = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
    const warningCases = await db
        .select()
        .from(cases)
        .where(
            and(
                lt(cases.slaDueAt, warningThreshold),
                eq(cases.slaBreached, false),
                notInArray(cases.status, ['resolved', 'closed'])
            )
        );

    return {
        breached: breachedCases.length,
        warned: warningCases.length,
    };
}

/**
 * Auto-escalate breached cases
 */
export async function escalateBreachedCases(): Promise<number> {
    const breachedCases = await db
        .select()
        .from(cases)
        .where(
            and(
                eq(cases.slaBreached, true),
                notInArray(cases.status, ['escalated', 'resolved', 'closed'])
            )
        )
        .limit(50); // Process in batches

    if (breachedCases.length === 0) {
        return 0;
    }

    // Escalate to manager (find team manager)
    for (const case_ of breachedCases) {
        // Logic: escalate to team manager or bump priority
        await db
            .update(cases)
            .set({
                status: 'escalated',
                priority: case_.priority === 'critical' ? 'critical' : 'high',
            })
            .where(eq(cases.id, case_.id));
    }

    return breachedCases.length;
}

/**
 * Get SLA metrics for dashboard
 */
export async function getSlaMetrics(): Promise<{
    totalOpen: number;
    breached: number;
    atRisk: number;
    breachRate: number;
}> {
    const now = new Date();
    const warningThreshold = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const [stats] = await db
        .select({
            total: sql<number>`count(*)::int`,
            breached: sql<number>`count(*) FILTER (WHERE ${cases.slaBreached} = true)::int`,
            atRisk: sql<number>`count(*) FILTER (WHERE ${cases.slaDueAt} < ${warningThreshold} AND ${cases.slaBreached} = false)::int`,
        })
        .from(cases)
        .where(notInArray(cases.status, ['resolved', 'closed']));

    const breachRate = stats.total > 0 ? (stats.breached / stats.total) * 100 : 0;

    return {
        totalOpen: stats.total,
        breached: stats.breached,
        atRisk: stats.atRisk,
        breachRate: Math.round(breachRate * 100) / 100,
    };
}

/**
 * Get cases by SLA status
 */
export async function getCasesBySlaStatus(status: 'breached' | 'warning' | 'ok') {
    const now = new Date();
    const warningThreshold = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    let condition;

    switch (status) {
        case 'breached':
            condition = eq(cases.slaBreached, true);
            break;
        case 'warning':
            condition = and(
                lt(cases.slaDueAt, warningThreshold),
                eq(cases.slaBreached, false)
            );
            break;
        case 'ok':
            condition = and(
                sql`${cases.slaDueAt} >= ${warningThreshold}`,
                eq(cases.slaBreached, false)
            );
            break;
    }

    return db
        .select()
        .from(cases)
        .where(
            and(
                condition!,
                notInArray(cases.status, ['resolved', 'closed'])
            )
        )
        .limit(100);
}
