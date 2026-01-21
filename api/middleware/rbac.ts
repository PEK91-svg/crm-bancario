/**
 * CRM Bancario - RBAC Middleware
 * Role-Based Access Control permission checking
 */

import { Context, Next } from 'hono';

/**
 * Permission types for the CRM system
 */
export type Permission =
    // Cases
    | 'cases:read'
    | 'cases:write'
    | 'cases:delete'
    | 'cases:assign'
    | 'cases:escalate'
    // Contacts
    | 'contacts:read'
    | 'contacts:write'
    | 'contacts:delete'
    | 'contacts:export'
    // Accounts
    | 'accounts:read'
    | 'accounts:write'
    | 'accounts:delete'
    // Pratiche
    | 'pratiche:read'
    | 'pratiche:write'
    | 'pratiche:approve'
    | 'pratiche:reject'
    // Marketing
    | 'journeys:read'
    | 'journeys:write'
    | 'journeys:activate'
    // Reports
    | 'reports:view'
    | 'reports:export'
    // Admin
    | 'admin:users'
    | 'admin:settings'
    | 'admin:audit'
    // Wildcard
    | '*';

/**
 * Default role configurations
 */
export const DEFAULT_ROLES = {
    admin: ['*'] as Permission[],

    manager: [
        'cases:read', 'cases:write', 'cases:assign', 'cases:escalate',
        'contacts:read', 'contacts:write', 'contacts:export',
        'accounts:read', 'accounts:write',
        'pratiche:read', 'pratiche:write',
        'reports:view', 'reports:export',
    ] as Permission[],

    agent: [
        'cases:read', 'cases:write',
        'contacts:read', 'contacts:write',
        'accounts:read',
    ] as Permission[],

    backoffice: [
        'pratiche:read', 'pratiche:write', 'pratiche:approve', 'pratiche:reject',
        'accounts:read', 'accounts:write',
        'contacts:read', 'contacts:write',
    ] as Permission[],

    marketing: [
        'journeys:read', 'journeys:write', 'journeys:activate',
        'contacts:read',
        'reports:view',
    ] as Permission[],

    readonly: [
        'cases:read',
        'contacts:read',
        'accounts:read',
        'pratiche:read',
        'journeys:read',
        'reports:view',
    ] as Permission[],
};

/**
 * Check if user has required permission
 */
export function hasPermission(
    userPermissions: string[],
    required: Permission
): boolean {
    // Wildcard permission grants everything
    if (userPermissions.includes('*')) {
        return true;
    }

    // Direct permission match
    if (userPermissions.includes(required)) {
        return true;
    }

    // Wildcard resource permission (e.g., "cases:*" grants all case permissions)
    const [resource] = required.split(':');
    if (userPermissions.includes(`${resource}:*`)) {
        return true;
    }

    return false;
}

/**
 * Middleware factory to require specific permission
 */
export function requirePermission(permission: Permission) {
    return async (c: Context, next: Next) => {
        const permissions = c.get('permissions') as string[];
        const user = c.get('user');

        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        if (!hasPermission(permissions, permission)) {
            // Log denied access to audit
            console.warn('Permission denied:', {
                userId: user.id,
                email: user.email,
                required: permission,
                has: permissions,
            });

            return c.json({
                error: 'Forbidden',
                message: `Permission '${permission}' required`,
            }, 403);
        }

        await next();
    };
}

/**
 * Middleware to require ANY of multiple permissions
 */
export function requireAnyPermission(...permissions: Permission[]) {
    return async (c: Context, next: Next) => {
        const userPermissions = c.get('permissions') as string[];
        const user = c.get('user');

        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const hasAny = permissions.some((perm) =>
            hasPermission(userPermissions, perm)
        );

        if (!hasAny) {
            return c.json({
                error: 'Forbidden',
                message: `One of these permissions required: ${permissions.join(', ')}`,
            }, 403);
        }

        await next();
    };
}

/**
 * Middleware to require ALL of multiple permissions
 */
export function requireAllPermissions(...permissions: Permission[]) {
    return async (c: Context, next: Next) => {
        const userPermissions = c.get('permissions') as string[];
        const user = c.get('user');

        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const hasAll = permissions.every((perm) =>
            hasPermission(userPermissions, perm)
        );

        if (!hasAll) {
            return c.json({
                error: 'Forbidden',
                message: `All of these permissions required: ${permissions.join(', ')}`,
            }, 403);
        }

        await next();
    };
}
