/**
 * CRM Bancario - Admin/System API Routes
 * Analytics, dashboards, system management
 */

import { Hono } from 'hono';
import { requirePermission, requireAnyPermission } from '../middleware/rbac';
import { getSlaMetrics, getCasesBySlaStatus } from '../services/slaService';
import { getTeamWorkload } from '../services/assignmentService';

const app = new Hono();

/**
 * GET /analytics/sla
 * SLA metrics dashboard
 */
app.get(
    '/analytics/sla',
    requireAnyPermission('reports:view', 'admin:settings'),
    async (c) => {
        const metrics = await getSlaMetrics();

        // Get breakdown by status
        const [breached, warning, ok] = await Promise.all([
            getCasesBySlaStatus('breached'),
            getCasesBySlaStatus('warning'),
            getCasesBySlaStatus('ok'),
        ]);

        return c.json({
            metrics,
            breakdown: {
                breached: breached.length,
                warning: warning.length,
                ok: ok.length,
            },
            cases: {
                breached: breached.slice(0, 10), // Top 10
                warning: warning.slice(0, 10),
            },
        });
    }
);

/**
 * GET /analytics/workload
 * Team workload distribution
 */
app.get(
    '/analytics/workload',
    requireAnyPermission('reports:view', 'admin:settings'),
    async (c) => {
        const teamId = c.req.query('teamId');

        if (!teamId) {
            return c.json({ error: 'teamId query parameter required' }, 400);
        }

        const workload = await getTeamWorkload(teamId);

        return c.json({
            teamId,
            members: workload,
            totals: {
                totalMembers: workload.length,
                totalCases: workload.reduce((sum, m) => sum + m.assignedCases, 0),
                totalPratiche: workload.reduce((sum, m) => sum + m.assignedPratiche, 0),
                avgWorkload: workload.length > 0
                    ? Math.round(workload.reduce((sum, m) => sum + m.totalWorkload, 0) / workload.length)
                    : 0,
            },
        });
    }
);

/**
 * GET /analytics/dashboard
 * Main dashboard KPIs
 */
app.get(
    '/analytics/dashboard',
    requireAnyPermission('reports:view', 'admin:settings'),
    async (c) => {
        const slaMetrics = await getSlaMetrics();

        return c.json({
            sla: slaMetrics,
        });
    }
);

/**
 * GET /analytics/cases-by-status
 * Case distribution by status
 */
app.get(
    '/analytics/cases-by-status',
    requireAnyPermission('reports:view', 'admin:settings'),
    async (c) => {
        const { db } = await import('../../db');
        const { cases } = await import('../../db/schema');
        const { sql } = await import('drizzle-orm');

        const [stats] = await db
            .select({
                new: sql<number>`count(*) FILTER (WHERE status = 'new')::int`,
                open: sql<number>`count(*) FILTER (WHERE status = 'open')::int`,
                pending: sql<number>`count(*) FILTER (WHERE status = 'pending')::int`,
                escalated: sql<number>`count(*) FILTER (WHERE status = 'escalated')::int`,
                resolved: sql<number>`count(*) FILTER (WHERE status = 'resolved')::int`,
                closed: sql<number>`count(*) FILTER (WHERE status = 'closed')::int`,
            })
            .from(cases);

        return c.json(stats);
    }
);

/**
 * GET /analytics/cases-by-priority
 * Case distribution by priority
 */
app.get(
    '/analytics/cases-by-priority',
    requireAnyPermission('reports:view', 'admin:settings'),
    async (c) => {
        const { db } = await import('../../db');
        const { cases } = await import('../../db/schema');
        const { sql, notInArray } = await import('drizzle-orm');

        const [stats] = await db
            .select({
                critical: sql<number>`count(*) FILTER (WHERE priority = 'critical')::int`,
                high: sql<number>`count(*) FILTER (WHERE priority = 'high')::int`,
                medium: sql<number>`count(*) FILTER (WHERE priority = 'medium')::int`,
                low: sql<number>`count(*) FILTER (WHERE priority = 'low')::int`,
            })
            .from(cases)
            .where(notInArray(cases.status, ['resolved', 'closed']));

        return c.json(stats);
    }
);

/**
 * GET /analytics/resolution-time
 * Average resolution time by priority
 */
app.get(
    '/analytics/resolution-time',
    requireAnyPermission('reports:view', 'admin:settings'),
    async (c) => {
        const { db } = await import('../../db');
        const { cases } = await import('../../db/schema');
        const { sql, isNotNull } = await import('drizzle-orm');

        const stats = await db
            .select({
                priority: cases.priority,
                avgHours: sql<number>`EXTRACT(EPOCH FROM AVG(${cases.resolvedAt} - ${cases.createdAt}))/3600`,
                count: sql<number>`count(*)::int`,
            })
            .from(cases)
            .where(isNotNull(cases.resolvedAt))
            .groupBy(cases.priority);

        const result = stats.reduce((acc, stat) => {
            if (stat.priority) {
                acc[stat.priority] = {
                    avgHours: Math.round(Number(stat.avgHours) * 10) / 10,
                    count: stat.count,
                };
            }
            return acc;
        }, {} as Record<string, { avgHours: number; count: number }>);

        return c.json(result);
    }
);

/**
 * GET /analytics/csat
 * Customer satisfaction scores
 */
app.get(
    '/analytics/csat',
    requireAnyPermission('reports:view', 'admin:settings'),
    async (c) => {
        const { db } = await import('../../db');
        const { cases } = await import('../../db/schema');
        const { sql, isNotNull, gte } = await import('drizzle-orm');

        const days = parseInt(c.req.query('days') || '30');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [stats] = await db
            .select({
                avgScore: sql<number>`AVG(${cases.csatScore})`,
                totalResponses: sql<number>`count(*)::int`,
                score1: sql<number>`count(*) FILTER (WHERE ${cases.csatScore} = 1)::int`,
                score2: sql<number>`count(*) FILTER (WHERE ${cases.csatScore} = 2)::int`,
                score3: sql<number>`count(*) FILTER (WHERE ${cases.csatScore} = 3)::int`,
                score4: sql<number>`count(*) FILTER (WHERE ${cases.csatScore} = 4)::int`,
                score5: sql<number>`count(*) FILTER (WHERE ${cases.csatScore} = 5)::int`,
            })
            .from(cases)
            .where(
                sql`${isNotNull(cases.csatScore)} AND ${gte(cases.resolvedAt, startDate)}`
            );

        return c.json({
            avgScore: stats.avgScore ? Math.round(Number(stats.avgScore) * 100) / 100 : null,
            totalResponses: stats.totalResponses,
            distribution: {
                1: stats.score1,
                2: stats.score2,
                3: stats.score3,
                4: stats.score4,
                5: stats.score5,
            },
            period: `${days} days`,
        });
    }
);

/**
 * GET /analytics/team-performance
 * Team performance metrics
 */
app.get(
    '/analytics/team-performance',
    requireAnyPermission('reports:view', 'admin:settings'),
    async (c) => {
        const { db } = await import('../../db');
        const { cases, teams } = await import('../../db/schema');
        const { sql, isNotNull } = await import('drizzle-orm');

        const teamStats = await db
            .select({
                teamId: cases.teamId,
                totalCases: sql<number>`count(*)::int`,
                resolvedCases: sql<number>`count(*) FILTER (WHERE ${cases.status} = 'resolved')::int`,
                avgCsat: sql<number>`AVG(${cases.csatScore})`,
                avgResolutionHours: sql<number>`EXTRACT(EPOCH FROM AVG(${cases.resolvedAt} - ${cases.createdAt}))/3600`,
            })
            .from(cases)
            .where(isNotNull(cases.teamId))
            .groupBy(cases.teamId);

        // Enrich with team names
        const enriched = await Promise.all(
            teamStats.map(async (stat) => {
                const team = await db.query.teams.findFirst({
                    where: (teams, { eq }) => eq(teams.id, stat.teamId!),
                    columns: { id: true, name: true },
                });

                return {
                    team,
                    totalCases: stat.totalCases,
                    resolvedCases: stat.resolvedCases,
                    resolutionRate: stat.totalCases > 0
                        ? Math.round((stat.resolvedCases / stat.totalCases) * 100)
                        : 0,
                    avgCsat: stat.avgCsat ? Math.round(Number(stat.avgCsat) * 100) / 100 : null,
                    avgResolutionHours: stat.avgResolutionHours
                        ? Math.round(Number(stat.avgResolutionHours) * 10) / 10
                        : null,
                };
            })
        );

        return c.json({ teams: enriched });
    }
);

export default app;
