/**
 * CRM Bancario - Marketing Service
 * Manage customer journeys, enrollments, and step execution
 */

import { db } from '../../db';
import {
    marketingJourneys,
    journeyEnrollments,
    contacts,
    onboardingActivities
} from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { sendNotification } from './notificationService';

/**
 * Enroll a contact in a journey
 */
export async function enrollContact(
    journeyId: string,
    contactId: string,
    userId: string // Who triggered the enrollment (or system)
) {
    // Check if already enrolled and active
    const existing = await db.query.journeyEnrollments.findFirst({
        where: and(
            eq(journeyEnrollments.journeyId, journeyId),
            eq(journeyEnrollments.contactId, contactId),
            eq(journeyEnrollments.status, 'active')
        ),
    });

    if (existing) {
        return { success: false, reason: 'Contact already enrolled' };
    }

    // Get journey details
    const journey = await db.query.marketingJourneys.findFirst({
        where: eq(marketingJourneys.id, journeyId),
    });

    if (!journey || journey.status !== 'active') {
        return { success: false, reason: 'Journey not active' };
    }

    // Create enrollment
    const [enrollment] = await db
        .insert(journeyEnrollments)
        .values({
            journeyId,
            contactId,
            status: 'active',
            currentStep: 1,
            enrolledAt: new Date(),
        })
        .returning();

    // Execute first step
    await executeJourneyStep(enrollment.id, 1);

    return { success: true, enrollment };
}

/**
 * Execute a specific step of a journey
 */
async function executeJourneyStep(enrollmentId: string, stepNumber: number) {
    const enrollment = await db.query.journeyEnrollments.findFirst({
        where: eq(journeyEnrollments.id, enrollmentId),
        with: {
            journey: true,
            contact: true,
        },
    });

    if (!enrollment || !enrollment.journey || !enrollment.contact) return;

    // Configuration JSON (steps definition)
    const config = enrollment.journey.configuration as any;
    const steps = config?.steps || [];
    const currentStepDef = steps.find((s: any) => s.order === stepNumber);

    if (!currentStepDef) {
        // End of journey
        await db
            .update(journeyEnrollments)
            .set({ status: 'completed', completedAt: new Date() })
            .where(eq(journeyEnrollments.id, enrollmentId));
        return;
    }

    console.log(`Executing Journey ${enrollment.journey.name} - Step ${stepNumber} for ${enrollment.contact.email}`);

    try {
        // Execute action based on type
        switch (currentStepDef.type) {
            case 'email':
                await sendNotification({
                    channel: 'email',
                    to: enrollment.contact.email!,
                    subject: currentStepDef.subject || `Update from ${enrollment.journey.name}`,
                    message: currentStepDef.template || 'Default message',
                });
                break;

            case 'sms':
                if (enrollment.contact.mobile) {
                    await sendNotification({
                        channel: 'sms',
                        to: enrollment.contact.mobile,
                        message: currentStepDef.message || 'Default SMS',
                    });
                }
                break;

            case 'wait':
                // Wait steps are handled by a scheduled job checking timestamps
                // For now, we just proceed immediately for demo
                break;
        }

        // Move to next step (simplified logic)
        // In production, 'wait' steps would pause here
        const nextStep = stepNumber + 1;

        await db
            .update(journeyEnrollments)
            .set({ currentStep: nextStep })
            .where(eq(journeyEnrollments.id, enrollmentId));

        // Recursively execute next step if not a wait step
        // Using simple recursion for MVP
        if (currentStepDef.type !== 'wait') {
            await executeJourneyStep(enrollmentId, nextStep);
        }

    } catch (error) {
        console.error(`Error executing journey step:`, error);
        // Log error but don't crash
    }
}

/**
 * Get all available journeys
 */
export async function getActiveJourneys() {
    return db.query.marketingJourneys.findMany({
        where: eq(marketingJourneys.status, 'active'),
    });
}

/**
 * Trigger journeys based on events (e.g., new customer, product purchase)
 */
export async function triggerJourneysByEvent(eventType: string, contactId: string, metadata: any = {}) {
    // Find automations triggered by this event
    const automations = await db.query.marketingJourneys.findMany({
        where: and(
            eq(marketingJourneys.status, 'active'),
            eq(marketingJourneys.triggerType, 'event')
            // In a real app, we'd filter by trigger_event_name matching eventType
            // Here we assume config check
        ),
    });

    for (const journey of automations) {
        const config = journey.configuration as any;
        if (config?.triggerEvent === eventType) {
            await enrollContact(journey.id, contactId, 'system');
        }
    }
}

/**
 * Analytics: Get journey performance
 */
export async function getJourneyStats(journeyId: string) {
    const [stats] = await db
        .select({
            total: sql<number>`count(*)::int`,
            active: sql<number>`count(*) FILTER (WHERE ${journeyEnrollments.status} = 'active')::int`,
            completed: sql<number>`count(*) FILTER (WHERE ${journeyEnrollments.status} = 'completed')::int`,
            converted: sql<number>`count(*) FILTER (WHERE ${journeyEnrollments.converted} = true)::int`,
        })
        .from(journeyEnrollments)
        .where(eq(journeyEnrollments.journeyId, journeyId));

    return stats;
}
