/**
 * CRM Bancario - Admin API Routes
 * User and Team Management
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db';
import { users, teams, roles } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { requirePermission } from '../middleware/rbac';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';

const app = new Hono();

// Schemas
const createUserSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    roleId: z.string().uuid(),
    teamId: z.string().uuid().optional(),
    extension: z.string().optional(),
});

const updateUserSchema = createUserSchema.partial().extend({
    isActive: z.boolean().optional(),
});

const createTeamSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['customer_service', 'sales', 'backoffice', 'marketing', 'it']),
    managerId: z.string().uuid().optional(),
});

/**
 * USERS MANAGEMENT
 */

app.get('/users', requirePermission('admin:users'), async (c) => {
    const allUsers = await db.query.users.findMany({
        with: { role: true, team: true },
        orderBy: [desc(users.createdAt)],
    });
    return c.json({ data: allUsers });
});

app.post('/users', requirePermission('admin:users'), zValidator('json', createUserSchema), async (c) => {
    const data = c.req.valid('json');

    // Check email exists
    const existing = await db.query.users.findFirst({
        where: eq(users.email, data.email),
    });

    if (existing) throw ConflictError('Email already exists');

    const [user] = await db.insert(users).values({
        ...data,
        isActive: true,
    }).returning();

    return c.json(user, 201);
});

app.put('/users/:id', requirePermission('admin:users'), zValidator('json', updateUserSchema), async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');

    const [updated] = await db
        .update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning();

    if (!updated) throw NotFoundError('User');
    return c.json(updated);
});

/**
 * TEAMS MANAGEMENT
 */

app.get('/teams', requirePermission('admin:users'), async (c) => {
    const allTeams = await db.query.teams.findMany({
        with: { manager: true },
        orderBy: [db.schema.teams.name],
    });
    return c.json({ data: allTeams });
});

app.post('/teams', requirePermission('admin:users'), zValidator('json', createTeamSchema), async (c) => {
    const data = c.req.valid('json');

    const [team] = await db.insert(teams).values({
        ...data,
        isActive: true,
    }).returning();

    return c.json(team, 201);
});

/**
 * ROLES MANAGEMENT (Read-only for now as they are system defined)
 */
app.get('/roles', requirePermission('admin:users'), async (c) => {
    const allRoles = await db.query.roles.findMany();
    return c.json({ data: allRoles });
});

export default app;
