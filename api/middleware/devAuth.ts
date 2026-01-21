/**
 * CRM Bancario - Development Auth Middleware
 * Bypasses authentication in development mode with mock user
 */

import { Context, Next } from 'hono';

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

    // If using mock token, inject admin user
    if (authHeader === 'Bearer mock-token') {
        const mockUser: User = {
            id: 'dev-user-123',
            email: 'dev@crm-bancario.local',
            role: 'admin',
            permissions: ['*'], // Admin has all permissions
        };

        c.set('user', mockUser);
        c.set('userId', mockUser.id);
        c.set('permissions', mockUser.permissions);
        console.log('🔓 Dev mode: Mock admin user authenticated');
    }

    await next();
}
