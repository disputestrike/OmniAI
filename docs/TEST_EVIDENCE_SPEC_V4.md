# Spec v4 — Test Evidence

## Summary

Implementation of **OTOBI AI Implementation Spec v4** (Phase A through E) is complete and tested.

## Test Runs

- **Full suite**: `pnpm run test` — 17 test files, 453 tests passed (7 skipped).
- **Smoke**: `fullStackSmoke.test.ts` — router inventory, public procedures (system.health, auth.me, musicStudio, **pricing.list**), protected auth (dashboard, repurposing, personalVideo, **dsp.status**, **subscription.status**). DB mocked so no hang.
- **Wiring**: `wiringChaosEdge.test.ts` — subscription.status, credits.balance, credits.packages callable with auth; v4 endpoints wired.
- **Chaos**: `wiringChaosEdge.test.ts` — pricing fallback when DB null; dsp.status safe defaults when DB null; runAllJobs does not throw; createDspFundCheckout returns url null when Stripe not configured.
- **Edge cases**: `wiringChaosEdge.test.ts` — dsp.fundCheckout rejects 0, 99, negative; unauthenticated dsp.fundCheckout and credits.balance throw UNAUTHORIZED; pricing list tier monthlyPrice numeric.
- **Spec v4**: `spec-v4.test.ts` — 8 tests (pricing from DB, DSP status/campaigns/fundCheckout, services, jobs).
- **Security**: `security.test.ts` — sanitization, XSS/SQL patterns, validation.
- **TypeScript**: `npx tsc --noEmit` — no errors.
- **Build**: `pnpm run build` — client and server bundles build successfully.

## What Was Tested

### Phase A — Database
- New tables exist in schema and SQL migrations: `tier_limits_config`, `subscription_limits`, `dsp_ad_wallets`, `dsp_campaigns`, `dsp_wallet_transactions`, `dsp_performance_snapshots`.
- Seed for `tier_limits_config` runs in `server/_core/migrate.ts` (ON DUPLICATE KEY UPDATE).

### Phase B — Env & Stripe
- Env vars: `ANTHROPIC_API_KEY`, `EPOM_*`, `DSP_ENABLED` in `server/_core/env.ts` and `.env.example`.
- Stripe webhook: `checkout.session.completed` handles `metadata.type === 'dsp_fund'`; `customer.subscription.trial_will_end` logged; `customer.subscription.deleted` already handled.

### Phase C — Backend
- **Claude Haiku**: `server/services/claudeHaiku.service.ts` — `callClaudeHaiku`, `isClaudeHaikuConfigured`.
- **AI Router**: `server/services/aiRouter.service.ts` — `routeAITask` with task types and Forge/Claude/OpenAI fallback.
- **Epom**: `server/services/epom.service.ts` — `createEpomAccount`, `fundEpomWallet`, `createEpomCampaign`, `getEpomStats`, `setEpomStatus`, `isEpomConfigured`.
- **Pricing from DB**: `pricing.list` reads from `tier_limits_config` when available, else `pricingConfig.PRICING_TIERS`.
- **DSP tRPC**: `dsp.status`, `dsp.fundCheckout`, `dsp.campaigns.list` — covered in `spec-v4.test.ts`.
- **Background jobs**: `server/jobs/index.ts` — `runSyncDspPerformance`, `runClaudeMomentumAnalysis`, `runDspBudgetAlert`, `runTrialEmailSender`, `runAllJobs` (no throw).

### Phase D — Frontend
- **Programmatic Ads page**: `client/src/pages/ProgrammaticAds.tsx` — wallet balance, fund CTA, campaigns list; route `/programmatic-ads`; nav item in Manage.
- **Landing**: Hero subheadline mentions programmatic ads and DSP; new section “Programmatic Ads — Content, Creatives, and DSP Ad Buying”; replace bar text updated to “Content, creatives, CRM, and programmatic DSP — one subscription.”

### Phase E — QA
- **Security**: Existing `server/security.test.ts` (sanitization, validation, XSS/SQL patterns).
- **Router smoke**: `fullStackSmoke.test.ts` includes `pricing`, `credits`, `dsp`.
- **Spec v4**: `spec-v4.test.ts` — pricing list shape, DSP status/campaigns/fundCheckout validation, service imports, jobs run.

## How to Run

```bash
pnpm run check       # TypeScript
pnpm run test        # Full test suite (includes battery)
pnpm run test:battery # Click-through, edge, chaos, security, adversarial, hallucination, catastrophe
pnpm run test:load   # Load test (skips if server not running; run after pnpm dev for real load)
```

## Notes

- DSP fund flow and Epom API calls require `EPOM_*` and `DSP_ENABLED=true` in production.
- Claude Haiku tasks require `ANTHROPIC_API_KEY`.
- Upgrade modals (6 triggers) and full DSP campaign creation wizard can be added in a follow-up; core wiring is in place.
