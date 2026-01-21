/**
 * CRM Bancario - Soft Delete Utility
 * Provides reusable soft delete logic for entities
 */

import { db } from '../../db';
import { eq } from 'drizzle-orm';
import { logAudit } from '../middleware/audit';

export interface SoftDeleteOptions {
    table: any;
    id: string;
    entityType: string;
    userId?: string;
}

/**
 * Soft delete an entity by setting isActive = false
 */
export async function softDelete({ table, id, entityType, userId }: SoftDeleteOptions) {
    const result = await db
        .update(table)
        .set({
            isActive: false,
            updatedAt: new Date()
        })
        .where(eq(table.id, id))
        .returning();

    if (result.length === 0) {
        throw new Error(`${entityType} not found`);
    }

    // Log the deletion for audit trail
    if (userId) {
        await logAudit({
            userId,
            action: 'delete',
            entityType,
            entityId: id,
            metadata: { softDelete: true }
        });
    }

    return result[0];
}

/**
 * Check if entity can be safely deleted
 * Override this in specific routes if needed
 */
export async function canDelete(entityType: string, id: string): Promise<{ canDelete: boolean; reason?: string }> {
    // Add your business logic here
    // For example, check if entity has dependencies

    return { canDelete: true };
}
