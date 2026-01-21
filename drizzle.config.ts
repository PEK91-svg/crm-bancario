import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './db/schema/*',
    out: './migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || '',
        ssl: true,
    },
    verbose: true,
    strict: true,
});
