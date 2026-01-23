/**
 * CRM Bancario - API Server Entry Point
 * Hono.js backend API
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { clerkAuth } from './middleware/auth';
import { auditMiddleware } from './middleware/audit';
import { securityHeaders, requestId, rateLimit } from './middleware/security';
import { devAuth } from './middleware/devAuth';

// Routes
import accountsRoutes from './routes/accounts';
import contactsRoutes from './routes/contacts';
import casesRoutes from './routes/cases';
import praticheRoutes from './routes/pratiche';
import journeysRoutes from './routes/journeys';
import communicationsRoutes from './routes/communications';
import adminRoutes from './routes/admin';
import analyticsRoutes from './routes/analytics';
import searchRoutes from './routes/search';
import gdprRoutes from './routes/gdpr';
import marketingRoutes from './routes/marketing';

// Types
type Variables = {
    userId: string | null;
    user: any;
    permissions: string[];
};

const app = new Hono<{ Variables: Variables }>();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', securityHeaders());
app.use('*', requestId());
app.use('*', cors({
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
}));

// Rate limiting (100 requests per 15 minutes per IP)
app.use('/api/*', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Health check (no auth required)
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});

// Dev auth bypass for mock-token (must be before clerkAuth)
app.use('/api/*', devAuth);

// Auth middleware for all /api routes
app.use('/api/*', clerkAuth);

// Audit middleware for mutations
app.use('/api/*', auditMiddleware);

// API Routes
const api = app.basePath('/api');

api.route('/accounts', accountsRoutes);
api.route('/contacts', contactsRoutes);
api.route('/cases', casesRoutes);
api.route('/pratiche', praticheRoutes);
api.route('/journeys', journeysRoutes);
api.route('/communications', communicationsRoutes);
api.route('/admin', adminRoutes);
api.route('/analytics', analyticsRoutes);
api.route('/search', searchRoutes);
api.route('/gdpr', gdprRoutes);
api.route('/marketing', marketingRoutes);

// 404 handler
app.notFound((c) => {
    return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

// Global error handler (must be last)
app.onError(errorHandler);

export default app;
