/**
 * Marketing - Main Router
 * Aggregates all marketing sub-routes
 */

import { Hono } from 'hono';
import campaigns from './campaigns';
import journeys from './journeys';
import segments from './segments';
import events from './events';

const app = new Hono();

// Mount sub-routes
app.route('/campaigns', campaigns);
app.route('/journeys', journeys);
app.route('/segments', segments);
app.route('/events', events);

// Marketing dashboard stats endpoint
app.get('/dashboard', async (c) => {
    // TODO: Implement dashboard aggregations
    return c.json({
        campaigns: {
            total: 0,
            active: 0,
            drafts: 0
        },
        performance: {
            sent: 0,
            openRate: 0,
            clickRate: 0,
            revenue: 0
        },
        journeys: {
            total: 0,
            active: 0,
            activeExecutions: 0
        }
    });
});

export default app;
