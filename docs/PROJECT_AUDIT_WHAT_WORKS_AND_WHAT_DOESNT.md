# OTOBI AI — Project Audit: What’s Supposed to Work vs What Isn’t

This doc lists what is **working**, what is **broken or missing**, and what depends on **config** so you can fix or prioritize.

---

## ✅ Working (wired and tested)

- **Auth** — Login, session, protected routes.
- **Dashboard** — Home, stats, campaign list, CTAs to Campaign Wizard and AI Agents.
- **Product Hub** — Add product, **product analyze with URL** (backend now fetches product URL and injects scraped content into analysis).
- **AI Agent** — Chat with tools (analyzeProduct, createCampaign, generateEmailSequence, generateSocialPosts); **no “I can’t access links”**; **URL in message is fetched** in analyzeProduct; **file attach** in chat (upload + send with message). Uses Claude Haiku (Anthropic) for tool calling.
- **Campaign Wizard** — Multi-step flow, multi-select goals, auto-fill, wizard generate/launch, campaign assets.
- **Campaigns** — List, create, assets, wizardLaunch.
- **Landing Page Builder** — List, create, update, components, **lead destination** (Lead Manager, CRM, email list), **redirect after submit**. Form submit: `POST /api/landing/submit` → submission, lead, deal, email list, automations.
- **Automations** — Form-submit trigger runs with context; send_email uses Resend to submitter.
- **Email Marketing** — Lists, campaigns, **real send** via Resend.
- **Creatives** — **Push to Ads** button (modal → launchAd); gallery, generate.
- **Content Studio** — 22 types, generate, remix, repurpose.
- **Forms** — CRUD, getPublicBySlug, submit; **FormView** at `/form/:slug` (public).
- **Reports** — Share report, **ReportView** at `/report/:shareToken` (public), getByToken.
- **Intelligence** — analyzeWebsite (fetches URL, scrapes, then LLM).
- **Other routers** — All routers in fullStackSmoke.test are present (dashboard, product, content, aiChat, creative, intelligence, videoAd, campaign, abTest, schedule, lead, analytics, subscription, pricing, credits, dsp, deal, activity, adPlatform, team, approval, predictive, platformIntel, momentum, voice, admin, seo, brandVoice, emailMarketing, landingPageBuilder, automation, socialPublish, videoRender, webhooks, imageEditor, multiLanguage, competitorSpy, bulkImport, personalVideo, competitorIntel, customerIntel, realVideo, voiceoverApi, avatar, socialConnection, ecommerce, meme, creativeEngine, integrationStatus, repurposing, publishing, adPerformance, ingest, library, creatorProfile, publisher, advanced, enhanced, brandKit, musicStudio).

---

## ❌ Broken or missing

### 1. **Public landing page view at `/lp/:slug`**

- **Expected:** After “launch” or “publish,” a landing page is viewable at e.g. `/lp/my-page`.
- **Actual:** Form submit can redirect to `/lp/{slug}`, but **there is no route or API for that**.
  - No `Route path="/lp/:slug"` in `App.tsx`.
  - No public procedure or REST endpoint that returns landing page by slug for anonymous users.
- **Result:** Redirect to `/lp/xyz` ends up on 404 (or catch‑all).
- **Fix:** Add a client route `/lp/:slug`, and either a public tRPC procedure (e.g. `landingPage.getPublicBySlug`) or a REST `GET /api/landing/page/:slug` that returns the page (title, components, status) for unauthenticated access. Render the same component structure as in the builder preview.

### 2. **Storage / file upload (e.g. AI chat attachments)**

- **Expected:** Attach file in AI chat → upload → agent sees link.
- **Actual:** `enhanced.uploadAttachment` uses `storagePut()`, which uses **`ENV.forgeApiUrl` and `ENV.forgeApiKey`** as the “storage proxy” (see `server/storage.ts`). If you only set `ANTHROPIC_API_KEY` and use OpenAI for nothing, **forge URL/key may be unset or point to OpenAI**, so upload throws: “Storage proxy credentials missing” or wrong endpoint.
- **Result:** File attach in AI chat can fail in production if storage isn’t configured.
- **Fix:** Either (a) configure a real storage proxy (e.g. R2) and set `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` for storage only, or (b) add a separate `STORAGE_URL` / `STORAGE_API_KEY` (or R2 env) and use that in `storage.ts` so file upload doesn’t depend on Forge. Optionally allow small files to be inlined (e.g. base64 in message) when storage is unavailable.

### 3. **Rate limit path typo**

- **Location:** `server/_core/index.ts` (and prod if same).
- **Current:** `app.use("/api/trpc/aiAgent.chat", rateLimit(...))`.
- **Actual procedure:** `aiChat.send` (path is `aiChat.send`, not `aiAgent.chat`).
- **Result:** This rate limit never applies.
- **Fix:** Change to `"/api/trpc/aiChat.send"` (or whatever the real tRPC path is for the chat mutation).

---

## ⚠️ Depends on configuration

- **AI Agent tool calling** — Requires **`ANTHROPIC_API_KEY`** (Claude Haiku). Without it, agent loop fails.
- **Other LLM (content, product analyze, etc.)** — Prefer Claude via `ANTHROPIC_API_KEY`; fallback **`BUILT_IN_FORGE_API_KEY`** (and optional `BUILT_IN_FORGE_API_URL`) for non–tool-calling or when Claude isn’t set.
- **Email (Resend)** — Real sending requires Resend configured (e.g. `RESEND_API_KEY` or whatever the app uses).
- **Stripe** — Pricing, DSP, credits depend on Stripe env vars.
- **DB** — MySQL (or configured DB) required; migrations in `server/_core/migrate.ts`.

---

## 🔧 Quick fixes to do next

1. **Add public landing page view**
   - In `client/src/App.tsx`: add `<Route path="/lp/:slug" component={LandingPagePublicView} />` (new page that fetches by slug and renders).
   - In backend: add public procedure or REST `GET /api/landing/page/:slug` that returns `getLandingPageBySlug(slug)` (title, components, status) without auth.
2. **Storage / attach**
   - Use dedicated storage env (e.g. R2) in `storage.ts` so upload doesn’t depend on Forge, or document that Forge URL/key must point to storage proxy for file attach to work.
3. **Rate limit**
   - Change `aiAgent.chat` to `aiChat.send` in `server/_core/index.ts` (and prod).

---

## Summary

| Area              | Status   | Note                                              |
|-------------------|----------|---------------------------------------------------|
| Product analyze   | ✅ Fixed | Fetches product URL and uses scraped content      |
| AI agent links    | ✅ Fixed | Never says “no access”; fetches URL in analyze   |
| AI chat attach    | ✅ Done  | UI + backend; may fail if storage not configured  |
| Public /lp/:slug  | ❌ Missing | No route or public API for published pages     |
| Storage upload    | ⚠️ Config | Depends on Forge URL/keys or separate storage   |
| Rate limit chat   | 🔧 Wrong path | Use aiChat.send instead of aiAgent.chat       |

Everything else in FEATURES.md that’s listed as wired (routers, sidebar, flows) is implemented; the main functional gaps are **public landing page view** and **reliable file upload** when storage isn’t set.
