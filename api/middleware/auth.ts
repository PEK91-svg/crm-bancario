/**
 * CRM Bancario - Authentication Middleware
 * Clerk integration for user authentication
 */

import { Context, Next } from 'hono';
import { createClerkClient } from '@clerk/backend';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Clerk authentication middleware
 * Validates JWT token and loads user data
 */
export const clerkAuth = async (c: Context, next: Next) => {
    try {
        // Extract token from Authorization header
        const authHeader = c.req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ error: 'Unauthorized - Missing token' }, 401);
        }

        const token = authHeader.substring(7);

        // Verify token with Clerk
        const verified = await clerkClient.verifyToken(token);

        if (!verified) {
            return c.json({ error: 'Unauthorized - Invalid token' }, 401);
        }

        const clerkUserId = verified.sub;

        // Load user from database
        const user = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkUserId),
            with: {
                role: true,
                team: true,
            },
        });

        if (!user) {
            return c.json({ error: 'Unauthorized - User not found in CRM' }, 401);
        }

        if (!user.isActive) {
            return c.json({ error: 'Forbidden - Account disabled' }, 403);
        }

        // Set user context
        c.set('userId', user.id);
        c.set('user', user);
        c.set('permissions', user.role?.permissions || []);

        await next();
    } catch (error) {
        console.error('Auth error:', error);
        return c.json({ error: 'Unauthorized - Authentication failed' }, 401);
    }
};

/**
 * Development/Mock auth middleware (for testing without Clerk)
 * Remove in production
 */
export const mockAuth = async (c: Context, next: Next) => {
    // Load first admin user for testing
    const user = await db.query.users.findFirst({
        with: { role: true, team: true },
    });

    if (user) {
        c.set('userId', user.id);
        c.set('user', user);
        c.set('permissions', user.role?.permissions || []);
    }

    await next();
};
