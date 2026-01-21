/**
 * CRM Bancario - Database Seed Data
 * Creates default roles, test users, and sample data for development
 */

import { db } from './index';
import {
    roles,
    teams,
    users,
    accounts,
    contacts,
    cases,
    contiCorrenti,
    progettiSpesa,
    praticheOnboarding,
} from './schema';
import { DEFAULT_ROLES } from '../api/middleware/rbac';

async function seed() {
    console.log('🌱 Starting database seed...');

    try {
        // 1. Create default roles
        console.log('Creating roles...');
        const createdRoles = await Promise.all([
            db.insert(roles).values({
                name: 'admin',
                description: 'Administrator with full access',
                permissions: DEFAULT_ROLES.admin,
                isSystem: true,
            }).returning(),

            db.insert(roles).values({
                name: 'manager',
                description: 'Team manager with elevated permissions',
                permissions: DEFAULT_ROLES.manager,
                isSystem: true,
            }).returning(),

            db.insert(roles).values({
                name: 'agent',
                description: 'Customer service agent',
                permissions: DEFAULT_ROLES.agent,
                isSystem: true,
            }).returning(),

            db.insert(roles).values({
                name: 'backoffice',
                description: 'Backoffice operator for onboarding',
                permissions: DEFAULT_ROLES.backoffice,
                isSystem: true,
            }).returning(),

            db.insert(roles).values({
                name: 'marketing',
                description: 'Marketing specialist',
                permissions: DEFAULT_ROLES.marketing,
                isSystem: true,
            }).returning(),

            db.insert(roles).values({
                name: 'readonly',
                description: 'Read-only access',
                permissions: DEFAULT_ROLES.readonly,
                isSystem: true,
            }).returning(),
        ]);

        const [adminRole, managerRole, agentRole, backofficeRole, marketingRole, readonlyRole] = createdRoles.map(r => r[0]);
        console.log('✅ Created 6 roles');

        // 2. Create teams
        console.log('Creating teams...');
        const [customerServiceTeam] = await db.insert(teams).values({
            name: 'Customer Service',
            description: 'Front-line customer support team',
            type: 'customer_service',
            isActive: true,
        }).returning();

        const [backofficeTeam] = await db.insert(teams).values({
            name: 'Backoffice',
            description: 'Onboarding and compliance team',
            type: 'backoffice',
            isActive: true,
        }).returning();

        const [marketingTeam] = await db.insert(teams).values({
            name: 'Marketing',
            description: 'Marketing and campaigns team',
            type: 'marketing',
            isActive: true,
        }).returning();

        console.log('✅ Created 3 teams');

        // 3. Create test users
        console.log('Creating test users...');

        const [adminUser] = await db.insert(users).values({
            email: 'admin@crm-bancario.it',
            firstName: 'Admin',
            lastName: 'User',
            roleId: adminRole.id,
            isActive: true,
            isOnline: false,
        }).returning();

        const [managerUser] = await db.insert(users).values({
            email: 'manager@crm-bancario.it',
            firstName: 'Maria',
            lastName: 'Bianchi',
            teamId: customerServiceTeam.id,
            roleId: managerRole.id,
            isActive: true,
        }).returning();

        // Update team with manager
        await db.update(teams)
            .set({ managerId: managerUser.id })
            .where({ id: customerServiceTeam.id });

        const [agent1] = await db.insert(users).values({
            email: 'agent1@crm-bancario.it',
            firstName: 'Marco',
            lastName: 'Rossi',
            teamId: customerServiceTeam.id,
            roleId: agentRole.id,
            extension: '101',
            isActive: true,
        }).returning();

        const [agent2] = await db.insert(users).values({
            email: 'agent2@crm-bancario.it',
            firstName: 'Laura',
            lastName: 'Verdi',
            teamId: customerServiceTeam.id,
            roleId: agentRole.id,
            extension: '102',
            isActive: true,
        }).returning();

        const [backofficeUser] = await db.insert(users).values({
            email: 'backoffice@crm-bancario.it',
            firstName: 'Paolo',
            lastName: 'Neri',
            teamId: backofficeTeam.id,
            roleId: backofficeRole.id,
            isActive: true,
        }).returning();

        const [marketingUser] = await db.insert(users).values({
            email: 'marketing@crm-bancario.it',
            firstName: 'Giulia',
            lastName: 'Bianchi',
            teamId: marketingTeam.id,
            roleId: marketingRole.id,
            isActive: true,
        }).returning();

        console.log('✅ Created 6 test users');

        // 4. Create sample accounts and contacts
        console.log('Creating sample data...');

        const [account1] = await db.insert(accounts).values({
            ndg: '00001234',
            name: 'Mario Rossi',
            type: 'retail',
            segment: 'mass_market',
            fiscalCode: 'RSSMRA80A01H501Z',
            ownerId: agent1.id,
            isActive: true,
        }).returning();

        const [contact1] = await db.insert(contacts).values({
            accountId: account1.id,
            firstName: 'Mario',
            lastName: 'Rossi',
            fiscalCode: 'RSSMRA80A01H501Z',
            email: 'mario.rossi@example.com',
            phone: '+39 333 1234567',
            mobile: '+39 333 1234567',
            isPrimary: true,
            consentMarketing: true,
            consentProfiling: false,
        }).returning();

        const [account2] = await db.insert(accounts).values({
            ndg: '00001235',
            name: 'Anna Verdi',
            type: 'premium',
            segment: 'affluent',
            fiscalCode: 'VRDNNA85M50H501Z',
            ownerId: agent2.id,
            isActive: true,
        }).returning();

        const [contact2] = await db.insert(contacts).values({
            accountId: account2.id,
            firstName: 'Anna',
            lastName: 'Verdi',
            fiscalCode: 'VRDNNA85M50H501Z',
            email: 'anna.verdi@example.com',
            phone: '+39 348 9876543',
            mobile: '+39 348 9876543',
            isPrimary: true,
            consentMarketing: true,
            consentProfiling: true,
        }).returning();

        const [account3] = await db.insert(accounts).values({
            ndg: '00001236',
            name: 'Paolo Bianchi S.r.l.',
            type: 'business',
            segment: 'mass_market',
            vatNumber: '12345678901',
            ownerId: managerUser.id,
            isActive: true,
        }).returning();

        const [contact3] = await db.insert(contacts).values({
            accountId: account3.id,
            firstName: 'Paolo',
            lastName: 'Bianchi',
            email: 'paolo.bianchi@azienda.it',
            phone: '+39 02 12345678',
            jobTitle: 'CEO',
            isPrimary: true,
            isDecisionMaker: true,
            consentMarketing: false,
            consentProfiling: false,
        }).returning();

        console.log('✅ Created 3 accounts and contacts');

        // 5. Create sample conti correnti
        const [conto1] = await db.insert(contiCorrenti).values({
            contactId: contact1.id,
            accountId: account1.id,
            iban: 'IT60X0542811101000000123456',
            accountNumber: '000000123456',
            type: 'conto_corrente',
            name: 'Conto Principale',
            balance: '12450.00',
            availableBalance: '12450.00',
            status: 'active',
            productCode: 'CC001',
            productName: 'Conto Corrente Base',
            openedAt: new Date('2023-01-15'),
        }).returning();

        const [conto2] = await db.insert(contiCorrenti).values({
            contactId: contact2.id,
            accountId: account2.id,
            iban: 'IT60X0542811101000000234567',
            accountNumber: '000000234567',
            type: 'conto_corrente',
            name: 'Conto Premium',
            balance: '45000.00',
            availableBalance: '43500.00',
            status: 'active',
            productCode: 'CC002',
            productName: 'Conto Corrente Premium',
            interestRate: '0.0150',
            openedAt: new Date('2022-06-10'),
        }).returning();

        console.log('✅ Created 2 conti correnti');

        // 6. Create sample progetti spesa
        await db.insert(progettiSpesa).values({
            contactId: contact1.id,
            accountId: account1.id,
            contoId: conto1.id,
            name: 'Casa al Mare',
            description: 'Risparmio per casa vacanze',
            category: 'casa',
            targetAmount: '80000.00',
            currentAmount: '25000.00',
            monthlyContribution: '1000.00',
            startDate: new Date('2024-01-01'),
            targetDate: new Date('2028-12-31'),
            status: 'active',
        });

        await db.insert(progettiSpesa).values({
            contactId: contact2.id,
            accountId: account2.id,
            contoId: conto2.id,
            name: 'Auto Nuova',
            description: 'Risparmio per auto elettrica',
            category: 'auto',
            targetAmount: '35000.00',
            currentAmount: '20000.00',
            monthlyContribution: '500.00',
            startDate: new Date('2024-06-01'),
            targetDate: new Date('2025-12-31'),
            status: 'active',
        });

        console.log('✅ Created 2 progetti spesa');

        // 7. Create sample cases
        await db.insert(cases).values({
            contactId: contact1.id,
            accountId: account1.id,
            ownerId: agent1.id,
            teamId: customerServiceTeam.id,
            subject: 'Problema bonifico verso estero',
            description: 'Il cliente segnala che il bonifico SEPA verso Germania non è stato eseguito',
            type: 'technical',
            category: 'payments',
            priority: 'high',
            status: 'open',
            channel: 'phone',
            slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
        });

        await db.insert(cases).values({
            contactId: contact2.id,
            accountId: account2.id,
            ownerId: agent2.id,
            teamId: customerServiceTeam.id,
            subject: 'Richiesta informazioni mutuo casa',
            description: 'Cliente interessato a mutuo prima casa, rata max 800€/mese',
            type: 'sales',
            category: 'mortgage',
            priority: 'medium',
            status: 'open',
            channel: 'email',
            slaDueAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // +72h
        });

        await db.insert(cases).values({
            contactId: contact3.id,
            accountId: account3.id,
            ownerId: managerUser.id,
            teamId: customerServiceTeam.id,
            subject: 'Reclamo commissioni carta di credito',
            description: 'Contestazione addebiti commissioni non dovute',
            type: 'complaint',
            category: 'fees',
            priority: 'critical',
            status: 'escalated',
            channel: 'branch',
            slaDueAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // +4h
            slaBreached: false,
        });

        console.log('✅ Created 3 sample cases');

        // 8. Create sample pratica onboarding
        await db.insert(praticheOnboarding).values({
            contactId: contact1.id,
            accountId: account1.id,
            assignedTo: backofficeUser.id,
            teamId: backofficeTeam.id,
            type: 'apertura_conto',
            productType: 'conto_deposito',
            status: 'in_progress',
            currentStep: 'verifica_documenti',
            submittedAt: new Date(),
            dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
            slaHours: 48,
            kycStatus: 'completed',
            amlStatus: 'in_progress',
            createdBy: backofficeUser.id,
        });

        console.log('✅ Created 1 pratica onboarding');

        console.log('\n✅ Seed completed successfully!');
        console.log('\n📊 Summary:');
        console.log('  - 6 roles (admin, manager, agent, backoffice, marketing, readonly)');
        console.log('  - 3 teams (Customer Service, Backoffice, Marketing)');
        console.log('  - 6 users (1 admin, 1 manager, 2 agents, 1 backoffice, 1 marketing)');
        console.log('  - 3 accounts with contacts');
        console.log('  - 2 conti correnti');
        console.log('  - 2 progetti spesa');
        console.log('  - 3 cases (1 high, 1 medium, 1 critical)');
        console.log('  - 1 pratica onboarding');
        console.log('\n🔐 Test credentials:');
        console.log('  Admin: admin@crm-bancario.it');
        console.log('  Manager: manager@crm-bancario.it');
        console.log('  Agent: agent1@crm-bancario.it / agent2@crm-bancario.it');
        console.log('  Backoffice: backoffice@crm-bancario.it');
        console.log('  Marketing: marketing@crm-bancario.it');

    } catch (error) {
        console.error('❌ Seed failed:', error);
        throw error;
    }
}

// Run seed if called directly
if (require.main === module) {
    seed()
        .then(() => {
            console.log('\n✅ Seed script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Seed script failed:', error);
            process.exit(1);
        });
}

export default seed;
