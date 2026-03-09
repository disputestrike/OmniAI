# Test Battery — Click-through, Edge, Chaos, Security, Load

## Overview

- **Battery tests** (`server/battery.test.ts`): Vitest suite covering click-through flows, edge cases, chaos, security/intrusion, adversarial inputs, hallucination checks, and catastrophe (graceful degradation).
- **Load test** (`scripts/load-test.mjs`): Concurrent HTTP requests to `/health` and `/api/trpc/pricing.list`. Run with server up; if server is not reachable, the script exits 0 and skips.

## Commands

| Command | Description |
|--------|-------------|
| `pnpm test` | Full suite (includes battery) |
| `pnpm test:battery` | Battery only: click-through, edge, chaos, security, adversarial, hallucination, catastrophe |
| `pnpm test:load` | Load test (150 requests × 2 endpoints). Start server first; skips if unreachable. |

## Battery Categories

| Category | What it covers |
|----------|----------------|
| **Click-through** | Critical user flow: `pricing.list` → `auth.me` → (with auth) `subscription.status` → `dsp.status` → `credits.balance`. |
| **Edge cases** | `dsp.fundCheckout` min amount (0, 1, 99 rejected; 100 passes validation); pricing list tier shape. |
| **Chaos** | `runAllJobs` does not throw when OpenAI/Claude missing; `createDspFundCheckout` returns null when Stripe missing; `dsp.status` safe defaults when DB null. |
| **Security / intrusion** | Protected procedures reject unauthenticated (UNAUTHORIZED); SQL/XSS pattern detection; sanitizeString; admin procedure rejects non-admin (FORBIDDEN); rate limit throws after exceeding max. |
| **Adversarial** | Wrong types (e.g. string for amountCents); negative amountCents; subscription.status does not leak stack/sql. |
| **Hallucination** | No false success: fundCheckout never returns url when amountCents < 100; dsp.status balance/spent are numeric; pricing monthlyPrice is number. |
| **Catastrophe** | `runAllJobs` and `createDspFundCheckout` do not throw when dependencies are missing. |

## Mitigations Applied

- **XSS**: `hasXSSPatterns` extended to detect unquoted event handlers (e.g. `onerror=alert(1)`) and `<img ... on*>`.
- **Rate limit**: Test ensures `checkRateLimit` throws after exceeding max (intrusion/abuse mitigation).
- **Auth**: All protected and admin procedures tested for UNAUTHORIZED/FORBIDDEN when context is missing or role is wrong.
- **Graceful degradation**: Jobs and Stripe helpers return safe defaults or null instead of throwing when APIs/DB are unavailable.

## Load Test

- Targets: `GET /health`, `GET /api/trpc/pricing.list?batch=1&input={}`.
- Default base URL: `http://localhost:3000`. Override with `BASE_URL` or first arg: `node scripts/load-test.mjs https://your-app.com`.
- If the server is not reachable, the script logs a skip message and exits 0 so CI does not fail.
