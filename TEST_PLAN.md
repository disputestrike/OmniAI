# OmniAI Test Plan — Go-Live Readiness

> **Current state:** `.env` is completely empty. All tests below assume a fresh environment unless otherwise noted.
> **Last updated:** 2026-03-21

---

## Section 1: Environment & API Key Audit

### 1.1 Status Table

| Group | Variable(s) | Status | Impact if Missing | Live Required? |
|---|---|---|---|---|
| **Database** | `DATABASE_URL` | MISSING | App won't start | REQUIRED |
| **Auth — Sessions** | `JWT_SECRET` | MISSING | No login possible | REQUIRED |
| **Auth — Google OAuth** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | MISSING | No login possible | REQUIRED |
| **App URL** | `PUBLIC_URL` | MISSING | File URLs broken, OAuth redirect broken | REQUIRED |
| **AI/LLM** | `ANTHROPIC_API_KEY` | MISSING | Falls back to mock mode (template content, real DB records) | REQUIRED FOR LIVE AI |
| **Images** | `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` | MISSING | No image generation | REQUIRED FOR IMAGES |
| **Payments — Core** | `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | MISSING | No billing | REQUIRED FOR REVENUE |
| **Payments — Price IDs** | `STRIPE_PRICE_STARTER_MONTHLY/ANNUAL`, `STRIPE_PRICE_PRO_MONTHLY/ANNUAL`, `STRIPE_PRICE_BIZ_MONTHLY/ANNUAL`, `STRIPE_PRICE_AGENCY_MONTHLY/ANNUAL` | MISSING | Checkout fails | REQUIRED FOR REVENUE |
| **Payments — Credit Packs** | `STRIPE_PRICE_CREDITS_50/150/400/1000/5000` | MISSING | Credit packs unavailable | REQUIRED FOR REVENUE |
| **Email** | `RESEND_API_KEY` | MISSING | Emails logged to console only, no crash | REQUIRED FOR EMAIL |
| **Video** | `RUNWAY_API_KEY` (or `LUMA_API_KEY` or `KLING_API_KEY`) | MISSING | Scripts generated, no MP4 render | OPTIONAL (feature-gated) |
| **Voice/TTS** | `ELEVENLABS_API_KEY` (or `OPENAI_API_KEY`) | MISSING | Browser TTS fallback | OPTIONAL |
| **Avatars** | `HEYGEN_API_KEY` | MISSING | No avatar video | OPTIONAL |
| **Social — Meta** | `META_APP_ID`, `META_APP_SECRET` | MISSING | No Facebook/Instagram posting | OPTIONAL |
| **Social — Twitter/X** | `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET` | MISSING | No Twitter posting | OPTIONAL |
| **Social — LinkedIn** | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | MISSING | No LinkedIn posting | OPTIONAL |
| **Social — TikTok** | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | MISSING | No TikTok posting | OPTIONAL |
| **Ecommerce** | `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET` | MISSING | No Shopify product sync | OPTIONAL |
| **Music** | `SUNO_API_KEY` (or `MUBERT_API_KEY` or `SOUNDRAW_API_KEY`) | MISSING | No AI music generation | OPTIONAL |
| **Admin** | `OWNER_OPEN_ID` | MISSING | No admin panel access | OPTIONAL (internal) |
| **Analytics** | `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID` | MISSING | No Umami tracking — non-breaking | OPTIONAL |
| **Error Tracking** | `SENTRY_DSN` | MISSING | No error monitoring — non-breaking | OPTIONAL |
| **DSP/Programmatic** | `EPOM_API_KEY` | MISSING | No programmatic ad buying | OPTIONAL |
| **Voice Transcription** | `BUILT_IN_FORGE_API_KEY` or `OPENAI_API_KEY` | MISSING | No Whisper transcription | OPTIONAL |

### 1.2 How to Obtain Keys

| Key | How to Obtain |
|---|---|
| `DATABASE_URL` | Railway/TiDB Cloud → create MySQL project → connection string |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID/SECRET` | console.cloud.google.com → Credentials → OAuth 2.0 Client IDs |
| `PUBLIC_URL` | Your deployment URL (e.g. `https://yourapp.railway.app`) |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `BUILT_IN_FORGE_API_URL/KEY` | Use `https://api.openai.com/v1` + OpenAI API key |
| `STRIPE_*` | dashboard.stripe.com → Developers → API Keys + Products |
| `RESEND_API_KEY` | resend.com → API Keys (free: 100/day, 3000/month) |
| `RUNWAY_API_KEY` | runwayml.com → API access |
| `ELEVENLABS_API_KEY` | elevenlabs.io → Profile → API Key |
| `HEYGEN_API_KEY` | app.heygen.com → API |
| `META_APP_ID/SECRET` | developers.facebook.com → My Apps |
| `TWITTER_API_KEY/SECRET` | developer.twitter.com → Projects & Apps |
| `LINKEDIN_CLIENT_ID/SECRET` | linkedin.com/developers → My Apps |
| `TIKTOK_CLIENT_KEY/SECRET` | developers.tiktok.com |
| `SHOPIFY_API_KEY/SECRET` | partners.shopify.com → Apps |

---

## Section 2: Pre-Flight Checklist

Complete these steps in order before running any feature tests.

- [ ] `DATABASE_URL` configured and MySQL instance accessible
- [ ] `JWT_SECRET` set (minimum 32 characters)
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set
- [ ] Google OAuth redirect URI configured in Google Console: `{PUBLIC_URL}/api/auth/google/callback`
- [ ] `PUBLIC_URL` set to the correct base URL (no trailing slash)
- [ ] Run `npm run dev` → no startup errors in console
- [ ] Auto-migration runs: look for "Migrations complete" in server logs
- [ ] Health check passes: `curl http://localhost:3000/health` → `{"ok":true}`
- [ ] Login works: navigate to `/login` → Google OAuth flow completes → redirected to `/dashboard`
- [ ] Dashboard loads without JS errors in browser console
- [ ] Create a test campaign via AI Agent prompt → workspace opens at `/campaigns/:id`

---

## Section 3: Core Flow Tests (P0)

All P0 tests must pass before any other testing begins.

| # | Test | Steps | Expected Result | API Keys Needed |
|---|---|---|---|---|
| C1 | Server starts | `npm run dev` | No crash, port 3000 listening | `DATABASE_URL`, `JWT_SECRET` |
| C2 | Health endpoint | `GET /health` | `{"ok":true}` | None |
| C3 | Google OAuth login | `/login` → Google button → complete OAuth | JWT cookie set, redirect to `/dashboard` | `GOOGLE_CLIENT_ID/SECRET`, `PUBLIC_URL` |
| C4 | Dashboard loads | `/dashboard` after login | Stats cards render (zeros acceptable) | Auth cookie |
| C5 | AI Agent — mock mode | `/ai-agents` → enter prompt → Enter | 7 tool cards animate, workspace opens | None (mock mode) |
| C6 | Campaign workspace | `/campaigns/:id` | 9 tabs populated with content | None |
| C7 | AI Agent — live mode | Same as C5 | Real Claude-generated content | `ANTHROPIC_API_KEY` |
| C8 | Logout | Invoke `auth.logout` | Cookie cleared, redirect to `/` | None |

---

## Section 4: Feature Group Tests

### 4.1 Authentication & Users

| Test | Endpoint / Procedure | Expected | Keys Needed |
|---|---|---|---|
| Google OAuth initiate | `GET /api/auth/google` | Redirect to Google consent screen | `GOOGLE_CLIENT_ID` |
| OAuth callback | `GET /api/auth/google/callback` | JWT set, redirect to `/dashboard` | `GOOGLE_CLIENT_SECRET` |
| OAuth status check | `GET /api/auth/google/status` | `{"configured": true/false}` | None |
| Email register | `POST /api/auth/email/register` | JWT cookie, user row created | None |
| Email login | `POST /api/auth/email/login` | JWT cookie returned | None |
| Get current user | `tRPC: auth.me` | Returns user object | Auth cookie |
| Logout | `tRPC: auth.logout` | Cookie cleared | Auth cookie |
| Unauthenticated tRPC call | Any `protectedProcedure` without cookie | `UNAUTHORIZED (401)` | None |
| Admin route as regular user | `admin.*` procedures | `FORBIDDEN (403)` | None |

### 4.2 Campaign System

| Test | Procedure | Expected | Keys Needed |
|---|---|---|---|
| Create campaign | `campaign.create` | Campaign record in DB, returns id | Auth |
| List campaigns | `campaign.list` | Array of user's campaigns | Auth |
| Get campaign | `campaign.get` | Single campaign with metadata | Auth |
| Update campaign | `campaign.update` | Updated record returned | Auth |
| Campaign workspace | `campaign.workspace` | All 9 asset arrays populated | Auth |
| Generate strategy | `campaign.generateStrategy` | AI strategy text | `ANTHROPIC_API_KEY` |
| Status transitions | `draft→active→paused→completed→archived` | Status updates correctly | Auth |
| Delete campaign | `campaign.delete` | Removed from list | Auth |

### 4.3 AI Agent (Most Critical)

| Test | Scenario | Expected | Keys Needed |
|---|---|---|---|
| Mock mode | Send prompt, no `ANTHROPIC_API_KEY` | `runMockAgentLoop` runs, real DB records created | None |
| Verify asset count | Check DB after mock run | 7 asset types created (contents, creatives, etc.) | None |
| campaignId injection | Check assets after run | All assets have correct `campaignId` | None |
| Tool sequence order | Check DB timestamps | `analyzeProduct→createCampaign→generateAssets` order | None |
| Auto-navigate | After agent completes | Browser navigates to `/campaigns/:id` after ~1.8s | None |
| Live mode | Send prompt with API key | Real Claude-generated content | `ANTHROPIC_API_KEY` |
| Old campaign backfill | Load workspace for pre-campaignId campaign | Assets retroactively linked (10-min window) | None |
| AI Chat — 6 modes | Each specialist mode | Mode-appropriate response style | `ANTHROPIC_API_KEY` |

### 4.4 Content Generation (22 Types)

For each type, test via `content.generate`:

- Short Ad Copy, Long Ad Copy, Blog Post, SEO Meta Tags, Social Media Captions
- Video Scripts, Email Newsletter Copy, Press Release, Podcast Script, TV Commercial Script
- Radio Ad Script, Sales Copywriting, Amazon Product Listing, eBay Product Listing, Google Ads Copy
- YouTube SEO Package, Twitter/X Thread, LinkedIn Article, WhatsApp Broadcast
- SMS Marketing Copy, Story Content, UGC Script, Landing Page Copy

| Test | Expected | Keys Needed |
|---|---|---|
| Generate each content type (22x) | Content saved to DB with correct `type` field | `ANTHROPIC_API_KEY` |
| List contents | Returns user's content array | Auth |
| Search contents | Filtered by query string | Auth |
| Bulk generate | Multiple pieces simultaneously | `ANTHROPIC_API_KEY` |
| Remix content | Variation created with new record | `ANTHROPIC_API_KEY` |
| Repurpose content | Cross-format conversion (e.g. blog → tweet thread) | `ANTHROPIC_API_KEY` |
| Delete content | Record removed from DB | Auth |

### 4.5 Creative Engine / Image Generation

| Test | Expected | Keys Needed |
|---|---|---|
| Generate image | `creatives` record created, `imageUrl` populated | `BUILT_IN_FORGE_API_URL` + `BUILT_IN_FORGE_API_KEY` |
| No Forge key fallback | Graceful error or placeholder | None |
| List creatives | Gallery view populated | Auth |
| Product photoshoot | Brand-style images generated | Forge API |
| Launch ad from creative | Ad creation flow opens | Auth |
| Delete creative | Record removed | Auth |

### 4.6 Video Ads & Rendering

| Test | Expected | Keys Needed |
|---|---|---|
| Generate video script | `video_ads` record with hook + script + CTA | `ANTHROPIC_API_KEY` |
| Render to MP4 (Runway) | `video_renders` record, `videoUrl` set | `RUNWAY_API_KEY` |
| Render to MP4 (Luma fallback) | Same as above | `LUMA_API_KEY` |
| Render to MP4 (Kling fallback) | Same as above | `KLING_API_KEY` |
| Static frame fallback | Thumbnail only, no crash | None |
| List video ads | Scripts listed | Auth |
| Localize video | Translated script created | `ANTHROPIC_API_KEY` |

### 4.7 Email Marketing

| Test | Expected | Keys Needed |
|---|---|---|
| Generate email sequence | 5 `email_campaigns` records (days 0,2,4,6,7) | `ANTHROPIC_API_KEY` |
| Send email campaign | Email dispatched via Resend | `RESEND_API_KEY` |
| Send without Resend key | Logged to console, no server crash | None |
| Email lists CRUD | Create / list / delete email lists | Auth |
| Email contacts | Add and import contacts | Auth |
| Track opens/clicks | `analytics` table updated | Auth |
| 12 trigger sequences | welcome, trial-ending, usage-80%, etc. fire correctly | `RESEND_API_KEY` |

### 4.8 Landing Pages

| Test | Expected | Keys Needed |
|---|---|---|
| Generate landing page | `landing_pages` record with `components` JSON | `ANTHROPIC_API_KEY` |
| Serve public page | `GET /api/landing/page/:slug` → page data | None |
| Submit landing form | `POST /api/landing/submit` → lead created | None |
| Visit counter | Increments on each visit | None |
| Landing page CRUD | Create / update / delete via tRPC | Auth |

### 4.9 Lead Management & CRM

| Test | Expected | Keys Needed |
|---|---|---|
| Create lead | `leads` record created | Auth |
| List leads by campaign | Filtered by `campaignId` correctly | Auth |
| Update lead status | Status field updated | Auth |
| Lead scoring | Predictive score attached | `ANTHROPIC_API_KEY` |
| Bulk import leads | CSV/JSON import processed | Auth |
| Round-robin assignment | Leads distributed to team members | Auth |
| Deals pipeline | Create / update / delete deals | Auth |
| Activities log | CRUD on activities | Auth |
| Customer profiles | Deep customer records CRUD | Auth |
| Customer segments | Segment creation and filtering | Auth |

### 4.10 Billing & Subscriptions

| Test | Expected | Keys Needed |
|---|---|---|
| Pricing list | 5 tiers + credit packs returned | Stripe Price IDs |
| Create checkout — Starter | Stripe checkout URL returned | `STRIPE_SECRET_KEY` |
| Create checkout — Professional | Same | `STRIPE_SECRET_KEY` |
| Create checkout — Business | Same | `STRIPE_SECRET_KEY` |
| Stripe webhook: `checkout.session.completed` | `subscriptions` + `users` tables updated | `STRIPE_WEBHOOK_SECRET` |
| Stripe webhook: `customer.subscription.updated` | Period end updated | `STRIPE_WEBHOOK_SECRET` |
| Stripe webhook: `customer.subscription.deleted` | Status set to `canceled` | `STRIPE_WEBHOOK_SECRET` |
| Create billing portal | Stripe portal URL returned | `STRIPE_SECRET_KEY` |
| Buy credit pack | `credit_wallets` balance increases | `STRIPE_SECRET_KEY` |
| Usage limit enforcement | `checkLimit()` blocks at tier max | Auth |
| Credit spend | `consumeLimit()` deducts correctly | Auth |
| Free tier limits | 5 AI gens, 2 images enforced | Auth |
| Trial flow | 7-day trial, `trialUsed` flag set after use | Auth |
| Stripe test card | `4242 4242 4242 4242` | Stripe test mode |

### 4.11 Analytics & A/B Testing

| Test | Expected | Keys Needed |
|---|---|---|
| Record analytics event | `analytics_events` row created | Auth |
| Analytics summary | Aggregate impressions/clicks/conversions | Auth |
| Per-campaign analytics | Filtered by `campaignId` | Auth |
| AI insights | Natural language analysis of metrics | `ANTHROPIC_API_KEY` |
| A/B test create | `ab_tests` + `variants` records created | Auth |
| Add variant | `ab_test_variants` added | Auth |
| Generate variations | AI creates content variations | `ANTHROPIC_API_KEY` |
| Update test status | `active / paused / completed` transitions | Auth |

### 4.12 Social Publishing & Ad Platforms

| Test | Expected | Keys Needed |
|---|---|---|
| Connect Meta | OAuth flow, token stored in DB | `META_APP_ID/SECRET` |
| Connect Twitter/X | OAuth flow, token stored | `TWITTER_API_KEY/SECRET` |
| Connect LinkedIn | OAuth flow, token stored | `LINKEDIN_CLIENT_ID/SECRET` |
| Connect TikTok | OAuth flow, token stored | `TIKTOK_CLIENT_KEY/SECRET` |
| Post to Instagram | `social_publish_queue` + API call | Meta keys |
| Post to Twitter | Queue entry + API call | Twitter keys |
| One-push publisher | Batch post to all connected platforms | All social keys |
| Sync ad campaigns | External campaigns imported | Platform keys |
| Ad performance report | Raw data + AI analysis | `ANTHROPIC_API_KEY` |

### 4.13 SEO, Intelligence & Predictive

| Test | Expected | Keys Needed |
|---|---|---|
| SEO audit | `seo_audits` record, score, keywords | `ANTHROPIC_API_KEY` |
| Website intel | Domain analysis report | `ANTHROPIC_API_KEY` |
| Competitor spy | `competitor_profiles` + snapshots | `ANTHROPIC_API_KEY` |
| Competitor monitor | Alerts on changes | Auth |
| Predictive score | `predictive_scores` record | `ANTHROPIC_API_KEY` |
| Forecast | Campaign performance prediction | `ANTHROPIC_API_KEY` |
| Budget optimization | Recommended allocation | `ANTHROPIC_API_KEY` |
| Platform intel | Specs for 21+ platforms | None (static data) |
| Auto-format content | Platform-native formatting | None (static logic) |

### 4.14 Workspace & Collaboration

| Test | Expected | Keys Needed |
|---|---|---|
| Invite team member | Invite email sent | `RESEND_API_KEY` |
| Update member role | Role updated in `team_members` | Auth |
| Remove team member | Removed from table | Auth |
| Submit for approval | `approval_workflows` record created | Auth |
| Approve content | Status updated to `approved` | Auth |
| Reject with note | Rejection reason stored | Auth |
| Automation workflow | Trigger → action chain executes | Auth |
| Webhook create | `webhook_endpoints` record created | Auth |
| Webhook fire | HTTP POST to endpoint URL | Auth |
| Forms builder | Form + fields CRUD | Auth |
| Form submission | `form_responses` record created | None |
| Funnel create | `funnels` + `funnel_steps` created | Auth |
| Funnel analytics | `funnel_step_events` tracked | Auth |

### 4.15 Content Tools

| Test | Expected | Keys Needed |
|---|---|---|
| Brand voice create | `brand_voices` record | Auth |
| Generate with brand voice | Content reflects voice profile | `ANTHROPIC_API_KEY` |
| Brand kit create | `brand_kits` with colors/fonts | Auth |
| Generate brand kit with AI | Logo + palette suggested | `ANTHROPIC_API_KEY` + Forge |
| Content repurpose | `repurposed_contents` record created | `ANTHROPIC_API_KEY` |
| Content ingest from URL | Source scraped + stored | `ANTHROPIC_API_KEY` |
| Content library | Template CRUD | Auth |
| Content scoring | Quality score assigned | `ANTHROPIC_API_KEY` |
| Bulk import | CSV/JSON processed | Auth |
| Multi-language translate | 30+ languages supported | `ANTHROPIC_API_KEY` |
| Meme generator | Meme with overlay text | Forge API |

### 4.16 Voice & Audio

| Test | Expected | Keys Needed |
|---|---|---|
| Voice transcription upload | Audio → text via Whisper | `BUILT_IN_FORGE_API_KEY` or `OPENAI_API_KEY` |
| Voiceover generate (ElevenLabs) | Audio file URL returned | `ELEVENLABS_API_KEY` |
| Voiceover generate (OpenAI TTS) | Audio file URL returned | `OPENAI_API_KEY` |
| Browser TTS fallback | Browser speech synthesis, no API | None |
| Music generate (Suno) | `music` contents record | `SUNO_API_KEY` |
| Music generate (Mubert) | Same | `MUBERT_API_KEY` |
| Music generate (SoundRaw) | Same | `SOUNDRAW_API_KEY` |

### 4.17 AI Avatars

| Test | Expected | Keys Needed |
|---|---|---|
| Generate avatar video | HeyGen video URL returned | `HEYGEN_API_KEY` |
| List available avatars | Avatar list from HeyGen | `HEYGEN_API_KEY` |
| Localize avatar video | Language-switched video | `HEYGEN_API_KEY` |

### 4.18 Reviews & Reputation

| Test | Expected | Keys Needed |
|---|---|---|
| Add review source | `review_sources` record | Auth |
| Sync reviews | Reviews fetched from source | Source platform API keys |
| Display reviews | Filtered by rating | Auth |
| Respond to review | Response saved to DB | Auth |

### 4.19 Reports & Sharing

| Test | Expected | Keys Needed |
|---|---|---|
| Generate report | `report_snapshots` record with `shareToken` | Auth |
| Access shared report | `GET /report/:shareToken` → report data | None (public) |
| Report expiry | 30-day expiry enforced | None |

### 4.20 Admin Panel

| Test | Expected | Keys Needed |
|---|---|---|
| Access `/admin` as admin | Panel loads with user list | `OWNER_OPEN_ID` set |
| Access `/admin` as regular user | 403 redirect | None |
| View all users | User list with plans | Admin role |
| Update user role | Role changed | Admin role |
| Update user plan | Plan overridden | Admin role |
| Platform stats | Total users/campaigns/content counts | Admin role |

### 4.21 DSP / Programmatic Ads

| Test | Expected | Keys Needed |
|---|---|---|
| DSP status | Balance + campaign count | Auth |
| Fund wallet (≥$1) | Stripe checkout URL | `STRIPE_SECRET_KEY` + `EPOM_API_KEY` |
| Fund wallet (<$1) | Validation error | None |
| Create DSP campaign | `dsp_campaigns` record + Epom API call | `EPOM_API_KEY` |
| Performance snapshots | Impressions/clicks/spend tracked | Auth |

### 4.22 Ecommerce & Shopify

| Test | Expected | Keys Needed |
|---|---|---|
| Connect Shopify | OAuth flow completes, token stored | `SHOPIFY_API_KEY/SECRET` |
| Sync products | Products imported as `products` records | Shopify connected |
| Generate product content | AI copy generated from product data | `ANTHROPIC_API_KEY` |

---

## Section 5: Security Tests

| Test | Expected Result | Notes |
|---|---|---|
| SQL injection in text inputs | Parameterized query executes safely | Drizzle ORM protection |
| XSS in content fields | HTML entities escaped, not rendered | React rendering |
| Unauthenticated tRPC call | `UNAUTHORIZED (401)` | All `protectedProcedure` routes |
| Non-admin hitting admin routes | `FORBIDDEN (403)` | `adminProcedure` check |
| CSRF on Stripe webhook | Signature verification fails → 400 | `constructEvent()` check |
| Rate limit AI endpoints | `429` after 15–30 requests/min | Rate limiter middleware |
| Rate limit general API | `429` after 200 requests/min | General rate limiter |
| Path traversal in file uploads | `..` stripped from file paths | `storage.ts` sanitization |
| Tampered JWT cookie | `UNAUTHORIZED (401)` | `jose` verification |
| Expired trial access | Tier limits enforced | `checkLimit()` |
| Cross-user data access | Cannot read another user's campaigns | Ownership check in queries |

---

## Section 6: Public Routes (No Auth Required)

| Route | Test | Expected |
|---|---|---|
| `GET /` | Landing page | Renders without auth cookie |
| `GET /login` | Login page | Shows Google OAuth button |
| `GET /lp/:slug` | Public landing page | Fetches from DB by slug |
| `POST /api/landing/submit` | Form submission | Lead created, 200 OK |
| `GET /report/:shareToken` | Shared report | Returns data within 30-day window |
| `GET /terms` | Terms page | Renders |
| `GET /privacy` | Privacy page | Renders |
| `GET /refund-policy` | Refund policy | Renders |
| `GET /health` | Health check | `{"ok":true}` |

---

## Section 7: API Key Requirements Summary for Live Launch

### Minimum Required to Run at All
```
DATABASE_URL            MySQL connection string
JWT_SECRET              Session signing — openssl rand -hex 32
GOOGLE_CLIENT_ID        OAuth login
GOOGLE_CLIENT_SECRET    OAuth login
PUBLIC_URL              File URLs + OAuth redirect URI
```

### Required for Core AI Value
```
ANTHROPIC_API_KEY       All content generation (mock fallback available for dev/testing)
BUILT_IN_FORGE_API_URL  Image generation — use https://api.openai.com/v1
BUILT_IN_FORGE_API_KEY  Image generation — OpenAI key works
```

### Required for Revenue
```
STRIPE_SECRET_KEY
VITE_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_STARTER_MONTHLY
STRIPE_PRICE_STARTER_ANNUAL
STRIPE_PRICE_PRO_MONTHLY
STRIPE_PRICE_PRO_ANNUAL
STRIPE_PRICE_BIZ_MONTHLY
STRIPE_PRICE_BIZ_ANNUAL
STRIPE_PRICE_AGENCY_MONTHLY
STRIPE_PRICE_AGENCY_ANNUAL
STRIPE_PRICE_CREDITS_50
STRIPE_PRICE_CREDITS_150
STRIPE_PRICE_CREDITS_400
STRIPE_PRICE_CREDITS_1000
STRIPE_PRICE_CREDITS_5000
```

### Required for Email
```
RESEND_API_KEY          Free tier: 100/day, 3000/month — resend.com
```

### Optional (Feature-Gated, Add When Ready)
```
RUNWAY_API_KEY          MP4 video rendering (or LUMA_API_KEY or KLING_API_KEY)
ELEVENLABS_API_KEY      Professional TTS (or OPENAI_API_KEY)
HEYGEN_API_KEY          AI avatar videos
META_APP_ID             Facebook/Instagram posting
META_APP_SECRET
TWITTER_API_KEY         Twitter/X posting
TWITTER_API_SECRET
TWITTER_ACCESS_TOKEN
TWITTER_ACCESS_SECRET
LINKEDIN_CLIENT_ID      LinkedIn posting
LINKEDIN_CLIENT_SECRET
TIKTOK_CLIENT_KEY       TikTok posting
TIKTOK_CLIENT_SECRET
SHOPIFY_API_KEY         Shopify product sync
SHOPIFY_API_SECRET
SUNO_API_KEY            AI music generation (or MUBERT_API_KEY or SOUNDRAW_API_KEY)
EPOM_API_KEY            Programmatic ad buying (DSP)
OWNER_OPEN_ID           Admin panel access (your Google sub ID)
SENTRY_DSN              Error tracking
VITE_ANALYTICS_ENDPOINT Umami analytics tracking
VITE_ANALYTICS_WEBSITE_ID
```

---

## Section 8: Test Execution Order (Go-Live Readiness)

Run groups in this priority order — each group gates the next.

| Priority | Group | Sections | Blocking? |
|---|---|---|---|
| **P0** | Infrastructure | §1 env audit + §2 pre-flight | Yes — nothing works without this |
| **P0** | Authentication | §4.1 | Yes — all other tests need a logged-in user |
| **P0** | Core Flow | §3 (C1–C8) | Yes — validates the main user journey |
| **P1** | Campaign System | §4.2 + §4.3 | Yes — campaigns own everything |
| **P1** | Content | §4.4 | Yes — primary product value |
| **P1** | Billing | §4.10 | Yes — required for revenue |
| **P2** | Images + Video | §4.5 + §4.6 | No — feature-gated |
| **P2** | Email + Landing Pages | §4.7 + §4.8 | No |
| **P2** | CRM / Leads | §4.9 | No |
| **P2** | Social Publishing | §4.12 | No — requires social OAuth |
| **P3** | Intelligence / SEO | §4.13 | No |
| **P3** | Workspace / Collab | §4.14 | No |
| **P3** | Content Tools | §4.15 | No |
| **P3** | Voice + Audio + Avatars | §4.16 + §4.17 | No — requires external API keys |
| **P3** | Reviews, Reports, Admin, DSP, Ecommerce | §4.18–§4.22 | No |
| **Security** | Security sweep | §5 | No — but must pass before launch |
| **Final** | Public routes | §6 | No |
| **Final** | Env audit re-check | §7 | No — confirm all live keys are set |
