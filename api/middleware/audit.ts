/**
 * CRM Bancario - Audit Middleware
 * Automatic audit logging for all mutations
 */

import { Context, Next } from 'hono';
import { db } from '../../db';
import { auditLog } from '../../db/schema';

/**
 * Audit middleware - logs all mutations (POST, PUT, PATCH, DELETE)
 */
export const auditMiddleware = async (c: Context, next: Next) => {
    const method = c.req.method;
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (!isMutation) {
        await next();
        return;
    }

    const user = c.get('user');
    const path = c.req.path;

    // Generate unique request ID for tracing
    const requestId = crypto.randomUUID();
    c.set('requestId', requestId);

    // Extract entity type from path (e.g., /api/cases -> 'case')
    const pathParts = path.split('/');
    const entityType = pathParts[pathParts.length - 2] || 'unknown';
    const entityId = pathParts[pathParts.length - 1];

    // Store request body for later (if needed for old/new values)
    let requestBody: any = null;
    try {
        if (method !== 'DELETE') {
            requestBody = await c.req.json();
        }
    } catch {
        // Body might not be JSON or empty
    }

    // Execute request
    await next();

    // Only log successful mutations (2xx responses)
    const status = c.res.status;
    if (status < 200 || status >= 300) {
        return;
    }

    // Log to audit_log asynchronously (don't block response)
    const auditData = {
        userId: user?.id || null,
        userEmail: user?.email || 'anonymous',
        action: getActionFromMethod(method),
        entityType: entityType.replace(/s$/, ''), // Remove plural 's'
        entityId: entityId !== entityType ? entityId : null,
        newValues: requestBody,
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
        userAgent: c.req.header('user-agent'),
        requestId,
    };

    // Fire-and-forget audit log (don't await)
    db.insert(auditLog)
        .values(auditData)
        .catch((error) => {
            console.error('Audit log error:', error);
        });
};

/**
 * Map HTTP method to audit action
 */
function getActionFromMethod(method: string): string {
    switch (method) {
        case 'POST':
            return 'create';
        case 'PUT':
        case 'PATCH':
            return 'update';
        case 'DELETE':
            return 'delete';
        default:
            return 'unknown';
    }
}

/**
 * Manual audit log helper for special cases
 * (e.g., bulk operations, read of PII data)
 */
export async function logAudit(params: {
    userId: string;
    userEmail: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
}) {
    try {
        await db.insert(auditLog).values({
            ...params,
            requestId: crypto.randomUUID(),
        });
    } catch (error) {
        console.error('Manual audit log error:', error);
    }
}
