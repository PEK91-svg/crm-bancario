/**
 * CRM Bancario - SLA Checker Job
 * BullMQ job for periodic SLA monitoring
 */

import { Queue, Worker } from 'bullmq';
import { checkSlaBreaches, escalateBreachedCases, getSlaMetrics } from '../services/slaService';

// Queue and Workers are not initialized at top level to avoid crash without Redis
let slaQueue: Queue | null = null;
let slaWorker: Worker | null = null;

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Schedule SLA check every 5 minutes
export async function scheduleSlaChecks() {
    try {
        if (!slaQueue) {
            slaQueue = new Queue('sla-checker', { connection });
        }

        await slaQueue.add(
            'check-sla',
            {},
            {
                repeat: {
                    pattern: '*/5 * * * *', // Every 5 minutes
                },
            }
        );

        console.log('✅ SLA checker scheduled (every 5 min)');

        // Initialize worker if not already done
        if (!slaWorker) {
            initWorker();
        }
    } catch (error) {
        console.error('⚠️ Redis connection failed. SLA Checker disabled.');
    }
}

function initWorker() {
    slaWorker = new Worker(
        'sla-checker',
        async (job) => {
            console.log(`🔍 Running SLA check job ${job.id}...`);

            try {
                // Check for breaches
                const { breached, warned } = await checkSlaBreaches();
                console.log(`  - Breached: ${breached}, Warned: ${warned}`);

                // Auto-escalate breached cases
                if (breached > 0) {
                    const escalated = await escalateBreachedCases();
                    console.log(`  - Auto-escalated: ${escalated} cases`);
                }

                // Get metrics
                const metrics = await getSlaMetrics();
                console.log(`  - Metrics:`, metrics);

                return {
                    breached,
                    warned,
                    metrics,
                    timestamp: new Date().toISOString(),
                };
            } catch (error) {
                console.error('❌ SLA check job failed:', error);
                throw error;
            }
        },
        { connection, concurrency: 1 }
    );

    slaWorker.on('completed', (job) => {
        console.log(`✅ SLA check job ${job.id} completed:`, job.returnvalue);
    });

    slaWorker.on('failed', (job, err) => {
        console.error(`❌ SLA check job ${job?.id} failed:`, err);
    });
}

// Manual trigger for testing
export async function triggerSlaCheck() {
    if (!slaQueue) {
        console.warn('⚠️ SLA Queue not initialized. Redis might be down.');
        return null;
    }
    const job = await slaQueue.add('check-sla-manual', {});
    console.log(`🚀 Manual SLA check triggered: ${job.id}`);
    return job;
}
