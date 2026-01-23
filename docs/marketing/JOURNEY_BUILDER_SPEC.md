# Journey Builder - Specification

## Overview

The Journey Builder is a visual, drag-and-drop interface for creating multi-step marketing automation workflows. Think Zapier + Figma for marketing.

**Design Principle**: Make complex logic simple through visual representation. Hide complexity, expose control.

---

## Node Library

### 1. Trigger Nodes (Entry Points)

#### Event Trigger
```typescript
{
  type: 'trigger:event',
  config: {
    event: 'contact_created' | 'form_submitted' | 'deal_won' | 'custom_event',
    filters?: {
      field: string
      operator: 'equals' | 'contains' | 'greater_than'
      value: any
    }[]
  }
}
```

**Example**: "When contact submits pricing page form"

#### Segment Trigger
```typescript
{
  type: 'trigger:segment',
  config: {
    segmentId: string,
    entryMode: 'one_time' | 'repeatable' // Can user re-enter if they re-join segment?
  }
}
```

**Example**: "When contact enters 'Trial Expiring Soon' segment"

#### Scheduled Trigger
```typescript
{
  type: 'trigger:schedule',
  config: {
    frequency: 'daily' | 'weekly' | 'monthly',
    time: '09:00',
    timezone: 'America/New_York',
    targetSegment: string // who gets this
  }
}
```

**Example**: "Every Monday at 9am, send to active users"

---

### 2. Wait Nodes (Delays)

#### Time Delay
```typescript
{
  type: 'wait:time',
  config: {
    duration: {
      value: number,
      unit: 'minutes' | 'hours' | 'days' | 'weeks'
    }
  }
}
```

**Example**: "Wait 24 hours"

#### Wait Until Specific Time
```typescript
{
  type: 'wait:until',
  config: {
    time: '09:00',
    timezone: 'auto' | 'America/New_York',
    skipWeekends: boolean,
    maxWait?: Duration // timeout
  }
}
```

**Example**: "Wait until next business day at 9am in user's timezone"

#### Wait For Event
```typescript
{
  type: 'wait:event',
  config: {
    event: string,
    timeout: Duration, // how long to wait before giving up
    onTimeout: 'exit' | 'continue' // what to do if event doesn't occur
  }
}
```

**Example**: "Wait for email open, max 3 days, then continue"

---

### 3. Condition Nodes (Branching Logic)

#### If/Else Split
```typescript
{
  type: 'condition:if',
  config: {
    conditions: {
      operator: 'AND' | 'OR',
      rules: [
        {
          type: 'attribute',
          field: 'industry',
          operator: 'equals',
          value: 'SaaS'
        },
        {
          type: 'event',
          event: 'email_opened',
          within: {
            value: 7,
            unit: 'days'
          }
        },
        {
          type: 'segment',
          segmentId: 'high_engagement'
        }
      ]
    },
    truePath: string, // next node ID
    falsePath: string
  }
}
```

**Visual Representation**:
```
    [Condition]
       /    \
     Yes    No
      /      \
 [Email A] [Email B]
```

#### Switch (Multi-Branch)
```typescript
{
  type: 'condition:switch',
  config: {
    field: 'lifecycle_stage',
    cases: [
      { value: 'lead', nextNode: 'node_lead' },
      { value: 'mql', nextNode: 'node_mql' },
      { value: 'sql', nextNode: 'node_sql' },
      { default: 'node_default' }
    ]
  }
}
```

**Example**: Route by lifecycle stage

---

### 4. Action Nodes

#### Send Email
```typescript
{
  type: 'action:email',
  config: {
    templateId: string,
    fromName: string,
    fromEmail: string,
    subject: string, // supports variables: "Hi {{first_name}}!"
    replyTo?: string,
    trackOpens: boolean,
    trackClicks: boolean
  }
}
```

#### Send SMS
```typescript
{
  type: 'action:sms',
  config: {
    body: string, // max 160 chars
    from: string // phone number
  }
}
```

#### Update Contact
```typescript
{
  type: 'action:update_contact',
  config: {
    updates: {
      field: string,
      value: string | number | boolean
    }[]
  }
}
```

**Example**: Add tag "nurture_sequence_completed"

#### Create Task
```typescript
{
  type: 'action:create_task',
  config: {
    assignTo: 'account_owner' | 'specific_user',
    userId?: string,
    title: string,
    description: string,
    dueIn: Duration
  }
}
```

**Example**: "Assign sales follow-up task after 3 email opens"

#### Webhook
```typescript
{
  type: 'action:webhook',
  config: {
    url: string,
    method: 'POST' | 'PUT',
    headers: Record<string, string>,
    body: any, // supports variables
    retryOnFail: boolean
  }
}
```

---

### 5. Split Test Node

```typescript
{
  type: 'split:ab_test',
  config: {
    variants: [
      { name: 'A', weight: 50, nextNode: 'node_a' },
      { name: 'B', weight: 50, nextNode: 'node_b' }
    ],
    winnerCriteria: {
      metric: 'open_rate' | 'click_rate' | 'conversion_rate',
      minSampleSize: 100,
      confidenceLevel: 0.95
    },
    autoPromoteWinner: boolean, // after stat significance, route all to winner
  }
}
```

**Visual**:
```
    [Split Test]
       /    \
    A(50%) B(50%)
     /      \
 [Email A] [Email B]
```

---

### 6. Exit Node

```typescript
{
  type: 'exit',
  config: {
    reason: 'completed' | 'goal_achieved' | 'unsubscribed'
  }
}
```

---

## Advanced Features

### 1. Versioning

**Problem**: What happens to in-flight users when you edit a journey?

**Solution**: Immutable versions.

```typescript
interface JourneyVersion {
  id: string
  journeyId: string
  version: number
  definition: JourneyGraph
  isActive: boolean
  createdAt: Date
  activatedAt?: Date
  deactivatedAt?: Date
}

// When you edit a journey:
// 1. Create new version (v2)
// 2. Users in v1 continue on v1
// 3. New users start on v2
// 4. Option to migrate existing users to v2 (admin choice)
```

**UI Indicator**:
```
Journey: "Welcome Sequence"
  ├─ v1 (deprecated) - 234 active users
  ├─ v2 (active) - 1,450 active users
  └─ v3 (draft) - 0 users
```

---

### 2. Simulation Mode

**Before launching**, test journey logic without sending real messages.

```typescript
async function simulateJourney(
  journeyId: string,
  testContactId: string,
  options: {
    speed: 'instant' | 'realtime', // skip waits or honor them
    stopAt?: string // node ID to pause simulation
  }
): Promise<SimulationResult> {
  const execution = await executeJourney(journeyId, testContactId, {
    isDryRun: true, // don't actually send messages
    logLevel: 'verbose'
  })
  
  return {
    path: execution.visitedNodes,
    actions: execution.actionsTaken,
    finalState: execution.state,
    errors: execution.errors
  }
}
```

**UI**: Show path user would take,

 highlight which emails would be sent.

---

### 3. Rollback

**Scenario**: Journey v2 has a bug. Need to revert to v1.

```typescript
async function rollbackJourney(journeyId: string, targetVersion: number) {
  // 1. Deactivate current version
  await deactivateVersion(journeyId, 'current')
  
  // 2. Reactivate target version
  await activateVersion(journeyId, targetVersion)
  
  // 3. Decide what to do with in-flight users
  const options = [
    'keep_on_current_version', // safest
    'migrate_to_rollback_version', // riskier
    'exit_all' // nuclear option
  ]
  
  // Usually: keep in-flight on broken version, new entrants on rollback
}
```

---

### 4. Goal Tracking

**Every journey should have a measurable goal.**

```typescript
interface JourneyGoal {
  type: 'conversion' | 'engagement' | 'revenue'
  event?: string // e.g., 'deal_won'
  target?: number // e.g., $10k ARR
  timeframe?: Duration // within 30 days of journey start
}

// Example: "Goal: Convert to paid customer within 14 days"
```

**Analytics**:
- % of users achieving goal
- Time to goal
- Compare v1 vs v2 goal completion

---

## Error Handling

### User Segment Change Mid-Journey

**Problem**: User enters journey via "Trial Users" segment. Then upgrades to paid. Should they continue?

**Solutions**:

1. **Continue Regardless** (default)
   - User stays in journey even if they no longer match entry criteria
   - Most common behavior

2. **Exit on Mismatch**
   ```typescript
   {
     type: 'condition:check_segment',
     config: {
       segmentId: 'original_entry_segment',
       ifNotInSegment: 'exit'
     }
   }
   ```

3. **Branch Based on Current State**
   ```typescript
   {
     type: 'condition:if',
     config: {
       conditions: { segment: 'paid_customers' },
       truePath: 'skip_to_onboarding',
       falsePath: 'continue_nurture'
     }
   }
   ```

---

### Message Send Failures

**Scenario**: Email bounces, SMS delivery fails.

**Handling**:

```typescript
interface ActionNode {
  config: {
    onError: {
      action: 'retry' | 'skip' | 'exit' | 'fallback',
      retries?: number,
      fallbackNode?: string
    }
  }
}

// Example: If email fails, send SMS instead
{
  type: 'action:email',
  config: {
    templateId: 'welcome',
    onError: {
      action: 'fallback',
      fallbackNode: 'sms_welcome'
    }
  }
}
```

---

### Consent Revoked Mid-Journey

**Problem**: User unsubscribes while in journey.

**Solution**: Auto-exit.

```typescript
// Before each action node, check:
async function canSendMessage(contactId: string, channel: string): Promise<boolean> {
  const consent = await getConsent(contactId, channel)
  
  if (!consent.granted) {
    await exitExecution(executionId, 'consent_revoked')
    return false
  }
  
  return true
}
```

**UI Indicator**: Show "234 users exited due to unsubscribe"

---

### Rate Limiting / Frequency Capping

**Problem**: User in 3 journeys simultaneously. Risk of spam.

**Solution**: Global frequency cap.

```typescript
interface FrequencyCap {
  channel: 'email' | 'sms' | 'push'
  maxPer: 'day' | 'week' | 'month'
  count: number
}

// Example: Max 3 marketing emails per week
// If cap exceeded, delay message or skip
async function checkFrequencyCap(contactId: string, channel: string): Promise<boolean> {
  const sent = await countRecentMessages(contactId, channel, 'week')
  
  if (sent >= 3) {
    // Option 1: Delay until next week
    // Option 2: Skip this message
    // Option 3: Prioritize by campaign importance
    return false
  }
  
  return true
}
```

---

## Visual Design Specs

### Canvas Layout

**Inspired by**: Figma, Miro, Lucidchart.

**Features**:
- Infinite canvas
- Zoom in/out (10%-200%)
- Pan with spacebar + drag
- Minimap in corner
- Grid snapping
- Auto-layout (align nodes)

### Node Appearance

```
┌─────────────────────────────┐
│ 📧 Send Email               │ ← Icon + Node Type
├─────────────────────────────┤
│ Template: Welcome Email     │ ← Config Summary
│ From: team@company.com      │
├─────────────────────────────┤
│ ⚙️ Edit   📊 Stats          │ ← Quick Actions
└─────────────────────────────┘
      ↓
```

**Colors by Node Type**:
- Trigger: Purple
- Wait: Blue
- Condition: Yellow
- Action: Green
- Exit: Red

### Connection Lines

- Solid line: Normal flow
- Dashed line: Error/fallback path
- Animated dots: Active users flowing through
- Thickness: Proportional to user volume

### Performance Stats Overlay

**Hover on node → show stats**:
```
📊 Email Performance
   Sent: 1,245
   Delivered: 1,240 (99.6%)
   Opened: 620 (50%)
   Clicked: 186 (15%)
```

---

## Builder UI Mockup

```
┌──────────────────────────────────────────────────────────────────────┐
│ Journey: Welcome Sequence (v2 - Active)            [Simulate] [Save] │
├──────────────────────────────────────────────────────────────────────┤
│ Sidebar                  │ Canvas                                    │
│ ┌────────────────┐      │                                           │
│ │ Triggers       │      │    ┌────────────────┐                    │
│ │  Event         │      │    │ 📌 Sign Up     │                    │
│ │  Segment       │      │    │                │                    │
│ │  Schedule      │      │    └────────┬───────┘                    │
│ ├────────────────┤      │             │                            │
│ │ Actions        │      │             ↓                            │
│ │  Email         │      │    ┌────────────────┐                    │
│ │  SMS           │      │    │ ⏰ Wait 1 hour │                    │
│ │  Update Field  │      │    └────────┬───────┘                    │
│ │  Webhook       │      │             │                            │
│ ├────────────────┤      │             ↓                            │
│ │ Logic          │      │    ┌────────────────┐                    │
│ │  If/Else       │      │    │ 📧 Welcome     │                    │
│ │  Wait          │      │    │ Email          │                    │
│ │  Split Test    │      │    └────────┬───────┘                    │
│ └────────────────┘      │             │                            │
│                         │            ...                            │
│ [Zoom: 100%]            │                                           │
└─────────────────────────┴───────────────────────────────────────────┘
```

---

## Implementation Stack

**Frontend**:
- **React Flow**: Canvas rendering, drag-drop
- **Zustand**: Journey state management
- **Zod**: Node validation
- **React Hook Form**: Node config forms

**Backend**:
- **PostgreSQL**: Store journey definitions as JSONB
- **BullMQ**: Execute journey steps asynchronously
- **Redis**: Track execution state

---

## Next: Read [AI_INTELLIGENCE_LAYER.md](file:///Users/gaetanopecorella/Downloads/Crm%20bancario/crm-bancario/docs/marketing/AI_INTELLIGENCE_LAYER.md)
