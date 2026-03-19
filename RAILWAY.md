# OmniAI — Railway Setup Checklist

## Your live URL
https://omniai-production-778d.up.railway.app

---

## Step 1 — Set these variables in Railway → OmniAI service → Variables

### MUST HAVE (app broken without these)

| Variable | How to get |
|---|---|
| `DATABASE_URL` | Railway MySQL service → Variables → copy `MYSQL_URL` |
| `JWT_SECRET` | Run: `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | console.cloud.google.com → APIs → Credentials → OAuth 2.0 Client |
| `GOOGLE_CLIENT_SECRET` | Same OAuth client |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys — **powers ALL AI features** |
| `BUILT_IN_FORGE_API_URL` | `https://api.openai.com/v1` (or your image API URL) |
| `BUILT_IN_FORGE_API_KEY` | Your OpenAI API key (for image generation) |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → API Keys (`sk_test_` for testing) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Same dashboard (`pk_test_` for testing) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Add endpoint (see below) → signing secret |
| `RESEND_API_KEY` | resend.com → free tier (100/day) → for welcome + usage emails |
| `PUBLIC_URL` | `https://omniai-production-778d.up.railway.app` |

### For payments to work — create Stripe Price IDs

In Stripe Dashboard → Products → create these products/prices:

| Variable | Description |
|---|---|
| `STRIPE_PRICE_STARTER_MONTHLY` | $49/mo recurring |
| `STRIPE_PRICE_STARTER_ANNUAL` | $41/mo annual |
| `STRIPE_PRICE_PRO_MONTHLY` | $97/mo recurring |
| `STRIPE_PRICE_PRO_ANNUAL` | $81/mo annual |
| `STRIPE_PRICE_BIZ_MONTHLY` | $197/mo recurring |
| `STRIPE_PRICE_BIZ_ANNUAL` | $163/mo annual |
| `STRIPE_PRICE_AGENCY_MONTHLY` | $497/mo recurring |
| `STRIPE_PRICE_AGENCY_ANNUAL` | $413/mo annual |
| `STRIPE_PRICE_CREDITS_50` | $9 one-time (50 credits) |
| `STRIPE_PRICE_CREDITS_150` | $19 one-time (150 credits) |
| `STRIPE_PRICE_CREDITS_400` | $39 one-time (400 credits) |

### For video generation (need at least one)

| Variable | Provider |
|---|---|
| `RUNWAY_API_KEY` | app.runwayml.com → Settings → API Keys |
| `LUMA_API_KEY` | lumalabs.ai/api |
| `KLING_API_KEY` | klingai.com/developer |

### For voiceover

| Variable | Provider |
|---|---|
| `ELEVENLABS_API_KEY` | elevenlabs.io → Profile → API Key |
| `OPENAI_API_KEY` | platform.openai.com/api-keys (TTS fallback) |

### For social media posting

| Variable | Provider |
|---|---|
| `META_APP_ID` + `META_APP_SECRET` | developers.facebook.com |
| `TWITTER_API_KEY` + `TWITTER_API_SECRET` | developer.twitter.com |
| `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET` | developer.linkedin.com |
| `TIKTOK_CLIENT_KEY` + `TIKTOK_CLIENT_SECRET` | developers.tiktok.com |

### For AI avatars
| `HEYGEN_API_KEY` | app.heygen.com → Settings → API |

---

## Step 2 — Google OAuth redirect URI

In Google Cloud Console → your OAuth client → Authorized redirect URIs, add:
```
https://omniai-production-778d.up.railway.app/api/auth/google/callback
```

---

## Step 3 — Stripe webhook endpoint

In Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://omniai-production-778d.up.railway.app/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`
- Copy signing secret → `STRIPE_WEBHOOK_SECRET`

---

## Step 4 — Railway healthcheck

Railway → OmniAI service → Settings → Healthcheck Path: `/health`

---

## Step 5 — Get your admin ID

1. Deploy and log in with Google
2. Go to Railway → MySQL → Data → run: `SELECT openId FROM users ORDER BY id LIMIT 1;`
3. Copy the value (looks like `google_123456789`)
4. Set `OWNER_OPEN_ID=google_123456789` in Railway variables
5. Redeploy → /admin unlocked

---

## How the system works

```
USER TYPES PROMPT
       ↓
AI Agent (/ai-agents)
       ↓
Anthropic Claude Haiku fires tools in parallel:
  ├─ analyzeProduct     → saves to products table
  ├─ createCampaign     → saves to campaigns table  
  ├─ generateLandingPage → saves to landing_pages table
  ├─ generateEmailSequence → saves to email_campaigns table
  ├─ generateSocialPosts → saves to contents table
  ├─ generateVideoScript → saves to video_ads table
  └─ generateAdCreative  → saves to contents table
       ↓
EVERYTHING VISIBLE IN DASHBOARD:
  /content         → all generated text content
  /creatives       → all generated images
  /video-ads       → all video scripts + storyboards
  /campaigns       → all campaigns
  /email-marketing → all email sequences
  /landing-pages   → all landing pages
  /leads           → all captured leads
  /deals           → CRM pipeline
  /analytics       → performance data
  /scheduler       → scheduled posts queue
  /social-publish  → published posts history
```

---

## Test the deployment

Run on server (after setting env vars):
```
npx ts-node server/integration.test.ts
```

