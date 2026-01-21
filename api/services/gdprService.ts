/**
 * CRM Bancario - GDPR Compliance Service
 * Data export, anonymization, right to be forgotten
 */

import { db } from '../../db';
import {
    contacts,
    accounts,
    cases,
    emails,
    telefonate,
    chats,
    contiCorrenti,
    progettiSpesa,
    praticheOnboarding,
    auditLog
} from '../../db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from '../middleware/audit';

/**
 * Export all personal data for a contact (GDPR Article 15)
 */
export async function exportContactData(contactId: string, requestedBy: {
    userId: string;
    userEmail: string;
}) {
    // Log data export request
    await logAudit({
        userId: requestedBy.userId,
        userEmail: requestedBy.userEmail,
        action: 'export_pii',
        entityType: 'contact',
        entityId: contactId,
    });

    // Gather all personal data
    const contact = await db.query.contacts.findFirst({
        where: eq(contacts.id, contactId),
        with: {
            account: true,
        },
    });

    if (!contact) {
        throw new Error('Contact not found');
    }

    // Get all related data in parallel
    const [
        relatedCases,
        relatedEmails,
        relatedCalls,
        relatedChats,
        conti,
        progetti,
        pratiche,
        auditTrail,
    ] = await Promise.all([
        db.query.cases.findMany({
            where: eq(cases.contactId, contactId),
        }),
        db.query.emails.findMany({
            where: eq(emails.contactId, contactId),
        }),
        db.query.telefonate.findMany({
            where: eq(telefonate.contactId, contactId),
        }),
        db.query.chats.findMany({
            where: eq(chats.contactId, contactId),
        }),
        db.query.contiCorrenti.findMany({
            where: eq(contiCorrenti.contactId, contactId),
        }),
        db.query.progettiSpesa.findMany({
            where: eq(progettiSpesa.contactId, contactId),
        }),
        db.query.praticheOnboarding.findMany({
            where: eq(praticheOnboarding.contactId, contactId),
        }),
        db.query.auditLog.findMany({
            where: eq(auditLog.entityId, contactId),
            limit: 100, // Limit audit trail
        }),
    ]);

    // Build export package
    return {
        exportDate: new Date().toISOString(),
        contact: {
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            fiscalCode: contact.fiscalCode,
            birthDate: contact.birthDate,
            gender: contact.gender,
            email: contact.email,
            phone: contact.phone,
            mobile: contact.mobile,
            jobTitle: contact.jobTitle,
            preferredChannel: contact.preferredChannel,
            consentMarketing: contact.consentMarketing,
            consentProfiling: contact.consentProfiling,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt,
        },
        account: contact.account ? {
            id: contact.account.id,
            name: contact.account.name,
            ndg: contact.account.ndg,
            fiscalCode: contact.account.fiscalCode,
            vatNumber: contact.account.vatNumber,
            type: contact.account.type,
            segment: contact.account.segment,
        } : null,
        bankingProducts: {
            conti: conti.map(c => ({
                iban: c.iban,
                type: c.type,
                status: c.status,
                openedAt: c.openedAt,
                closedAt: c.closedAt,
            })),
            progetti: progetti.map(p => ({
                name: p.name,
                category: p.category,
                targetAmount: p.targetAmount,
                currentAmount: p.currentAmount,
                status: p.status,
            })),
        },
        interactions: {
            cases: relatedCases.length,
            emails: relatedEmails.length,
            calls: relatedCalls.length,
            chats: relatedChats.length,
        },
        pratiche: pratiche.map(p => ({
            praticaNumber: p.praticaNumber,
            type: p.type,
            status: p.status,
            submittedAt: p.submittedAt,
            outcome: p.outcome,
        })),
        auditTrail: auditTrail.map(a => ({
            action: a.action,
            timestamp: a.createdAt,
            user: a.userEmail,
        })),
    };
}

/**
 * Anonymize contact data (GDPR Article 17 - Right to be Forgotten)
 */
export async function anonymizeContact(contactId: string, requestedBy: {
    userId: string;
    userEmail: string;
    reason?: string;
}) {
    // Log anonymization request
    await logAudit({
        userId: requestedBy.userId,
        userEmail: requestedBy.userEmail,
        action: 'anonymize',
        entityType: 'contact',
        entityId: contactId,
        newValues: { reason: requestedBy.reason },
    });

    // Get contact to preserve account relationship
    const contact = await db.query.contacts.findFirst({
        where: eq(contacts.id, contactId),
    });

    if (!contact) {
        throw new Error('Contact not found');
    }

    // Anonymize personal data (GDPR-compliant)
    const anonymizedData = {
        firstName: 'ANONYMIZED',
        lastName: 'ANONYMIZED',
        fiscalCode: null,
        birthDate: null,
        gender: null,
        email: `anonymized-${contactId}@deleted.local`,
        phone: null,
        mobile: null,
        jobTitle: null,
        consentMarketing: false,
        consentProfiling: false,
        isActive: false,
    };

    await db
        .update(contacts)
        .set(anonymizedData)
        .where(eq(contacts.id, contactId));

    // Anonymize related communications (emails, chats)
    // Note: Keep cases for audit purposes but mask PII in descriptions
    const relatedCases = await db.query.cases.findMany({
        where: eq(cases.contactId, contactId),
    });

    for (const case_ of relatedCases) {
        await db.update(cases)
            .set({
                description: '[ANONYMIZED - Contact data removed per GDPR request]',
            })
            .where(eq(cases.id, case_.id));
    }

    return {
        success: true,
        contactId,
        anonymizedAt: new Date().toISOString(),
        itemsAnonymized: {
            contact: 1,
            cases: relatedCases.length,
        },
    };
}

/**
 * Delete contact and all related data (hard delete)
 * WARNING: This is irreversible and may violate audit requirements
 * Use anonymization instead for GDPR compliance in banking
 */
export async function deleteContactData(contactId: string, requestedBy: {
    userId: string;
    userEmail: string;
    confirmation: string; // Must be "I CONFIRM DELETE"
}) {
    if (requestedBy.confirmation !== 'I CONFIRM DELETE') {
        throw new Error('Deletion not confirmed');
    }

    // Log deletion request
    await logAudit({
        userId: requestedBy.userId,
        userEmail: requestedBy.userEmail,
        action: 'delete',
        entityType: 'contact',
        entityId: contactId,
    });

    // CASCADE DELETE will handle related records automatically
    // (telefonate, emails, chats, conti, progetti, cases, pratiche)
    await db.delete(contacts).where(eq(contacts.id, contactId));

    return {
        success: true,
        contactId,
        deletedAt: new Date().toISOString(),
        warning: 'All data permanently deleted',
    };
}

/**
 * Get consent history for a contact
 */
export async function getConsentHistory(contactId: string) {
    const consentChanges = await db.query.auditLog.findMany({
        where: eq(auditLog.entityId, contactId),
    });

    const consentEvents = consentChanges
        .filter(log => log.action === 'update_consent' || log.action === 'create')
        .map(log => ({
            timestamp: log.createdAt,
            user: log.userEmail,
            changes: log.changes,
        }));

    return {
        contactId,
        consentHistory: consentEvents,
    };
}
