# AI & Intelligence Layer

## Principle

**AI is a copilot, not an autopilot.**  
Humans make strategic decisions. AI handles repetitive analysis and surfaces recommendations.

---

## 1. Churn Prediction

### Purpose
Identify contacts at risk of churning before they leave.

### Input Data
- **Engagement metrics**: Email opens, clicks, logins (last 90 days)
- **Product usage**: Features used, session frequency
- **Support interactions**: Ticket count, sentiment
- **Billing**: Payment failures, downgrades
- **Demographics**: Company size, industry, tenure

### Model
- **Type**: Gradient Boosted Trees (LightGBM)
- **Output**: Churn probability score (0-100)
- **Features**: 50+ engineered features
- **Training**: Weekly retrain on last 12 months data
- **Validation**: 80/20 train/test split, AUC-ROC > 0.85

### Implementation
```python
import lightgbm as lgb
import pandas as pd

def train_churn_model(df: pd.DataFrame):
    features = [
        'days_since_last_login',
        'email_open_rate_30d',
        'support_tickets_30d',
        'product_usage_score',
        'billing_issues_count',
        # ...50 more
    ]
    
    X = df[features]
    y = df['churned'] # 1 = churned in next 30 days, 0 = retained
    
    model = lgb.LGBMClassifier(
        n_estimators=100,
        learning_rate=0.05,
        max_depth=6
    )
    
    model.fit(X, y)
    return model

def predict_churn(contact_id: str) -> float:
    features = extract_features(contact_id)
    score = model.predict_proba([features])[0][1] * 100
    return round(score, 2)
```

### Output
- **Score**: 0-100 (0 = very low risk, 100 = imminent churn)
- **Segment**: Auto-created "High Churn Risk" segment (score > 70)
- **Recommendation**: "Send win-back offer" or "Assign to CS team"

### Human-in-Loop
- ✅ Scores shown in contact profile
- ✅ Weekly digest email to CS team
- ❌ Does NOT auto-send campaigns (human approves journey)

---

## 2. Engagement Scoring

### Purpose
Predict likelihood of a contact engaging with a campaign.

### Input Data
- **Past behavior**: Open rate, click rate, conversion rate (per contact)
- **Campaign attributes**: Subject line length, send time, content type
- **Contact attributes**: Industry, role, lifecycle stage

### Model
- **Type**: Logistic Regression (interpretable)
- **Output**: Engagement probability (0-100)
- **Retrain**: Daily

### Implementation
```python
def predict_engagement(contact_id: str, campaign_id: str) -> float:
    contact_features = get_contact_engagement_history(contact_id)
    campaign_features = get_campaign_attributes(campaign_id)
    
    features = {
        **contact_features,
        **campaign_features,
        'hour_of_day': get_current_hour(),
        'day_of_week': get_current_day()
    }
    
    score = engagement_model.predict_proba([features])[0][1] * 100
    return score
```

### Use Case
**Before sending campaign**: Filter out contacts with engagement score < 20 to avoid spam complaints.

---

## 3. Send-Time Optimization

### Purpose
Determine the best time to send a message to each contact.

### Approach
- **Per-contact analysis**: When did this contact historically open emails?
- **Cohort fallback**: If no personal data, use industry/role averages

### Implementation
```python
def get_optimal_send_time(contact_id: str) -> datetime:
    # Get contact's past open times
    opens = db.query("""
        SELECT EXTRACT(HOUR FROM opened_at) as hour,
               EXTRACT(DOW FROM opened_at) as day_of_week,
               COUNT(*) as count
        FROM marketing_events
        WHERE contact_id = %s AND event_type = 'email_opened'
        GROUP BY hour, day_of_week
        ORDER BY count DESC
        LIMIT 1
    """, contact_id)
    
    if opens:
        # Send at contact's most active time
        return next_occurrence(opens.hour, opens.day_of_week)
    else:
        # Fallback to industry average (e.g., Tuesday 10am for SaaS)
        cohort = get_cohort(contact_id)
        return cohort.avg_open_time
```

### Output
- **Recommended time**: "Tuesday, 10:15 AM" (in contact's timezone)
- **Confidence**: High (based on 50+ opens) / Medium / Low (fallback)

### UI Integration
**Journey Builder**: 
```
┌────────────────────────┐
│ 📧 Send Email          │
│ ────────────────────── │
│ Send time: Optimized ✨│ ← AI-powered
│ (Tuesday 10am avg)     │
└────────────────────────┘
```

---

## 4. Next-Best-Action

### Purpose
Recommend what campaign to run next based on current portfolio.

### Input Data
- **Campaign history**: What's been sent recently, what performed well
- **Audience state**: Who hasn't been contacted in 30 days
- **Business goals**: Increase trials, reduce churn, upsell

### Logic
```python
def recommend_next_campaign() -> List[Recommendation]:
    recommendations = []
    
    # Rule 1: Win-back dormant users
    dormant = count_contacts_with_no_activity_30d()
    if dormant > 100:
        recommendations.append({
            'type': 'win_back',
            'reason': f'{dormant} contacts inactive for 30+ days',
            'priority': 'high',
            'template': 'win_back_v2'
        })
    
    # Rule 2: Upsell high-engagement users
    high_engagement = get_segment('high_engagement').count
    if high_engagement > 50:
        recommendations.append({
            'type': 'upsell',
           'reason': f'{high_engagement} highly engaged contacts ready for upsell',
            'priority': 'medium',
            'template': 'upsell_premium'
        })
    
    # Rule 3: Nurture recent signups
    recent_signups = count_contacts_created_last_7d()
    if recent_signups > 20:
        recommendations.append({
            'type': 'onboarding',
            'reason': f'{recent_signups} new signups this week',
            'priority': 'high',
            'template': 'welcome_series'
        })
    
    return sorted(recommendations, key=lambda x: x['priority'])
```

### UI Display
```
💡 Suggested Actions
────────────────────
🔥 HIGH PRIORITY
   Win-back dormant users (234 contacts)
   Expected impact: +15% reactivation
   
⚡ MEDIUM PRIORITY
   Upsell to engaged users (89 contacts)
   Expected revenue: $12k
```

---

## 5. Content Scoring

### Purpose
Predict how well an email will perform before sending.

### Input Data
- **Subject line**: Length, sentiment, use of emojis, personalization
- **Body**: Word count, reading level, CTA count
- **Historical data**: Similar emails' performance

### Model
```python
def score_email_content(subject: str, body: str) -> dict:
    score = {
        'subject_score': score_subject_line(subject),
        'body_score': score_body(body),
        'overall_score': 0
    }
    
    # Subject line analysis
    def score_subject_line(subject):
        signals = {
            'length': len(subject), # optimal: 40-60 chars
            'personalization': '{{' in subject, # +10 points
            'urgency': bool(re.search(r'today|now|limited', subject.lower())),
            'spam_words': bool(re.search(r'free|buy now|click here', subject.lower())) # -20 points
        }
        
        score = 50 # baseline
        if 40 <= signals['length'] <= 60: score += 20
        if signals['personalization']: score += 10
        if signals['urgency']: score += 5
        if signals['spam_words']: score -= 20
        
        return max(0, min(100, score))
    
    # Body analysis
    def score_body(body):
        reading_level = textstat.flesch_reading_ease(body) # 60-70 = ideal
        cta_count = body.lower().count('click here') + body.lower().count('learn more')
        
        score = 50
        if 60 <= reading_level <= 70: score += 20
        if cta_count == 1: score += 10 # 1 CTA is optimal
        elif cta_count > 2: score -= 10 # too many CTAs
        
        return score
    
    score['overall_score'] = (score['subject_score'] + score['body_score']) / 2
    return score
```

### Output
```
📊 Content Score: 78/100

✅ Strong Points:
   • Subject line length optimal (48 chars)
   • Personalized greeting
   • Clear single CTA

⚠️ Improvements:
   • Body reading level too complex (grade 12)
   • Suggest simplifying language

Expected open rate: 28-32%
```

---

## 6. Anomaly Detection

### Purpose
Alert when campaign performance is unusually bad (or good).

### Method
- **Baseline**: Calculate rolling 30-day average for open rate, click rate
- **Threshold**: Alert if current campaign is > 2 standard deviations away

### Implementation
```python
def detect_anomaly(campaign_id: str):
    current = get_campaign_stats(campaign_id)
    baseline = get_baseline_stats(channel='email', last_n_days=30)
    
    anomalies = []
    
    # Check open rate
    z_score = (current.open_rate - baseline.avg_open_rate) / baseline.std_open_rate
    if abs(z_score) > 2:
        anomalies.append({
            'metric': 'open_rate',
            'current': current.open_rate,
            'expected': baseline.avg_open_rate,
            'severity': 'high' if z_score < -2 else 'positive'
        })
    
    # Check bounce rate
    if current.bounce_rate > baseline.avg_bounce_rate * 2:
        anomalies.append({
            'metric': 'bounce_rate',
            'current': current.bounce_rate,
            'expected': baseline.avg_bounce_rate,
            'severity': 'critical',
            'action': 'Check email list quality'
        })
    
    return anomalies
```

### Alert Example
```
🚨 Anomaly Detected: Campaign "Summer Sale"

Bounce rate: 8.2% (expected: 2.1%)
Severity: CRITICAL

Possible causes:
• Purchased email list (low quality)
• Domain authentication issue
• Spam trap hits

Recommended action:
Pause campaign and review list source
```

---

## AI Service Architecture

### Microservice Design

```
┌─────────────────────────────────────┐
│ CRM Main API (Hono.js)              │
│   POST /api/ai/predict-churn        │
│   POST /api/ai/recommend-send-time  │
└──────────────┬──────────────────────┘
               │ HTTP
               ↓
┌─────────────────────────────────────┐
│ AI Service (Python FastAPI)         │
│   - Model serving                   │
│   - Feature engineering             │
│   - Batch prediction jobs           │
└──────────────┬──────────────────────┘
               │
          ┌────┴────┐
          ↓         ↓
    [PostgreSQL] [S3/Model Storage]
```

### API Endpoints

```python
# FastAPI service
from fastapi import FastAPI
app = FastAPI()

@app.post("/predict/churn")
async def predict_churn(contact_id: str):
    features = await extract_features(contact_id)
    score = churn_model.predict_proba([features])[0][1]
    
    return {
        "contact_id": contact_id,
        "churn_score": round(score * 100, 2),
        "risk_level": "high" if score > 0.7 else "medium" if score > 0.4 else "low",
        "contributing_factors": explain_prediction(features, score)
    }

@app.post("/optimize/send-time")
async def optimize_send_time(contact_id: str):
    history = await get_open_history(contact_id)
    optimal_hour = calculate_optimal_hour(history)
    
    return {
        "contact_id": contact_id,
        "recommended_time": optimal_hour,
        "confidence": "high" if len(history) > 20 else "medium",
        "timezone": await get_contact_timezone(contact_id)
    }
```

---

## Model Monitoring

### Metrics Tracked
- **Accuracy**: Are predictions correct?
- **Drift**: Is input data distribution changing?
- **Latency**: < 200ms for inference
- **Usage**: How often is each model called?

### Dashboard
```
┌───────────────────────────────────────────────┐
│ AI Model Health Dashboard                    │
├───────────────────────────────────────────────┤
│ Churn Prediction Model v3.2                  │
│   Accuracy: 87.3% (target: >85%) ✅           │
│   Drift score: 0.12 (threshold: 0.2) ✅       │
│   Avg latency: 145ms ✅                        │
│   Predictions today: 12,450                   │
│                                               │
│ Engagement Scoring Model v2.1                │
│   Accuracy: 82.1% (target: >80%) ✅           │
│   Drift score: 0.31 (threshold: 0.2) ⚠️       │
│   → Scheduled retrain: Tonight 2am           │
└───────────────────────────────────────────────┘
```

---

## Explainability (XAI)

**Users need to trust AI recommendations.**

### SHAP Values
```python
import shap

def explain_prediction(features, prediction):
    explainer = shap.TreeExplainer(churn_model)
    shap_values = explainer.shap_values(features)
    
    # Top 3 contributing factors
    top_factors = sorted(
        zip(feature_names, shap_values[0]),
        key=lambda x: abs(x[1]),
        reverse=True
    )[:3]
    
    return [
        {
            "factor": name,
            "impact": "increases" if value > 0 else "decreases",
            "strength": abs(value)
        }
        for name, value in top_factors
    ]
```

### UI Display
```
Churn Score: 82/100 (High Risk)

Why this score?
━━━━━━━━━━━━━━━━━━━━━━
🔴 No login in 45 days (+35 points)
🔴 Support tickets increased (+18 points)
🔴 Email engagement dropped (-15 points)
```

---

## Human Approval Workflow

### Jobs Auto-Executed
- ✅ Engagement scoring (background job, no user action)
- ✅ Churn prediction (nightly batch)
- ✅ Send-time optimization (silent calculation)

### Jobs Requiring Approval
- ❌ Auto-sending campaigns (human must approve journey)
- ❌ Auto-updating contact fields (human reviews suggested changes)
- ❌ Auto-suppressing contacts (human decides to remove from list)

---

## Next: Read [DESIGN_SYSTEM.md](file:///Users/gaetanopecorella/Downloads/Crm%20bancario/crm-bancario/docs/marketing/DESIGN_SYSTEM.md)
