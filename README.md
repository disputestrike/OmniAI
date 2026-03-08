# OTOBI AI (OmniAI)

AI-powered marketing automation platform: create content, run campaigns, manage leads, funnels, forms, reviews, and analytics from one dashboard. All features are wired end-to-end (front-end, back-end, database, routes, sidebar).

## Quick start

- **Development:** `npm run dev` (client + server).
- **Build:** `npm run build` then `npm start`.
- **Database:** Set `DATABASE_URL` (or Railway `MYSQL_URL`). Tables are created/updated automatically on startup via migrations.

## Documentation

| Doc | Purpose |
|-----|---------|
| [TECH_SPEC.md](./TECH_SPEC.md) | Architecture, stack, DB schema, API, security, deployment |
| [FEATURES.md](./FEATURES.md) | Where to find every feature (sidebar categories and routes) |
| [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) | Deploy to Railway (env vars, MySQL, build) |
| [COMPETITIVE_RANKING.md](./COMPETITIVE_RANKING.md) | Competitive positioning and feature comparison |
| [PLATFORM_ASSESSMENT.md](./PLATFORM_ASSESSMENT.md) | How good we are now, what's wired, what's missing |
| [docs/API_KEYS_OVERLAP.md](./docs/API_KEYS_OVERLAP.md) | API key overlaps (video, voice, music): pick one per category, minimum set |
| [docs/ARCHITECTURE_OVERVIEW_AND_RECOMMENDATIONS.md](./docs/ARCHITECTURE_OVERVIEW_AND_RECOMMENDATIONS.md) | Intelligence layer, data flywheel, 5+ recommendations (merge competitor, self-learning, narrative, influence graph) |

## Sidebar (where to find what)

- **Overview:** Dashboard
- **Create:** Product Analyzer, Content Studio, Content Repurposer, Creative Engine, Video Ads/Render/Studio, Image Editor, Brand Voice, Translate, AI Avatars, Meme Generator, Content Ingest/Library/Templates/Scorer, Bulk Import, Brand Kit, Music/Voiceover Studio, **Forms**
- **Manage:** Campaigns, **Funnels**, A/B Testing, Scheduler, Lead Manager, CRM Deals, Ad Platforms, Ad Performance, One-Push Publisher, Momentum, Social Publish, Email Marketing, Content Calendar, Performance, Social Planner
- **Intelligence:** Website Intel, **Reviews**, Platform Intel, SEO Audits, Analytics, Predictive AI, AI Agents, Competitor Spy, Customer/Competitor Intel, Competitor Monitor
- **Workspace:** Collaboration, Approvals, Export/Import, Webhooks, Landing Pages, Automations, Projects
- **Account:** Pricing & Plans, Creator Profile
- **Admin:** Admin Panel

All links go to real, wired pages. No placeholders.

## Tech stack

- **Frontend:** React 19, TypeScript, Tailwind, shadcn/ui, Wouter, tRPC client
- **Backend:** Express 4, Node 22, tRPC 11, Drizzle ORM
- **Database:** MySQL-compatible (TiDB / Railway MySQL); auto-migrations on startup
- **Auth:** Google OAuth, JWT session cookies
- **Payments:** Stripe

## License

MIT
