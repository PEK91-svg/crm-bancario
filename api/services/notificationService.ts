/**
 * CRM Bancario - Notification Service
 * Send notifications via email, SMS, Slack (base implementation)
 */

export interface Notification {
    to: string | string[];
    subject?: string;
    message: string;
    channel: 'email' | 'sms' | 'slack' | 'in_app';
    priority?: 'low' | 'medium' | 'high';
    metadata?: Record<string, any>;
}

/**
 * Send email notification (SendGrid integration - mock)
 */
export async function sendEmail(params: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}): Promise<{ success: boolean; messageId?: string }> {
    console.log('[EMAIL] Sending email:', {
        to: params.to,
        subject: params.subject,
        from: params.from || 'noreply@crm-bancario.it',
    });

    // TODO: Integrate with SendGrid
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ ... });

    // Mock success
    return {
        success: true,
        messageId: `mock-${Date.now()}`,
    };
}

/**
 * Send SMS notification (Twilio integration - mock)
 */
export async function sendSms(params: {
    to: string;
    message: string;
}): Promise<{ success: boolean; sid?: string }> {
    console.log('[SMS] Sending SMS:', {
        to: params.to,
        message: params.message.substring(0, 50) + '...',
    });

    // TODO: Integrate with Twilio
    // const client = require('twilio')(accountSid, authToken);
    // await client.messages.create({ ... });

    // Mock success
    return {
        success: true,
        sid: `SM${Date.now()}`,
    };
}

/**
 * Send Slack notification (mock)
 */
export async function sendSlack(params: {
    channel: string;
    message: string;
    blocks?: any[];
}): Promise<{ success: boolean }> {
    console.log('[SLACK] Sending to channel:', params.channel);

    // TODO: Integrate with Slack Webhook
    // await fetch(process.env.SLACK_WEBHOOK_URL, {
    //   method: 'POST',
    //   body: JSON.stringify({ text: message, blocks }),
    // });

    return { success: true };
}

/**
 * Universal notification dispatcher
 */
export async function sendNotification(notification: Notification): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        switch (notification.channel) {
            case 'email':
                if (typeof notification.to === 'string') {
                    await sendEmail({
                        to: notification.to,
                        subject: notification.subject || 'Notification from CRM',
                        html: notification.message,
                    });
                }
                break;

            case 'sms':
                if (typeof notification.to === 'string') {
                    await sendSms({
                        to: notification.to,
                        message: notification.message,
                    });
                }
                break;

            case 'slack':
                await sendSlack({
                    channel: typeof notification.to === 'string' ? notification.to : notification.to[0],
                    message: notification.message,
                });
                break;

            case 'in_app':
                // TODO: Store in-app notification
                console.log('[IN_APP] Notification:', notification.message);
                break;

            default:
                return { success: false, error: 'Unknown channel' };
        }

        return { success: true };
    } catch (error) {
        console.error('Notification error:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Notify on SLA breach
 */
export async function notifySlaBreached(params: {
    caseId: string;
    caseSubject: string;
    ownerId: string;
    ownerEmail: string;
    managerEmail?: string;
}) {
    // Notify owner
    await sendEmail({
        to: params.ownerEmail,
        subject: `⚠️ SLA Breached - Case #${params.caseId}`,
        html: `
      <h2>SLA Breach Alert</h2>
      <p>The following case has breached its SLA:</p>
      <ul>
        <li><strong>Case ID:</strong> ${params.caseId}</li>
        <li><strong>Subject:</strong> ${params.caseSubject}</li>
      </ul>
      <p>Please take immediate action.</p>
    `,
    });

    // Notify manager if available
    if (params.managerEmail) {
        await sendEmail({
            to: params.managerEmail,
            subject: `🚨 Team SLA Breach - Case #${params.caseId}`,
            html: `
        <h2>SLA Breach - Manager Alert</h2>
        <p>A case in your team has breached its SLA:</p>
        <ul>
          <li><strong>Case ID:</strong> ${params.caseId}</li>
          <li><strong>Subject:</strong> ${params.caseSubject}</li>
          <li><strong>Owner:</strong> ${params.ownerEmail}</li>
        </ul>
      `,
        });
    }
}

/**
 * Notify on pratica approval
 */
export async function notifyPraticaApproved(params: {
    praticaNumber: number;
    contactEmail: string;
    productType: string;
}) {
    await sendEmail({
        to: params.contactEmail,
        subject: `✅ Pratica Approvata - #${params.praticaNumber}`,
        html: `
      <h2>La tua pratica è stata approvata!</h2>
      <p>Siamo lieti di informarti che la pratica <strong>#${params.praticaNumber}</strong> 
      per <strong>${params.productType}</strong> è stata approvata.</p>
      <p>Riceverai a breve ulteriori comunicazioni.</p>
      <p>Cordiali saluti,<br>Team CRM Bancario</p>
    `,
    });
}

/**
 * Notify on pratica rejection
 */
export async function notifyPraticaRejected(params: {
    praticaNumber: number;
    contactEmail: string;
    reason: string;
}) {
    await sendEmail({
        to: params.contactEmail,
        subject: `❌ Pratica Rifiutata - #${params.praticaNumber}`,
        html: `
      <h2>Pratica non approvata</h2>
      <p>Ci dispiace informarti che la pratica <strong>#${params.praticaNumber}</strong> 
      non è stata approvata.</p>
      <p><strong>Motivo:</strong> ${params.reason}</p>
      <p>Per maggiori informazioni, contatta il nostro servizio clienti.</p>
      <p>Cordiali saluti,<br>Team CRM Bancario</p>
    `,
    });
}
