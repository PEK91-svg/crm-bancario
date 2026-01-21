/**
 * CRM Bancario - Communications API Routes
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db';
import { telefonate, emails, chats, chatMessages } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { requirePermission } from '../middleware/rbac';
import { registerCall, sendEmail, startChat, addChatMessage } from '../services/communicationsService';

const app = new Hono();

// Schemas
const logCallSchema = z.object({
    contactId: z.string().uuid().optional(),
    caseId: z.string().uuid().optional(),
    direction: z.enum(['inbound', 'outbound']),
    fromNumber: z.string(),
    toNumber: z.string(),
    status: z.string().default('completed'),
    duration: z.number().optional(),
    recordingUrl: z.string().url().optional(),
});

const sendEmailSchema = z.object({
    contactId: z.string().uuid(),
    caseId: z.string().uuid().optional(),
    toEmail: z.string().email(),
    subject: z.string().min(1),
    htmlBody: z.string(),
});

const chatMessageSchema = z.object({
    message: z.string().min(1),
});

/**
 * CALLS ROUTES
 */
app.get('/calls', requirePermission('cases:read'), async (c) => {
    const calls = await db.query.telefonate.findMany({
        orderBy: [desc(telefonate.startedAt)],
        limit: 50,
        with: { contact: true, case: true, agent: true }
    });
    return c.json({ data: calls });
});

app.post('/calls', requirePermission('cases:write'), zValidator('json', logCallSchema), async (c) => {
    const data = c.req.valid('json');
    const user = c.get('user');
    const call = await registerCall({ ...data, agentId: user.id });
    return c.json(call, 201);
});

/**
 * EMAILS ROUTES
 */
app.get('/emails', requirePermission('cases:read'), async (c) => {
    const emailList = await db.query.emails.findMany({
        orderBy: [desc(emails.sentAt)],
        limit: 50,
        with: { contact: true, case: true }
    });
    return c.json({ data: emailList });
});

app.post('/emails', requirePermission('cases:write'), zValidator('json', sendEmailSchema), async (c) => {
    const data = c.req.valid('json');
    const user = c.get('user');

    const email = await sendEmail({
        ...data,
        fromEmail: user.email, // Agent email
        userId: user.id,
    });
    return c.json(email, 201);
});

/**
 * CHATS ROUTES
 */
app.get('/chats', requirePermission('cases:read'), async (c) => {
    const chatList = await db.query.chats.findMany({
        orderBy: [desc(chats.createdAt)],
        limit: 50,
        with: { contact: true, messages: { limit: 1, orderBy: [desc(chatMessages.createdAt)] } }
    });
    return c.json({ data: chatList });
});

app.get('/chats/:id/messages', requirePermission('cases:read'), async (c) => {
    const id = c.req.param('id');
    const messages = await db.query.chatMessages.findMany({
        where: eq(chatMessages.chatId, id),
        orderBy: [db.schema.chatMessages.createdAt], // asc order for reading
    });
    return c.json({ data: messages });
});

app.post('/chats/:id/messages', requirePermission('cases:write'), zValidator('json', chatMessageSchema), async (c) => {
    const chatId = c.req.param('id');
    const { message } = c.req.valid('json');
    const user = c.get('user');

    const msg = await addChatMessage(chatId, {
        senderType: 'agent',
        senderId: user.id,
        message,
    });

    return c.json(msg, 201);
});

export default app;
