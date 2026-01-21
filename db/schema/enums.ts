/**
 * CRM Bancario - Database Schema: ENUMS
 * All PostgreSQL ENUM types used across the schema
 */

import { pgEnum } from 'drizzle-orm/pg-core';

// User & Team
export const userRoleEnum = pgEnum('user_role', [
    'admin',
    'manager',
    'agent',
    'backoffice',
    'marketing',
    'readonly',
]);

export const teamTypeEnum = pgEnum('team_type', [
    'customer_service',
    'backoffice',
    'marketing',
    'sales',
    'compliance',
]);

// Account & Contact
export const accountTypeEnum = pgEnum('account_type', [
    'retail',
    'premium',
    'private',
    'business',
]);

export const accountSegmentEnum = pgEnum('account_segment', [
    'mass_market',
    'affluent',
    'hnwi',
    'uhnwi',
]);

export const genderEnum = pgEnum('gender', ['M', 'F', 'O']);

// Banking Products
export const contoTypeEnum = pgEnum('conto_type', [
    'conto_corrente',
    'conto_deposito',
    'conto_titoli',
    'carta_credito',
]);

export const contoStatusEnum = pgEnum('conto_status', [
    'active',
    'dormant',
    'blocked',
    'closed',
]);

export const progettoStatusEnum = pgEnum('progetto_status', [
    'draft',
    'active',
    'completed',
    'cancelled',
]);

// Cases & Communications
export const caseStatusEnum = pgEnum('case_status', [
    'new',
    'open',
    'pending',
    'waiting_customer',
    'escalated',
    'resolved',
    'closed',
]);

export const casePriorityEnum = pgEnum('case_priority', [
    'low',
    'medium',
    'high',
    'critical',
]);

export const caseChannelEnum = pgEnum('case_channel', [
    'phone',
    'email',
    'chat',
    'web',
    'branch',
    'app',
]);

export const callDirectionEnum = pgEnum('call_direction', ['inbound', 'outbound']);
export const emailDirectionEnum = pgEnum('email_direction', ['inbound', 'outbound']);

export const chatChannelEnum = pgEnum('chat_channel', [
    'webchat',
    'whatsapp',
    'telegram',
    'app',
]);

// Onboarding
export const onboardingStatusEnum = pgEnum('onboarding_status', [
    'pending',
    'in_progress',
    'waiting_docs',
    'review',
    'approved',
    'rejected',
]);

export const activityStatusEnum = pgEnum('activity_status', [
    'todo',
    'in_progress',
    'completed',
    'blocked',
    'skipped',
]);
