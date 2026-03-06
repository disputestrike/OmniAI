# OmniMarket AI — Technical Specification Document

**Version:** 2.0  
**Date:** March 6, 2026  
**Status:** Production-Ready

---

## 1. Executive Summary

OmniMarket AI is an all-in-one AI marketing engine that enables users to create, publish, and optimize marketing campaigns across 21+ platforms from a single command center. The platform combines AI content generation, visual creation, video ad production, campaign management, predictive analytics, and multi-channel publishing into one integrated system.

---

## 2. Architecture Overview

### 2.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript | Single-page application |
| Styling | Tailwind CSS 4 + shadcn/ui | Design system & components |
| API Layer | tRPC 11 + Superjson | Type-safe RPC with auto-serialization |
| Backend | Express 4 + Node.js 22 | HTTP server & middleware |
| Database | TiDB (MySQL-compatible) | Relational data storage |
| ORM | Drizzle ORM | Type-safe SQL queries |
| File Storage | AWS S3 | Media & asset storage |
| Authentication | Manus OAuth 2.0 | User identity & sessions |
| Payments | Stripe Checkout + Webhooks | Subscription billing |
| AI/LLM | Built-in Forge API (GPT-class) | Content generation, analysis, chat |
| Voice | Whisper API | Speech-to-text transcription |
| Image Gen | Built-in Image Service | AI image generation & editing |
| Routing | Wouter | Client-side routing |
| State | React Query (via tRPC) | Server state management |

### 2.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React 19)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Landing  │ │Dashboard │ │ Content  │ │ AI Chat  │   │
│  │  Page    │ │  + Home  │ │ Studio   │ │ + Voice  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Campaigns │ │Creatives │ │Video Ads │ │Analytics │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Platform │ │Momentum  │ │ Admin    │ │ Pricing  │   │
│  │  Intel   │ │          │ │ Panel    │ │          │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                        │                                 │
│                   tRPC Client                            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS /api/trpc
┌────────────────────────┴────────────────────────────────┐
│                   SERVER (Express 4)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │              tRPC Router (appRouter)               │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │   │
│  │  │ auth   │ │product │ │content │ │campaign│    │   │
│  │  │ system │ │creative│ │videoAd │ │abTest  │    │   │
│  │  │ leads  │ │schedule│ │aiChat  │ │voice   │    │   │
│  │  │ seo    │ │predict │ │platform│ │momentum│    │   │
│  │  │ admin  │ │team    │ │subscr. │ │deals   │    │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘    │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ Stripe   │ │ OAuth    │ │ Webhook  │                │
│  │ Routes   │ │ Handler  │ │ Handler  │                │
│  └──────────┘ └──────────┘ └──────────┘                │
└────────┬──────────────┬──────────────┬──────────────────┘
         │              │              │
    ┌────┴────┐   ┌─────┴─────┐  ┌────┴────┐
    │  TiDB   │   │  AWS S3   │  │  Forge  │
    │Database │   │  Storage  │  │  API    │
    └─────────┘   └───────────┘  └─────────┘
```

---

## 3. Database Schema

### 3.1 Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts & profiles | id, openId, name, email, role (admin/user), subscriptionPlan, stripeCustomerId |
| `products` | Products being marketed | id, userId, name, description, category, targetAudience, competitorUrls |
| `content` | AI-generated content pieces | id, userId, productId, type, platform, title, body, hashtags, status |
| `creatives` | AI-generated images/visuals | id, userId, productId, prompt, imageUrl, platform, style |
| `video_ads` | Video ad scripts & assets | id, userId, productId, script, avatarConfig, voiceConfig, status |
| `campaigns` | Marketing campaigns | id, userId, productId, name, platforms, status, budget, startDate, endDate |
| `ab_tests` | A/B test experiments | id, userId, campaignId, name, variants, status, winner |
| `leads` | Captured leads | id, userId, name, email, source, status, score |
| `scheduled_posts` | Content scheduler | id, userId, contentId, platform, scheduledAt, status |
| `seo_audits` | SEO analysis results | id, userId, url, score, issues, recommendations |
| `team_members` | Team collaboration | id, teamOwnerId, userId, role (owner/editor/viewer), invitedAt |
| `subscriptions` | Stripe subscription tracking | id, userId, stripeSubscriptionId, stripeCustomerId, plan, status |
| `deals` | CRM deal pipeline | id, userId, leadId, name, value, stage, probability |
| `ad_platform_connections` | Connected ad accounts | id, userId, platform, accountId, status |
| `approvals` | Content approval workflows | id, userId, contentId, status, reviewerId, comments |
| `ai_avatars` | Custom AI avatars | id, userId, name, config (ethnicity, age, hair, etc.), imageUrl |

### 3.2 Role-Based Access

| Role | Permissions |
|------|------------|
| `admin` | Full platform access, user management, plan changes, analytics, all CRUD |
| `user` | Own data CRUD, team collaboration (if on team plan), feature access per subscription tier |

### 3.3 Team Roles

| Team Role | Permissions |
|-----------|------------|
| `owner` | Full team management, billing, invite/remove members |
| `editor` | Create/edit content, campaigns, creatives within team |
| `viewer` | Read-only access to team content and analytics |

---

## 4. Authentication Flow

```
User → Landing Page → "Get Started" CTA
  → Manus OAuth Login Portal
  → OAuth Callback (/api/oauth/callback)
  → Session Cookie (JWT-signed)
  → Dashboard (authenticated)
```

**Session Management:**
- JWT-signed session cookies
- `protectedProcedure` middleware injects `ctx.user` for all authenticated routes
- `ctx.user.role` checked for admin-only operations
- Session persists across browser sessions

---

## 5. Pricing & Unit Economics

### 5.1 Pricing Tiers

| Tier | Monthly Price | Annual Price | Target User | Key Limits |
|------|--------------|-------------|-------------|------------|
| **Free** | $0 | $0 | Trial users | 5 content/mo, 2 images/mo, 1 product |
| **Starter** | $29/mo | $23/mo | Solopreneurs | 50 content/mo, 15 images/mo, 5 products |
| **Professional** | $79/mo | $63/mo | Growing teams | 200 content/mo, 50 images/mo, 5 seats |
| **Business** | $199/mo | $159/mo | Agencies | Unlimited content, 15 seats, API access |
| **Enterprise** | Custom | Custom | Large orgs | Unlimited everything, dedicated support |

### 5.2 Seat Pricing

| Tier | Included Seats | Extra Seat Cost |
|------|---------------|----------------|
| Free | 1 | N/A |
| Starter | 1 | N/A |
| Professional | 5 | $15/seat/mo |
| Business | 15 | $12/seat/mo |
| Enterprise | Unlimited | Included |

### 5.3 Unit Economics (Per User/Month)

| Cost Component | Free | Starter | Professional | Business |
|---------------|------|---------|-------------|----------|
| LLM API (GPT-class) | $0.10 | $2.50 | $8.00 | $15.00 |
| Image Generation | $0.04 | $0.60 | $2.00 | $5.00 |
| Voice Transcription | $0 | $0.20 | $0.50 | $1.00 |
| Infrastructure (compute) | $0.50 | $0.50 | $0.50 | $0.50 |
| Database & Storage | $0.10 | $0.20 | $0.50 | $1.00 |
| **Total COGS** | **$0.74** | **$4.00** | **$11.50** | **$22.50** |
| **Revenue** | **$0** | **$29** | **$79** | **$199** |
| **Gross Margin** | N/A | **86.2%** | **85.4%** | **88.7%** |

### 5.4 Market Comparison

| Competitor | Starting Price | Our Advantage |
|-----------|---------------|---------------|
| AdCreative.ai | $25/mo (10 credits) | More content types, 21 platforms |
| Arcads.ai | $110/mo (100 credits) | Full marketing suite, not just video |
| Omneky | $99/mo | More platforms, voice AI, CRM |
| Jasper | $49/mo/seat | No seat pricing on Starter, more features |
| Copy.ai | $49/mo | Visual + video + audio, not just text |

---

## 6. Feature Inventory

### 6.1 Content Creation (22 Content Types)

| # | Content Type | Platforms | AI-Powered |
|---|-------------|-----------|------------|
| 1 | Social Media Posts | Instagram, TikTok, Twitter/X, Facebook, LinkedIn, Pinterest, Snapchat, Reddit | Yes |
| 2 | Ad Copy | Google Ads, Facebook Ads, LinkedIn Ads, Amazon Ads | Yes |
| 3 | Email Campaigns | Email (Mailchimp, SendGrid, etc.) | Yes |
| 4 | SMS Marketing | SMS/MMS | Yes |
| 5 | Blog Articles | Blog/SEO | Yes |
| 6 | Video Scripts | YouTube, TikTok, Instagram Reels | Yes |
| 7 | Podcast Scripts | Spotify, Apple Podcasts | Yes |
| 8 | Press Releases | PR Wires | Yes |
| 9 | Newsletter Content | Email newsletters | Yes |
| 10 | Product Descriptions | Amazon, eBay, Shopify | Yes |
| 11 | Landing Page Copy | Web | Yes |
| 12 | WhatsApp Messages | WhatsApp Business | Yes |
| 13 | TV/Radio Scripts | Broadcast | Yes |
| 14 | AI Images | All visual platforms | Yes |
| 15 | AI Video Ads | Video platforms | Yes |
| 16 | AI Avatars | Video platforms | Yes |
| 17 | SEO Content | Blog/Web | Yes |
| 18 | A/B Test Variants | All platforms | Yes |
| 19 | Campaign Briefs | Internal | Yes |
| 20 | Competitor Analysis | Internal | Yes |
| 21 | Audience Personas | Internal | Yes |
| 22 | Content Calendars | All platforms | Yes |

### 6.2 Platform Intelligence (14 Platforms)

Each platform includes:
- Character limits (title, body, hashtags)
- Image specs (min/max dimensions, aspect ratios, file size)
- Video specs (min/max duration, aspect ratios, file size)
- Best posting times (by day of week, by industry)
- Peak engagement windows
- Hashtag strategies
- Auto-formatting rules

**Supported Platforms:** Instagram, TikTok, YouTube, Facebook, LinkedIn, Twitter/X, Pinterest, Google Ads, Amazon, Email, SMS, Snapchat, Reddit, WhatsApp

### 6.3 AI Capabilities

| Capability | Implementation | Endpoint |
|-----------|---------------|----------|
| Content Generation | LLM (GPT-class) via Forge API | `trpc.content.generate` |
| Content Remixing | LLM with original content context | `trpc.content.remix` |
| Image Generation | Built-in Image Service | `trpc.creative.generate` |
| Video Script Generation | LLM with avatar/product context | `trpc.videoAd.generate` |
| AI Avatar Creation | Image Generation + config | `trpc.videoAd.generateAvatar` |
| Voice Transcription | Whisper API | `trpc.voice.uploadAndTranscribe` |
| AI Chat (Marketing Agent) | LLM with marketing system prompt | `trpc.aiChat.send` |
| Product Analysis | LLM competitive analysis | `trpc.product.analyze` |
| SEO Audit | LLM + structured analysis | `trpc.seo.audit` |
| Predictive Analytics | LLM trend analysis | `trpc.predictive.forecast` |
| Campaign Momentum | LLM performance analysis | `trpc.momentum.analyze` |
| Content Calendar | LLM scheduling intelligence | `trpc.momentum.generateCalendar` |
| Platform Auto-Format | Rule-based + LLM adaptation | `trpc.platformIntel.autoFormat` |

---

## 7. User Flows

### 7.1 New User Onboarding

```
1. Visit Landing Page → See interactive demo, value props, pricing
2. Click "Start Free" → OAuth login
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
3. Choose content type (social, ad, email, etc.)
4. Select target platform(s)
5. AI generates content with platform-specific formatting
6. Review, edit, or remix
7. Schedule or publish immediately
8. Track performance in Analytics
```

### 7.3 Campaign Flow

```
1. Create Campaign → Name, product, platforms, budget, dates
2. Generate Content → AI creates content for all selected platforms
3. Create Visuals → AI generates images/videos
4. Set up A/B Tests → AI creates variants
5. Schedule Posts → AI recommends optimal times
6. Monitor → Real-time analytics dashboard
7. Optimize → AI momentum analysis suggests improvements
8. Scale → AI recommends budget increases for winners
```

### 7.4 Team Collaboration Flow

```
1. Owner creates team (Professional+ plan)
2. Invite members by email → Role assignment (editor/viewer)
3. Members access shared products, campaigns, content
4. Approval workflows for content review
5. Activity feed shows team actions
```

### 7.5 AI Chat / Voice Flow

```
1. Navigate to AI Agents
2. Choose agent mode (Strategist, Viral Engineer, etc.)
3. Type message OR click microphone to record voice
4. Voice → Whisper transcription → Text input
5. AI responds with marketing strategy/advice
6. Conversation history maintained in session
```

---

## 8. API Endpoints (tRPC Procedures)

### 8.1 Authentication

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `auth.me` | Query | Public | Get current user |
| `auth.logout` | Mutation | Protected | End session |

### 8.2 Products

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `product.list` | Query | Protected | List user's products |
| `product.create` | Mutation | Protected | Create new product |
| `product.update` | Mutation | Protected | Update product |
| `product.delete` | Mutation | Protected | Delete product |
| `product.analyze` | Mutation | Protected | AI competitive analysis |

### 8.3 Content

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `content.list` | Query | Protected | List content pieces |
| `content.generate` | Mutation | Protected | AI content generation |
| `content.remix` | Mutation | Protected | AI content remixing |
| `content.update` | Mutation | Protected | Update content |
| `content.delete` | Mutation | Protected | Delete content |

### 8.4 Creatives

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `creative.list` | Query | Protected | List creatives |
| `creative.generate` | Mutation | Protected | AI image generation |
| `creative.delete` | Mutation | Protected | Delete creative |

### 8.5 Video Ads

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `videoAd.list` | Query | Protected | List video ads |
| `videoAd.generate` | Mutation | Protected | AI video script gen |
| `videoAd.generateAvatar` | Mutation | Protected | AI avatar creation |
| `videoAd.listAvatars` | Query | Protected | List user avatars |

### 8.6 Campaigns

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `campaign.list` | Query | Protected | List campaigns |
| `campaign.create` | Mutation | Protected | Create campaign |
| `campaign.update` | Mutation | Protected | Update campaign |
| `campaign.delete` | Mutation | Protected | Delete campaign |

### 8.7 A/B Testing

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `abTest.list` | Query | Protected | List A/B tests |
| `abTest.create` | Mutation | Protected | Create test |
| `abTest.declareWinner` | Mutation | Protected | Set winner variant |

### 8.8 Scheduler

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `scheduler.list` | Query | Protected | List scheduled posts |
| `scheduler.create` | Mutation | Protected | Schedule content |
| `scheduler.delete` | Mutation | Protected | Cancel scheduled post |

### 8.9 Leads & CRM

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `lead.list` | Query | Protected | List leads |
| `lead.create` | Mutation | Protected | Add lead |
| `lead.update` | Mutation | Protected | Update lead |
| `deal.list` | Query | Protected | List deals |
| `deal.create` | Mutation | Protected | Create deal |
| `deal.update` | Mutation | Protected | Update deal stage |

### 8.10 Intelligence

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `seo.audit` | Mutation | Protected | Run SEO audit |
| `seo.list` | Query | Protected | List past audits |
| `predictive.forecast` | Mutation | Protected | AI trend prediction |
| `platformIntel.getAll` | Query | Public | All platform specs |
| `platformIntel.getOne` | Query | Public | Single platform specs |
| `platformIntel.autoFormat` | Mutation | Public | Auto-format content |
| `platformIntel.bestTime` | Query | Public | Best posting time |
| `momentum.analyze` | Mutation | Protected | AI campaign analysis |
| `momentum.generateCalendar` | Mutation | Protected | AI content calendar |

### 8.11 Voice & AI Chat

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `aiChat.send` | Mutation | Protected | Send message to AI |
| `voice.uploadAndTranscribe` | Mutation | Protected | Voice → text |

### 8.12 Admin

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `admin.users` | Query | Admin | List all users |
| `admin.stats` | Query | Admin | Platform statistics |
| `admin.updateUserRole` | Mutation | Admin | Change user role |
| `admin.updateUserPlan` | Mutation | Admin | Change user plan |

### 8.13 Subscriptions & Payments

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `subscription.status` | Query | Protected | Current plan status |
| `subscription.createCheckout` | Mutation | Protected | Stripe checkout |
| `subscription.cancel` | Mutation | Protected | Cancel subscription |

---

## 9. External API Dependencies

### 9.1 Required API Keys

| Service | Environment Variable | Purpose | Required |
|---------|---------------------|---------|----------|
| Forge API (LLM) | `BUILT_IN_FORGE_API_KEY` | AI content generation | Auto-configured |
| Forge API (Frontend) | `VITE_FRONTEND_FORGE_API_KEY` | Frontend AI access | Auto-configured |
| Stripe (Secret) | `STRIPE_SECRET_KEY` | Payment processing | Auto-configured |
| Stripe (Publishable) | `VITE_STRIPE_PUBLISHABLE_KEY` | Frontend Stripe | Auto-configured |
| Stripe (Webhook) | `STRIPE_WEBHOOK_SECRET` | Webhook verification | Auto-configured |
| JWT Secret | `JWT_SECRET` | Session signing | Auto-configured |
| OAuth | `VITE_APP_ID`, `OAUTH_SERVER_URL` | Authentication | Auto-configured |
| Database | `DATABASE_URL` | TiDB connection | Auto-configured |

**Note:** All API keys are auto-configured by the platform. No manual key setup required for core functionality.

### 9.2 API Cost Estimates (Per 1,000 Operations)

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

### 10.1 Authentication & Authorization

- OAuth 2.0 via Manus identity provider
- JWT-signed session cookies (HttpOnly, Secure, SameSite)
- Role-based access control (admin/user)
- Team-level permissions (owner/editor/viewer)
- All mutations require `protectedProcedure` (authenticated)
- Admin operations check `ctx.user.role === 'admin'`

### 10.2 Data Protection

- No sensitive data stored locally (Stripe handles all payment data)
- S3 storage with non-enumerable paths (random suffixes)
- Database credentials via environment variables (never in code)
- HTTPS enforced for all traffic
- Webhook signature verification for Stripe events

### 10.3 Input Validation

- All tRPC inputs validated via Zod schemas
- SQL injection prevented by Drizzle ORM parameterized queries
- XSS prevented by React's default escaping
- File upload size limits enforced (16MB for voice)

---

## 11. Performance

### 11.1 Optimization Strategies

- React Query caching for all tRPC queries
- Optimistic updates for list operations
- Lazy loading for page components
- Image CDN for all static assets
- Database indexing on frequently queried columns

### 11.2 Scalability

- Stateless server (horizontal scaling ready)
- Database connection pooling via TiDB
- S3 for unlimited file storage
- CDN for static asset delivery

---

## 12. Deployment

### 12.1 Environment

- **Hosting:** Manus managed infrastructure
- **Database:** TiDB (MySQL-compatible, auto-scaling)
- **Storage:** AWS S3 (managed)
- **CDN:** CloudFront for static assets
- **SSL:** Auto-provisioned

### 12.2 Deployment Process

1. Save checkpoint via `webdev_save_checkpoint`
2. Click "Publish" in Management UI
3. Auto-build and deploy
4. Custom domain configuration available in Settings > Domains

---

## 13. File Structure

```
omni-market-ai/
├── client/
│   ├── src/
│   │   ├── pages/           # 29 page components
│   │   │   ├── Landing.tsx      # Public landing page (10 sections + interactive demo)
│   │   │   ├── Home.tsx         # Dashboard home
│   │   │   ├── Products.tsx     # Product management
│   │   │   ├── ContentStudio.tsx # Content creation
│   │   │   ├── Creatives.tsx    # AI image generation
│   │   │   ├── VideoAds.tsx     # Video ad creation + avatars
│   │   │   ├── Campaigns.tsx    # Campaign management
│   │   │   ├── AbTesting.tsx    # A/B testing
│   │   │   ├── Scheduler.tsx    # Content scheduler
│   │   │   ├── Leads.tsx        # Lead management
│   │   │   ├── Deals.tsx        # CRM deals pipeline
│   │   │   ├── AdPlatforms.tsx  # Ad platform connections
│   │   │   ├── Analytics.tsx    # Performance analytics
│   │   │   ├── Intelligence.tsx # Website intelligence
│   │   │   ├── SeoAudits.tsx    # SEO audit engine
│   │   │   ├── Predictive.tsx   # Predictive analytics
│   │   │   ├── PlatformIntel.tsx # Platform specs & formatter
│   │   │   ├── Momentum.tsx     # Campaign momentum
│   │   │   ├── AiAgents.tsx     # AI chat + voice
│   │   │   ├── AdminPanel.tsx   # Admin panel (RBAC)
│   │   │   ├── Pricing.tsx      # Pricing page
│   │   │   ├── Team.tsx         # Team management
│   │   │   ├── Collaboration.tsx # Team collaboration
│   │   │   ├── Approvals.tsx    # Content approvals
│   │   │   ├── ExportImport.tsx # Data export/import
│   │   │   └── NotFound.tsx     # 404 page
│   │   ├── components/      # Reusable UI components
│   │   │   ├── DashboardLayout.tsx  # Sidebar + layout
│   │   │   ├── AIChatBox.tsx        # Chat component
│   │   │   └── ui/                  # shadcn/ui components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/trpc.ts      # tRPC client
│   │   ├── App.tsx          # Routes & layout
│   │   └── index.css        # Global styles
│   └── index.html           # Entry HTML
├── server/
│   ├── routers.ts           # All tRPC procedures (~2100 lines)
│   ├── db.ts                # Database helpers
│   ├── storage.ts           # S3 helpers
│   ├── stripe-products.ts   # Stripe product definitions
│   ├── stripe-routes.ts     # Stripe webhook/checkout
│   ├── _core/               # Framework internals
│   │   ├── llm.ts           # LLM helper
│   │   ├── voiceTranscription.ts # Whisper helper
│   │   ├── imageGeneration.ts    # Image gen helper
│   │   ├── notification.ts       # Owner notifications
│   │   └── oauth.ts              # OAuth handler
│   └── *.test.ts            # Vitest test files
├── drizzle/
│   ├── schema.ts            # Database schema (16 tables)
│   └── 000*.sql             # Migration files
├── shared/
│   └── platformSpecs.ts     # Platform intelligence data
└── TECH_SPEC.md             # This document
```

---

## 14. Testing

### 14.1 Test Strategy

- **Unit Tests:** Vitest for server-side procedures and shared modules
- **Integration Tests:** tRPC procedure tests with mocked context
- **Coverage Areas:** Auth, content generation, platform intelligence, admin RBAC

### 14.2 Running Tests

```bash
pnpm test                    # Run all tests
pnpm test -- server/         # Run server tests only
pnpm test -- --coverage      # With coverage report
```

---

## 15. Roadmap & Future Considerations

### 15.1 Phase 2 (Planned)

- Google OAuth as additional auth provider
- Real-time collaboration (WebSocket)
- Webhook integrations (Zapier, Make)
- White-label customization for Business tier
- Mobile app (React Native)

### 15.2 Phase 3 (Future)

- Direct API publishing to social platforms
- AI video rendering (not just scripts)
- Multi-language content generation
- Advanced analytics with ML predictions
- Marketplace for templates and strategies
