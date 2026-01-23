-- Marketing Automation - Database Schema Migration
-- Phase 1: Core Tables

-- ============================================
-- 1. CAMPAIGNS & JOURNEYS
-- ============================================

CREATE TABLE marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('broadcast', 'journey', 'recurring')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
    segment_id UUID, -- references marketing_segments
    
    -- Metadata
    goal_type VARCHAR(50), -- 'conversion', 'engagement', 'revenue'
    goal_event VARCHAR(100), -- e.g., 'deal_won'
    goal_target NUMERIC,
    
    -- Ownership
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    launched_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Stats (cached)
    total_sent INT DEFAULT 0,
    total_delivered INT DEFAULT 0,
    total_opened INT DEFAULT 0,
    total_clicked INT DEFAULT 0,
    total_converted INT DEFAULT 0,
    total_revenue NUMERIC DEFAULT 0,
    
    metadata JSONB, -- tags, notes, custom fields
    
    INDEX idx_campaigns_status ON marketing_campaigns(status, created_at DESC),
    INDEX idx_campaigns_created_by ON marketing_campaigns(created_by, created_at DESC)
);

CREATE TABLE marketing_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    
    -- Journey definition (DAG stored as JSON)
    definition JSONB NOT NULL,
    -- Example structure:
    -- {
    --   "nodes": [
    --     { "id": "trigger_1", "type": "trigger:event", "config": {...} },
    --     { "id": "wait_1", "type": "wait:time", "config": {"duration": {"value": 24, "unit": "hours"}} }
    --   ],
    --   "edges": [
    --     { "source": "trigger_1", "target": "wait_1" }
    --   ]
    -- }
    
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    
    UNIQUE(campaign_id, version),
    INDEX idx_journeys_active ON marketing_journeys(campaign_id, is_active) WHERE is_active = true
);

CREATE TABLE marketing_journey_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID NOT NULL REFERENCES marketing_journeys(id),
    journey_version INT NOT NULL,
    contact_id UUID NOT NULL,
    
    -- Current state
    current_step_id VARCHAR(50),
    state JSONB, -- variables, progress
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'waiting', 'completed', 'exited', 'error')),
    
    -- Timestamps
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    last_step_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    exited_at TIMESTAMPTZ,
    exit_reason VARCHAR(100), -- 'goal_achieved', 'unsubscribed', 'error', 'manual'
    
    INDEX idx_executions_contact ON marketing_journey_executions(contact_id, journey_id),
    INDEX idx_executions_status ON marketing_journey_executions(status, last_step_at) WHERE status IN ('active', 'waiting')
);

CREATE TABLE marketing_journey_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES marketing_journey_executions(id) ON DELETE CASCADE,
    step_id VARCHAR(50) NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'skip', 'error')),
    metadata JSONB, -- step-specific data, errors
    
    INDEX idx_steps_execution ON marketing_journey_steps(execution_id, executed_at DESC)
);

-- ============================================
-- 2. SEGMENTS & AUDIENCES
-- ============================================

CREATE TABLE marketing_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Segment logic
    conditions JSONB NOT NULL,
    -- Example:
    -- {
    --   "operator": "AND",
    --   "rules": [
    --     { "type": "attribute", "field": "industry", "operator": "equals", "value": "SaaS" },
    --     { "type": "event", "event": "email_opened", "within": {"value": 7, "unit": "days"} }
    --   ]
    -- }
    
    is_dynamic BOOLEAN DEFAULT true, -- auto-refresh vs static snapshot
    
    -- Ownership
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Cached stats
    last_calculated_at TIMESTAMPTZ,
    member_count INT DEFAULT 0,
    
    INDEX idx_segments_created_by ON marketing_segments(created_by, created_at DESC)
);

-- Materialized view for fast segment membership lookup
CREATE MATERIALIZED VIEW marketing_segment_memberships AS
SELECT
    segment_id,
    contact_id,
    NOW() AS calculated_at
FROM (
    -- This will be populated by segment calculation job
    -- For now, empty placeholder
    SELECT NULL::UUID AS segment_id, NULL::UUID AS contact_id WHERE false
) AS placeholder;

CREATE UNIQUE INDEX idx_segment_memberships_pk ON marketing_segment_memberships(segment_id, contact_id);
CREATE INDEX idx_segment_memberships_contact ON marketing_segment_memberships(contact_id);

-- Refresh function (call from cron job)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY marketing_segment_memberships;

-- ============================================
-- 3. CONTENT & TEMPLATES
-- ============================================

CREATE TABLE marketing_email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject_line VARCHAR(500) NOT NULL,
    preview_text VARCHAR(255),
    
    -- Content
    html_body TEXT NOT NULL,
    text_body TEXT,
    
    -- Variables (merge tags)
    variables JSONB, -- ["first_name", "company", "trial_end_date"]
    
    -- Version control
    version INT DEFAULT 1,
    parent_template_id UUID REFERENCES marketing_email_templates(id),
    
    -- Ownership
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Stats (from AI content scoring)
    quality_score INT, -- 0-100
    
    INDEX idx_templates_created_by ON marketing_email_templates(created_by, created_at DESC)
);

CREATE TABLE marketing_sms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    body TEXT NOT NULL CHECK (LENGTH(body) <= 160),
    variables JSONB,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE marketing_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    cdn_url VARCHAR(500) NOT NULL,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_assets_uploaded_by ON marketing_assets(uploaded_by, uploaded_at DESC)
);

-- ============================================
-- 4. MESSAGE DELIVERY
-- ============================================

CREATE TABLE marketing_message_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL,
    campaign_id UUID,
    journey_execution_id UUID REFERENCES marketing_journey_executions(id),
    
    -- Channel
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'webhook')),
    provider VARCHAR(50), -- 'sendgrid', 'twilio', 'ses'
    
    -- Message payload
    payload JSONB NOT NULL,
    -- Example for email:
    -- {
    --   "to": "user@example.com",
    --   "from": "team@company.com",
    --   "subject": "Welcome!",
    --   "html": "<p>Hello {{first_name}}</p>",
    --   "variables": {"first_name": "John"}
    -- }
    
    -- Queue management
    priority INT DEFAULT 5, -- 1=urgent, 10=bulk
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed')),
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    
    -- Retry logic
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    error TEXT,
    
    INDEX idx_queue_status ON marketing_message_queue(status, scheduled_at) WHERE status = 'queued',
    INDEX idx_queue_contact ON marketing_message_queue(contact_id, created_at DESC)
);

CREATE TABLE marketing_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    contact_id UUID NOT NULL,
    campaign_id UUID,
    
    channel VARCHAR(20) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_message_id VARCHAR(255), -- external ID from SendGrid/Twilio
    
    status VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB, -- user_agent, ip_address, link clicked, etc.
    
    INDEX idx_delivery_contact ON marketing_delivery_logs(contact_id, created_at DESC),
    INDEX idx_delivery_campaign ON marketing_delivery_logs(campaign_id, status, created_at),
    INDEX idx_delivery_provider_id ON marketing_delivery_logs(provider_message_id)
);

-- ============================================
-- 5. EVENTS (Partitioned Table)
-- ============================================

CREATE TABLE marketing_events (
    event_id UUID DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    contact_id UUID NOT NULL,
    campaign_id UUID,
    journey_id UUID,
    
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    PRIMARY KEY (event_id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for current and next 12 months
CREATE TABLE marketing_events_2026_01 PARTITION OF marketing_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE marketing_events_2026_02 PARTITION OF marketing_events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- (Continue for all months...)

CREATE INDEX idx_events_contact ON marketing_events(contact_id, created_at DESC);
CREATE INDEX idx_events_campaign ON marketing_events(campaign_id, event_type, created_at DESC);
CREATE INDEX idx_events_type ON marketing_events(event_type, created_at DESC);

-- ============================================
-- 6. GDPR COMPLIANCE
-- ============================================

CREATE TABLE marketing_consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('marketing', 'transactional')),
    
    status VARCHAR(20) NOT NULL CHECK (status IN ('granted', 'denied', 'pending')),
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    
    -- Audit trail
    source VARCHAR(100), -- 'webform', 'api', 'manual', 'imported'
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(contact_id, channel, consent_type),
    INDEX idx_consent_contact ON marketing_consent_records(contact_id, channel)
);

CREATE TABLE marketing_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'contact', 'campaign', 'consent', 'journey'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'sent', 'opened'
    
    actor_id UUID, -- user who performed action (NULL for system)
    actor_type VARCHAR(20), -- 'user', 'system', 'api'
    
    changes JSONB, -- { "before": {...}, "after": {...} }
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_audit_entity ON marketing_audit_logs(entity_type, entity_id, created_at DESC),
    INDEX idx_audit_actor ON marketing_audit_logs(actor_id, created_at DESC) WHERE actor_id IS NOT NULL
);

-- ============================================
-- 7. AI PREDICTIONS
-- ============================================

CREATE TABLE marketing_ml_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- 'churn_prediction', 'engagement_score'
    version VARCHAR(20) NOT NULL,
    model_type VARCHAR(50), -- 'lightgbm', 'logistic_regression'
    
    -- Model storage
    storage_path VARCHAR(500), -- S3/blob path
    
    -- Performance metrics
    accuracy NUMERIC,
    auc_roc NUMERIC,
    precision NUMERIC,
    recall NUMERIC,
    
    -- Metadata
    trained_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(name, version)
);

CREATE TABLE marketing_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL,
    prediction_type VARCHAR(50) NOT NULL, -- 'churn_score', 'engagement_score', 'optimal_send_time'
    model_id UUID REFERENCES marketing_ml_models(id),
    
    score NUMERIC, -- 0-100
    confidence VARCHAR(20), -- 'high', 'medium', 'low'
    explanation JSONB, -- SHAP values, contributing factors
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- predictions go stale
    
    INDEX idx_predictions_contact ON marketing_predictions(contact_id, prediction_type, created_at DESC),
    INDEX idx_predictions_type ON marketing_predictions(prediction_type, created_at DESC)
);

-- ============================================
-- 8. UTILITY FUNCTIONS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_segments_updated_at BEFORE UPDATE ON marketing_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log trigger
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO marketing_audit_logs (entity_type, entity_id, action, changes)
        VALUES (TG_TABLE_NAME, OLD.id, 'deleted', row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO marketing_audit_logs (entity_type, entity_id, action, changes)
        VALUES (TG_TABLE_NAME, NEW.id, 'updated', jsonb_build_object('before', row_to_json(OLD)::jsonb, 'after', row_to_json(NEW)::jsonb));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO marketing_audit_logs (entity_type, entity_id, action, changes)
        VALUES (TG_TABLE_NAME, NEW.id, 'created', row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to sensitive tables
CREATE TRIGGER audit_campaigns AFTER INSERT OR UPDATE OR DELETE ON marketing_campaigns
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_consent AFTER INSERT OR UPDATE OR DELETE ON marketing_consent_records
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- ============================================
-- COMPLETE
-- ============================================
