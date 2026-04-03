# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start full-stack dev server (tsx watch + vite)
npm run build        # vite build (client) + esbuild (server) → dist/
npm start            # Production: node dist/index.js
npm run check        # TypeScript type check (no emit)
npm run format       # Prettier format all files
npm test             # Vitest unit/integration tests
npm run test:battery # Run battery.test.ts specifically
npm run db:push      # Generate + run Drizzle migrations
```

To run a single test file: `npx vitest run server/someFile.test.ts`

## Architecture

**OmniAI** is a full-stack TypeScript AI marketing automation platform ("Campaign Operating System"). Everything revolves around campaigns — every asset must be owned by a `campaign_id`.

### Layer structure

```
client/src/          React 19 SPA (Wouter routing, React Query via tRPC)
server/              Express 4 + tRPC 11 backend
shared/              Platform specs, constants shared across layers
drizzle/schema.ts    Single source of truth for all 78 DB tables
```

### Request flow

```
React page → tRPC client → Express middleware → tRPC procedure
  → business logic (aiAgent.ts, db.ts, *Router.ts files)
  → Drizzle ORM → MySQL (TiDB/Railway)
  → SuperJSON response → React Query cache → UI update
```

### Backend organization

- **`server/routers.ts`** — Root `appRouter` assembling all 32+ router groups (143+ procedures). This is the entry point for all API.
- **`server/_core/`** — Server bootstrap (`index.ts` dev, `index.prod.ts` prod), auth, tRPC context, LLM wrapper, migrations
- **`server/db.ts`** — All Drizzle ORM query functions
- **`server/[Feature]Router.ts`** — Domain-specific routers imported into `routers.ts`
- **`server/gapRouters.ts`, `newFeatureRouters.ts`, `apiIntegrationRouters.ts`, `autonomousRouters.ts`** — Grouped router files for feature batches

### Frontend organization

- **`client/src/pages/`** — 81 page components, one per feature/route
- **`client/src/components/ui/`** — 53+ shadcn/ui base components
- **`client/src/contexts/`** — Auth, theme, workspace contexts
- Routing is done with **Wouter** (not React Router)
- All API calls go through **tRPC** (`@trpc/react-query`); avoid raw fetch/axios for new features

### Database

- **`drizzle/schema.ts`** — All 78 tables defined with Drizzle MySQL syntax
- **Auto-migration** on every server startup (`server/_core/migrate.ts`)
- Schema changes: edit `drizzle/schema.ts` then run `npm run db:push`
- Key tables: `users`, `campaigns`, `products`, `contents`, `creatives`, `subscriptions`

### Authentication

- Google OAuth 2.0 via `server/_core/auth.ts`
- JWT stored as HTTP-only session cookie (name from `shared/const.ts` → `COOKIE_NAME`)
- tRPC context (`server/_core/context.ts`) attaches `user` to every request
- Use `protectedProcedure` for authenticated routes, `publicProcedure` for public ones

### AI integration

- **`server/_core/llm.ts`** — `invokeLLM()` wraps Anthropic Claude (Haiku by default)
- **`server/aiAgent.ts`** — Full campaign generation orchestration
- **`server/_core/imageGeneration.ts`** — Image generation via internal Forge API
- **`server/_core/voiceTranscription.ts`** — Whisper API for voice input

### Billing

- Stripe with 5 tiers: `free | starter | professional | business | enterprise`
- `server/creditsAndUsage.ts` — `checkLimit()` / `consumeLimit()` for usage gating
- `server/tierAccess.ts` — `checkTierAccess()` / `getFeatureAccess()` for feature gating

### Shared code

- **`shared/platformSpecs.ts`** — Specs for 21+ platforms (aspect ratios, character limits, best posting times)
- **`shared/const.ts`** — Cookie name, platform lists

## Key environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` / `MYSQL_URL` | MySQL connection string |
| `ANTHROPIC_API_KEY` | Claude LLM (content generation) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Payments |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET` | File storage |
| `RESEND_API_KEY` | Transactional email |
| `SESSION_SECRET` | JWT signing |

App runs in mock/demo mode when API keys are absent — the mock agent provides simulated responses.

## Adding a new feature

1. Add table(s) to `drizzle/schema.ts` → run `npm run db:push`
2. Add query functions to `server/db.ts`
3. Create `server/[feature]Router.ts` with `protectedProcedure` procedures
4. Import and mount the router in `server/routers.ts` → `appRouter`
5. Create `client/src/pages/[Feature].tsx` using `trpc.[feature].[procedure].useQuery/useMutation`
6. Add route to the Wouter `<Switch>` in `client/src/App.tsx` (or wherever routing lives)
