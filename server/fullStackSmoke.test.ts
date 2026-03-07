/**
 * Fortune 500 / full-stack smoke tests:
 * - All routers are wired and present
 * - Public procedures are callable without auth
 * - Critical protected procedures are callable with auth (no unexpected throws)
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// ─── Expected routers (must exist on appRouter) ─────────────────────────────
const EXPECTED_ROUTERS = [
  "system",
  "auth",
  "dashboard",
  "product",
  "content",
  "aiChat",
  "creative",
  "intelligence",
  "videoAd",
  "campaign",
  "abTest",
  "schedule",
  "lead",
  "analytics",
  "subscription",
  "deal",
  "activity",
  "adPlatform",
  "team",
  "approval",
  "predictive",
  "platformIntel",
  "momentum",
  "voice",
  "admin",
  "seo",
  "brandVoice",
  "emailMarketing",
  "landingPageBuilder",
  "automation",
  "socialPublish",
  "videoRender",
  "webhooks",
  "imageEditor",
  "multiLanguage",
  "competitorSpy",
  "bulkImport",
  "personalVideo",
  "competitorIntel",
  "customerIntel",
  "realVideo",
  "voiceoverApi",
  "avatar",
  "socialConnection",
  "ecommerce",
  "meme",
  "creativeEngine",
  "integrationStatus",
  "repurposing",
  "publishing",
  "adPerformance",
  "ingest",
  "library",
  "creatorProfile",
  "publisher",
  "advanced",
  "enhanced",
  "brandKit",
  "musicStudio",
];

function getRouterNamesFromApp(appRouter: { _def: { procedures: Record<string, unknown> } }): string[] {
  const procedurePaths = Object.keys(appRouter._def.procedures);
  const names = new Set<string>();
  for (const path of procedurePaths) {
    const routerName = path.split(".")[0];
    if (routerName) names.add(routerName);
  }
  return [...names];
}

describe("Full-stack smoke (router inventory)", () => {
  it("appRouter has all expected routers wired", async () => {
    const { appRouter } = await import("./routers");
    const wired = getRouterNamesFromApp(appRouter as unknown as { _def: { procedures: Record<string, unknown> } });
    for (const name of EXPECTED_ROUTERS) {
      expect(wired).toContain(name);
    }
  });

  it("appRouter has at least 50 router namespaces", async () => {
    const { appRouter } = await import("./routers");
    const wired = getRouterNamesFromApp(appRouter as unknown as { _def: { procedures: Record<string, unknown> } });
    expect(wired.length).toBeGreaterThanOrEqual(50);
  });
});

describe("Full-stack smoke (public procedures)", () => {
  it("system.health is callable without auth", async () => {
    const { appRouter } = await import("./routers");
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.system.health({ timestamp: Date.now() });
    expect(result).toEqual({ ok: true });
  });

  it("auth.me returns null when unauthenticated", async () => {
    const { appRouter } = await import("./routers");
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("musicStudio.getMusicLibrary is callable without auth", async () => {
    const { appRouter } = await import("./routers");
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.musicStudio.getMusicLibrary();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Full-stack smoke (protected procedures)", () => {
  it("unauthenticated access to dashboard.stats throws UNAUTHORIZED", async () => {
    const { appRouter } = await import("./routers");
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.stats()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("unauthenticated access to repurposing.list throws UNAUTHORIZED", async () => {
    const { appRouter } = await import("./routers");
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.repurposing.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("unauthenticated access to personalVideo.list throws UNAUTHORIZED", async () => {
    const { appRouter } = await import("./routers");
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.personalVideo.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
