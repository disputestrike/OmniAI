# OmniAI — Master Technical Document
## Single Source of Truth · Version 1.0 · March 2026

> **Purpose:** Complete end-to-end reference for any developer to understand, operate, fix, or extend OmniAI. Covers architecture, data model, APIs, UI/UX, integrations, environment variables, deployment, known issues, and expected behavior.

---

# TABLE OF CONTENTS

1. [Product Overview](#1-product-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Data Model — All 78 Tables](#5-data-model)
6. [The Campaign System](#6-the-campaign-system)
7. [AI Agent — How It Works](#7-ai-agent)
8. [All API Routes](#8-all-api-routes)
9. [tRPC Router Groups](#9-trpc-router-groups)
10. [Environment Variables — Complete List](#10-environment-variables)
11. [External API Integrations](#11-external-api-integrations)
12. [Authentication & Sessions](#12-authentication--sessions)
13. [Billing & Subscriptions](#13-billing--subscriptions)
14. [Frontend — Pages & Routes](#14-frontend--pages--routes)
15. [User Experience Flows](#15-user-experience-flows)
16. [Deployment — Railway](#16-deployment--railway)
17. [Database Migrations](#17-database-migrations)
18. [Security](#18-security)
19. [Known Issues & Status](#19-known-issues--status)
20. [Runbook — Common Operations](#20-runbook)

---

# 1. PRODUCT OVERVIEW

## What OmniAI Is
OmniAI is a **Campaign Operating System** — a unified marketing platform where a user types a single prompt and receives a complete, production-ready campaign with all assets generated and organized in one place.

**Core promise:** One prompt → one campaign → everything inside it.

## What It Does
- AI agent generates all marketing collateral from a single prompt
- Every generated asset belongs to a campaign container
- Campaign Workspace shows all assets in one unified view
- Supports the full marketing lifecycle: create → publish → analyze → optimize

## What It Does NOT Do
- It is NOT a social media scheduling tool alone
- It is NOT a standalone email platform
- It does NOT store files externally without configuration (uses local filesystem by default)
- It does NOT send real emails without `RESEND_API_KEY`
- It does NOT generate real AI content without `ANTHROPIC_API_KEY` (falls back to mock)
- It does NOT generate real images without `BUILT_IN_FORGE_API_URL/KEY`
- It does NOT post to social media without platform OAuth credentials

## The One Rule
> **Nothing exists without a `campaign_id`.** Every asset — content, image, video, email, landing page, lead, scheduled post — is owned by a campaign. The campaign is the root container.

---

# 2. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (React SPA)                 │
│  Vite + React 19 + Wouter + tRPC client + Tailwind   │
│  Served from: dist/public/                           │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│              EXPRESS SERVER (Node.js ESM)            │
│  dist/index.js — esbuild bundle of index.prod.ts     │
│                                                      │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ REST routes │  │ tRPC     │  │ Static serving │  │
│  │ /api/auth/* │  │ /api/trpc│  │ dist/public/*  │  │
│  │ /api/stripe │  │ 32 groups│  │ SPA catch-all  │  │
│  │ /api/landing│  │ 143 procs│  │                │  │
│  └──────┬──────┘  └────┬─────┘  └────────────────┘  │
│         │              │                              │
│  ┌──────▼──────────────▼──────────────────────────┐  │
│  │              BUSINESS LOGIC LAYER               │  │
│  │  aiAgent.ts · db.ts · stripe-routes.ts          │  │
│  │  socialPosting.ts · videoGeneration.ts          │  │
│  │  voiceover.ts · creditsAndUsage.ts              │  │
│  └──────┬──────────────────────────────────────────┘  │
│         │                                              │
│  ┌──────▼──────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  MySQL DB   │  │ Anthropic    │  │  Stripe     │  │
│  │  (Railway)  │  │ Claude Haiku │  │  Payments   │  │
│  └─────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Request Flow
```
User types prompt in /ai-agents
  → sendMessage() in AiAgents.tsx
  → POST /api/trpc/aiChat.send
  → runAgentLoop() in aiAgent.ts
  → chatWithTools() calls Anthropic Claude Haiku
  → Claude fires tools: analyzeProduct → createCampaign → generateEmailSequence
     → generateSocialPosts → generateLandingPage → generateVideoScript → generateAdCreative
  → Each tool saves records to MySQL (with campaignId)
  → Returns toolResults array to frontend
  → Frontend shows assets panel (1.8s)
  → Auto-navigates to /campaigns/:id
  → Campaign Workspace loads via campaign.workspace tRPC query
  → All assets appear in 9 tabs: Overview/Content/Images/Videos/Email/Landing/Leads/Schedule/Analytics
```

---

# 3. TECHNOLOGY STACK

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19 |
| Frontend build | Vite | 7 |
| Frontend routing | Wouter | — |
| UI components | shadcn/ui + Radix UI | — |
| CSS | Tailwind CSS | v4 |
| API layer | tRPC | — |
| Backend | Express.js | — |
| Runtime | Node.js | 22 |
| Package manager | pnpm | 10.4.1 |
| Database ORM | Drizzle ORM | — |
| Database | MySQL 8 | — |
| Server build | esbuild | — |
| AI | Anthropic Claude Haiku | claude-haiku-4-5-20251001 |
| Payments | Stripe | 2025-02-24 |
| Email | Resend | — |
| Auth | JWT (HttpOnly cookie) | — |
| Containerization | Docker | — |
| Hosting | Railway | — |

---

# 4. PROJECT STRUCTURE

```
OmniAI/
├── client/                          # React frontend
│   ├── src/
│   │   ├── App.tsx                  # Root router — all 83 routes
│   │   ├── pages/                   # 81 page components
│   │   │   ├── AiAgents.tsx         # PRIMARY: prompt → campaign
│   │   │   ├── CampaignWorkspace.tsx # PRIMARY: campaign OS view
│   │   │   ├── Campaigns.tsx        # Campaign list
│   │   │   ├── Home.tsx             # Dashboard
│   │   │   ├── Pricing.tsx          # Stripe checkout
│   │   │   ├── Login.tsx            # Auth page
│   │   │   └── [74 other pages]
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx  # Sidebar + main layout
│   │   │   ├── TrialCountdownBanner.tsx
│   │   │   ├── ReportExport.tsx
│   │   │   ├── WhatsNextCard.tsx
│   │   │   ├── UpgradePrompt.tsx
│   │   │   └── LimitExceededModal.tsx
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx     # Dark/light mode
│   │   ├── hooks/
│   │   │   └── useMobile.ts
│   │   ├── lib/
│   │   │   ├── trpc.ts              # tRPC client setup
│   │   │   ├── utils.ts
│   │   │   └── crisp.ts             # Customer support
│   │   └── index.css                # Full design system (946 lines)
│   └── index.html
├── server/
│   ├── _core/
│   │   ├── index.prod.ts            # Production entry point
│   │   ├── index.ts                 # Dev entry point
│   │   ├── env.ts                   # All environment variables
│   │   ├── llm.ts                   # Claude Haiku invocation
│   │   ├── migrate.ts               # DB migration runner
│   │   ├── static.ts                # SPA file serving
│   │   ├── trpc.ts                  # tRPC setup + procedures
│   │   ├── context.ts               # Request context (auth)
│   │   ├── auth.ts                  # JWT create/verify
│   │   ├── cookies.ts               # Cookie config
│   │   └── systemRouter.ts          # Health + admin procedures
│   ├── routers.ts                   # ALL tRPC routers (2814 lines)
│   ├── db.ts                        # ALL database functions (1668 lines)
│   ├── aiAgent.ts                   # AI agent loop + tool executors (866 lines)
│   ├── google-oauth.ts              # Google OAuth flow
│   ├── email-auth.ts                # Email/password auth
│   ├── stripe-routes.ts             # Stripe checkout/webhook/portal
│   ├── credits-routes.ts            # Credit balance/purchase
│   ├── landing-routes.ts            # Public landing page API
│   ├── socialPosting.ts             # Social media posting
│   ├── videoGeneration.ts           # Runway/Luma/Kling video
│   ├── voiceover.ts                 # ElevenLabs/OpenAI TTS
│   ├── storage.ts                   # File upload/download
│   ├── email.service.ts             # Resend email sending
│   ├── creditsAndUsage.ts           # Usage limits enforcement
│   ├── tierLimits.ts                # Plan limits config
│   ├── pricingConfig.ts             # Pricing tiers display
│   ├── security.ts                  # Rate limiting + headers
│   └── [40+ other server files]
├── drizzle/
│   ├── schema.ts                    # 78 table definitions
│   └── apply-all-migrations.sql     # CREATE TABLE + ALTER statements
├── scripts/
│   └── build-server.mjs             # esbuild server bundle
├── Dockerfile                       # Two-stage Docker build
├── RAILWAY.md                       # Railway deployment checklist
├── .env.example                     # All env vars documented
├── MASTER_DOCUMENT.md               # This file
└── package.json
```

---

# 5. DATA MODEL

## Core Principle
Every asset table has `campaignId` (nullable for backward compat, populated by agent). The `campaigns` table is the root container.

## All 78 Tables

### Authentication & Users
| Table | Purpose | Key Columns |
|---|---|---|
| `users` | All accounts | id, openId, name, email, loginMethod, role, subscriptionPlan |
| `subscriptions` | Stripe subscription state | userId, stripeSubscriptionId, status, currentPeriodEnd, trialEndsAt |
| `user_monthly_usage` | Usage tracking per billing period | userId, periodStart, aiGenerationsUsed, aiImagesUsed |
| `credit_wallets` | Purchased credit balance | userId, purchasedCredits, lifetimePurchased |
| `credit_transactions` | Credit purchase/spend log | userId, amount, actionType, balanceAfter |
| `tier_limits_config` | Plan limits (seeded at startup) | tier, maxAiGenerations, maxAiImages, priceMonthlyCents |
| `subscription_limits` | Per-user tier override | userId, tier |

### Campaign System (Core)
| Table | Purpose | Key Columns |
|---|---|---|
| `campaigns` | Root container for all assets | id, userId, name, goal, platforms, objective, status, budget |
| `campaign_assets` | Asset manifest (links campaign→asset) | campaignId, assetType, assetId, status |
| `contents` | All text content (22 types) | userId, campaignId, type, platform, title, body, status |
| `creatives` | AI-generated images | userId, campaignId, type, imageUrl, platform, style |
| `video_ads` | Video scripts + storyboards | userId, campaignId, platform, script, voiceoverText, metadata |
| `video_renders` | Actual MP4 renders | userId, videoAdId, videoUrl, thumbnailUrl, status |
| `email_campaigns` | Email sequences | userId, campaignId, subject, htmlBody, status, opened, clicked |
| `landing_pages` | Landing pages | userId, campaignId, title, slug, components, status, visits |
| `scheduled_posts` | Post queue | userId, campaignId, contentId, platform, scheduledAt, status |
| `analytics_events` | Performance data | userId, campaignId, platform, impressions, clicks, conversions |

### CRM
| Table | Purpose | Key Columns |
|---|---|---|
| `leads` | Captured leads | userId, campaignId, name, email, phone, source, status, score |
| `deals` | CRM pipeline | userId, leadId, campaignId, title, value, stage |
| `activities` | CRM activity log | userId, dealId, leadId, type, title, dueDate |
| `customer_profiles` | Deep customer records | userId, leadId, name, email, company, jobTitle |
| `customer_interactions` | Customer touchpoints | customerId, userId, type, channel |
| `customer_segments` | Audience segments | userId, name, criteria, customerCount |

### Ad Platforms
| Table | Purpose | Key Columns |
|---|---|---|
| `ad_platform_connections` | OAuth connections to Meta/Google/etc | userId, platform, accessToken, status |
| `ad_platform_campaigns` | External ad campaigns | userId, connectionId, campaignId, externalCampaignId |
| `ad_performance_reports` | Ad performance data | userId, connectionId, platform, rawData, aiAnalysis |
| `social_publish_queue` | Queued social posts | userId, contentId, platform, status, publishedAt |
| `publisher_queue` | One-push publisher queue | userId, connectionId, platform, adName |
| `performance_alerts` | Performance warnings | userId, platform, alertType, severity |

### Intelligence & Research
| Table | Purpose | Key Columns |
|---|---|---|
| `competitor_profiles` | Tracked competitors | userId, name, domain, industry |
| `competitor_snapshots` | Competitor data snapshots | competitorId, snapshotType, data |
| `competitor_alerts` | Competitor change alerts | competitorId, alertType, severity |
| `seo_audits` | SEO analysis results | userId, url, overallScore, keywords |
| `predictive_scores` | AI scoring predictions | userId, entityType, entityId, predictedCtr |
| `campaign_winning_patterns` | What's working | userId, campaignId, platform, format, ctr |
| `narratives` | Content angle ideas | userId, summary, emotion, suggestedAngles |
| `influence_nodes` | Influencer tracking | userId, name, type, segmentId |

### Content Tools
| Table | Purpose | Key Columns |
|---|---|---|
| `brand_voices` | Brand voice profiles | userId, name, voiceProfile, isDefault |
| `brand_kits` | Brand assets | userId, name, logoUrl, primaryColor, fontHeading |
| `content_templates` | Reusable templates | userId, name, contentType, platform, body |
| `ab_tests` | A/B test setup | userId, campaignId, name, status, winnerVariantId |
| `ab_test_variants` | Test variations | testId, name, contentId, impressions, clicks |
| `repurposing_projects` | Content repurposing | userId, sourceUrl, sourceTranscript, status |
| `repurposed_contents` | Repurposed output | projectId, userId, formatType, body |
| `personal_videos` | Personal video records | userId, title, script, videoUrl |

### Publishing & Automation
| Table | Purpose | Key Columns |
|---|---|---|
| `automation_workflows` | Automated workflows | userId, triggerType, triggerConfig, actions, isActive |
| `webhook_endpoints` | Outbound webhooks | userId, url, events, secret, isActive |
| `publishing_credentials` | WP/Medium/Substack auth | userId, platform, accessToken, siteUrl |
| `email_lists` | Email subscriber lists | userId, name, contactCount |
| `email_contacts` | Email list members | userId, listId, email, name, unsubscribed |

### Forms & Funnels
| Table | Purpose | Key Columns |
|---|---|---|
| `forms` | Custom forms | userId, name, slug, createLeadOnSubmit |
| `form_fields` | Form fields | formId, fieldType, label, required |
| `form_responses` | Form submissions | formId, userId, leadId, data |
| `form_submissions` | Landing page submissions | userId, landingPageId, data |
| `funnels` | Conversion funnels | userId, name, slug, status |
| `funnel_steps` | Funnel stages | funnelId, stepType, landingPageId, formId |
| `funnel_step_events` | Funnel analytics | funnelId, funnelStepId, eventType |
| `funnel_ab_tests` | Funnel A/B tests | funnelId, name, status |

### DSP (Programmatic Advertising)
| Table | Purpose | Key Columns |
|---|---|---|
| `dsp_ad_wallets` | DSP spend wallet | userId, balanceCents, totalSpentCents |
| `dsp_campaigns` | Programmatic campaigns | userId, epomCampaignId, status, dailyBudgetCents |
| `dsp_performance_snapshots` | DSP performance | campaignId, impressions, clicks, spendCents |
| `dsp_wallet_transactions` | Spend log | userId, campaignId, grossAmountCents, markupCents |

### Misc
| Table | Purpose | Key Columns |
|---|---|---|
| `team_members` | Team/seats | ownerId, userId, email, role, inviteStatus |
| `report_snapshots` | Shareable reports | userId, reportType, shareToken, payload, expiresAt |
| `reviews` | Review management | userId, sourceId, authorName, rating, text |
| `review_sources` | Review platforms | userId, sourceType, name, accessToken |
| `products` | Product catalog | userId, name, description, url, features, analysisStatus |
| `projects2` | Project organization | userId, name, status |
| `creator_profiles` | Creator/influencer profiles | userId, displayName, bio, website |
| `portfolio_items` | Creator portfolio | userId, title, contentType, contentUrl |
| `chat_conversations` | AI chat history | userId, title, messages |
| `performance_metrics` | Content performance | userId, contentId, platform, likes, shares |
| `music_studio` data | Stored in `contents` table | type=music |
| `referral_codes` | Referral program | userId, code |
| `referral_signups` | Referral tracking | referrerUserId, referredUserId |
| `assignment_settings` | Lead round-robin | userId, mode, memberOrder |
| `flywheel_patterns` | Global performance patterns | platform, format, ctrBand |

---

# 6. THE CAMPAIGN SYSTEM

## Campaign as Root Container

```
Campaign (root)
├── contents[]          → /content page
├── creatives[]         → /creatives page  
├── video_ads[]         → /video-ads page
├── email_campaigns[]   → /email-marketing page
├── landing_pages[]     → /landing-pages page
├── scheduled_posts[]   → /scheduler page
├── leads[]             → /leads page
├── analytics_events[]  → /analytics page
└── campaign_assets[]   → manifest of all above
```

## Campaign Workspace (`/campaigns/:id`)

The workspace fetches everything in a single `campaign.workspace` tRPC query using `Promise.all`:

```typescript
// All 9 asset types fetched simultaneously
const [contents, creatives, videoAds, emailSequences, landingPages,
       scheduledPosts, analytics, leads, assets] = await Promise.all([
  getContentsByCampaign(campaignId),
  getCreativesByCampaign(campaignId),
  getVideoAdsByCampaign(campaignId),
  getEmailCampaignsByCampaign(campaignId),
  getLandingPagesByCampaign(campaignId),
  getScheduledPostsByCampaign(campaignId),
  getAnalyticsByCampaign(campaignId),
  getLeadsByCampaign(campaignId),
  getCampaignAssetsByCampaignId(campaignId),
]);
```

Each fetch is wrapped in `safe()` — returns `[]` on error instead of crashing.

**Backfill logic:** If total assets = 0 (old campaigns with NULL campaignId), the workspace fetches user's recent assets created within 10 minutes of campaign creation and retroactively links them.

## Campaign Status Flow
```
draft → active → paused → completed → archived
```

---

# 7. AI AGENT

## How It Works

File: `server/aiAgent.ts`

### Normal Mode (with ANTHROPIC_API_KEY)

```
User message
  → chatWithTools(systemPrompt, messages, 7 tools)
  → Claude decides which tools to call and in what order
  → executeTool() runs each tool, saves to DB
  → campaignId force-injected into all asset tools
  → Results returned as toolResults[]
  → Frontend auto-navigates to workspace
```

### Mock Mode (without ANTHROPIC_API_KEY)

```
User message
  → runMockAgentLoop() detects no API key
  → Extracts product name, platforms, audience from message text
  → Creates real DB records: campaign + posts + emails + landing page + video + ad
  → Returns identical toolResults[] structure
  → Frontend behavior identical — workspace fills up
```

### The 7 Tools

| Tool | What It Does | Saves To |
|---|---|---|
| `analyzeProduct` | Generates positioning, value props, target audience | Returns in-memory (no DB save) |
| `createCampaign` | Creates the root campaign record | `campaigns` table |
| `generateSocialPosts` | Writes platform-native posts | `contents` table (type: social_caption) |
| `generateEmailSequence` | Writes 5-email launch sequence | `email_campaigns` table (5 rows) |
| `generateLandingPage` | Builds full landing page with components | `landing_pages` table |
| `generateVideoScript` | Writes hook + script + CTA | `video_ads` table |
| `generateAdCreative` | Writes ad copy (headline + body + CTA) | `contents` table (type: ad_copy_short) |

### campaignId Chaining (Critical)

```typescript
let activeCampaignId: number | undefined;
const ASSET_TOOLS = new Set(["generateEmailSequence","generateSocialPosts",
  "generateLandingPage","generateVideoScript","generateAdCreative"]);

// For each tool call:
if (ASSET_TOOLS.has(tc.name) && activeCampaignId && !args.campaignId) {
  args.campaignId = activeCampaignId; // Force-inject
}
// After createCampaign returns:
if (result.kind === "createCampaign") activeCampaignId = result.campaignId;
```

### System Prompt Behavior
- Never asks more than 1 question before building
- If no product described → asks ONE question: "What are you launching and who is your customer?"
- If enough context → immediately says "Got it. Building now." and fires tools
- Explicit sequence: analyzeProduct → createCampaign → all asset tools with campaignId

---

# 8. ALL API ROUTES

## REST Endpoints (Express)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | None | Railway healthcheck → `{ok:true}` |
| GET | `/api/auth/google` | None | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | None | OAuth callback → set JWT cookie |
| GET | `/api/auth/google/status` | None | Check if Google OAuth configured |
| POST | `/api/auth/email/register` | None | Email/password registration |
| POST | `/api/auth/email/login` | None | Email/password login |
| POST | `/api/stripe/webhook` | Stripe-sig | Subscription lifecycle events |
| POST | `/api/stripe/create-checkout` | Cookie | Create Stripe checkout session |
| POST | `/api/stripe/create-credit-checkout` | Cookie | Buy credit pack |
| POST | `/api/stripe/create-portal` | Cookie | Open Stripe billing portal |
| POST | `/api/stripe/create-dsp-fund-checkout` | Cookie | Fund DSP wallet |
| GET | `/api/credits/balance` | Cookie | Get credit wallet balance |
| POST | `/api/credits/purchase` | Cookie | Initiate credit purchase |
| GET | `/api/landing/page/:slug` | None | Get published landing page data |
| POST | `/api/landing/submit` | None | Submit landing page form → create lead |
| GET | `/api/uploads/*` | None | Serve uploaded files |

## tRPC Endpoint
All tRPC calls go through:
```
POST /api/trpc/[routerGroup].[procedure]
```

Example: `POST /api/trpc/campaign.workspace`

---

# 9. tRPC ROUTER GROUPS

32 router groups, 135 protected procedures, 8 public procedures.

| Router | Key Procedures | Purpose |
|---|---|---|
| `auth` | `me`, `logout` | Session management |
| `aiChat` | `send` | Main AI agent entry point |
| `campaign` | `list`, `get`, `create`, `update`, `delete`, `workspace`, `generateStrategy`, `wizardGenerate`, `wizardLaunch` | Campaign CRUD + workspace |
| `content` | `list`, `get`, `create`, `update`, `delete`, `generate`, `search`, `bulkGenerate` | Text content management |
| `creative` | `list`, `get`, `generate`, `delete`, `launchAd`, `productPhotoshoot` | AI image generation |
| `videoAd` | `list`, `get`, `create`, `update`, `delete`, `generate`, `render` | Video scripts + renders |
| `product` | `list`, `get`, `create`, `update`, `delete`, `analyze`, `syncFromStore` | Product management |
| `lead` | `list`, `get`, `create`, `update`, `delete`, `import`, `bulkUpdate` | Lead management |
| `deal` | `list`, `get`, `create`, `update`, `delete` | CRM deals |
| `analytics` | `summary`, `list`, `getInsights`, `track` | Analytics data |
| `schedule` | `list`, `create`, `update`, `delete`, `publish` | Post scheduling |
| `abTest` | `list`, `get`, `create`, `update`, `delete`, `addVariant` | A/B testing |
| `adPlatform` | `list`, `connect`, `disconnect`, `sync` | Ad platform OAuth |
| `subscription` | `status`, `usage` | Billing state |
| `credits` | `packages`, `balance`, `spend` | Credit wallet |
| `pricing` | `list`, `userCount` | Pricing display |
| `intelligence` | `analyzeWebsite`, `getReport` | Website intelligence |
| `seo` | `audit`, `list`, `get` | SEO audits |
| `predictive` | `score`, `list` | AI predictions |
| `momentum` | `analyze`, `get` | Content momentum |
| `platformIntel` | `analyze`, `list` | Platform intelligence |
| `team` | `list`, `invite`, `remove`, `updateRole` | Team management |
| `approval` | `list`, `get`, `create`, `approve`, `reject` | Approval workflows |
| `brandKit` | `list`, `get`, `create`, `update`, `delete` | Brand kit management |
| `voice` | `uploadAndTranscribe`, `generateVoiceover` | Voice input/TTS |
| `musicStudio` | `generate`, `list` | AI music generation |
| `dsp` | `campaign.*`, `wallet.*` | Programmatic ads |
| `dashboard` | `stats`, `recentActivity` | Home dashboard data |
| `activity` | `list`, `create` | Activity log |
| `admin` | `users`, `stats`, `impersonate` | Admin panel |
| `campaigns` | (alias for campaign router) | — |
| `system` | `health`, `forgeConfigured`, `notifyOwner` | System status |

---

# 10. ENVIRONMENT VARIABLES

## Required to Run (App Breaks Without These)

| Variable | Purpose | How to Get |
|---|---|---|
| `DATABASE_URL` | MySQL connection string | Railway → MySQL service → Variables → MYSQL_URL |
| `JWT_SECRET` | Signs session cookies | `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth | console.cloud.google.com → OAuth 2.0 Client |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Same OAuth client |
| `PUBLIC_URL` | Base URL for file links + OAuth | `https://omniai-production-778d.up.railway.app` |

## Required for AI (Everything AI-Powered Breaks)

| Variable | Purpose | How to Get |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude Haiku — ALL AI features | console.anthropic.com → API Keys |

> **Without this:** Mock agent runs — creates real DB records with template content. Good for testing, not for production.

## Required for Image Generation

| Variable | Purpose | Notes |
|---|---|---|
| `BUILT_IN_FORGE_API_URL` | Image generation endpoint | Use `https://api.openai.com/v1` for DALL-E |
| `BUILT_IN_FORGE_API_KEY` | Image generation API key | OpenAI API key works |

## Required for Payments

| Variable | Purpose | How to Get |
|---|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe | dashboard.stripe.com → API Keys |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe | Same dashboard |
| `STRIPE_WEBHOOK_SECRET` | Verify webhook signatures | Stripe → Webhooks → signing secret |
| `STRIPE_PRICE_STARTER_MONTHLY` | $49/mo price ID | Stripe Dashboard → Products |
| `STRIPE_PRICE_STARTER_ANNUAL` | $41/mo annual price ID | — |
| `STRIPE_PRICE_PRO_MONTHLY` | $97/mo price ID | — |
| `STRIPE_PRICE_PRO_ANNUAL` | $81/mo annual price ID | — |
| `STRIPE_PRICE_BIZ_MONTHLY` | $197/mo price ID | — |
| `STRIPE_PRICE_BIZ_ANNUAL` | $163/mo annual price ID | — |
| `STRIPE_PRICE_AGENCY_MONTHLY` | $497/mo price ID | — |
| `STRIPE_PRICE_AGENCY_ANNUAL` | $413/mo annual price ID | — |
| `STRIPE_PRICE_CREDITS_50` | $9 one-time (50 credits) | — |
| `STRIPE_PRICE_CREDITS_150` | $19 one-time (150 credits) | — |
| `STRIPE_PRICE_CREDITS_400` | $39 one-time (400 credits) | — |

## Required for Email Sending

| Variable | Purpose | How to Get |
|---|---|---|
| `RESEND_API_KEY` | Transactional email | resend.com → free tier 100/day |

> **Without this:** Emails are logged to console but not sent. App still works.

## Optional — Video Generation (Need At Least One)

| Variable | Provider | Cost |
|---|---|---|
| `RUNWAY_API_KEY` | Runway ML Gen-3 Alpha | app.runwayml.com |
| `LUMA_API_KEY` | Luma Dream Machine | lumalabs.ai/api |
| `KLING_API_KEY` | Kling AI | klingai.com/developer |

> **Without all three:** Video scripts generate (stored in DB), but no MP4 file is created. Fallback uses static image frames.

## Optional — Voiceover

| Variable | Provider | Notes |
|---|---|---|
| `ELEVENLABS_API_KEY` | ElevenLabs | elevenlabs.io → Profile → API Key |
| `OPENAI_API_KEY` | OpenAI TTS | Fallback if ElevenLabs not set |

## Optional — AI Avatars

| Variable | Provider | Notes |
|---|---|---|
| `HEYGEN_API_KEY` | HeyGen | app.heygen.com → Settings → API |

## Optional — Social Media Posting

| Variable | Platform | Notes |
|---|---|---|
| `META_APP_ID` + `META_APP_SECRET` | Facebook + Instagram | Requires App Review for production |
| `TWITTER_API_KEY` + `TWITTER_API_SECRET` | Twitter/X | developer.twitter.com |
| `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET` | LinkedIn | developer.linkedin.com |
| `TIKTOK_CLIENT_KEY` + `TIKTOK_CLIENT_SECRET` | TikTok | developers.tiktok.com |

> **Without these:** Users cannot connect social accounts or post. OAuth flows fail gracefully.

## Optional — E-commerce

| Variable | Purpose |
|---|---|
| `SHOPIFY_API_KEY` + `SHOPIFY_API_SECRET` | Shopify product sync |

## Optional — Music

| Variable | Provider |
|---|---|
| `SUNO_API_KEY` | Suno AI music |
| `MUBERT_API_KEY` | Mubert AI music |
| `SOUNDRAW_API_KEY` | Soundraw AI music |

> **Without these:** Built-in SFX library (40+ royalty-free tracks) is available.

## Admin

| Variable | Purpose | How to Get |
|---|---|---|
| `OWNER_OPEN_ID` | Grants admin role | After first login, query: `SELECT openId FROM users LIMIT 1` |
| `TRIAL_DAYS` | Trial length | Default: 7 |

---

# 11. EXTERNAL API INTEGRATIONS

## Anthropic Claude Haiku
- **Used for:** ALL AI content generation, agent tools, strategy, analysis, email sequences, video scripts, ad copy, SEO analysis, competitor intelligence, predictive scoring
- **Model:** `claude-haiku-4-5-20251001`
- **Endpoint:** Anthropic SDK `messages.create`
- **Where:** `server/_core/llm.ts` (standard calls), `server/aiAgent.ts` (tool-use loop)
- **Fallback:** Mock agent in `runMockAgentLoop()` — creates real DB records with template content

## Stripe
- **Used for:** Subscription checkout, credit pack purchases, billing portal, webhook subscription management
- **Webhook events handled:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`
- **Where:** `server/stripe-routes.ts`
- **Webhook URL:** `https://omniai-production-778d.up.railway.app/api/stripe/webhook`

## Google OAuth
- **Used for:** Primary login method
- **Flow:** `/api/auth/google` → Google consent → `/api/auth/google/callback` → JWT HttpOnly cookie
- **Redirect URI (must be in Google Console):** `https://omniai-production-778d.up.railway.app/api/auth/google/callback`
- **Where:** `server/google-oauth.ts`

## Resend
- **Used for:** 12 transactional email sequences
  - Welcome email (on signup)
  - Trial ending reminder (3 days before)
  - Usage 80% alert
  - Email marketing campaign sends
  - Automation workflow emails
- **From address:** `hello@otobi.ai` (must be verified domain in Resend)
- **Where:** `server/email.service.ts`

## Image Generation (Forge/OpenAI)
- **Used for:** Creative Engine, AI product photoshoot, video frames
- **API format:** OpenAI-compatible image generation
- **Where:** `server/_core/imageGeneration.ts`
- **Endpoint called:** `{BUILT_IN_FORGE_API_URL}/images.v1.ImageService/GenerateImage`

## ElevenLabs
- **Used for:** Voiceover Studio, video ad voiceovers
- **Default voice:** Rachel (`21m00Tcm4TlvDq8ikWAM`)
- **Where:** `server/voiceover.ts`

## Runway ML / Luma AI / Kling AI
- **Used for:** Actual MP4 video generation from scripts
- **Provider priority:** Runway → Luma → Kling → fallback (static frames)
- **Where:** `server/videoGeneration.ts`

## HeyGen
- **Used for:** AI Avatar video creation
- **Where:** `server/avatarGeneration.ts`

## Social Platforms (Meta/Twitter/LinkedIn/TikTok)
- **Used for:** Publishing posts directly to platforms
- **Flow:** User connects account at `/ad-platforms` → OAuth → access token stored in `ad_platform_connections` → post via API at `/social-publish`
- **Where:** `server/socialPosting.ts`

## Epom DSP
- **Used for:** Programmatic advertising (display ads, retargeting)
- **Where:** `server/dspRouters.ts`
- **Enable:** Set `DSP_ENABLED=true`

---

# 12. AUTHENTICATION & SESSIONS

## Session Mechanism
- JWT token signed with `JWT_SECRET`
- Stored as HttpOnly cookie named `omni-session` (1 year expiry)
- Verified on every tRPC `protectedProcedure` call via `createContext()`

## Login Methods
1. **Google OAuth (Primary):** `/api/auth/google` → Google → `/api/auth/google/callback`
2. **Email/Password:** POST `/api/auth/email/register` and `/api/auth/email/login`

## Auth Middleware
```typescript
// Every protected tRPC call:
const context = createContext(req) // extracts JWT from cookie
// protectedProcedure checks ctx.user exists
// adminProcedure additionally checks ctx.user.role === "admin"
```

## Admin Access
- Set `OWNER_OPEN_ID` to your Google openId (format: `google_123456789`)
- First login auto-assigns admin role
- Admin panel at `/admin`

---

# 13. BILLING & SUBSCRIPTIONS

## Plans

| Plan | Monthly | Annual/mo | AI Gens | Images | Videos | Seats |
|---|---|---|---|---|---|---|
| Free | $0 | $0 | 5 | 2 | 1 | 1 |
| Starter | $49 | $41 | 50 | 15 | 5 | 1 |
| Professional | $97 | $81 | 200 | 50 | 20 | 5 |
| Business | $197 | $163 | 800 | 200 | Unlimited | 15 |
| Agency | $497 | $413 | 3,000 | 500 | Unlimited | Unlimited |

## Trial
- 7-day free trial on first paid checkout (configurable via `TRIAL_DAYS`)
- `trialUsed` flag prevents second trials

## Subscription Webhook Flow
```
User clicks upgrade → POST /api/stripe/create-checkout → Stripe checkout URL
User completes payment → Stripe fires checkout.session.completed
→ POST /api/stripe/webhook
→ Update subscriptions table (status, currentPeriodEnd, plan)
→ Update users.subscriptionPlan
→ Send welcome/trial email via Resend
```

## Credit System
- Credits purchased separately for extra usage
- Stored in `credit_wallets.purchasedCredits`
- Deducted per action in `creditsAndUsage.ts`
- Packages: 50 ($9), 150 ($19), 400 ($39), 1000+ (custom)

## Usage Enforcement
- Every AI endpoint checks `checkLimit(userId, actionType)`
- If monthly limit hit → check credit wallet
- If no credits → dispatch `otobi-limit-exceeded` event → `LimitExceededModal` shown

---

# 14. FRONTEND — PAGES & ROUTES

## Routing Architecture
Two nested `<Switch>` components in `App.tsx`:
1. **Outer Switch:** Maps top-level paths to `DashboardRouter` component
2. **Inner Switch (inside DashboardRouter):** Maps paths to actual page components

**Critical:** Every dynamic route (`/campaigns/:id`) must be in BOTH switches.

## All Routes

### Public
| Path | Component | Purpose |
|---|---|---|
| `/` | Landing | Marketing landing page |
| `/login` | Login | Google OAuth + email login |
| `/lp/:slug` | LandingPagePublicView | Published landing pages |
| `/form/:slug` | FormView | Public form submissions |
| `/report/:shareToken` | ReportView | Shared reports (30-day expiry) |
| `/about` | AboutUs | About page |
| `/terms` | Terms | Terms of service |
| `/privacy` | Privacy | Privacy policy |
| `/refund-policy` | RefundPolicy | Refund policy |
| `/contact` | Contact | Contact page |

### Dashboard (Auth Required)
| Path | Component | Purpose |
|---|---|---|
| `/dashboard` | Home | Stats + quick actions |
| `/ai-agents` | AiAgents | **PRIMARY: prompt → campaign** |
| `/campaigns` | Campaigns | Campaign list |
| `/campaigns/:id` | CampaignWorkspace | **PRIMARY: campaign OS** |
| `/campaign-wizard` | CampaignWizard | Guided campaign creation |
| `/content` | ContentStudio | 22-type content generation |
| `/creatives` | Creatives | AI image generation gallery |
| `/video-ads` | VideoAds | Video scripts + storyboards |
| `/video-render` | VideoRender | MP4 render status |
| `/video-studio` | VideoStudio | Video studio tools |
| `/email-marketing` | EmailMarketing | Email campaigns |
| `/landing-pages` | LandingPageBuilder | Landing page editor |
| `/scheduler` | Scheduler | Post scheduling calendar |
| `/leads` | Leads | Lead management |
| `/deals` | Deals | CRM pipeline |
| `/analytics` | Analytics | Campaign analytics |
| `/ad-platforms` | AdPlatforms | Connect social/ad accounts |
| `/social-publish` | SocialPublish | Publish to connected platforms |
| `/one-push-publisher` | OnePushPublisher | Push to all platforms at once |
| `/ab-testing` | AbTesting | A/B test setup |
| `/products` | Products | Product catalog |
| `/intelligence` | Intelligence | Website intelligence |
| `/competitor-intelligence` | CompetitorIntelligenceHub | Competitor analysis |
| `/competitor-spy` | CompetitorSpy | Competitor monitoring |
| `/seo-audits` | SeoAudits | SEO analysis |
| `/predictive` | Predictive | AI predictions |
| `/momentum` | Momentum | Content momentum tracking |
| `/platform-intel` | PlatformIntel | Platform intelligence |
| `/brand-voice` | BrandVoice | Brand voice setup |
| `/brand-kit` | BrandKit | Brand assets |
| `/image-editor` | ImageEditor | Image editing |
| `/ai-avatars` | AiAvatars | AI avatar videos |
| `/voiceover-studio` | VoiceoverStudio | Text-to-speech |
| `/music-studio` | MusicStudio | AI music generation |
| `/meme-generator` | MemeGenerator | Meme creation |
| `/translate` | Translate | Content translation |
| `/content-repurposer` | ContentRepurposer | Repurpose content |
| `/content-library` | ContentLibrary | Content archive |
| `/content-templates` | ContentTemplates | Template library |
| `/content-scorer` | ContentScorer | AI content scoring |
| `/content-calendar` | ContentCalendar | Editorial calendar |
| `/content-ingest` | ContentIngest | Import content |
| `/bulk-import` | BulkImport | Bulk data import |
| `/automations` | Automations | Workflow automation |
| `/webhooks` | Webhooks | Outbound webhooks |
| `/funnels` | Funnels | Conversion funnels |
| `/forms` | Forms | Form builder |
| `/reviews` | Reviews | Review management |
| `/approvals` | Approvals | Content approval |
| `/collaboration` | Collaboration | Team collaboration |
| `/team` | Team | Team management |
| `/programmatic-ads` | ProgrammaticAds | DSP advertising |
| `/ad-performance` | AdPerformanceAnalyzer | Ad performance |
| `/social-planner` | SocialPlanner | Social planning |
| `/customer-intel` | CustomerIntel | Customer intelligence |
| `/creator-profile` | CreatorProfile | Creator profile |
| `/projects` | Projects | Project management |
| `/export-import` | ExportImport | Data export/import |
| `/performance` | PerformanceTracking | Performance tracking |
| `/competitor-monitor` | CompetitorMonitor | Competitor alerts |
| `/competitor-intel` | CompetitorIntel | Competitor detail |
| `/pricing` | Pricing | Upgrade/billing |
| `/admin` | AdminPanel | Admin panel |
| `/help` | Help | Help & docs |

## Sidebar Navigation

The custom sidebar (`DashboardLayout.tsx`) has two sections:

**Main Nav (always visible):**
Home, Campaigns, Analytics, Library, Approvals, Integrations, Account

**All Tools (collapsible, organized in 4 groups):**
- **Create:** AI Agents, Campaign Wizard, Product Analyzer, Content Studio, Repurposer, Creative Engine, Video Ads, Video Render, Video Studio, Image Editor, Brand Voice, Translate, AI Avatars, Meme Generator, Content Ingest, Content Library, Templates, Content Scorer, Bulk Import, Brand Kit, Music Studio, Voiceover Studio, Forms
- **Manage:** Programmatic Ads, Funnels, A/B Testing, Scheduler, Lead Manager, CRM Deals, Ad Performance, One-Push Publisher, Momentum, Social Publish, Email Marketing, Content Calendar, Performance, Social Planner
- **Intelligence:** Website Intel, Reviews, Platform Intel, SEO Audits, Predictive AI, Growth & Learning, Competitor Intel, Customer Intel
- **Workspace:** Collaboration, Export/Import, Webhooks, Landing Pages, Automations, Projects, Creator Profile, Help & Docs

## Design System

All styles in `client/src/index.css` (946 lines). Key classes:

| Class | Purpose |
|---|---|
| `.glass` | Dark glass card (bg rgba white 3%, border rgba white 7%) |
| `.glass-hover` | Glass with hover state |
| `.stat-card` | Metric display card |
| `.agent-pill` | Status badge (idle/running/done/error) |
| `.creative-card` | Image gallery card with overlay |
| `.command-bar` | AI input bar |
| `.progress-bar` | Progress indicator |
| `.empty-state` | Empty state container |
| `.prose-dark` | Dark markdown rendering |
| `.data-table` | Dark table styling |
| `.page-title` | H1 page heading |
| `.page-subtitle` | Subtitle text |
| `.mesh-bg` | Animated mesh background |
| `.platform-tag` | Social platform label |
| `.input-dark` | Dark form input |

Colors: `--color-primary: #7c3aed` (violet), `--color-accent: #06b6d4` (cyan), base `#09090b`

---

# 15. USER EXPERIENCE FLOWS

## Primary Flow: Create Campaign

```
1. User opens /ai-agents
2. Types: "Launch my protein powder for gym people on TikTok and Instagram"
3. Hits Enter or clicks Send button
4. Agent fires immediately — sub-agent cards animate (Strategy/Content/Video etc)
5. [~10-30 seconds with API key, ~2 seconds in mock mode]
6. Asset panel appears showing what was built
7. Auto-navigates to /campaigns/:id after 1.8 seconds
8. Campaign Workspace shows all 9 tabs populated:
   - Overview: impressions/clicks/conversions/revenue + AI strategy (auto-generated)
   - Content: TikTok post, Instagram post, LinkedIn post, Facebook ad
   - Images: (if image API configured)
   - Videos: TikTok script with hook + 45-second script + CTA
   - Email: 5-email launch sequence (day 0,2,4,6,7)
   - Landing Page: hero + features + CTA with LAUNCH20 code
   - Leads: (empty until leads come in)
   - Schedule: (empty until posts scheduled)
   - Analytics: (empty until campaigns run)
```

## Secondary Flow: Review & Launch

```
From Campaign Workspace:
1. Overview tab → "Regenerate" strategy → AI writes campaign plan
2. Content tab → copy posts → paste into social platforms
3. Videos tab → copy script → use for video creation
4. Email tab → see sequence → connect email list to send
5. Landing Page tab → "Visit" → share URL with audience
6. Click "Launch" button → campaign status: active
7. Use "Add with AI" → returns to /ai-agents with campaign context
```

## Auth Flow

```
Landing (/) → "Sign in" button
  → Google: /api/auth/google → Google consent → callback → dashboard
  → Email: /login → register/login form → POST /api/auth/email/* → dashboard
```

## Billing Flow

```
/pricing page → choose plan → "Start Trial" button
  → POST /api/stripe/create-checkout → Stripe hosted checkout
  → User pays → Stripe fires webhook → subscriptions table updated
  → User redirected to /pricing?success=true → toast shown
  → Plan features unlocked immediately
```

## Usage Limit Hit Flow

```
User generates 6th piece of content (free plan = 5/mo)
  → checkLimit() returns allowed:false
  → LimitExceededModal fires
  → Options: Upgrade plan or Buy credits
  → If upgrade: → /pricing
  → If credits: POST /api/stripe/create-credit-checkout
```

---

# 16. DEPLOYMENT — RAILWAY

## Live URL
`https://omniai-production-778d.up.railway.app`

## Build Process
```
Docker two-stage build:
Stage 1 (build):
  - pnpm install --frozen-lockfile
  - vite build → dist/public/ (React SPA)
  - node scripts/build-server.mjs → dist/index.js (Express server)

Stage 2 (production):
  - pnpm install --prod
  - COPY dist/ from build stage
  - COPY drizzle/ (migrations)
  - CMD ["node", "dist/index.js"]
```

## Server Startup Sequence
```
1. runMigrations() — creates/alters all 78 tables
2. app.get("/health") registered
3. securityHeaders middleware
4. Stripe routes (raw body parser for webhook)
5. JSON body parser
6. Credits + Landing routes
7. /api/uploads static file serving
8. Google + Email OAuth routes
9. Rate limiters on AI endpoints
10. /api/trpc tRPC middleware
11. serveStatic() — dist/public + SPA catch-all
12. server.listen(PORT, "0.0.0.0")
```

## Railway Configuration

**Service Settings:**
- Healthcheck Path: `/health`
- Build: Docker (auto-detected from Dockerfile)
- Start: `node dist/index.js`

**Required Variables in Railway UI:**
(See Section 10 — Environment Variables)

**Google OAuth Redirect URI (add in Google Console):**
`https://omniai-production-778d.up.railway.app/api/auth/google/callback`

**Stripe Webhook URL:**
`https://omniai-production-778d.up.railway.app/api/stripe/webhook`
Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`

## Getting Admin Access
```sql
-- After first login, run in Railway MySQL console:
SELECT openId FROM users ORDER BY id ASC LIMIT 1;
-- Copy value (looks like: google_123456789012345678901)
-- Set OWNER_OPEN_ID=google_123456789012345678901 in Railway variables
-- Redeploy → /admin unlocked
```

---

# 17. DATABASE MIGRATIONS

## How Migrations Run
- File: `server/_core/migrate.ts`
- Called at startup in `index.prod.ts` BEFORE the server listens
- Reads `drizzle/apply-all-migrations.sql`
- Splits on `CREATE TABLE` boundaries
- Runs each `CREATE TABLE IF NOT EXISTS` — idempotent
- Then runs explicit `ALTER TABLE ADD COLUMN` for:
  - `users` — passwordHash, stripeCustomerId, subscriptionPlan, trialUsed
  - `subscriptions` — currentPeriodStart, trialEndsAt, pastDueAt, canceledAt
  - `campaigns` — goal, totalBudget, totalSpend, totalLeads, totalRevenue
  - `campaign_assets` — entire table if missing
  - 16 tables — `campaignId` column (added retroactively)
- Uses `ER_DUP_FIELD (1060)` error code to skip already-existing columns

## Fresh Database Setup
No manual steps needed. Just set `DATABASE_URL` and deploy. Migrations auto-run.

## Adding a New Table
1. Add to `drizzle/schema.ts`
2. Add `CREATE TABLE IF NOT EXISTS` to `drizzle/apply-all-migrations.sql`
3. Add DB functions to `server/db.ts`
4. Add tRPC procedures to `server/routers.ts`

---

# 18. SECURITY

| Layer | Implementation |
|---|---|
| Auth | JWT HttpOnly cookie — cannot be accessed by JavaScript |
| Route protection | 135 tRPC `protectedProcedure` — all check `ctx.user` |
| Admin routes | `adminProcedure` — checks `ctx.user.role === "admin"` |
| SQL injection | Drizzle ORM parameterized queries throughout — no raw string SQL |
| Rate limiting | AI endpoints: 15-30 req/min. API general: 200 req/min |
| Security headers | `securityHeaders` middleware (helmet-style) on all routes |
| Stripe webhook | Raw body + `constructEvent` signature verification |
| CORS | Express default (same-origin for production) |
| File uploads | Sanitized paths, no path traversal (`..` stripped) |
| XSS | React renders, no `dangerouslySetInnerHTML` in core flows |

---

# 19. KNOWN ISSUES & STATUS

## Resolved (Fixed in Session History)
| Issue | Fix Applied |
|---|---|
| `/campaigns/:id` → 404 | Added to outer Wouter Switch |
| Tailwind v4 `@apply` build failure | Inlined all custom class properties |
| Sidebar icon+text overlap | Rewrote with plain HTML divs, no shadcn sidebar |
| Assets saved without `campaign_id` | Force-inject `activeCampaignId` in agent loop |
| `campaign_assets` missing from migration | Added to SQL + migrate.ts |
| `campaignId` column missing on live DB | Added 16 `ALTER TABLE ADD COLUMN` in migrate.ts |
| Workspace crashes when any query fails | `safe()` wrapper returns `[]` instead of throwing |
| No content without API key | Mock agent creates real DB records |
| Empty workspace for old campaigns | 10-minute backfill window + retroactive campaignId write |
| Strategy required manual click | Auto-triggers on workspace load via `useEffect` |

## Currently Known Limitations
| Issue | Impact | Workaround |
|---|---|---|
| Image generation requires external API | Creative Engine shows empty without `BUILT_IN_FORGE_API_URL` | Set to OpenAI endpoint |
| Social posting requires App Review | Meta/TikTok require platform approval for production | Use test accounts |
| Real video MP4 needs Runway/Luma/Kling key | Without key, gets static frames | Set at least one video API key |
| Email sending needs Resend key | Emails silently skipped | resend.com free tier |
| Music generation falls back to SFX library | No AI music without Suno/Mubert/Soundraw | Built-in library available |
| `deleteLandingPage` not wired in tRPC | Landing pages can't be deleted from UI | Delete via DB directly |

## System Health (as of last audit)
- TypeScript errors: **0**
- Tailwind build violations: **0**
- Schema/migration parity: **78/78 tables**
- Protected routes: **135**
- Test coverage: **31/31 automated checks passing**

---

# 20. RUNBOOK

## Start Local Development
```bash
# Clone repo
git clone https://github.com/disputestrike/OmniAI.git
cd OmniAI

# Install dependencies
pnpm install

# Copy env
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and JWT_SECRET

# Start dev server (Vite + Express together)
pnpm dev
```

## Run Full Test Suite
```bash
pnpm test:integration
# Or
npx tsx server/integration.test.ts
```
Tests: API key presence, DB connection, Stripe, ElevenLabs, HeyGen, social credentials, complete data flow.

## Deploy to Railway
```bash
git push origin main
# Railway auto-deploys on every push to main
# Monitor: Railway dashboard → OmniAI service → Deploy Logs
```

## Check What's Running
```bash
# Health check
curl https://omniai-production-778d.up.railway.app/health
# Expected: {"ok":true}
```

## Add a New AI Tool to the Agent
1. Add tool definition to `AGENT_TOOL_DEFS` array in `aiAgent.ts`
2. Add to `ANTHROPIC_AGENT_TOOLS` (auto-maps from definition)
3. Add executor function `runYourTool()` in `aiAgent.ts`
4. Add case to `executeTool()` switch statement
5. Add to `ASSET_TOOLS` set if it creates campaign assets
6. Add `ToolResult` type to the union in `aiAgent.ts`
7. Add type to `AgentToolResult` union in `AiAgents.tsx`
8. Add to `ASSET_CFG` in `AiAgents.tsx` for asset panel rendering

## Add a New Page
1. Create `client/src/pages/YourPage.tsx`
2. Import in `client/src/App.tsx`
3. Add `<Route path="/your-path" component={YourPage} />` to inner Switch (DashboardRouter)
4. Add `<Route path="/your-path" component={DashboardRouter} />` to outer Switch
5. Add to sidebar nav in `DashboardLayout.tsx` if needed
6. If dynamic route: add BOTH `/your-path` AND `/your-path/:id` to both switches

## Reset a User's Usage (Admin)
```sql
UPDATE user_monthly_usage 
SET aiGenerationsUsed = 0, aiImagesUsed = 0, videoScriptsUsed = 0 
WHERE userId = ?;
```

## Find Assets for a Campaign
```sql
-- All content for campaign 5:
SELECT id, type, platform, title, status FROM contents WHERE campaignId = 5;
SELECT id, platform, script FROM video_ads WHERE campaignId = 5;
SELECT id, subject, status FROM email_campaigns WHERE campaignId = 5;
SELECT id, title, slug, status FROM landing_pages WHERE campaignId = 5;
```

## Manually Backfill campaignId on Orphaned Assets
```sql
-- Find assets created at same time as campaign (within 10 min)
UPDATE contents 
SET campaignId = 5 
WHERE userId = 1 
  AND campaignId IS NULL 
  AND createdAt BETWEEN '2026-03-19 10:00:00' AND '2026-03-19 10:10:00';
```

---

*Document generated: March 2026. Maintained in `/MASTER_DOCUMENT.md` at root of repo.*
*For questions or corrections: open an issue at github.com/disputestrike/OmniAI*
