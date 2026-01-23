# Requirements Functional Document (RFD)
## Marketing Automation Module

**Version**: 1.0  
**Date**: January 2026  
**Author**: Marketing Engineering Team  

---

## 1. Scope

### In-Scope
- ✅ Multi-channel campaign orchestration (Email, SMS, Push)
- ✅ Visual journey builder with versioning
- ✅ Dynamic audience segmentation
- ✅ Multi-touch attribution
- ✅ AI-powered recommendations (churn, send-time, engagement)
- ✅ GDPR compliance features
- ✅ Real-time analytics dashboard
- ✅ A/B testing framework
- ✅ Content template management

### Out-of-Scope (Phase 2)
- ❌ Social media publishing
- ❌ Native ad buying (Google Ads, Facebook Ads)
- ❌ Landing page builder
- ❌ Form builder (use existing tools)
- ❌ In-app messaging (web/mobile SDK)
- ❌ Live chat integration beyond data sync
- ❌ Predictive lead scoring (separate from churn)

---

## 2. Functional Requirements

### FR-1: Campaign Management

**FR-1.1**: Users SHALL be able to create broadcast campaigns (one-time send).  
**FR-1.2**: Users SHALL be able to create recurring campaigns (daily, weekly, monthly).  
**FR-1.3**: Users SHALL be able to schedule campaigns for future send times.  
**FR-1.4**: Users SHALL be able to pause/resume active campaigns.  
**FR-1.5**: System SHALL prevent duplicate sends to same contact within campaign.

---

### FR-2: Journey Builder

**FR-2.1**: System SHALL provide a visual drag-drop journey builder interface.  
**FR-2.2**: Journey SHALL support nodes: Trigger, Wait, Condition, Action, Exit, Split Test.  
**FR-2.3**: Journey SHALL support branching logic (if/else, switch).  
**FR-2.4**: Journey SHALL support versioning (v1, v2, v3...).  
**FR-2.5**: System SHALL allow rollback to previous journey version.  
**FR-2.6**: System SHALL provide simulation mode to test journey logic.  
**FR-2.7**: Journey SHALL track execution state per contact (current step, variables).  
**FR-2.8**: Journey SHALL handle errors (retry, fallback, exit).  
**FR-2.9**: Users SHALL be able to

 A/B test journey paths.  
**FR-2.10**: System SHALL automatically promote winning variant based on statistical significance.

---

### FR-3: Segmentation

**FR-3.1**: Users SHALL be able to create dynamic segments with auto-refresh.  
**FR-3.2**: Users SHALL be able to create static segments (point-in-time snapshot).  
**FR-3.3**: Segments SHALL support nested conditions (AND/OR/NOT).  
**FR-3.4**: Segments SHALL support conditions based on:  
   - Contact attributes (name, email, industry, custom fields)  
   - Event history (clicked, opened, purchased)  
   - Behavioral data (last login, engagement score)  
   - Predictive scores (churn risk, engagement likelihood)  
**FR-3.5**: System SHALL calculate segment membership within 5 minutes.  
**FR-3.6**: Users SHALL be able to preview segment members (sample).  
**FR-3.7**: System SHALL display segment member count in real-time.

---

### FR-4: Content & Templates

**FR-4.1**: Users SHALL be able to create email templates with WYSIWYG editor.  
**FR-4.2**: Templates SHALL support merge tags ({{first_name}}, {{company}}).  
**FR-4.3**: System SHALL validate merge tags before send.  
**FR-4.4**: Users SHALL be able to upload images/assets to CDN.  
**FR-4.5**: System SHALL provide template version history.  
**FR-4.6**: Users SHALL be able to create SMS templates (max 160 chars).  
**FR-4.7**: System SHALL preview how email renders on mobile/desktop.

---

### FR-5: Channel Orchestration

**FR-5.1**: System SHALL support sending via Email, SMS, Push, Webhook.  
**FR-5.2**: System SHALL support multiple provider integrations (SendGrid, Twilio, etc).  
**FR-5.3**: System SHALL implement retry logic with exponential backoff.  
**FR-5.4**: System SHALL implement fallback to secondary provider on primary failure.  
**FR-5.5**: System SHALL enforce frequency caps (max N messages per time period).  
**FR-5.6**: System SHALL respect channel preferences (email OK, SMS not OK).  
**FR-5.7**: System SHALL queue messages asynchronously (BullMQ).  
**FR-5.8**: System SHALL log every delivery attempt (sent, failed, bounced).

---

### FR-6: Attribution & Analytics

**FR-6.1**: System SHALL track events: sent, delivered, opened, clicked, bounced, unsubscribed.  
**FR-6.2**: System SHALL support attribution models:  
   - First-touch  
   - Last-touch  
   - Linear  
   - Time-decay  
   - Data-driven (ML-based)  
**FR-6.3**: System SHALL attribute revenue to campaigns based on selected model.  
**FR-6.4**: Users SHALL be able to view campaign performance dashboard.  
**FR-6.5**: Dashboard SHALL display: sends, opens, clicks, conversions, revenue.  
**FR-6.6**: System SHALL update analytics within 5 seconds of event occurrence.  
**FR-6.7**: Users SHALL be able to export analytics data as CSV.

---

### FR-7: AI & Intelligence

**FR-7.1**: System SHALL provide churn prediction score (0-100) for each contact.  
**FR-7.2**: System SHALL provide engagement score for each contact.  
**FR-7.3**: System SHALL recommend optimal send time per contact.  
**FR-7.4**: System SHALL analyze email content and provide quality score.  
**FR-7.5**: System SHALL detect anomalies in campaign performance.  
**FR-7.6**: System SHALL provide next-best-action recommendations.  
**FR-7.7**: AI predictions SHALL be updated daily (batch) or on-demand (API).  
**FR-7.8**: System SHALL explain AI predictions (top 3 contributing factors).

---

### FR-8: Compliance (GDPR)

**FR-8.1**: System SHALL track consent per channel (email, SMS, push).  
**FR-8.2**: System SHALL prevent sends to contacts without valid consent.  
**FR-8.3**: System SHALL provide one-click unsubscribe functionality.  
**FR-8.4**: System SHALL honor unsubscribe within 1 hour.  
**FR-8.5**: System SHALL provide data export (GDPR portability).  
**FR-8.6**: System SHALL provide data deletion (Right to Erasure).  
**FR-8.7**: System SHALL log all consent changes with timestamp and IP.  
**FR-8.8**: System SHALL audit all message sends (proof of consent).

---

## 3. Non-Functional Requirements

### NFR-1: Performance

**NFR-1.1**: Event ingestion latency SHALL be < 100ms (p99).  
**NFR-1.2**: API response time SHALL be < 200ms (p95).  
**NFR-1.3**: Segment calculation SHALL complete in < 10s for 100k contacts.  
**NFR-1.4**: Journey step execution SHALL complete in < 500ms per step.  
**NFR-1.5**: System SHALL handle 10k events/second during peak load.  
**NFR-1.6**: System SHALL queue 100k messages/minute.

---

### NFR-2: Scalability

**NFR-2.1**: System SHALL horizontally scale API services.  
**NFR-2.2**: System SHALL partition database tables by ID shard.  
**NFR-2.3**: System SHALL support 10M+ contacts.  
**NFR-2.4**: System SHALL support 1M+ active journey executions.

---

### NFR-3: Reliability

**NFR-3.1**: System uptime SHALL be 99.9% monthly.  
**NFR-3.2**: Data replication SHALL be enabled (multi-region).  
**NFR-3.3**: Automated backups SHALL run daily.  
**NFR-3.4**: System SHALL recover from crash without data loss (WAL).

---

### NFR-4: Security

**NFR-4.1**: All APIs SHALL require authentication (JWT).  
**NFR-4.2**: User actions SHALL be audited (who, what, when).  
**NFR-4.3**: Sensitive data SHALL be encrypted at rest (AES-256).  
**NFR-4.4**: Connections SHALL use TLS 1.3.  
**NFR-4.5**: System SHALL implement role-based access control (RBAC).

---

### NFR-5: Accessibility

**NFR-5.1**: UI SHALL meet WCAG 2.1 Level AA.  
**NFR-5.2**: All actions SHALL be keyboard-accessible.  
**NFR-5.3**: Color contrast SHALL be ≥ 4.5:1 for text.  
**NFR-5.4**: Screen readers SHALL announce all critical UI changes.

---

## 4. User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Marketing Admin** | Full access (create, edit, delete campaigns, journeys, segments) |
| **Marketing Manager** | Create/edit campaigns, view analytics |
| **Marketing Analyst** | View-only access to dashboards and reports |
| **Developer** | API access, webhook configuration |
| **Compliance Officer** | View audit logs, export data, manage consent |

---

## 5. Success Metrics (12 Months Post-Launch)

| Metric | Target |
|--------|--------|
| **Campaign Launch Time** | < 30 min (from idea to live) |
| **Automation Coverage** | > 80% campaigns automated |
| **Marketing-Attributed Revenue** | > 40% of total revenue |
| **User Adoption** | > 50 marketing seats |
| **NPS (Marketing Module)** | > 50 |
| **System Uptime** | 99.9% |

---

## 6. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Complexity Overwhelms Users** | Medium | High | Phased rollout, training, templates |
| **Email Deliverability Issues** | High | High | Multi-provider strategy, DMARC/SPF/DKIM setup |
| **GDPR Violations** | Low | Critical | External audit, automated compliance checks |
| **Performance Degradation at Scale** | Medium | High | Load testing before GA, auto-scaling |
| **Data Loss** | Low | Critical | Daily backups, multi-region replication |

---

## 7. Dependencies

| Dependency | Purpose | Criticality |
|------------|---------|-------------|
| **PostgreSQL** | Primary database | Critical |
| **Redis** | Caching, queues | Critical |
| **Kafka** | Event streaming | High |
| **SendGrid/Twilio** | Email/SMS delivery | Critical |
| **S3/CDN** | Asset storage | Medium |
| **FastAPI (Python)** | AI service | Medium |

---

## 8. Acceptance Criteria

**Phase 1 (MVP)** is complete when:
- ✅ User can create and send broadcast email campaign
- ✅ User can build simple journey (trigger → wait → email)
- ✅ User can create dynamic segment
- ✅ System tracks events (sent, opened, clicked)
- ✅ Dashboard displays campaign performance
- ✅ GDPR consent checks functional

**Phase 2** is complete when:
- ✅ All AI features deployed
- ✅ A/B testing framework live
- ✅ Multi-touch attribution models functional
- ✅ Journey versioning and rollback tested

---

## Next: Read [FAILURE_MODES.md](file:///Users/gaetanopecorella/Downloads/Crm%20bancario/crm-bancario/docs/marketing/FAILURE_MODES.md)
