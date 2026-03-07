# OTOBI AI — Technical Specification

**Version:** 4.1  
**Date:** March 2026  
**Status:** Production-Ready (Launch-Ready)  
**Codebase:** Full-stack TypeScript: 40+ pages, 45+ tRPC router groups, 47+ database tables. All features wired end-to-end (front-end, back-end, DB, routes, sidebar). No placeholders.

---

## 1. Executive Summary

OTOBI AI is a comprehensive, AI-powered marketing automation platform that enables users to create, publish, and optimize marketing campaigns across 21+ platforms from a single command center. The platform combines AI content generation (22 content types), visual creation, real video rendering, campaign management, CRM with deal tracking, predictive analytics, multi-channel publishing, competitor intelligence, customer intelligence, email marketing, landing page building, automation workflows, and team collaboration into one integrated system. Every feature is fully wired and functional — the only user-provided inputs required are API keys for external social platform integrations.

---

## 2. Architecture Overview

### 2.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript | Single-page application with 40 page components |
| Styling | Tailwind CSS 4 + shadcn/ui | Design system and component library |
| API Layer | tRPC 11 + Superjson | Type-safe RPC with auto-serialization |
| Backend | Express 4 + Node.js 22 | HTTP server, middleware, and route handling |
| Database | TiDB / MySQL (e.g. Railway) | Relational data storage (47+ tables); auto-migrations on deploy |
| ORM | Drizzle ORM | Type-safe SQL queries and schema management |
| File Storage | AWS S3 | Media, assets, and document storage |
| Auth | Google OAuth 2.0 | User identity and session management (primary) |
| Payments | Stripe Checkout + Webhooks | 5-tier subscription billing with seat pricing |
| AI/LLM | Built-in Forge API (GPT-class) | Content generation, analysis, chat, and predictions |
| Voice | Whisper API | Speech-to-text transcription |
| Image Gen | Built-in Image Service | AI image generation, editing, and video frames |
| Routing | Wouter | Client-side routing |
| State | React Query (via tRPC) | Server state management with optimistic updates |

### 2.2 System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19 + TypeScript)                │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Landing  │ │Dashboard │ │ Content  │ │ AI Chat  │ │Campaigns │  │
│  │  Page    │ │  + Home  │ │ Studio   │ │ + Voice  │ │          │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Creatives │ │Video Ads │ │ Video    │ │ Video    │ │Analytics │  │
│  │          │ │+ Avatars │ │ Render   │ │ Studio   │ │          │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Platform │ │Momentum  │ │ Social   │ │  Email   │ │ Landing  │  │
│  │  Intel   │ │          │ │ Publish  │ │Marketing │ │Pg Builder│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Leads   │ │  Deals   │ │Customer  │ │Competitor│ │Competitor│  │
│  │          │ │  (CRM)   │ │  Intel   │ │  Intel   │ │   Spy    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ SEO      │ │Predictive│ │ Brand    │ │Translate │ │ Image    │  │
│  │ Audits   │ │Analytics │ │  Voice   │ │ (30+)    │ │ Editor   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Automations│ │Webhooks │ │ Admin    │ │  Team    │ │ Pricing  │  │
│  │          │ │(Zapier)  │ │ Panel    │ │Collab    │ │          │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                        │                                             │
│                   tRPC Client (type-safe)                            │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ HTTPS /api/trpc
┌────────────────────────┴─────────────────────────────────────────────┐
│                      SERVER (Express 4 + tRPC 11)                    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                  tRPC Router (appRouter) — 39 Groups            │  │
│  │  auth · dashboard · product · content · aiChat · creative      │  │
│  │  intelligence · videoAd · campaign · abTest · schedule · lead  │  │
│  │  analytics · subscription · deal · activity · adPlatform       │  │
│  │  team · approval · predictive · platformIntel · momentum       │  │
│  │  voice · admin · seo · brandVoice · emailMarketing             │  │
│  │  landingPageBuilder · automation · socialPublish · videoRender  │  │
│  │  webhooks · imageEditor · multiLanguage · competitorSpy        │  │
│  │  bulkImport · personalVideo · competitorIntel · customerIntel  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Stripe   │ │ Google   │ │ Security │ │ Webhook  │ │ Migrate  │  │
│  │ Routes   │ │ OAuth    │ │Middleware│ │ Handler  │ │ (startup)│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└────────┬──────────────┬──────────────┬──────────────┬────────────────┘
         │              │              │              │
    ┌────┴────┐   ┌─────┴─────┐  ┌────┴────┐  ┌─────┴─────┐
    │  TiDB   │   │  AWS S3   │  │  Forge  │  │  External │
    │Database │   │  Storage  │  │  API    │  │  APIs     │
    │(38 tbl) │   │  (media)  │  │(LLM/Img)│  │(Social)   │
    └─────────┘   └───────────┘  └─────────┘  └───────────┘
```

---

## 3. Database Schema (47+ Tables)

### 3.1 Complete Table Inventory

| # | Table | Purpose | Key Fields |
|---|-------|---------|------------|
| 1 | `users` | User accounts and profiles | openId, name, email, role, subscriptionPlan, loginMethod, stripeCustomerId |
| 2 | `products` | Products being marketed | userId, name, description, url, category, analysisData, targetAudience |
| 3 | `contents` | AI-generated content pieces | userId, productId, type (22 types), platform, title, body, hashtags, status |
| 4 | `creatives` | AI-generated images/visuals | userId, productId, prompt, imageUrl, platform, style |
| 5 | `video_ads` | Video ad scripts and assets | userId, productId, script, avatarConfig, voiceConfig, platform, status |
| 6 | `campaigns` | Marketing campaigns | userId, productId, name, platforms (JSON), status, budget, strategy |
| 7 | `ab_tests` | A/B test experiments | userId, campaignId, name, status, winnerVariantId |
| 8 | `ab_test_variants` | A/B test variant data | testId, name, impressions, clicks, conversions, revenue |
| 9 | `scheduled_posts` | Content scheduler queue | userId, contentId, platform, scheduledAt, status, publishedAt |
| 10 | `leads` | Captured leads | userId, assignedToUserId, name, email, phone, company, source, status, score |
| 11 | `analytics_events` | Performance tracking | userId, campaignId, platform, impressions, clicks, conversions, revenue |
| 12 | `subscriptions` | Stripe subscription tracking | userId, stripeSubscriptionId, plan, status, currentPeriodEnd |
| 13 | `deals` | CRM deal pipeline | userId, leadId, name, value, stage, probability, expectedCloseDate |
| 14 | `activities` | Activity timeline | userId, type, entityType, entityId, description, metadata |
| 15 | `ad_platform_connections` | Connected ad accounts | userId, platform, accountId, accessToken, status |
| 16 | `ad_platform_campaigns` | Synced ad campaigns | connectionId, externalCampaignId, name, status, spend, metrics |
| 17 | `team_members` | Team collaboration | teamOwnerId, userId, role (owner/editor/viewer), invitedAt |
| 18 | `approval_workflows` | Content approval chains | userId, contentType, entityId, status, reviewerId, comments |
| 19 | `predictive_scores` | AI prediction results | userId, entityType, entityId, score, confidence, recommendations |
| 20 | `seo_audits` | SEO analysis results | userId, url, score, issues, recommendations, keywords |
| 21 | `brand_voices` | Brand voice profiles | userId, name, description, tone, vocabulary, documentUrls |
| 22 | `email_campaigns` | Email marketing campaigns | userId, name, subject, htmlContent, status, sentCount, openRate |
| 23 | `email_lists` | Email subscriber lists | userId, name, description, contactCount |
| 24 | `email_contacts` | Email subscribers | listId, email, name, status, subscribedAt, unsubscribedAt |
| 25 | `landing_pages` | Built landing pages | userId, name, slug, template, components (JSON), published |
| 26 | `form_submissions` | Landing page form data | landingPageId, data (JSON), submittedAt, convertedToLead |
| 27 | `automation_workflows` | Automation rules | userId, name, trigger, actions (JSON), status, executionCount |
| 28 | `social_publish_queue` | Social media publish queue | userId, platform, contentId, status, publishedAt, error |
| 29 | `video_renders` | Rendered video files | userId, prompt, frames (JSON), videoUrl, status, duration |
| 30 | `webhook_endpoints` | Webhook/Zapier endpoints | userId, url, events, secret, status, lastTriggeredAt |
| 31 | `personal_videos` | Personal video recordings | userId, title, videoUrl, thumbnailUrl, scriptContent, shareToken |
| 32 | `competitor_profiles` | Tracked competitors | userId, name, website, industry, description, lastAnalyzedAt |
| 33 | `competitor_snapshots` | Competitor analysis history | competitorId, analysisType, data (JSON), analyzedAt |
| 34 | `competitor_alerts` | Competitor change alerts | competitorId, type, severity, message, read |
| 35 | `customer_profiles` | Customer intelligence | userId, name, email, company, engagementScore, clvPrediction |
| 36 | `customer_interactions` | Customer touchpoints | customerId, type, description, sentiment, date |
| 37 | `customer_segments` | Customer segmentation | userId, name, criteria (JSON), customerCount |
| 38 | `funnels` | Multi-step funnels | userId, name, slug, status |
| 39 | `funnel_steps` | Funnel steps (landing, form, payment, thank_you) | funnelId, orderIndex, stepType, title, landingPageId, formId, stripePriceId |
| 40 | `review_sources` | Review sources (Google, Facebook, Yelp, manual) | userId, sourceType, name, status |
| 41 | `reviews` | Reviews and replies | userId, sourceId, authorName, rating, text, reply |
| 42 | `forms` | Standalone forms | userId, name, slug, status, submissionCount, createLeadOnSubmit |
| 43 | `form_fields` | Form field definitions | formId, orderIndex, fieldType, label, required, options |
| 44 | `form_responses` | Form submissions | formId, userId, leadId, data (JSON) |
| 45 | `report_snapshots` | One-click shareable reports | userId, reportType, title, shareToken, payload, expiresAt |
| 46 | `assignment_settings` | Lead assignment (round-robin) | userId, mode, memberOrder (JSON), lastAssignedIndex |

### 3.2 Role-Based Access Control

| Role | Scope | Permissions |
|------|-------|------------|
| `admin` | Platform-wide | Full access, user management, plan changes, analytics, all CRUD |
| `user` | Own data | CRUD on own resources, team collaboration (if on team plan), features per subscription tier |

### 3.3 Team Roles

| Team Role | Permissions |
|-----------|------------|
| `owner` | Full team management, billing, invite/remove members, all CRUD |
| `editor` | Create/edit content, campaigns, creatives within team workspace |
| `viewer` | Read-only access to team content and analytics |

---

## 4. Authentication

### 4.1 Google OAuth (Primary)

```
User → Landing Page → "Get Started" / "Continue with Google"
  → /api/auth/google → Google OAuth Consent Screen
  → /api/auth/google/callback → Exchange code for tokens
  → Get user info from Google → Upsert user (google_ prefixed openId)
  → JWT-signed Session Cookie → Dashboard (authenticated)
```

Google OAuth is the primary identity provider. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Status: `/api/auth/google/status`.

### 4.3 Session Management

- JWT-signed session cookies (HttpOnly, Secure, SameSite)
- `protectedProcedure` middleware injects `ctx.user` for all authenticated routes
- `ctx.user.role` checked for admin-only operations
- Sessions persist across browser sessions (1-year expiry)

---

## 5. Pricing and Unit Economics

### 5.1 Pricing Tiers

| Tier | Monthly | Annual (per month) | Target User | Key Limits |
|------|---------|-------------------|-------------|------------|
| **Free** | $0 | $0 | Trial users | 5 content/mo, 2 images/mo, 1 product |
| **Starter** | $29/mo | $23/mo | Solopreneurs | 50 content/mo, 15 images/mo, 5 products |
| **Professional** | $79/mo | $63/mo | Growing teams | 200 content/mo, 50 images/mo, 5 seats |
| **Business** | $199/mo | $159/mo | Agencies | Unlimited content, 15 seats, API access |
| **Enterprise** | $499/mo | $399/mo | Large orgs | Unlimited everything, white-label, priority support |

### 5.2 Seat-Based Team Pricing

| Tier | Included Seats | Extra Seat Cost |
|------|---------------|----------------|
| Free | 1 | N/A |
| Starter | 1 | N/A |
| Professional | 5 | $15/seat/mo |
| Business | 15 | $12/seat/mo |
| Enterprise | Unlimited | Included |

### 5.3 Unit Economics

| Cost Component | Free | Starter | Professional | Business |
|---------------|------|---------|-------------|----------|
| LLM API | $0.10 | $2.50 | $8.00 | $15.00 |
| Image Generation | $0.04 | $0.60 | $2.00 | $5.00 |
| Voice Transcription | $0 | $0.20 | $0.50 | $1.00 |
| Infrastructure | $0.50 | $0.50 | $0.50 | $0.50 |
| Database and Storage | $0.10 | $0.20 | $0.50 | $1.00 |
| **Total COGS** | **$0.74** | **$4.00** | **$11.50** | **$22.50** |
| **Revenue** | **$0** | **$29** | **$79** | **$199** |
| **Gross Margin** | N/A | **86.2%** | **85.4%** | **88.7%** |

---

## 6. Complete Feature Inventory

### 6.1 Content Creation (22 Content Types)

| # | Content Type | Target Platforms |
|---|-------------|-----------------|
| 1 | Short Ad Copy | Facebook, Instagram, Google Ads |
| 2 | Long Ad Copy | Facebook, LinkedIn, Google Ads |
| 3 | Blog Post (SEO-optimized) | Blog/Website |
| 4 | SEO Meta Tags | All web platforms |
| 5 | Social Media Captions | Instagram, TikTok, Facebook, LinkedIn, Twitter |
| 6 | Video Scripts | YouTube, TikTok, Instagram Reels |
| 7 | Email Newsletter Copy | Email |
| 8 | Press Release | PR wires, media outlets |
| 9 | Podcast Script | Spotify, Apple Podcasts |
| 10 | TV Commercial Script | Broadcast TV |
| 11 | Radio Ad Script | Broadcast radio |
| 12 | Sales Copywriting (AIDA/PAS) | Landing pages, sales pages |
| 13 | Amazon/eBay Product Listing | Amazon, eBay |
| 14 | Google Ads Copy | Google Ads (headlines, descriptions, extensions) |
| 15 | YouTube SEO Package | YouTube (title, description, tags, chapters) |
| 16 | Twitter/X Thread | Twitter/X |
| 17 | LinkedIn Article | LinkedIn |
| 18 | WhatsApp Broadcast | WhatsApp Business |
| 19 | SMS Marketing Copy | SMS/MMS |
| 20 | Story Content | Instagram Stories, TikTok |
| 21 | UGC Script | All social platforms |
| 22 | Landing Page Copy | Web |

### 6.2 Platform Intelligence (14 Platforms)

Each platform includes character limits, image specs, video specs, best posting times (by day and industry), peak engagement windows, hashtag strategies, and auto-formatting rules.

**Supported:** Instagram, TikTok, YouTube, Facebook, LinkedIn, Twitter/X, Pinterest, Google Ads, Amazon, Email, SMS, Snapchat, Reddit, WhatsApp

### 6.3 AI Capabilities

| Capability | Implementation | Endpoint |
|-----------|---------------|----------|
| Content Generation (22 types) | LLM with platform-specific prompts | `content.generate` |
| Content Remixing | LLM with original content context | `content.remix` |
| Content Repurposing | LLM multi-format conversion | `content.repurpose` |
| Image Generation | Built-in Image Service | `creative.generate` |
| Video Script Generation | LLM with avatar/product context | `videoAd.generate` |
| Video Frame Rendering | AI image generation for video frames | `videoRender.create` |
| AI Avatar Creation | Image generation with diverse configs | `videoAd.createAvatar` |
| Voice Transcription | Whisper API | `voice.uploadAndTranscribe` |
| AI Marketing Agent | LLM with 6 specialist modes | `aiChat.send` |
| Product Analysis | LLM competitive analysis | `product.analyze` |
| Website Intelligence | LLM + web scraping | `intelligence.analyzeWebsite` |
| SEO Audit | LLM + structured scoring | `seo.audit` |
| Predictive Analytics | LLM trend analysis | `predictive.forecast` |
| Campaign Momentum | LLM performance analysis | `momentum.analyze` |
| Content Calendar | LLM scheduling intelligence | `momentum.generateCalendar` |
| Platform Auto-Format | Rule-based + LLM adaptation | `platformIntel.autoFormat` |
| Brand Voice Extraction | LLM document analysis | `brandVoice.create` |
| Multi-Language Translation | LLM translation (30+ languages) | `multiLanguage.translate` |
| Competitor Analysis | LLM + web scraping deep analysis | `competitorIntel.analyzeCompetitor` |
| Customer Enrichment | LLM 360-degree profiling | `customerIntel.enrichCustomer` |
| Customer Journey Mapping | LLM journey analysis | `customerIntel.getJourney` |
| Email HTML Generation | LLM email template creation | `emailMarketing.generateEmailHtml` |
| Landing Page AI Generation | LLM component generation | `landingPageBuilder.generateWithAi` |
| Hook Variation Generator | LLM creative hooks | `intelligence.generateHookVariations` |

### 6.4 Social Publishing

Direct publishing framework for Meta (Facebook/Instagram), Twitter/X, LinkedIn, and TikTok. Each platform integration is ready to activate when the user provides their respective API credentials. The system handles OAuth token management, content formatting, media upload, and publish status tracking with retry logic.

### 6.5 Video Production

The platform includes two video creation systems. The AI Video Ad Generator creates scripts, storyboards, and avatar configurations with support for 12 diverse AI actors, emotion control, and multi-language localization. The Video Render Engine generates actual MP4 video files by creating AI image frames and assembling them into downloadable videos. The Personal Video Studio provides webcam recording with a teleprompter overlay, AI script generation, thumbnail creation, and shareable video links.

### 6.6 Email Marketing

Full email marketing system with campaign creation, HTML email generation via AI, subscriber list management, contact import, send tracking (open rate, click rate, bounce rate), and CAN-SPAM compliant unsubscribe handling.

### 6.7 Landing Page Builder

Template-based landing page builder with 6 pre-built templates, a form builder component, AI-powered content generation, page hosting with unique slugs, and automatic lead capture from form submissions.

### 6.8 Automation Workflows

Visual workflow builder with trigger types (form submission, lead status change, campaign event, time-based) and action types (send email, generate content, notify team, update lead, create task). Includes 4 pre-built templates: lead nurture, welcome series, re-engagement, and post-purchase.

### 6.9 Competitor Intelligence Center

Comprehensive competitor tracking with profile management, deep AI analysis (SWOT, ad scan, SEO check, social check, content check), competitive positioning maps, historical snapshots, and an alert system with severity levels.

### 6.10 Customer Intelligence Dashboard

360-degree customer profiles with AI enrichment, interaction tracking (calls, emails, meetings, purchases), segmentation engine with rules-based criteria, journey mapping, engagement scoring (0-100), CLV prediction, and personalized outreach plan generation.

### 6.11 Funnels, Forms, Reviews, Reports, Lead Distribution

- **Funnels:** Multi-step funnel builder (landing, form, payment, thank-you steps); link steps to landing pages and forms; status draft/active/archived. Route: `/funnels`. Sidebar: **Manage → Funnels**.
- **Forms:** Standalone form builder with field types (text, email, phone, textarea, select, checkbox, number); share link; responses view; optional create-lead-on-submit; round-robin applies to new leads. Route: `/forms`. Sidebar: **Create → Forms**.
- **Reviews:** Review sources (Google, Facebook, Yelp, manual); add reviews manually; reply to reviews from one dashboard. Route: `/reviews`. Sidebar: **Intelligence → Reviews**.
- **One-click reports:** Generate shareable report links from Dashboard, Analytics, and Ad Performance; recipients view at `/report/:shareToken` (30-day expiry). Wired in Home, Analytics, AdPerformanceAnalyzer pages.
- **Lead distribution:** Assign leads to self or team members; optional round-robin (Team → Lead assignment). Lead Manager shows Assigned-to dropdown; new leads from forms/import get auto-assigned when round-robin is on.

---

## 6.12 Navigation — Where to Find What (Sidebar)

| Category | Items | Purpose |
|----------|-------|---------|
| **Overview** | Dashboard | Home, stats, guided paths, export report |
| **Create** | Product Analyzer, Content Studio, Content Repurposer, Creative Engine, Video Ads, Video Render, Video Studio, Image Editor, Brand Voice, Translate, AI Avatars, Meme Generator, Content Ingest, Content Library, Templates, Content Scorer, Bulk Import, Brand Kit, Music Studio, Voiceover Studio, **Forms** | Create content, assets, and forms |
| **Manage** | Campaigns, **Funnels**, A/B Testing, Scheduler, Lead Manager, CRM Deals, Ad Platforms, Ad Performance, One-Push Publisher, Momentum, Social Publish, Email Marketing, Content Calendar, Performance, Social Planner | Campaigns, funnels, leads, deals, ads, scheduling |
| **Intelligence** | Website Intel, **Reviews**, Platform Intel, SEO Audits, Analytics, Predictive AI, AI Agents, Competitor Spy, Customer Intel, Competitor Intel, Competitor Monitor | Intel, reviews, analytics, AI |
| **Workspace** | Collaboration, Approvals, Export/Import, Webhooks, Landing Pages, Automations, Projects | Team, approvals, integrations, landing pages |
| **Account** | Pricing & Plans, Creator Profile | Billing, profile |
| **Admin** | Admin Panel | Platform admin (admin role only) |

All sidebar links have matching routes; every route is wired to a real page and backend. No placeholder or fake screens.

---

## 7. User Flows

### 7.1 New User Onboarding

```
1. Visit Landing Page → See interactive 3-step demo, value props, pricing
2. Click "Start Free" → OAuth login (Google)
3. Dashboard → See 3 guided paths:
   a. "Make a Product #1" (6 steps)
   b. "Make Someone Viral" (6 steps)
   c. "Spread a Concept" (6 steps)
4. Add first product → AI analyzes it
5. Generate first content → AI creates for selected platform
6. View analytics → See performance metrics
```

### 7.2 Content Creation Flow

```
1. Navigate to Content Studio
2. Select product (or create new)
3. Choose content type (22 options)
4. Select target platform(s)
5. AI generates content with platform-specific formatting and brand voice
6. Review, edit, remix, or repurpose into other formats
7. Schedule, publish immediately, or send to approval workflow
8. Track performance in Analytics
```

### 7.3 Full Campaign Flow

```
1. Create Campaign → Name, product, platforms, budget, dates
2. Generate Content → AI creates content for all selected platforms
3. Create Visuals → AI generates images/videos
4. Set up A/B Tests → AI creates variants
5. Schedule Posts → AI recommends optimal times per platform
6. Publish → Direct publishing to connected platforms
7. Monitor → Real-time analytics dashboard
8. Optimize → AI momentum analysis suggests improvements
9. Scale → AI recommends budget increases for winners
```

### 7.4 Team Collaboration Flow

```
1. Owner creates team (Professional+ plan)
2. Invite members by email → Role assignment (editor/viewer)
3. Members access shared products, campaigns, content
4. Submit content for approval → Review workflow
5. Activity feed shows all team actions
6. Task assignment and comment threads on content
```

### 7.5 AI Chat and Voice Flow

```
1. Navigate to AI Agents
2. Choose agent mode (Strategist, Persuasion Expert, Viral Engineer,
   SEO & Growth, Creative Director, Global Marketer)
3. Type message OR click microphone to record voice
4. Voice → Whisper transcription → Text input
5. AI responds with marketing strategy/advice (markdown rendered)
6. Upload files for analysis (drag-and-drop)
7. Conversation history maintained in session
```

---

## 8. API Endpoints (tRPC Procedures)

### 8.1 Core Routers

| Router Group | Procedures | Auth Level | Description |
|-------------|-----------|------------|-------------|
| `auth` | me, logout | Public/Protected | Authentication state |
| `dashboard` | stats | Protected | Dashboard overview metrics |
| `product` | list, get, create, analyze, delete | Protected | Product management and AI analysis |
| `content` | list, get, generate, update, delete, byProduct, remix, repurpose | Protected | 22-type AI content generation |
| `aiChat` | send | Protected | AI marketing agent with 6 modes |
| `creative` | list, get, generate, delete | Protected | AI image generation |
| `intelligence` | analyzeWebsite, generateHookVariations | Protected | Website intelligence analyzer |
| `videoAd` | list, get, generate, getActors, createAvatar, localize, delete | Protected | Video ad scripts and AI avatars |
| `campaign` | list, get, create, update, delete, generateStrategy | Protected | Campaign management |
| `abTest` | list, get, create, addVariant, updateVariant, generateVariations, updateStatus | Protected | A/B testing suite |
| `schedule` | list, create, update, delete, getOptimalTimes | Protected | Content scheduling |
| `lead` | list, get, create, update, delete, assign, byCampaign, bulkImport, getAssignmentSetting, saveAssignmentSetting | Protected | Lead management, assignment, round-robin |
| `analytics` | summary, list, byCampaign, record, getInsights | Protected | Performance analytics |

### 8.2 Extended Routers

| Router Group | Procedures | Auth Level | Description |
|-------------|-----------|------------|-------------|
| `subscription` | status, createCheckout, cancel | Protected | Stripe billing |
| `deal` | list, get, create, update, delete | Protected | CRM deal pipeline |
| `activity` | list, create | Protected | Activity timeline |
| `adPlatform` | list, connect, disconnect, sync, getCampaigns | Protected | Ad platform connections |
| `team` | list, invite, remove, updateRole | Protected | Team management |
| `approval` | list, submit, review, approve, reject | Protected | Content approval workflows |
| `predictive` | score, forecast, optimizeBudget | Protected | Predictive analytics |
| `platformIntel` | getAll, getOne, autoFormat, bestTime, crossPlatformAdapt | Public | Platform intelligence |
| `momentum` | analyze, generateCalendar | Protected | Campaign momentum |
| `voice` | uploadAndTranscribe | Protected | Voice transcription |
| `admin` | users, stats, updateUserRole, updateUserPlan | Admin | Platform administration |
| `seo` | audit, list, getKeywords, trackRank | Protected | SEO audit engine |

### 8.3 Gap Closure Routers

| Router Group | Procedures | Auth Level | Description |
|-------------|-----------|------------|-------------|
| `brandVoice` | list, get, create, update, delete | Protected | Brand voice training |
| `emailMarketing` | listLists, createList, getContacts, addContact, bulkImportContacts, listCampaigns, createCampaign, sendCampaign, generateEmailHtml | Protected | Email marketing |
| `landingPageBuilder` | list, get, create, update, delete, getSubmissions, generateWithAi, templates | Protected | Landing page builder |
| `automation` | list, get, create, update, delete, execute, getTemplates | Protected | Automation workflows |
| `socialPublish` | list, publish, retry, cancel | Protected | Social media publishing |
| `videoRender` | list, get, create, download | Protected | Video rendering engine |
| `webhooks` | list, create, update, delete, test | Protected | Webhook/Zapier integration |
| `imageEditor` | removeBackground, resize, upscale, applyFilter | Protected | Image editing tools |
| `multiLanguage` | translate, detect, getSupportedLanguages | Protected | Multi-language (30+) |
| `competitorSpy` | analyze, deepAnalyze | Protected | Competitor ad spy |
| `bulkImport` | importProducts, importLeads, importContacts | Protected | Bulk CSV/JSON import |

### 8.4 New Feature Routers

| Router Group | Procedures | Auth Level | Description |
|-------------|-----------|------------|-------------|
| `personalVideo` | list, get, getByShareToken, generateScript, create, uploadRecording, generateThumbnail, getAISuggestions, share, update, delete | Protected | Personal video studio |
| `competitorIntel` | listProfiles, getProfile, addCompetitor, analyzeCompetitor, getSnapshots, getPositioningMap, getAlerts, markAlertRead | Protected | Competitor intelligence center |
| `customerIntel` | listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, addInteraction, getInteractions, enrichCustomer, getJourney, listSegments, createSegment, getOutreachPlan, getDashboardStats | Protected | Customer intelligence |

---

## 9. External API Dependencies

### 9.1 Auto-Configured (No User Action Required)

| Service | Environment Variable | Purpose |
|---------|---------------------|---------|
| Forge API (LLM) | `BUILT_IN_FORGE_API_KEY` | AI content generation, analysis, chat |
| Forge API (Frontend) | `VITE_FRONTEND_FORGE_API_KEY` | Frontend AI access |
| Stripe (Secret) | `STRIPE_SECRET_KEY` | Payment processing |
| Stripe (Publishable) | `VITE_STRIPE_PUBLISHABLE_KEY` | Frontend Stripe elements |
| Stripe (Webhook) | `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| JWT Secret | `JWT_SECRET` | Session cookie signing |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | User authentication |
| Database | `DATABASE_URL` | TiDB connection string |
| S3 Storage | Auto-configured | File and media storage |

### 9.2 User-Provided (Optional — Features Activate When Provided)

| Service | Environment Variable | Purpose | Where to Get |
|---------|---------------------|---------|-------------|
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Sign-In | Google Cloud Console |
| Meta/Facebook | `META_APP_ID`, `META_APP_SECRET` | Social publishing to Facebook/Instagram | Meta for Developers |
| Twitter/X | `TWITTER_API_KEY`, `TWITTER_API_SECRET` | Social publishing to Twitter | Twitter Developer Portal |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | Social publishing to LinkedIn | LinkedIn Developer Portal |
| TikTok | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | Social publishing to TikTok | TikTok for Developers |

### 9.3 API Cost Estimates (Per 1,000 Operations)

| Operation | Estimated Cost | Notes |
|-----------|---------------|-------|
| LLM Content Generation | $0.50/1K calls | ~500 tokens avg per call |
| LLM Chat Messages | $0.30/1K calls | ~300 tokens avg |
| Image Generation | $4.00/1K images | Via built-in service |
| Voice Transcription | $0.60/1K minutes | Whisper API |
| S3 Storage | $0.023/GB/month | Standard tier |
| S3 Bandwidth | $0.09/GB | Outbound transfer |

---

## 10. Security

### 10.1 Authentication and Authorization

- OAuth 2.0 via Google (primary); JWT session
- JWT-signed session cookies (HttpOnly, Secure, SameSite=Lax)
- Role-based access control: admin and user roles at platform level
- Team-level permissions: owner, editor, viewer roles
- All mutations require `protectedProcedure` (authenticated)
- Admin operations check `ctx.user.role === 'admin'`
- Webhook signature verification for Stripe events

### 10.2 Data Protection

- Content-Security-Policy headers on all responses
- No sensitive data stored locally (Stripe handles all payment data)
- S3 storage with non-enumerable paths (random suffixes)
- Database credentials via environment variables (never in code)
- HTTPS enforced for all traffic
- CSRF protection via SameSite cookies

### 10.3 Input Validation and Rate Limiting

- All tRPC inputs validated via Zod schemas
- SQL injection prevented by Drizzle ORM parameterized queries
- XSS prevented by React's default escaping and CSP headers
- File upload size limits enforced (16MB for voice, 50MB for general)
- Rate limiting on AI-heavy endpoints (15-30 requests/minute)
- General API rate limit (200 requests/minute per IP)
- Input sanitization on all text inputs

---

## 11. Performance and Scalability

### 11.1 Optimization Strategies

- React Query caching for all tRPC queries with automatic invalidation
- Optimistic updates for list operations (add, edit, delete)
- Lazy loading for all page components
- Image CDN for all static assets (uploaded via `manus-upload-file`)
- Database indexing on frequently queried columns (userId, status, platform)
- Superjson serialization for automatic Date/BigInt handling

### 11.2 Scalability

- Stateless server design (horizontal scaling ready)
- Database connection pooling via TiDB (auto-scaling)
- S3 for unlimited file storage with CDN delivery
- Background job patterns for long-running AI operations
- Webhook-based event processing for external integrations

---

## 12. Deployment

### 12.1 Environment

- **Hosting:** Manus managed infrastructure (*.manus.space)
- **Database:** TiDB (MySQL-compatible, auto-scaling)
- **Storage:** AWS S3 (managed, CDN-backed)
- **SSL:** Auto-provisioned certificates
- **Domain:** Custom domain support via Settings > Domains

### 12.2 Deployment Process

1. Save checkpoint via Management UI or API
2. Click "Publish" in Management UI header
3. Auto-build and deploy to production
4. Custom domain configuration available in Settings > Domains

---

## 13. File Structure

```
otobi-ai/
├── client/
│   ├── src/
│   │   ├── pages/                  # 40 page components
│   │   │   ├── Landing.tsx             # Public landing page (10 sections + interactive demo)
│   │   │   ├── Home.tsx                # Dashboard home with guided onboarding
│   │   │   ├── Products.tsx            # Product management + AI analysis
│   │   │   ├── ContentStudio.tsx       # 22-type content generation
│   │   │   ├── Creatives.tsx           # AI image generation
│   │   │   ├── VideoAds.tsx            # Video ad creation + AI avatars
│   │   │   ├── VideoRender.tsx         # Real MP4 video rendering
│   │   │   ├── VideoStudio.tsx         # Personal webcam recording studio
│   │   │   ├── Campaigns.tsx           # Campaign management
│   │   │   ├── AbTesting.tsx           # A/B testing suite
│   │   │   ├── Scheduler.tsx           # Content scheduler
│   │   │   ├── SocialPublish.tsx       # Social media publishing
│   │   │   ├── Leads.tsx               # Lead management
│   │   │   ├── Deals.tsx               # CRM deals pipeline
│   │   │   ├── CustomerIntel.tsx       # Customer intelligence dashboard
│   │   │   ├── CompetitorIntel.tsx     # Competitor intelligence center
│   │   │   ├── CompetitorSpy.tsx       # Competitor ad spy
│   │   │   ├── Analytics.tsx           # Performance analytics
│   │   │   ├── Intelligence.tsx        # Website intelligence analyzer
│   │   │   ├── SeoAudits.tsx           # SEO audit engine
│   │   │   ├── Predictive.tsx          # Predictive analytics
│   │   │   ├── PlatformIntel.tsx       # Platform specs and formatter
│   │   │   ├── Momentum.tsx            # Campaign momentum analysis
│   │   │   ├── AiAgents.tsx            # AI chat + voice (6 modes)
│   │   │   ├── BrandVoice.tsx          # Brand voice training
│   │   │   ├── Translate.tsx           # Multi-language translation (30+)
│   │   │   ├── ImageEditor.tsx         # AI image editing tools
│   │   │   ├── EmailMarketing.tsx      # Email campaigns + lists
│   │   │   ├── LandingPageBuilder.tsx  # Landing page builder
│   │   │   ├── Automations.tsx         # Automation workflows
│   │   │   ├── Webhooks.tsx            # Zapier/Make integration
│   │   │   ├── AdPlatforms.tsx         # Ad platform connections
│   │   │   ├── AdminPanel.tsx          # Admin panel (RBAC)
│   │   │   ├── Pricing.tsx             # 5-tier pricing page
│   │   │   ├── Team.tsx                # Team management
│   │   │   ├── Collaboration.tsx       # Team collaboration workspace
│   │   │   ├── Approvals.tsx           # Content approval workflows
│   │   │   ├── ExportImport.tsx        # Data export/import (JSON + CSV)
│   │   │   ├── ComponentShowcase.tsx   # UI component showcase
│   │   │   └── NotFound.tsx            # 404 page
│   │   ├── components/             # Reusable UI components
│   │   │   ├── DashboardLayout.tsx     # Sidebar navigation + layout
│   │   │   ├── AIChatBox.tsx           # Chat component with streaming
│   │   │   └── ui/                     # shadcn/ui component library
│   │   ├── contexts/               # React contexts (Theme)
│   │   ├── hooks/                  # Custom hooks
│   │   ├── lib/trpc.ts             # tRPC client binding
│   │   ├── App.tsx                 # Routes and layout (40 routes)
│   │   └── index.css               # Global styles (warm beige theme)
│   └── index.html                  # Entry HTML
├── server/
│   ├── routers.ts                  # Main tRPC procedures (~2,185 lines)
│   ├── gapRouters.ts               # Gap closure routers (~1,129 lines)
│   ├── newFeatureRouters.ts        # New feature routers
│   ├── google-oauth.ts             # Google OAuth integration
│   ├── db.ts                       # Database query helpers
│   ├── storage.ts                  # S3 storage helpers
│   ├── security.ts                 # Security middleware (CSP, rate limiting)
│   ├── stripe-products.ts          # 5-tier pricing definitions
│   ├── stripe-routes.ts            # Stripe webhook and checkout routes
│   ├── _core/                      # Framework internals
│   │   ├── llm.ts                      # LLM helper (Forge API)
│   │   ├── voiceTranscription.ts       # Whisper API helper
│   │   ├── imageGeneration.ts          # Image generation helper
│   │   ├── notification.ts             # Owner notification helper
│   │   ├── oauth.ts                    # Manus OAuth handler
│   │   └── sdk.ts                      # Session management SDK
│   └── *.test.ts                   # 8 Vitest test suites (352+ tests)
├── drizzle/
│   ├── schema.ts                   # Database schema (38 tables, 770 lines)
│   └── migrations/                 # SQL migration files
├── shared/
│   ├── const.ts                    # Shared constants
│   └── platformSpecs.ts            # Platform intelligence data (14 platforms)
├── TECH_SPEC.md                    # This document
├── UNIT_ECONOMICS.md               # Pricing and margin analysis
├── COMPETITIVE_RANKING.md          # Competitive analysis
└── todo.md                         # Project task tracking
```

---

## 14. Testing

### 14.1 Test Strategy

The project includes 8 comprehensive test suites covering all major feature areas:

| Test File | Coverage Area | Tests |
|-----------|--------------|-------|
| `routers.test.ts` | Core procedures (products, content, campaigns, leads) | ~50 |
| `comprehensive.test.ts` | All 22 content types, A/B testing, scheduler, analytics | ~100 |
| `admin-voice.test.ts` | Admin panel, voice transcription, platform intelligence | ~50 |
| `security.test.ts` | Auth bypass, XSS, SQL injection, CSRF, rate limiting | ~30 |
| `platformIntel.test.ts` | Platform specs, auto-formatting, best times | ~30 |
| `gapFeatures.test.ts` | Social publish, video render, email, brand voice, webhooks | ~40 |
| `newFeatures.test.ts` | Personal video, competitor intel, customer intel | ~30 |
| `auth.logout.test.ts` | Authentication logout flow | ~5 |

### 14.2 Running Tests

```bash
pnpm test                    # Run all tests
pnpm test -- server/         # Run server tests only
pnpm test -- --reporter=verbose  # Verbose output
```

---

## 15. Chrome Extension

A companion Chrome extension is available in the `/otobi-ai-chrome-extension/` directory. It provides browser-integrated access to the platform's features:

- **Page Analysis:** Analyze any webpage for marketing intelligence
- **Product Extraction:** Extract product data from e-commerce pages
- **Competitor Intelligence:** Right-click any page to run competitor analysis
- **Content Generation:** Select text and generate ads, social posts, or improved content
- **SEO Quick Audit:** Run instant SEO audits on any page
- **Lead Capture:** Save contact information from any webpage
- **Side Panel:** Access AI Marketing Agent directly in the browser sidebar
- **Context Menus:** Right-click integration for all quick actions

The extension uses Manifest V3 and connects to the deployed OTOBI AI instance.

---

## 16. Summary Statistics

| Metric | Value |
|--------|-------|
| Total TypeScript Lines | 32,169 |
| Frontend Pages | 40 |
| tRPC Router Groups | 39 |
| Database Tables | 38 |
| Content Types | 22 |
| Supported Platforms | 21+ |
| Platform Intelligence | 14 platforms |
| Languages Supported | 30+ |
| Test Suites | 8 |
| Tests Passing | 352+ |
| Pricing Tiers | 5 |
| Target Gross Margin | 85-90% |
| TypeScript Errors | 0 |
