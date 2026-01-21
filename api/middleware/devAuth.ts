/**
 * CRM Bancario - Development Auth Middleware
 * Bypasses authentication in development mode with mock user
 */

import { Context, Next } from 'hono';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export interface User {
    id: string;
    email: string;
    role: string;
    permissions: string[];
}

/**
 * Development middleware that injects a mock admin user
 * Only active when using "Bearer mock-token"
 */
export async function devAuth(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');

    // If using mock token, inject admin user (real user from DB)
    if (authHeader === 'Bearer mock-token') {
        const realUser = await db.query.users.findFirst({
            with: { role: true },
        });
        if (realUser) {
            c.set('user', realUser);
            c.set('userId', realUser.id);
            const perms = realUser.role?.permissions ?? ['*'];
            c.set('permissions', perms);
            console.log('🔓 Dev mode: Real user authenticated from DB');
        } else {
            console.warn('⚠️ Dev mode: No users found in DB');
        }
    }

    await next();
}
