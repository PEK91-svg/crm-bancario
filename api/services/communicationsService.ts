/**
 * CRM Bancario - Communications Service
 * Handle Calls, Emails, and Chats
 */

import { db } from '../../db';
import { telefonate, emails, chats, chatMessages } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Register a call (e.g. from Twilio webhook)
 */
export async function registerCall(data: {
    contactId?: string;
    caseId?: string;
    direction: 'inbound' | 'outbound';
    fromNumber: string;
    toNumber: string;
    status: string;
    duration?: number;
    recordingUrl?: string;
    agentId?: string;
}) {
    const [call] = await db.insert(telefonate).values({
        ...data,
        startedAt: new Date(),
    }).returning();

    return call;
}

/**
 * Send an email (via provider) and log it
 */
export async function sendEmail(data: {
    contactId: string;
    caseId?: string;
    subject: string;
    txtBody?: string;
    htmlBody?: string;
    fromEmail: string;
    toEmail: string;
    userId: string; // Agent sending it
}) {
    // TODO: Actual send logic (SendGrid/SMTP) here
    const messageId = `msg-${Date.now()}`;

    const [email] = await db.insert(emails).values({
        ...data,
        direction: 'outbound',
        status: 'sent',
        messageId,
        sentAt: new Date(),
    }).returning();

    return email;
}

/**
 * Start a new chat session
 */
export async function startChat(contactId: string, channel: 'web' | 'whatsapp' = 'web') {
    const [chat] = await db.insert(chats).values({
        contactId,
        channel,
        status: 'active',
    }).returning();

    return chat;
}

/**
 * Add message to chat
 */
export async function addChatMessage(chatId: string, data: {
    senderType: 'customer' | 'agent' | 'bot';
    senderId?: string; // agent ID if senderType=agent
    message: string;
}) {
    const [message] = await db.insert(chatMessages).values({
        chatId,
        ...data,
    }).returning();

    // Update chat updated_at
    await db.update(chats)
        .set({ updatedAt: new Date() })
        .where(eq(chats.id, chatId));

    return message;
}

/**
 * Get communication history for a contact
 */
export async function getCommunicationHistory(contactId: string) {
    const [calls, emailList, chatList] = await Promise.all([
        db.query.telefonate.findMany({
            where: eq(telefonate.contactId, contactId),
            orderBy: [desc(telefonate.startedAt)],
            limit: 20
        }),
        db.query.emails.findMany({
            where: eq(emails.contactId, contactId),
            orderBy: [desc(emails.sentAt)],
            limit: 20
        }),
        db.query.chats.findMany({
            where: eq(chats.contactId, contactId),
            orderBy: [desc(chats.createdAt)],
            limit: 20
        })
    ]);

    return { calls, emails: emailList, chats: chatList };
}
