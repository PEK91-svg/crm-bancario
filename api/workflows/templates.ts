/**
 * CRM Bancario - Workflow Templates
 * Predefined workflow templates for onboarding pratiche
 */

export interface WorkflowActivity {
    id: string;
    name: string;
    description?: string;
    type: 'document_review' | 'call_customer' | 'verify_identity' | 'system_action' | 'approval';
    sequenceOrder: number;
    isMandatory: boolean;
    dependsOn?: string[]; // IDs of activities that must complete first
    estimatedDurationHours?: number;
    assignToRole?: string; // 'backoffice' | 'manager' | 'compliance'
    autoExecute?: boolean; // For system actions
    checklist?: Array<{
        item: string;
        required: boolean;
    }>;
}

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    type: string; // 'apertura_conto' | 'kyc_refresh' | 'nuovo_prodotto'
    activities: WorkflowActivity[];
    slaDays: number;
}

/**
 * Template: Apertura Conto Corrente
 */
export const APERTURA_CONTO_TEMPLATE: WorkflowTemplate = {
    id: 'apertura_conto',
    name: 'Apertura Conto Corrente',
    description: 'Workflow completo per apertura nuovo conto corrente',
    type: 'apertura_conto',
    slaDays: 2, // 48 ore
    activities: [
        {
            id: 'receive_docs',
            name: 'Ricezione Documenti',
            description: 'Verifica presenza documenti richiesti',
            type: 'document_review',
            sequenceOrder: 1,
            isMandatory: true,
            estimatedDurationHours: 1,
            assignToRole: 'backoffice',
            checklist: [
                { item: 'Documento identità valido', required: true },
                { item: 'Codice fiscale', required: true },
                { item: 'Prova residenza (bolletta recente)', required: true },
            ],
        },
        {
            id: 'verify_identity',
            name: 'Verifica Identità',
            description: 'Controllo autenticità documenti identità',
            type: 'verify_identity',
            sequenceOrder: 2,
            isMandatory: true,
            dependsOn: ['receive_docs'],
            estimatedDurationHours: 2,
            assignToRole: 'backoffice',
            checklist: [
                { item: 'Documento non scaduto', required: true },
                { item: 'Foto leggibile', required: true },
                { item: 'Dati anagrafici corrispondenti', required: true },
            ],
        },
        {
            id: 'kyc_check',
            name: 'Controllo KYC',
            description: 'Verifica Know Your Customer',
            type: 'system_action',
            sequenceOrder: 3,
            isMandatory: true,
            dependsOn: ['verify_identity'],
            estimatedDurationHours: 0.5,
            autoExecute: true,
        },
        {
            id: 'aml_check',
            name: 'Controllo AML',
            description: 'Verifica Anti Money Laundering',
            type: 'system_action',
            sequenceOrder: 4,
            isMandatory: true,
            dependsOn: ['kyc_check'],
            estimatedDurationHours: 0.5,
            autoExecute: true,
        },
        {
            id: 'credit_check',
            name: 'Controllo Creditizio',
            description: 'Verifica lista CRIF/Centrale Rischi',
            type: 'system_action',
            sequenceOrder: 5,
            isMandatory: false,
            dependsOn: ['kyc_check'],
            estimatedDurationHours: 1,
            autoExecute: true,
        },
        {
            id: 'customer_call',
            name: 'Chiamata Cliente',
            description: 'Conferma dati e condizioni contrattuali',
            type: 'call_customer',
            sequenceOrder: 6,
            isMandatory: true,
            dependsOn: ['aml_check'],
            estimatedDurationHours: 0.5,
            assignToRole: 'backoffice',
            checklist: [
                { item: 'Cliente confermato identità telefonica', required: true },
                { item: 'Condizioni contrattuali spiegate', required: true },
                { item: 'Cliente accettato condizioni', required: true },
            ],
        },
        {
            id: 'manager_approval',
            name: 'Approvazione Manager',
            description: 'Verifica finale e approvazione',
            type: 'approval',
            sequenceOrder: 7,
            isMandatory: true,
            dependsOn: ['customer_call', 'aml_check'],
            estimatedDurationHours: 2,
            assignToRole: 'manager',
        },
        {
            id: 'account_creation',
            name: 'Creazione Conto',
            description: 'Apertura conto su sistema core banking',
            type: 'system_action',
            sequenceOrder: 8,
            isMandatory: true,
            dependsOn: ['manager_approval'],
            estimatedDurationHours: 0.5,
            autoExecute: true,
        },
    ],
};

/**
 * Template: KYC Refresh (rinnovo periodico)
 */
export const KYC_REFRESH_TEMPLATE: WorkflowTemplate = {
    id: 'kyc_refresh',
    name: 'Rinnovo KYC',
    description: 'Aggiornamento periodico dati cliente',
    type: 'kyc_refresh',
    slaDays: 1,
    activities: [
        {
            id: 'request_docs',
            name: 'Richiesta Documenti Aggiornati',
            description: 'Email/SMS cliente per aggiornamento documenti',
            type: 'system_action',
            sequenceOrder: 1,
            isMandatory: true,
            autoExecute: true,
            estimatedDurationHours: 0.1,
        },
        {
            id: 'receive_new_docs',
            name: 'Ricezione Nuovi Documenti',
            description: 'Verifica upload documenti',
            type: 'document_review',
            sequenceOrder: 2,
            isMandatory: true,
            dependsOn: ['request_docs'],
            assignToRole: 'backoffice',
            estimatedDurationHours: 1,
        },
        {
            id: 'verify_changes',
            name: 'Verifica Modifiche',
            description: 'Confronto con dati precedenti',
            type: 'document_review',
            sequenceOrder: 3,
            isMandatory: true,
            dependsOn: ['receive_new_docs'],
            assignToRole: 'backoffice',
            estimatedDurationHours: 0.5,
        },
        {
            id: 'update_kyc',
            name: 'Aggiornamento KYC',
            description: 'Update sistema KYC',
            type: 'system_action',
            sequenceOrder: 4,
            isMandatory: true,
            dependsOn: ['verify_changes'],
            autoExecute: true,
            estimatedDurationHours: 0.5,
        },
    ],
};

/**
 * All available templates
 */
export const WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {
    apertura_conto: APERTURA_CONTO_TEMPLATE,
    kyc_refresh: KYC_REFRESH_TEMPLATE,
};

/**
 * Get template by type
 */
export function getWorkflowTemplate(type: string): WorkflowTemplate | undefined {
    return WORKFLOW_TEMPLATES[type];
}
