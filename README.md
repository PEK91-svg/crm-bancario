# CRM Bancario Retail

Enterprise-grade CRM system for retail banking operations, featuring customer service, backoffice workflows, and marketing automation.

## Architecture

- **Frontend**: Next.js 15 + React 19 + TailwindCSS 4
- **Backend**: Hono.js (API server)
- **Database**: PostgreSQL 17 with Drizzle ORM
- **Cache**: Redis Stack
- **Search**: Meilisearch
- **Auth**: Clerk (planned)
- **Telephony**: Twilio Flex integration (planned)

## Project Structure

```
crm-bancario/
├── app/                    # Next.js App Router
├── db/                     # Database layer
│   ├── schema/            # Drizzle schemas (17 tables)
│   │   ├── enums.ts
│   │   ├── teams.ts
│   │   ├── users.ts
│   │   ├── accounts.ts
│   │   ├── banking.ts
│   │   ├── cases.ts
│   │   ├── communications.ts
│   │   ├── onboarding.ts
│   │   ├── marketing.ts
│   │   └── audit.ts
│   └── index.ts           # DB connection
├── migrations/             # Drizzle migrations
├── docker-compose.yml      # Local infrastructure
└── drizzle.config.ts      # Drizzle configuration
```

## Database Modules

### Core (4 tables)
- `teams` - Organizational structure
- `roles` - RBAC permissions
- `users` - CRM operators
- `accounts` - Customer entities

### Contacts (2 tables)
- `contacts` - Individual persons
- PII fields marked for GDPR compliance

### Banking Products (2 tables)
- `conti_correnti` - Bank accounts (IBAN, balances)  
- `progetti_spesa` - Savings goals

### Customer Service (5 tables)
- `cases` - Tickets with SLA tracking
- `telefonate` - Phone calls (Twilio integration)
- `emails` - Email communications
- `chats` - Live chat sessions
- `chat_messages` - Chat message history

### Backoffice (2 tables)
- `pratiche_onboarding` - Onboarding workflows
- `onboarding_activities` - Workflow steps with dependencies

### Marketing (2 tables)
- `marketing_journeys` - Automated customer journeys
- `journey_enrollments` - Contact enrollments & tracking

### System (1 table)
- `audit_log` - Complete audit trail (append-only)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Infrastructure

**Note**: Requires Docker installed

```bash
npm run docker:up
```

This starts:
- PostgreSQL 17 on port 5432
- Redis on port 6379
- Meilisearch on port 7700
- pgAdmin on port 5050

### 3. Run Migrations

```bash
npm run db:migrate
```

### 4. Seed Database (Development Data)

```bash
npm run db:seed
```

This creates:
- 6 default roles (admin, manager, agent, backoffice, marketing, readonly)
- 3 teams (Customer Service, Backoffice, Marketing)
- 6 test users with realistic data
- 3 sample accounts with contacts
- Banking products (conti correnti, progetti spesa)
- Sample cases and pratiche

**Test Credentials**:
- Admin: `admin@crm-bancario.it`
- Manager: `manager@crm-bancario.it`
- Agent: `agent1@crm-bancario.it` / `agent2@crm-bancario.it`

### 5. Start Development Servers

**API Server**:
```bash
npm run api:dev
# API running on http://localhost:3001
```

**Frontend** (future):
```bash
npm run dev
```

## Security & GDPR

The CRM implements comprehensive security and GDPR compliance features:

### GDPR Rights
- **Right to Access** (Article 15): `GET /api/gdpr/export/:contactId`
- **Right to be Forgotten** (Article 17): `POST /api/gdpr/anonymize/:contactId`
- **Consent Management**: Full tracking and history

### Security Features
- Rate limiting (100 req/15min per IP)
- Security headers (CSP, HSTS, XSS protection)
- PII masking in logs
- Comprehensive audit trail
- Request ID tracking

See [SECURITY.md](./SECURITY.md) for complete documentation.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build production bundle |
| `npm run db:generate` | Generate migrations from schema changes |
| `npm run db:migrate` | Apply migrations to database |
| `npm run db:push` | Push schema directly without migrations (dev only) |
| `npm run db:studio` | Open Drizzle Studio GUI |
| `npm run docker:up` | Start Docker infrastructure |
| `npm run docker:down` | Stop Docker infrastructure |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://crm:secret@localhost:5432/crm_bancario

# Redis
REDIS_URL=redis://localhost:6379

# Meilisearch
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_API_KEY=masterkey

# Clerk (when configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Twilio (when configured)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FLEX_WORKSPACE_SID=

# SendGrid (when configured)
SENDGRID_API_KEY=
```

## Database Access

### pgAdmin
- URL: http://localhost:5050
- Email: admin@crm.local
- Password: admin

### Drizzle Studio
```bash
npm run db:studio
```

### PostgreSQL Direct
```bash
docker exec -it crm-postgres psql -U crm -d crm_bancario
```

## Development Roadmap

### ✅ Phase 1: Data Model (Complete)
- [x] Database schema designed
- [x] Drizzle ORM configured
- [x] Migrations generated
- [x] Docker Compose infrastructure

### 🚧 Phase 2: Data Model (In Progress)
- [ ] Seed data implementation
- [ ] Database indexes optimization

### ⏳ Phase 3: API Contracts
- [ ] Hono.js API server setup
- [ ] Zod validation schemas
- [ ] RBAC middleware
- [ ] Audit middleware
- [ ] API endpoints implementation

### ⏳ Phase 4: Business Logic
- [ ] SLA service
- [ ] Case assignment logic
- [ ] Workflow engine (onboarding)
- [ ] Marketing journey executor
- [ ] Job queue setup (BullMQ)

### ⏳ Phase 5: Security & Compliance
- [ ] RBAC role templates
- [ ] Audit log automation
- [ ] GDPR compliance features
- [ ] PII masking in logs

### ⏳ Phase 6: Frontend
- [ ] Next.js UI setup
- [ ] shadcn/ui components
- [ ] Agent Desktop
- [ ] Contact 360° view
- [ ] Case management UI
- [ ] Pratiche onboarding UI

## Compliance & Security

### PII Protection
All PII fields are marked in schema comments:
- `contacts`: fiscal_code, first_name, last_name, email, phone, birth_date
- `accounts`: fiscal_code, vat_number, addresses
- `conti_correnti`: IBAN, account_number, balances (CRITICAL)
- `users`: email, first_name, last_name, phone

### GDPR Features
- Consent tracking (`consent_marketing`, `consent_profiling`)
- Audit trail for all data access
- Data export capability (planned)
- Data anonymization (planned)

### Audit Log
- Append-only table
- Tracks all mutations
- Request context (IP, user-agent)
- Change tracking (old/new values)

## Documentation

- [Analisi Strutturale](../brain/780764c2-2817-4c0d-88cd-5a29b631d667/analisi_strutturale.md)
- [Implementation Plan](../brain/780764c2-2817-4c0d-88cd-5a29b631d667/implementation_plan.md)
- [Task Breakdown](../brain/780764c2-2817-4c0d-88cd-5a29b631d667/task.md)

## Tech Stack Details

### Why Drizzle ORM?
- Type-safe queries
- Zero runtime overhead
- SQL-like syntax
- Built-in migrations

### Why Hono.js?
- Ultra-fast (100K+ req/s)
- TypeScript-first
- Lightweight middleware
- Edge-ready

### Why PostgreSQL 17?
- JSONB for flexible schemas
- Full-text search (pg_trgm)
- Advanced indexing (GIN, BRIN)
- ACID transactions (critical for banking)

## License

Proprietary - Internal use only
