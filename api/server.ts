/**
 * CRM Bancario - API Server Initialization
 */

import { serve } from '@hono/node-server';
import app from './app';

const port = parseInt(process.env.API_PORT || '3001');

console.log('🚀 Initializing CRM Bancario API Server...');

// Initialize background jobs
async function initializeJobs() {
    try {
        const { scheduleSlaChecks } = await import('./jobs/slaChecker');
        await scheduleSlaChecks();
        console.log('✅ Background jobs initialized');
    } catch (error) {
        console.error('❌ Failed to initialize background jobs:', error);
        console.log('⚠️  Server will continue without background jobs');
    }
}

// Start server
serve({
    fetch: app.fetch,
    port,
}, async (info) => {
    console.log(`✅ API Server running on http://localhost:${info.port}`);
    console.log(`📡 Health check: http://localhost:${info.port}/health`);

    // Initialize background jobs after server starts
    await initializeJobs();
});
