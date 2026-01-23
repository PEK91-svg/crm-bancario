# Design System - Marketing Control Room

## Philosophy

**This is not a "pretty" interface. This is a control room.**

Principles:
1. **Information Density**: More data, less chrome
2. **Scannability**: User should understand system state in < 5 seconds
3. **Speed**: Every action < 3 clicks
4. **Trust**: Show mechanics, not magic
5. **Dark Mode First**: Reduce eye strain for power users

**Inspiration**: Bloomberg Terminal, Linear, Vercel, Stripe

---

## Color System

### Semantic Colors (Dark Mode)

| Use Case | Color | Hex | When to Use |
|----------|-------|-----|-------------|
| **Background** | Charcoal | `#0A0A0A` | Main canvas |
| **Surface** | Dark Gray | `#1A1A1A` | Cards, panels |
| **Border** | Subtle Gray | `#2A2A2A` | Dividers |
| **Text Primary** | White | `#FFFFFF` | Headings, key metrics |
| **Text Secondary** | Gray | `#A0A0A0` | Labels, metadata |
| **Accent** | Cyan | `#00D9FF` | Primary actions |
| **Success** | Green | `#00FF88` | Completed, high performance |
| **Warning** | Amber | `#FFB800` | Needs attention |
| **Danger** | Red | `#FF4444` | Errors, critical issues |
| **Neutral** | Blue-Gray | `#64748B` | Info, secondary actions |

### Campaign Status Colors

```css
.status-draft { background: #3B82F6; } /* Blue */
.status-scheduled { background: #8B5CF6; } /* Purple */
.status-active { background: #10B981; } /* Green */
.status-paused { background: #F59E0B; } /* Amber */
.status-completed { background: #6B7280; } /* Gray */
```

---

## Typography

### Font Stack
```css
font-family: 
  'Inter', /* Primary */
  -apple-system, 
  BlinkMacSystemFont, 
  'Segoe UI', 
  sans-serif;

/* Monospace for metrics */
font-family-mono: 
  'JetBrains Mono', 
  'Fira Code', 
  'Consolas', 
  monospace;
```

### Type Scale

| Element | Size  | Weight | Line Height | Use |
|---------|------|--------|-------------|-----|
| **H1** | 32px | 700 | 1.2 | Page titles |
| **H2** | 24px | 600 | 1.3 | Section headers |
| **H3** | 18px | 600 | 1.4 | Card titles |
| **Body** | 14px | 400 | 1.5 | Default text |
| **Small** | 12px | 400 | 1.4 | Meta info |
| **Metric** | 28px | 700 | 1.2 | Key numbers |
| **Code** | 13px | 400 | 1.6 | IDs, technical values |

---

## Layout Patterns

### 1. Marketing Dashboard

```
┌────────────────────────────────────────────────────────────────┐
│ Header                                                         │
│ [Marketing] Last 30 days ▾         🔍 Search    [+ Campaign]   │
├────────────────────────────────────────────────────────────────┤
│ Key Metrics (Grid 4 columns)                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ Sent     │ │ Opened   │ │ Clicked  │ │ Revenue  │          │
│ │ 125.4K   │ │ 28.3%    │ │ 4.2%     │ │ $42.8K   │          │
│ │ +12% ▲   │ │ -2% ▼    │ │ +5% ▲    │ │ +18% ▲   │          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
├────────────────────────────────────────────────────────────────┤
│ Campaigns Table                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Name             Status    Sent    Open%   Click%  Rev   │  │
│ │ Welcome Series   Active    1.2K    32%     5.1%    $2.4K │  │
│ │ Product Launch   Active    8.5K    28%     3.8%    $12K  │  │
│ │ Win-back         Paused    450     18%     1.2%    $890  │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Metrics show absolute value + trend
- Table sortable by any column
- Hover row → quick actions appear
- Infinite scroll (virtual rendering)

---

### 2. Journey Builder (See JOURNEY_BUILDER_SPEC.md for full spec)

```
┌────────────────────────────────────────────────────────────┐
│ [< Back] Welcome Sequence v2              [Simulate][Save] │
├──────────┬─────────────────────────────────────────────────┤
│ Nodes    │ Canvas                                          │
│ Panel    │         ┌────────────┐                          │
│          │         │ Sign Up    │                          │
│ Triggers │         └──────┬─────┘                          │
│ Actions  │                │                                │
│ Logic    │                ↓                                │
│          │         ┌────────────┐                          │
│          │         │ Wait 1hr   │                          │
│          │         └──────┬─────┘                          │
│          │                │                                │
│ [Stats]  │       ╔════════╧════════╗                      │
│ Entered  │       ║ If Opened?      ║                      │
│ 1,245    │       ╚═══╤════════╤════╝                      │
│          │          YES       NO                           │
│ Active   │           │         │                           │
│ 892      │      [Thank You] [Reminder]                    │
└──────────┴─────────────────────────────────────────────────┘
```

---

### 3. Audience Explorer

```
┌──────────────────────────────────────────────────────────────┐
│ Segment: High Value Customers                    [Edit][Copy]│
├──────────────────────────────────────────────────────────────┤
│ Conditions                                                   │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ALL of the following:                                  │  │
│ │  ┌──────────────────────────────────────────────────┐  │  │
│ │  │ Lifetime Value   >   $5,000                      │  │  │
│ │  │ Last Purchase    <   90 days ago                 │  │  │
│ │  │ Engagement Score >   70                          │  │  │
│ │  └──────────────────────────────────────────────────┘  │  │
│ │                                                        │  │
│ │ [+ Add Condition]                                      │  │
│ └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ Preview: 1,248 contacts                         [Refresh]    │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Name              Company        LTV      Last Purchase │  │
│ │ Sarah Johnson     Acme Inc       $8.2K    23 days ago   │  │
│ │ Mike Chen         TechCorp       $12.5K   45 days ago   │  │
│ │ ...                                                     │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

### 4. Campaign Analytics

```
┌──────────────────────────────────────────────────────────────┐
│ Campaign: Summer Sale 2026                      [Export CSV] │
├──────────────────────────────────────────────────────────────┤
│ Performance                                                  │
│ ┌──────────────────────────────────────────────────────────┐│
│ │     Open Rate Over Time                                  ││
│ │  40%│                                                     ││
│ │  30%│         ●─────●                                     ││
│ │  20%│    ●────         ─────●                             ││
│ │  10%│                                                     ││
│ │   0%└──────────────────────────────────────              ││
│ │      Day 1   Day 2   Day 3   Day 4                       ││
│ └──────────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────────┤
│ Funnel                                                       │
│  Sent       Delivered   Opened     Clicked    Converted     │
│  10,000  →  9,850    →  2,840   →  420     →  89           │
│  100%       98.5%       28.8%      4.3%       0.9%          │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Library

### Metric Card

```tsx
<MetricCard
  label="Open Rate"
  value="28.3%"
  trend={-2.1}
  target={30}
  sparklineData={[25, 27, 29, 28, 28.3]}
/>
```

**Visual**:
```
┌──────────────┐
│ Open Rate    │
│ 28.3%        │ ← Large, bold
│ -2.1% ▼      │ ← Red if negative
│ ─╮─╮─╮╮      │ ← Sparkline
│ Target: 30%  │ ← Context
└──────────────┘
```

---

### Status Badge

```tsx
<StatusBadge status="active" />
```

**States**:
- `draft` → Blue, "Draft"
- `scheduled` → Purple, "Scheduled"
- `active` → Green, "Active"
- `paused` → Amber, "Paused"
- `completed` → Gray, "Completed"

---

### Data Table

**Features**:
- ✅ Sortable columns
- ✅ Row actions (hover to reveal)
- ✅ Virtualized scrolling (10k+ rows)
- ✅ Column resize
- ✅ Multi-select
- ✅ Inline editing

```tsx
<DataTable
  columns={[
    { key: 'name', label: 'Campaign', sortable: true },
    { key: 'sent', label: 'Sent', align: 'right', format: 'number' },
    { key: 'openRate', label: 'Open %', align: 'right', format: 'percentage' }
  ]}
  data={campaigns}
  rowActions={(row) => [
    { label: 'Edit', onClick: () => editCampaign(row.id) },
    { label: 'Duplicate', onClick: () => duplicateCampaign(row.id) },
    { label: 'Delete', onClick: () => deleteCampaign(row.id), danger: true }
  ]}
/>
```

---

### Performance on Large Datasets

**Challenge**: Render 10,000+ rows without lag.

**Solution**: Virtual scrolling.

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function CampaignTable({ campaigns }) {
  const parentRef = useRef()
  
  const virtualizer = useVirtualizer({
    count: campaigns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // row height
    overscan: 10 // render 10 extra rows above/below viewport
  })
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <CampaignRow
            key={virtualRow.index}
            campaign={campaigns[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

**Result**: Smooth 60fps scrolling through 100k rows.

---

## Micro-Interactions

### Loading States

**Do NOT use generic spinners.**

Use skeleton screens that match final layout:

```
┌──────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░              │ ← Animated shimmer
│ ░░░░░░░░                        │
│                                  │
│ ░░░░  ░░░░  ░░░░  ░░░░          │
└──────────────────────────────────┘
```

### Success Feedback

**After action (save campaign, send test email)**:

- ✅ Toast notification (auto-dismiss 3s)
- ✅ Green checkmark animation
- ✅ Updated UI reflects new state immediately

```tsx
<Toast
  type="success"
  message="Campaign saved"
  duration={3000}
  position="top-right"
/>
```

---

## Dark Mode (Primary)

**Why Dark Mode First**:
- Marketing teams stare at dashboards for hours
- Reduce eye strain
- Modern, premium feel

**Implementation**:
```css
:root {
  --bg-primary: #0A0A0A;
  --bg-secondary: #1A1A1A;
  --text-primary: #FFFFFF;
  --text-secondary: #A0A0A0;
}

/* Light mode (optional) */
[data-theme="light"] {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --text-primary: #000000;
  --text-secondary: #666666;
}
```

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| **Keyboard Navigation** | All actions accessible via Tab, Enter, Esc |
| **Screen Reader** | Semantic HTML, ARIA labels |
| **Color Contrast** | WCAG AA (4.5:1 for text) |
| **Focus Indicators** | Visible 2px cyan outline |
| **Reduced Motion** | Respect `prefers-reduced-motion` |

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| **Mobile** | < 640px | Single column, hide sidebars |
| **Tablet** | 640-1024px | 2 columns, collapsible sidebar |
| **Desktop** | > 1024px | Full layout |
| **Wide** | > 1440px | More data density |

**Journey Builder**: Desktop-only (too complex for mobile).

---

## Performance Budgets

| Metric | Target |
|--------|--------|
| **First Contentful Paint** | < 1.2s |
| **Time to Interactive** | < 2.5s |
| **Largest Contentful Paint** | < 2.0s |
| **Cumulative Layout Shift** | < 0.1 |

---

## Next: Read [RFD.md](file:///Users/gaetanopecorella/Downloads/Crm%20bancario/crm-bancario/docs/marketing/RFD.md)
