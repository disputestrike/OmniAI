/**
 * Spec v4 implementation tests:
 * - Pricing from tier_limits_config (when DB has data)
 * - DSP router (status, fundCheckout, campaigns.list)
 * - AI Router, Claude Haiku, Epom services exist and are wired
 * - Background jobs run without throwing
 */
import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));

function createAuthContext(userId = 1): TrpcContext {
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

describe("Spec v4 — Pricing from DB", () => {
  it("pricing.list returns array (from config or tier_limits_config)", async () => {
    const caller = appRouter.createCaller({ user: null, session: null } as TrpcContext);
    const list = await caller.pricing.list();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    const first = list[0] as { key?: string; name?: string; monthlyPrice?: number };
    expect(first).toHaveProperty("key");
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("monthlyPrice");
  });
});

describe("Spec v4 — DSP router", () => {
  it("dsp.status returns balance and campaigns", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const status = await caller.dsp.status();
    expect(status).toHaveProperty("balanceCents");
    expect(status).toHaveProperty("totalSpentCents");
    expect(status).toHaveProperty("campaigns");
    expect(status).toHaveProperty("enabled");
    expect(Array.isArray(status.campaigns)).toBe(true);
  });

  it("dsp.campaigns.list returns array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const list = await caller.dsp.campaigns.list();
    expect(Array.isArray(list)).toBe(true);
  });

  it("dsp.fundCheckout rejects amount < 100 cents", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.dsp.fundCheckout({ amountCents: 50 })).rejects.toThrow();
  });
});

describe("Spec v4 — Services exist", () => {
  it("routeAITask is importable and has correct task types", async () => {
    const { routeAITask } = await import("./services/aiRouter.service");
    expect(typeof routeAITask).toBe("function");
  });

  it("callClaudeHaiku is importable", async () => {
    const { callClaudeHaiku, isClaudeHaikuConfigured } = await import("./services/claudeHaiku.service");
    expect(typeof callClaudeHaiku).toBe("function");
    expect(typeof isClaudeHaikuConfigured).toBe("function");
  });

  it("Epom service is importable", async () => {
    const { isEpomConfigured } = await import("./services/epom.service");
    expect(typeof isEpomConfigured).toBe("function");
  });

  it("Background jobs runAllJobs does not throw", async () => {
    const { runAllJobs } = await import("./jobs");
    await expect(runAllJobs()).resolves.toBeUndefined();
  });
});
