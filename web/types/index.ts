// Basic entity types reflecting the backend schema
// This is a simplified version of the Drizzle schema types

export type Call = {
    id: string;
    contactId?: string;
    userId?: string;
    status: 'ongoing' | 'completed' | 'missed';
    direction: 'inbound' | 'outbound';
    duration?: number;
    recordingUrl?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    notes?: string;
    startedAt?: string;
    completedAt?: string;
    createdAt: string;
};

export type Email = {
    id: string;
    contactId?: string;
    userId?: string;
    subject: string;
    body: string;
    isRead: boolean;
    direction: 'inbound' | 'outbound';
    sentAt?: string;
    receivedAt?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    createdAt: string;
};

export type Chat = {
    id: string;
    contactId?: string;
    userId?: string;
    status: 'active' | 'closed';
    platform: 'whatsapp' | 'messenger' | 'webchat' | 'telegram' | 'instagram';
    startedAt?: string;
    closedAt?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    createdAt: string;
};

export type ChatMessage = {
    id: string;
    chatId: string;
    senderType: 'agent' | 'contact' | 'bot';
    content: string;
    sentAt: string;
};

export type Communication = {
    type: 'call' | 'email' | 'chat';
    id: string;
    date: string;
    direction: 'inbound' | 'outbound';
    details: Call | Email | Chat;
    contactName?: string;
    contactAvatar?: string;
};
