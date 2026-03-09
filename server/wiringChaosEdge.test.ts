/**
 * Wiring, chaos, and edge-case tests (Spec v4 + enterprise battery).
 * - Wiring: critical v4 endpoints callable with correct auth
 * - Chaos: graceful degradation when DB null / Stripe missing / jobs fail
 * - Edge: boundary inputs, validation, auth boundaries
 */
import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));

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

const unauthedCtx: TrpcContext = {
  user: null,
  session: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
} as TrpcContext;

describe("Wiring — v4 endpoints callable with auth", () => {
  it("subscription.status returns object with expected keys", async () => {
    const caller = appRouter.createCaller(authCtx());
    const out = await caller.subscription.status();
    expect(out).toBeDefined();
    expect(typeof out).toBe("object");
    expect(out).toHaveProperty("plan");
    expect(out).toHaveProperty("trialEndsAt");
  });

  it("credits.balance returns object with usage/period", async () => {
    const caller = appRouter.createCaller(authCtx());
    const out = await caller.credits.balance();
    expect(out).toHaveProperty("purchasedCredits");
    expect(out).toHaveProperty("periodStart");
    expect(out).toHaveProperty("periodEnd");
  });

  it("credits.packages returns array", async () => {
    const caller = appRouter.createCaller(authCtx());
    const out = await caller.credits.packages();
    expect(Array.isArray(out)).toBe(true);
  });

  it("pricing.userCount returns a number", async () => {
    const caller = appRouter.createCaller(unauthedCtx);
    const out = await caller.pricing.userCount();
    expect(typeof out).toBe("number");
    expect(out).toBeGreaterThanOrEqual(0);
  });
});

describe("Chaos — graceful degradation", () => {
  it("pricing.list returns fallback array when DB is null", async () => {
    const caller = appRouter.createCaller(unauthedCtx);
    const list = await caller.pricing.list();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it("dsp.status returns safe defaults when DB is null", async () => {
    const caller = appRouter.createCaller(authCtx());
    const status = await caller.dsp.status();
    expect(status.balanceCents).toBe(0);
    expect(status.totalSpentCents).toBe(0);
    expect(Array.isArray(status.campaigns)).toBe(true);
  });

  it("runAllJobs does not throw when dependencies missing", async () => {
    const { runAllJobs } = await import("./jobs");
    await expect(runAllJobs()).resolves.toBeUndefined();
  });

  it("createDspFundCheckout returns url null when Stripe not configured", async () => {
    const { createDspFundCheckout } = await import("./stripe-routes");
    const result = await createDspFundCheckout(1, 5000, "https://example.com");
    expect(result).toHaveProperty("url");
    expect(result.url).toBeNull();
  });
});

describe("Edge cases — validation and boundaries", () => {
  it("dsp.fundCheckout rejects amountCents 0", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.dsp.fundCheckout({ amountCents: 0 })).rejects.toThrow();
  });

  it("dsp.fundCheckout rejects amountCents 99 (below min 100)", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.dsp.fundCheckout({ amountCents: 99 })).rejects.toThrow();
  });

  it("dsp.fundCheckout rejects negative amountCents", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.dsp.fundCheckout({ amountCents: -100 })).rejects.toThrow();
  });

  it("unauthenticated dsp.fundCheckout throws UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(unauthedCtx);
    await expect(caller.dsp.fundCheckout({ amountCents: 100 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("unauthenticated credits.balance throws UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(unauthedCtx);
    await expect(caller.credits.balance()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("pricing.list tier items have numeric monthlyPrice", async () => {
    const caller = appRouter.createCaller(unauthedCtx);
    const list = await caller.pricing.list();
    for (const tier of list as Array<{ key?: string; monthlyPrice?: number }>) {
      expect(typeof tier.monthlyPrice).toBe("number");
      expect(tier.monthlyPrice).toBeGreaterThanOrEqual(0);
    }
  });
});
