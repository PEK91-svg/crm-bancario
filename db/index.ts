/**
 * CRM Bancario - Database Connection
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
}

// Connection for migrations
export const migrationClient = postgres(connectionString, { max: 1 });

// Connection for queries
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// Type exports
export type Database = typeof db;
export { schema };
