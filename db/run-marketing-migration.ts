/**
 * Run Marketing Schema Migration
 * Execute this file directly: tsx db/run-marketing-migration.ts
 */

import { db } from './index';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    console.log('🚀 Starting Marketing Schema Migration...');

    const migrationPath = path.join(__dirname, 'migrations', '009_marketing_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    try {
        // Execute the migration
        await db.execute(sql.raw(migrationSQL));

        console.log('✅ Marketing schema created successfully!');
        console.log('\nTables created:');
        console.log('  - marketing_campaigns');
        console.log('  - marketing_journeys');
        console.log('  - marketing_journey_executions');
        console.log('  - marketing_journey_steps');
        console.log('  - marketing_segments');
        console.log('  - marketing_segment_memberships (materialized view)');
        console.log('  - marketing_email_templates');
        console.log('  - marketing_sms_templates');
        console.log('  - marketing_assets');
        console.log('  - marketing_message_queue');
        console.log('  - marketing_delivery_logs');
        console.log('  - marketing_events (partitioned)');
        console.log('  - marketing_consent_records');
        console.log('  - marketing_audit_logs');
        console.log('  - marketing_ml_models');
        console.log('  - marketing_predictions');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
