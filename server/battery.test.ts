/**
 * Full battery: click-through, edge cases, chaos, security/intrusion, adversarial, hallucination, catastrophe.
 * Run: pnpm test -- server/battery.test.ts
 */
import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { checkRateLimit, hasSQLInjectionPatterns, hasXSSPatterns, sanitizeString } from "./security";

vi.mock("./db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));

const unauthed: TrpcContext = {
  user: null,
  session: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
} as TrpcContext;

function authCtx(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-${userId}`,
      name: "Test User",
      email: "test@example.com",
      role: "user",
      subscriptionPlan: "professional",
    },
    session: { sub: String(userId), email: "test@example.com" },
  } as TrpcContext;
}

// ─── Click-through: critical user flow (public → protected sequence) ─────
describe("Click-through", () => {
  it("flow: pricing list → auth me (null) → with auth: subscription.status → dsp.status → credits.balance", async () => {
    const callerPublic = appRouter.createCaller(unauthed);
    const callerAuth = appRouter.createCaller(authCtx());

    const pricing = await callerPublic.pricing.list();
    expect(Array.isArray(pricing)).toBe(true);

    const me = await callerPublic.auth.me();
    expect(me).toBeNull();

    const sub = await callerAuth.subscription.status();
    expect(sub).toBeDefined();
    expect(typeof sub.plan).toBe("string");

    const dsp = await callerAuth.dsp.status();
    expect(dsp).toHaveProperty("balanceCents");
    expect(dsp).toHaveProperty("campaigns");

    const credits = await callerAuth.credits.balance();
    expect(credits).toHaveProperty("purchasedCredits");
    expect(credits).toHaveProperty("periodStart");
  });
});

// ─── Edge cases: boundaries, empty, huge, special chars ───────────────────
describe("Edge cases", () => {
  it("dsp.fundCheckout rejects 0, 1, 99 (min 100 cents)", async () => {
    const caller = appRouter.createCaller(authCtx());
    for (const cents of [0, 1, 99]) {
      await expect(caller.dsp.fundCheckout({ amountCents: cents })).rejects.toThrow();
    }
  });

  it("dsp.fundCheckout with 100 passes validation (may throw if Stripe not configured)", async () => {
    const caller = appRouter.createCaller(authCtx());
    try {
      const out = await caller.dsp.fundCheckout({ amountCents: 100 });
      expect(out).toHaveProperty("url");
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      expect(err?.code).not.toBe("BAD_REQUEST");
      expect(String(err?.message || "")).not.toMatch(/min|100|amount/i);
    }
  });

  it("pricing.list returns valid tier shape (no hallucinated fields)", async () => {
    const caller = appRouter.createCaller(unauthed);
    const list = await caller.pricing.list();
    for (const tier of list as Array<Record<string, unknown>>) {
      expect(tier).toHaveProperty("key");
      expect(tier).toHaveProperty("name");
      expect(tier).toHaveProperty("monthlyPrice");
      expect(typeof tier.monthlyPrice).toBe("number");
      expect(tier.monthlyPrice).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── Chaos: dependency failures, graceful degradation ─────────────────────
describe("Chaos", () => {
  it("runAllJobs does not throw when OpenAI/Claude missing", async () => {
    const { runAllJobs } = await import("./jobs");
    await expect(runAllJobs()).resolves.toBeUndefined();
  });

  it("createDspFundCheckout returns null url when Stripe missing", async () => {
    const { createDspFundCheckout } = await import("./stripe-routes");
    const out = await createDspFundCheckout(1, 5000, "https://example.com");
    expect(out.url).toBeNull();
  });

  it("dsp.status returns safe defaults when DB null", async () => {
    const caller = appRouter.createCaller(authCtx());
    const s = await caller.dsp.status();
    expect(s.balanceCents).toBe(0);
    expect(s.campaigns).toEqual([]);
  });
});

// ─── Security / intrusion: auth bypass, injection ────────────────────────
describe("Security / intrusion", () => {
  it("protected procedures reject unauthenticated (UNAUTHORIZED)", async () => {
    const caller = appRouter.createCaller(unauthed);
    await expect(caller.dashboard.stats()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.dsp.status()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.subscription.status()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.credits.balance()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("SQL injection patterns detected by security module", () => {
    expect(hasSQLInjectionPatterns("'; DROP TABLE users; --")).toBe(true);
    expect(hasSQLInjectionPatterns("1 OR 1=1")).toBe(true);
    expect(hasSQLInjectionPatterns("normal text")).toBe(false);
  });

  it("XSS patterns detected by security module", () => {
    expect(hasXSSPatterns("<script>alert(1)</script>")).toBe(true);
    expect(hasXSSPatterns("<img src=x onerror=alert(1)>")).toBe(true);
    expect(hasXSSPatterns("hello")).toBe(false);
  });

  it("sanitizeString neutralizes script tag", () => {
    const out = sanitizeString("<script>alert(1)</script>");
    expect(out).not.toMatch(/<script/i);
    expect(out).toContain("&lt;");
  });

  it("admin procedure rejects non-admin user (FORBIDDEN)", async () => {
    const caller = appRouter.createCaller(authCtx()); // role: user
    await expect(caller.system.notifyOwner({ title: "x", content: "y" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rate limit throws after exceeding max", () => {
    const ip = "192.168.1.1";
    const key = "battery-test";
    const windowMs = 60_000;
    const max = 3;
    checkRateLimit(ip, key, windowMs, max);
    checkRateLimit(ip, key, windowMs, max);
    checkRateLimit(ip, key, windowMs, max);
    expect(() => checkRateLimit(ip, key, windowMs, max)).toThrow("Too many requests");
  });
});

// ─── Adversarial: wrong types, malformed input ───────────────────────────
describe("Adversarial", () => {
  it("dsp.fundCheckout rejects non-number amountCents (Zod validation)", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.dsp.fundCheckout({ amountCents: "100" as unknown as number })).rejects.toThrow();
    await expect(caller.dsp.fundCheckout({ amountCents: NaN })).rejects.toThrow();
  });

  it("dsp.fundCheckout rejects negative amountCents", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.dsp.fundCheckout({ amountCents: -100 })).rejects.toThrow();
  });

  it("subscription.status does not leak internal errors to client", async () => {
    const caller = appRouter.createCaller(authCtx());
    const out = await caller.subscription.status();
    expect(out).not.toHaveProperty("stack");
    expect(out).not.toHaveProperty("sql");
  });
});

// ─── Hallucination: no false success ────────────────────────────────────
describe("Hallucination", () => {
  it("fundCheckout never returns url when amountCents < 100", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.dsp.fundCheckout({ amountCents: 50 })).rejects.toThrow();
  });

  it("dsp.status balance is numeric, not string", async () => {
    const caller = appRouter.createCaller(authCtx());
    const s = await caller.dsp.status();
    expect(typeof s.balanceCents).toBe("number");
    expect(typeof s.totalSpentCents).toBe("number");
  });

  it("pricing.list monthlyPrice is number", async () => {
    const caller = appRouter.createCaller(unauthed);
    const list = await caller.pricing.list();
    (list as Array<{ monthlyPrice?: unknown }>).forEach((t) => {
      expect(typeof t.monthlyPrice).toBe("number");
    });
  });
});

// ─── Catastrophe: graceful degradation, no uncaught ───────────────────────
describe("Catastrophe", () => {
  it("runAllJobs catches and does not throw", async () => {
    const { runAllJobs } = await import("./jobs");
    await runAllJobs();
  });

  it("createDspFundCheckout does not throw when Stripe null", async () => {
    const { createDspFundCheckout } = await import("./stripe-routes");
    await expect(createDspFundCheckout(1, 1000, "https://x.com")).resolves.toEqual({ url: null });
  });
});
