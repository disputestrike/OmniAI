# OmniMarket AI — Unit Economics & Pricing Analysis

**Date:** March 6, 2026

---

## 1. Market Landscape

### 1.1 Competitor Pricing

| Competitor | Lowest Tier | Mid Tier | Top Tier | Pricing Model |
|-----------|------------|---------|---------|---------------|
| AdCreative.ai | $25/mo (10 credits) | $119/mo (100 credits) | $359/mo (500 credits) | Credit-based |
| Arcads.ai | $110/mo (100 credits) | $250/mo (250 credits) | $500/mo (600 credits) | Credit-based |
| Omneky | $99/mo | $249/mo | Custom | Flat + usage |
| Jasper | $49/mo/seat | $69/mo/seat | Custom | Per-seat |
| Copy.ai | $49/mo (1 seat) | Custom | Custom | Per-seat |
| Predis.ai | $32/mo | $59/mo | $249/mo | Flat + limits |

### 1.2 Our Positioning

OmniMarket AI is positioned as the **most comprehensive** AI marketing platform at **competitive pricing**. Unlike competitors who focus on one area (Arcads = video, AdCreative = images, Jasper = text), we offer **all 22 content types across 21 platforms** in one tool.

**Key differentiators:**
- 22 content types (vs. 3-5 for competitors)
- 21 platform support (vs. 5-8 for competitors)
- Voice AI integration (unique)
- AI avatars for video (unique at this price)
- CRM + lead management built-in (unique)
- Predictive analytics (unique at Starter tier)

---

## 2. Pricing Strategy

### 2.1 Tier Design Philosophy

| Tier | Price | Strategy |
|------|-------|----------|
| **Free** | $0 | Conversion funnel entry. Limited enough to show value, restrictive enough to drive upgrades. Target: 5-8% conversion to paid within 30 days. |
| **Starter** | $29/mo | Price anchor below competitors' entry points ($49 Jasper, $99 Omneky). Captures solopreneurs. High volume, high margin. |
| **Professional** | $79/mo | Sweet spot for growing businesses. Includes team seats (5). This is our **target tier** for majority revenue. |
| **Business** | $199/mo | Agency/department tier. Unlimited content + API access justifies premium. Seat-based expansion revenue. |
| **Enterprise** | Custom | White-glove service. Minimum $499/mo. Dedicated support + SLA. |

### 2.2 Annual Discount

- **20% discount** for annual billing
- Reduces churn (12-month commitment)
- Improves cash flow (upfront payment)
- Annual prices: Free $0, Starter $23/mo, Professional $63/mo, Business $159/mo

---

## 3. Cost Structure (COGS)

### 3.1 Variable Costs Per User Per Month

| Cost Component | Free | Starter | Professional | Business | Notes |
|---------------|------|---------|-------------|----------|-------|
| **LLM API calls** | $0.10 | $2.50 | $8.00 | $15.00 | GPT-class, ~$0.05/call avg |
| **Image generation** | $0.04 | $0.60 | $2.00 | $5.00 | ~$0.04/image |
| **Voice transcription** | $0.00 | $0.20 | $0.50 | $1.00 | Whisper, ~$0.006/min |
| **Compute (server)** | $0.50 | $0.50 | $0.50 | $0.50 | Shared infrastructure |
| **Database** | $0.05 | $0.10 | $0.25 | $0.50 | TiDB per-query costs |
| **S3 Storage** | $0.05 | $0.10 | $0.25 | $0.50 | Images, files, exports |
| **Stripe fees** | $0.00 | $1.17 | $2.59 | $6.07 | 2.9% + $0.30 per charge |
| **Total COGS** | **$0.74** | **$5.17** | **$14.09** | **$28.57** | |

### 3.2 Fixed Costs (Monthly)

| Cost | Amount | Notes |
|------|--------|-------|
| Infrastructure (base) | $500 | Servers, CDN, monitoring |
| Database (base) | $200 | TiDB minimum |
| S3 (base) | $50 | Minimum storage |
| Domain & SSL | $20 | Managed |
| Monitoring & logging | $100 | Error tracking, analytics |
| **Total Fixed** | **$870/mo** | |

---

## 4. Margin Analysis

### 4.1 Per-User Gross Margins

| Tier | Revenue | COGS | Gross Profit | Gross Margin |
|------|---------|------|-------------|-------------|
| **Free** | $0 | $0.74 | -$0.74 | N/A (acquisition cost) |
| **Starter** | $29 | $5.17 | $23.83 | **82.2%** |
| **Professional** | $79 | $14.09 | $64.91 | **82.2%** |
| **Business** | $199 | $28.57 | $170.43 | **85.6%** |

### 4.2 Blended Margin Scenarios

**Scenario: 1,000 users (Month 6)**

| Metric | Conservative | Target | Optimistic |
|--------|-------------|--------|-----------|
| Free users | 700 (70%) | 600 (60%) | 500 (50%) |
| Starter users | 180 (18%) | 200 (20%) | 220 (22%) |
| Professional users | 90 (9%) | 140 (14%) | 180 (18%) |
| Business users | 30 (3%) | 60 (6%) | 100 (10%) |
| **Monthly Revenue** | **$17,190** | **$28,260** | **$46,200** |
| **Monthly COGS** | **$3,629** | **$5,746** | **$9,134** |
| **Fixed Costs** | **$870** | **$870** | **$870** |
| **Net Profit** | **$12,691** | **$21,644** | **$36,196** |
| **Net Margin** | **73.8%** | **76.6%** | **78.3%** |

### 4.3 Seat Expansion Revenue

Additional revenue from team seat purchases:

| Tier | Extra Seat Price | Avg Extra Seats | Extra Revenue/User |
|------|-----------------|----------------|-------------------|
| Professional | $15/seat/mo | 2 seats | $30/mo |
| Business | $12/seat/mo | 5 seats | $60/mo |

**Seat expansion adds 15-25% to base subscription revenue.**

---

## 5. Conversion Funnel

### 5.1 Target Metrics

| Stage | Target Rate | Notes |
|-------|------------|-------|
| Visitor → Free signup | 5-8% | Landing page optimization |
| Free → Starter | 8-12% | Within 30 days |
| Starter → Professional | 15-20% | Within 90 days |
| Professional → Business | 5-8% | When team grows |
| Monthly churn (paid) | <5% | Industry avg: 6-8% |

### 5.2 Free Tier Conversion Levers

| Limit | Free Value | Upgrade Trigger |
|-------|-----------|----------------|
| 5 content/mo | Shows AI quality | Hits limit after 2-3 sessions |
| 2 images/mo | Demonstrates visual AI | Needs more for campaigns |
| 1 product | Proves analysis value | Wants to analyze more products |
| No team | Individual only | Needs collaboration |
| No voice AI | Text only | Wants voice input |
| No CRM | No lead tracking | Wants full pipeline |

---

## 6. Revenue Projections

### 6.1 Year 1 Monthly Revenue Growth

| Month | Total Users | Paid Users | MRR | Notes |
|-------|------------|-----------|-----|-------|
| 1 | 100 | 15 | $1,200 | Launch |
| 3 | 500 | 100 | $5,800 | Growth phase |
| 6 | 1,500 | 350 | $19,500 | Product-market fit |
| 9 | 3,000 | 800 | $48,000 | Scaling |
| 12 | 5,000 | 1,500 | $95,000 | Maturity |

### 6.2 Annual Revenue (Year 1)

| Metric | Conservative | Target | Optimistic |
|--------|-------------|--------|-----------|
| ARR (end of Y1) | $420,000 | $1,140,000 | $2,400,000 |
| Total Revenue (Y1) | $180,000 | $480,000 | $960,000 |
| Gross Margin | 78% | 82% | 85% |
| CAC (target) | <$50 | <$30 | <$20 |
| LTV:CAC ratio | >5:1 | >10:1 | >15:1 |

---

## 7. Profitability Optimization

### 7.1 Cost Reduction Strategies

1. **LLM cost optimization:** Cache common queries, use smaller models for simple tasks, batch API calls
2. **Image generation caching:** Store generated images in S3, serve from CDN for repeated access
3. **Usage-based throttling:** Free tier rate limits prevent abuse
4. **Efficient prompts:** Optimized system prompts reduce token usage by 30-40%
5. **Annual billing incentive:** 20% discount but 12-month commitment reduces churn cost

### 7.2 Revenue Expansion Strategies

1. **Seat expansion:** Team growth drives automatic revenue increase
2. **Usage overage charges:** Charge for exceeding tier limits (future)
3. **Marketplace:** Template/strategy marketplace with revenue share (future)
4. **API access:** Business tier API enables integrations, increasing stickiness
5. **White-label:** Business/Enterprise white-label increases willingness to pay

---

## 8. Key Metrics to Track

| Metric | Target | Measurement |
|--------|--------|-------------|
| MRR Growth | >15% MoM | Stripe dashboard |
| Gross Margin | >80% | Revenue - COGS |
| Net Revenue Retention | >110% | Expansion revenue |
| CAC Payback | <3 months | CAC / ARPU |
| Free-to-Paid Conversion | >10% | Signup → paid within 30d |
| Monthly Churn | <5% | Cancellations / active |
| ARPU | >$55 | Total revenue / paid users |
| LTV | >$660 | ARPU / churn rate |
