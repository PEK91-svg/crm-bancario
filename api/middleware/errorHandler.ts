/**
 * CRM Bancario - Error Handler Middleware
 * Global error handling for API
 */

import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

/**
 * Global error handler
 */
export const errorHandler = (err: Error, c: Context) => {
    console.error('API Error:', {
        error: err.message,
        stack: err.stack,
        path: c.req.path,
        method: c.req.method,
    });

    // HTTP exceptions (thrown by Hono)
    if (err instanceof HTTPException) {
        return c.json(
            {
                error: err.message,
                status: err.status,
            },
            err.status
        );
    }

    // Zod validation errors
    if (err instanceof ZodError) {
        return c.json(
            {
                error: 'Validation failed',
                issues: err.errors.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                })),
            },
            400
        );
    }

    // Database errors
    if (err.message.includes('violates foreign key constraint')) {
        return c.json(
            {
                error: 'Referenced entity does not exist',
            },
            400
        );
    }

    if (err.message.includes('duplicate key value')) {
        return c.json(
            {
                error: 'Duplicate entry - record already exists',
            },
            409
        );
    }

    // Generic server error
    return c.json(
        {
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        },
        500
    );
};

/**
 * HTTP exception helper
 */
export class ApiError extends HTTPException {
    constructor(status: number, message: string) {
        super(status, { message });
    }
}

/**
 * Common API errors
 */
export const NotFoundError = (resource: string) =>
    new ApiError(404, `${resource} not found`);

export const ValidationError = (message: string) =>
    new ApiError(400, message);

export const UnauthorizedError = () =>
    new ApiError(401, 'Unauthorized');

export const ForbiddenError = (message?: string) =>
    new ApiError(403, message || 'Forbidden');

export const ConflictError = (message: string) =>
    new ApiError(409, message);
