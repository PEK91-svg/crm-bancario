/**
 * CRM Bancario - Global Search API Route
 */

import { Hono } from 'hono';
import { db } from '../../db';
import { contacts, accounts, cases } from '../../db/schema';
import { or, like, sql, eq } from 'drizzle-orm';
import { requirePermission } from '../middleware/rbac';
import { maskPiiFields } from '../utils/piiMasking';

const app = new Hono();

/**
 * GET /search?q=query
 * Global search across contacts, accounts, and cases
 */
app.get('/', requirePermission('contacts:read'), async (c) => {
    const query = c.req.query('q');

    if (!query || query.length < 2) {
        return c.json({ results: [] });
    }

    const searchPattern = `%${query}%`;

    // Parallel queries
    const [contactsResults, accountsResults, casesResults] = await Promise.all([
        // Search Contacts
        db.select({
            id: contacts.id,
            firstName: contacts.firstName,
            lastName: contacts.lastName,
            email: contacts.email,
        }).from(contacts).where(or(
            like(contacts.firstName, searchPattern),
            like(contacts.lastName, searchPattern),
            like(contacts.email, searchPattern)
        )).limit(5),

        // Search Accounts
        db.select({
            id: accounts.id,
            name: accounts.name,
            ndg: accounts.ndg,
        }).from(accounts).where(or(
            like(accounts.name, searchPattern),
            like(accounts.ndg, searchPattern)
        )).limit(5),

        // Search Cases
        db.select({
            id: cases.id,
            subject: cases.subject,
            caseNumber: cases.id, // Using UUID as number for now
        }).from(cases).where(
            like(cases.subject, searchPattern)
        ).limit(5),
    ]);

    // Format results
    const results = [
        ...contactsResults.map(r => ({
            type: 'contact',
            id: r.id,
            title: `${r.firstName} ${r.lastName}`,
            subtitle: maskPiiFields({ email: r.email }).email,
            url: `/contacts/${r.id}`
        })),
        ...accountsResults.map(r => ({
            type: 'account',
            id: r.id,
            title: r.name,
            subtitle: `NDG: ${r.ndg}`,
            url: `/accounts/${r.id}`
        })),
        ...casesResults.map(r => ({
            type: 'case',
            id: r.id,
            title: r.subject,
            subtitle: `Case #${r.caseNumber.substring(0, 8)}`,
            url: `/cases/${r.id}`
        })),
    ];

    return c.json({ results });
});

export default app;
