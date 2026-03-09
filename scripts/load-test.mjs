#!/usr/bin/env node
/**
 * Load test: concurrent requests to health and public tRPC.
 * Usage: Start server (pnpm start or dev), then: pnpm test:load [BASE_URL]
 *        Or: BASE_URL=https://your-app.up.railway.app node scripts/load-test.mjs
 * If server is not reachable, exits 0 with a skip message (so CI can run without server).
 */
const BASE = process.env.BASE_URL || process.argv[2] || "http://localhost:3000";
const TOTAL_REQUESTS = 150;

async function fetchHealth() {
  const res = await fetch(`${BASE}/health`);
  return { ok: res.ok, status: res.status };
}

async function fetchPricing() {
  const res = await fetch(
    `${BASE}/api/trpc/pricing.list?batch=1&input=${encodeURIComponent(JSON.stringify({}))}`,
    { headers: { Accept: "application/json" } }
  );
  return { ok: res.ok, status: res.status };
}

async function runLoad(fn, label) {
  const start = Date.now();
  const promises = Array.from({ length: TOTAL_REQUESTS }, (_, i) =>
    Promise.resolve()
      .then(() => fn())
      .catch((e) => ({ ok: false, status: 0, error: e.message }))
  );
  const results = await Promise.all(promises);
  const elapsed = Date.now() - start;
  const ok = results.filter((r) => r?.ok).length;
  const failed = results.filter((r) => !r?.ok).length;
  const statuses = {};
  results.forEach((r) => {
    const s = r?.status ?? 0;
    statuses[s] = (statuses[s] || 0) + 1;
  });
  console.log(`[${label}] ${TOTAL_REQUESTS} requests in ${elapsed}ms | OK: ${ok} | Failed: ${failed} | Status: ${JSON.stringify(statuses)}`);
  return { ok, failed, elapsed, statuses };
}

async function main() {
  console.log("Load test target:", BASE);
  console.log("Total requests per endpoint:", TOTAL_REQUESTS);

  const probe = await fetch(BASE + "/health").catch(() => null);
  if (!probe?.ok) {
    console.log("(Server not reachable — start server with pnpm dev or set BASE_URL. Skipping load test.)");
    process.exit(0);
  }

  const [health, pricing] = await Promise.all([
    runLoad(fetchHealth, "health"),
    runLoad(fetchPricing, "pricing.list"),
  ]);

  const healthOk = health.failed === 0;
  const pricingOk = pricing.failed === 0;
  if (!healthOk) console.warn("Health load test had failures");
  if (!pricingOk) console.warn("Pricing load test had failures");

  process.exit(healthOk && pricingOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
