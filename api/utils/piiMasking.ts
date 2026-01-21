/**
 * CRM Bancario - PII Masking Utilities
 * Mask sensitive data in logs and responses
 */

/**
 * Mask email address
 * example@domain.com -> e****e@domain.com
 */
export function maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '***';

    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;

    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

/**
 * Mask phone number
 * +39 333 1234567 -> +39 *** ***4567
 */
export function maskPhone(phone: string): string {
    if (!phone) return '***';

    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length < 4) return '***';

    return cleaned.substring(0, cleaned.length - 4).replace(/\d/g, '*') +
        cleaned.substring(cleaned.length - 4);
}

/**
 * Mask fiscal code (Codice Fiscale)
 * RSSMRA80A01H501Z -> RSS***********1Z
 */
export function maskFiscalCode(code: string): string {
    if (!code || code.length !== 16) return '***';

    return code.substring(0, 3) + '*'.repeat(13) + code.substring(15);
}

/**
 * Mask IBAN
 * IT60X0542811101000000123456 -> IT********************3456
 */
export function maskIban(iban: string): string {
    if (!iban || iban.length < 8) return '***';

    return iban.substring(0, 2) + '*'.repeat(iban.length - 6) + iban.substring(iban.length - 4);
}

/**
 * Mask credit card number
 * 4532123456789012 -> 4532********9012
 */
export function maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 8) return '***';

    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.substring(0, 4) + '*'.repeat(cleaned.length - 8) + cleaned.substring(cleaned.length - 4);
}

/**
 * Mask balance/amount (for logging)
 * 12345.67 -> €*****
 */
export function maskAmount(amount: string | number): string {
    return '€*****';
}

/**
 * Mask object with PII fields
 */
export function maskPiiFields(obj: any, fields: string[] = []): any {
    if (!obj || typeof obj !== 'object') return obj;

    const defaultPiiFields = [
        'email', 'phone', 'mobile',
        'fiscalCode', 'fiscal_code',
        'iban', 'accountNumber', 'account_number',
        'balance', 'availableBalance',
        'firstName', 'first_name', 'lastName', 'last_name',
        'birthDate', 'birth_date',
        'vatNumber', 'vat_number',
        'ndg'
    ];

    const fieldsToMask = [...defaultPiiFields, ...fields];
    const masked = { ...obj };

    for (const key of Object.keys(masked)) {
        if (fieldsToMask.includes(key)) {
            const value = masked[key];

            if (value === null || value === undefined) continue;

            if (key.includes('email') || key === 'email') {
                masked[key] = maskEmail(String(value));
            } else if (key.includes('phone') || key.includes('mobile')) {
                masked[key] = maskPhone(String(value));
            } else if (key.includes('fiscal') || key.includes('codice')) {
                masked[key] = maskFiscalCode(String(value));
            } else if (key.includes('iban')) {
                masked[key] = maskIban(String(value));
            } else if (key.includes('balance') || key.includes('amount')) {
                masked[key] = maskAmount(value);
            } else if (key === 'ndg') {
                masked[key] = '***' + String(value).slice(-4);
            } else {
                masked[key] = '***';
            }
        }
    }

    return masked;
}

/**
 * Safe logger that masks PII
 */
export function safeLog(message: string, data?: any) {
    if (data) {
        console.log(message, maskPiiFields(data));
    } else {
        console.log(message);
    }
}

/**
 * Create masked audit log entry
 */
export function createMaskedAuditEntry(entry: any) {
    return {
        ...entry,
        oldValues: entry.oldValues ? maskPiiFields(entry.oldValues) : null,
        newValues: entry.newValues ? maskPiiFields(entry.newValues) : null,
        changes: entry.changes?.map((change: any) => ({
            ...change,
            oldValue: typeof change.oldValue === 'string' && change.field.includes('email')
                ? maskEmail(change.oldValue)
                : change.oldValue,
            newValue: typeof change.newValue === 'string' && change.field.includes('email')
                ? maskEmail(change.newValue)
                : change.newValue,
        })),
    };
}
