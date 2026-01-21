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
console.log('🔌 DB Connection String:', connectionString.replace(/:[^:@]*@/, ':****@')); // Mask password

// Connection for migrations
export const migrationClient = postgres(connectionString, { max: 1, ssl: 'require' });

// Connection for queries
const queryClient = postgres(connectionString, { ssl: 'require' });
export const db = drizzle(queryClient, { schema });

// Type exports
export type Database = typeof db;
export { schema };
