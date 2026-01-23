# Technical Architecture - Marketing Automation Module

## System Design Principles

1. **Event-Driven**: All state changes emit events
2. **Eventually Consistent**: Accept CAP theorem trade-offs
3. **Horizontally Scalable**: Stateless services, sharded data
4. **Fail-Safe**: Retries, dead-letter queues, circuit breakers
5. **Observable**: Metrics, logs, traces for every operation

---

## Event-Driven Architecture

### Event Types

```typescript
// Core Marketing Events
type MarketingEvent = 
  | EmailSent
  | EmailDelivered
  | EmailOpened
  | EmailClicked
  | EmailBounced
  | EmailUnsubscribed
  | SMSSent
  | SMSDelivered
  | SMSClicked
  | PushSent
  | PushOpened
  | CampaignLaunched
  | JourneyEntered
  | JourneyStepCompleted
  | JourneyExited
  | SegmentMembershipChanged
  | ConsentGranted
  | ConsentRevoked

interface EmailOpened {
  type: 'email_opened'
  eventId: string
  timestamp: Date
  contactId: string
  campaignId: string
  messageId: string
  userAgent: string
  ipAddress: string
  location?: GeoLocation
}
```

### Event Flow

```
[Contact Action] 
    ↓
[Event Captured] → Kafka Topic: marketing.events
    ↓
[Event Processor] → Write to Event Store (PostgreSQL)
    ↓
┌─────────────────────────────────────────┐
│ Parallel Consumers:                     │
│ • Attribution Engine                    │
│ • Analytics Aggregator                  │
│ • Journey Executor                      │
│ • AI Model Updater                      │
│ • Webhook Forwarder                     │
└─────────────────────────────────────────┘
```

### Event Store Schema

```sql
CREATE TABLE marketing_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    contact_id UUID NOT NULL,
    campaign_id UUID,
    journey_id UUID,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Performance indexes
    INDEX idx_contact_events ON marketing_events(contact_id, created_at DESC),
    INDEX idx_campaign_events ON marketing_events(campaign_id, event_type, created_at),
    INDEX idx_event_type_time ON marketing_events(event_type, created_at DESC)
);

-- Partition by month for performance
CREATE TABLE marketing_events_2026_01 PARTITION OF marketing_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

---

## Database Schema (Core Tables)

### Campaigns & Journeys

```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'broadcast', 'journey', 'recurring'
    status VARCHAR(20) NOT NULL, -- 'draft', 'scheduled', 'active', 'paused', 'completed'
    segment_id UUID REFERENCES marketing_segments(id),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    launched_at TIMESTAMPTZ,
    metadata JSONB -- goals, tags, notes
);

CREATE TABLE journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    version INT NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    definition JSONB NOT NULL, -- DAG structure
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(campaign_id, version)
);

CREATE TABLE journey_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID REFERENCES journeys(id),
    contact_id UUID NOT NULL,
    current_step_id VARCHAR(50),
    state JSONB, -- progress, variables
    status VARCHAR(20), -- 'active', 'completed', 'exited'
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    INDEX idx_contact_journey ON journey_executions(contact_id, journey_id)
);

CREATE TABLE journey_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES journey_executions(id),
    step_id VARCHAR(50) NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB -- outcomes, errors
);
```

### Segmentation

```sql
CREATE TABLE marketing_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL, -- nested logic tree
    is_dynamic BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_calculated_at TIMESTAMPTZ,
    member_count INT DEFAULT 0
);

-- Materialized view for performance
CREATE MATERIALIZED VIEW segment_memberships AS
SELECT 
    segment_id,
    contact_id,
    added_at
FROM (
    -- Calculated based on segment conditions
    -- Refreshed every 5 minutes via cron job
) AS calc;

CREATE INDEX idx_segment_members ON segment_memberships(segment_id, contact_id);
```

### Content & Templates

```sql
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject_line VARCHAR(500) NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,
    variables JSONB, -- list of merge tags
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    version INT DEFAULT 1
);

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    cdn_url VARCHAR(500) NOT NULL,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Message Delivery

```sql
CREATE TABLE message_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL,
    campaign_id UUID,
    channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'
    provider VARCHAR(50), -- 'sendgrid', 'twilio', etc.
    payload JSONB NOT NULL,
    priority INT DEFAULT 5, -- 1=urgent, 10=bulk
    status VARCHAR(20) DEFAULT 'queued', -- 'queued', 'sending', 'sent', 'failed'
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    error TEXT,
    
    INDEX idx_queue_status ON message_queue(status, scheduled_at) WHERE status = 'queued'
);

CREATE TABLE delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    contact_id UUID NOT NULL,
    campaign_id UUID,
    channel VARCHAR(20) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained'
    provider_message_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,
    
    INDEX idx_delivery_contact ON delivery_logs(contact_id, created_at DESC),
    INDEX idx_delivery_campaign ON delivery_logs(campaign_id, status)
);
```

### Compliance

```sql
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL,
    channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'
    consent_type VARCHAR(50) NOT NULL, -- 'marketing', 'transactional'
    status VARCHAR(20) NOT NULL, -- 'granted', 'denied', 'pending'
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    source VARCHAR(100), -- 'webform', 'api', 'manual'
    ip_address INET,
    
    UNIQUE(contact_id, channel, consent_type)
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'contact', 'campaign', 'consent'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted'
    actor_id UUID, -- user who performed action
    changes JSONB, -- old/new values
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC)
);
```

---

## Journey Execution Engine

### State Machine

```typescript
interface JourneyState {
  executionId: string
  contactId: string
  journeyId: string
  currentStepId: string
  variables: Record<string, any> // carry data between steps
  history: StepExecution[]
  status: 'active' | 'waiting' | 'completed' | 'exited'
}

interface StepExecution {
  stepId: string
  executedAt: Date
  outcome: 'success' | 'skip' | 'error'
  metadata?: any
}
```

### Execution Flow

```typescript
async function executeJourneyStep(execution: JourneyExecution, step: JourneyStep) {
  switch (step.type) {
    case 'trigger':
      // Entry point - already handled
      return nextStep(step)
    
    case 'wait':
      // Schedule resume at future time
      await scheduleResume(execution, step.waitDuration)
      return 'waiting'
    
    case 'condition':
      // Evaluate condition
      const result = await evaluateCondition(execution.contactId, step.condition)
      return result ? step.truePath : step.falsePath
    
    case 'action':
      // Execute action (send email, add tag)
      try {
        await executeAction(execution.contactId, step.action)
        logStep(execution, step, 'success')
        return nextStep(step)
      } catch (error) {
        logStep(execution, step, 'error', error)
        return handleError(execution, step, error)
      }
    
    case 'exit':
      await completeExecution(execution)
      return 'completed'
  }
}

async function evaluateCondition(contactId: string, condition: Condition): Promise<boolean> {
  // Examples:
  // { type: 'event', event: 'email_opened', within: '24h' }
  // { type: 'attribute', field: 'industry', operator: 'equals', value: 'SaaS' }
  // { type: 'segment', segmentId: 'xyz' }
  
  switch (condition.type) {
    case 'event':
      return await checkEventOccurred(contactId, condition.event, condition.within)
    case 'attribute':
      return await checkAttribute(contactId, condition.field, condition.operator, condition.value)
    case 'segment':
      return await isInSegment(contactId, condition.segmentId)
  }
}
```

### Error Handling

```typescript
async function handleError(execution: JourneyExecution, step: JourneyStep, error: Error) {
  // Log error
  await logError({
    executionId: execution.id,
    stepId: step.id,
    error: error.message,
    stack: error.stack
  })
  
  // Check if step has fallback
  if (step.fallbackStepId) {
    return step.fallbackStepId
  }
  
  // Check retry policy
  const retries = execution.stepRetries[step.id] || 0
  if (retries < step.maxRetries) {
    execution.stepRetries[step.id] = retries + 1
    await delay(exponentialBackoff(retries))
    return step.id // retry same step
  }
  
  // Exit journey if error is unrecoverable
  await exitExecution(execution, 'error')
  return 'exited'
}
```

---

## Scalability & Performance

### Horizontal Scaling

**Stateless Services**: All services can run in multiple instances behind load balancer.

```yaml
# Kubernetes deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: journey-executor
spec:
  replicas: 10 # scale based on load
  template:
    spec:
      containers:
      - name: executor
        image: crm/journey-executor:latest
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-creds
              key: url
```

### Database Sharding

**Segments by ID**: Use consistent hashing to distribute load.

```sql
-- Shard campaigns by hash of ID
CREATE TABLE campaigns
  PARTITION BY HASH (id);

CREATE TABLE campaigns_shard_0 PARTITION OF campaigns
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE campaigns_shard_1 PARTITION OF campaigns
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
-- etc.
```

### Caching Strategy

```typescript
// Redis cache layers
const CACHE_TTL = {
  SEGMENT_MEMBERS: 300, // 5 minutes
  CONTACT_PROFILE: 60,  // 1 minute
  TEMPLATE: 3600,       // 1 hour
  CONSENT: 10,          // 10 seconds (critical)
}

async function getSegmentMembers(segmentId: string): Promise<string[]> {
  const cacheKey = `segment:${segmentId}:members`
  
  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  // Calculate from DB
  const members = await db.query(`
    SELECT contact_id FROM segment_memberships WHERE segment_id = $1
  `, [segmentId])
  
  // Store in cache
  await redis.setex(cacheKey, CACHE_TTL.SEGMENT_MEMBERS, JSON.stringify(members))
  
  return members
}
```

### Message Queue Architecture

```typescript
// BullMQ job processor
const queue = new Queue('message-delivery', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
})

queue.process('send-email', async (job) => {
  const { contactId, templateId, campaignId } = job.data
  
  // Check consent
  const hasConsent = await checkConsent(contactId, 'email')
  if (!hasConsent) {
    throw new Error('No consent')
  }
  
  // Render template
  const message = await renderTemplate(contactId, templateId)
  
  // Send via provider
  const result = await sendgrid.send(message)
  
  // Log delivery
  await logDelivery({
    messageId: result.messageId,
    contactId,
    campaignId,
    status: 'sent'
  })
})
```

---

## Real-Time vs Batch Processing

| Operation | Mode | Frequency | Reason |
|-----------|------|-----------|--------|
| Event ingestion | Real-time | Immediate | User actions need instant tracking |
| Journey step execution | Real-time | < 1s | Timely user experience |
| Segment calculation | Batch | Every 5 min | Balance freshness vs cost |
| AI model inference | Hybrid | On-demand + nightly | Predictions needed in UI + batch scoring |
| Analytics aggregation | Batch | Hourly | Reports don't need second-level updates |
| Audit log writes | Real-time | Immediate | Compliance requirement |

---

## Monitoring & Observability

### Key Metrics

```typescript
// Prometheus metrics
const campaignMetrics = new Histogram({
  name: 'campaign_delivery_duration_seconds',
  help: 'Time to deliver campaign messages',
  labelNames: ['campaign_id', 'channel']
})

const journeyMetrics = new Counter({
  name: 'journey_steps_executed_total',
  help: 'Total journey steps executed',
  labelNames: ['journey_id', 'step_type', 'outcome']
})

const eventMetrics = new Counter({
  name: 'marketing_events_ingested_total',
  help: 'Total marketing events processed',
  labelNames: ['event_type']
})
```

### Distributed Tracing

```typescript
// OpenTelemetry spans
const tracer = trace.getTracer('marketing-automation')

async function sendCampaignMessage(contactId: string, campaignId: string) {
  const span = tracer.startSpan('send_campaign_message', {
    attributes: {
      'contact.id': contactId,
      'campaign.id': campaignId
    }
  })
  
  try {
    // Nested spans for each operation
    await renderTemplate(contactId, campaignId) // child span
    await checkConsent(contactId) // child span
    await deliverMessage() // child span
    span.setStatus({ code: SpanStatusCode.OK })
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
    throw error
  } finally {
    span.end()
  }
}
```

---

## Next: Read [JOURNEY_BUILDER_SPEC.md](file:///Users/gaetanopecorella/Downloads/Crm%20bancario/crm-bancario/docs/marketing/JOURNEY_BUILDER_SPEC.md)
