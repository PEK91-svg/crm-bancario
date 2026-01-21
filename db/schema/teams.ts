/**
 * CRM Bancario - Database Schema: Teams & Roles
 */

import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teamTypeEnum } from './enums';

/**
 * TEAMS - Organizational structure
 */
export const teams = pgTable('teams', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    type: teamTypeEnum('type').notNull(),
    managerId: uuid('manager_id'), // Self-reference to users (added later)
    parentTeamId: uuid('parent_team_id').references((): any => teams.id),
    settings: jsonb('settings').$type<Record<string, any>>().default({}),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const teamsRelations = relations(teams, ({ one, many }) => ({
    manager: one(teams, {
        fields: [teams.managerId],
        references: [teams.id],
        relationName: 'manager',
    }),
    parentTeam: one(teams, {
        fields: [teams.parentTeamId],
        references: [teams.id],
        relationName: 'parentTeam',
    }),
    childTeams: many(teams, { relationName: 'parentTeam' }),
}));

/**
 * ROLES - RBAC roles with permissions
 */
export const roles = pgTable('roles', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(),
    description: text('description'),
    // Permissions as JSONB array: ["cases:read", "cases:write", "contacts:read", ...]
    permissions: jsonb('permissions').$type<string[]>().notNull().default([]),
    isSystem: boolean('is_system').default(false), // System roles cannot be deleted
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const rolesRelations = relations(roles, ({ many }) => ({
    // users: many(users), // Defined in users.ts
}));
