/**
 * CRM Bancario - Security Middleware
 * Rate limiting and security headers
 */

import { Context, Next } from 'hono';

/**
 * Simple in-memory rate limiter
 * Production: use Redis-based rate limiting
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(options: {
    windowMs: number; // Time window in milliseconds
    max: number; // Max requests per window
}) {
    return async (c: Context, next: Next) => {
        const key = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
        const now = Date.now();

        const record = rateLimitStore.get(key);

        if (!record || now > record.resetAt) {
            // New window
            rateLimitStore.set(key, {
                count: 1,
                resetAt: now + options.windowMs,
            });
            await next();
            return;
        }

        if (record.count >= options.max) {
            // Rate limit exceeded
            const retryAfter = Math.ceil((record.resetAt - now) / 1000);
            c.header('Retry-After', String(retryAfter));
            c.header('X-RateLimit-Limit', String(options.max));
            c.header('X-RateLimit-Remaining', '0');
            c.header('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

            return c.json({
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
            }, 429);
        }

        // Increment counter
        record.count++;
        rateLimitStore.set(key, record);

        c.header('X-RateLimit-Limit', String(options.max));
        c.header('X-RateLimit-Remaining', String(options.max - record.count));
        c.header('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

        await next();
    };
}

/**
 * Security headers middleware
 */
export function securityHeaders() {
    return async (c: Context, next: Next) => {
        // Prevent clickjacking
        c.header('X-Frame-Options', 'DENY');

        // Prevent MIME sniffing
        c.header('X-Content-Type-Options', 'nosniff');

        // XSS Protection
        c.header('X-XSS-Protection', '1; mode=block');

        // Referrer policy
        c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Content Security Policy (restrictive for banking)
        c.header('Content-Security-Policy', [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'", // TailwindCSS needs inline styles
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self'",
            "frame-ancestors 'none'",
        ].join('; '));

        // Strict Transport Security (HTTPS only)
        if (process.env.NODE_ENV === 'production') {
            c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // Permissions Policy (disable unnecessary features)
        c.header('Permissions-Policy', [
            'camera=()',
            'microphone=()',
            'geolocation=()',
            'payment=()',
        ].join(', '));

        await next();
    };
}

/**
 * Request ID middleware (for tracing)
 */
export function requestId() {
    return async (c: Context, next: Next) => {
        const id = crypto.randomUUID();
        c.set('requestId', id);
        c.header('X-Request-ID', id);
        await next();
    };
}

/**
 * Sensitive operation confirmation (for destructive actions)
 */
export function requireConfirmation(confirmationText: string) {
    return async (c: Context, next: Next) => {
        const body = await c.req.json();

        if (body.confirmation !== confirmationText) {
            return c.json({
                error: 'Confirmation required',
                message: `You must provide confirmation: "${confirmationText}"`,
            }, 400);
        }

        await next();
    };
}
