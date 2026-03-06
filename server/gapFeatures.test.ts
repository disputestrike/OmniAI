import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-gap",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createAnonContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

// ─── Brand Voice Router Tests ────────────────────────────────────────

describe("brandVoice router", () => {
  it("list returns empty array for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.brandVoice.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("requires authentication", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.brandVoice.list()).rejects.toThrow();
  });
});

// ─── Email Campaign Router Tests ────────────────────────────────────

describe("emailMarketing router", () => {
  it("list returns empty array for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.emailMarketing.listLists();
    expect(Array.isArray(result)).toBe(true);
  });

  it("requires authentication", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.emailMarketing.listLists()).rejects.toThrow();
  });
});

// ─── Landing Page Router Tests ────────────────────────────────────

describe("landingPageBuilder router", () => {
  it("list returns empty array for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.landingPageBuilder.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("requires authentication", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.landingPageBuilder.list()).rejects.toThrow();
  });
});

// ─── Automation Workflow Router Tests ────────────────────────────────

describe("automation router", () => {
  it("list returns empty array for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.automation.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("requires authentication", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.automation.list()).rejects.toThrow();
  });
});

// ─── Social Publish Router Tests ────────────────────────────────────

describe("socialPublish router", () => {
  it("connections returns empty array for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.socialPublish.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("requires authentication for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.socialPublish.list()).rejects.toThrow();
  });
});

// ─── Video Render Router Tests ────────────────────────────────────

describe("videoRender router", () => {
  it("list returns empty array for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.videoRender.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("requires authentication", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.videoRender.list()).rejects.toThrow();
  });
});

// ─── Webhook Router Tests ────────────────────────────────────

describe("webhooks router", () => {
  it("list returns empty array for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.webhooks.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("requires authentication", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.webhooks.list()).rejects.toThrow();
  });

  it("getAvailableEvents returns event list", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.webhooks.getAvailableEvents();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("event");
    expect(result[0]).toHaveProperty("description");
  });
});

// ─── Multi-Language Router Tests ────────────────────────────────────

describe("multiLanguage router", () => {
  it("getSupportedLanguages returns language list", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.multiLanguage.getSupportedLanguages();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(20);
    expect(result).toContain("English");
    expect(result).toContain("Spanish");
    expect(result).toContain("French");
    expect(result).toContain("Japanese");
  });

  it("requires authentication for translate", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.multiLanguage.translate({ text: "Hello", targetLanguage: "Spanish" })
    ).rejects.toThrow();
  });
});

// ─── Bulk Import Router Tests ────────────────────────────────────

describe("bulkImport router", () => {
  it("requires authentication", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.bulkImport.importProducts({
        data: [{ name: "Test", description: "Test product" }],
      })
    ).rejects.toThrow();
  });
});

// ─── Image Editor Router Tests ────────────────────────────────────

describe("imageEditor router", () => {
  it("requires authentication for removeBackground", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.imageEditor.removeBackground({ imageUrl: "https://example.com/img.png" })
    ).rejects.toThrow();
  });

  it("requires authentication for resize", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.imageEditor.resize({ imageUrl: "https://example.com/img.png", platform: "instagram-post" })
    ).rejects.toThrow();
  });
});

// ─── Competitor Spy Router Tests ────────────────────────────────────

describe("competitorSpy router", () => {
  it("requires authentication for analyzeAds", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.competitorSpy.analyzeAds({ competitorUrl: "https://example.com" })
    ).rejects.toThrow();
  });
});

// ─── Admin Router Tests ────────────────────────────────────

describe("admin router", () => {
  it("requires admin role for listUsers", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listUsers()).rejects.toThrow();
  });

  it("requires admin role for stats", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("requires authentication for admin routes", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listUsers()).rejects.toThrow();
  });
});

// ─── Platform Specs Module Tests ────────────────────────────────────

describe("platformSpecs module", () => {
  it("exports all expected functions", async () => {
    const mod = await import("../shared/platformSpecs");
    expect(typeof mod.getAllPlatformSpecs).toBe("function");
    expect(typeof mod.autoFormatContent).toBe("function");
    expect(typeof mod.getBestPostingTime).toBe("function");
    expect(typeof mod.getRecommendedAspectRatio).toBe("function");
  });

  it("getAllPlatforms returns 14 platforms", async () => {
    const { getAllPlatformSpecs } = await import("../shared/platformSpecs");
    const platforms = getAllPlatformSpecs();
    expect(platforms.length).toBeGreaterThanOrEqual(10);
  });

  it("autoFormatContent formats text correctly", async () => {
    const { autoFormatContent } = await import("../shared/platformSpecs");
    const result = autoFormatContent("Hello world this is a test post for formatting", "twitter");
    expect(result).toHaveProperty("formatted");
    expect(typeof result.formatted).toBe("string");
  });

  it("getBestPostingTime returns valid data", async () => {
    const { getBestPostingTime } = await import("../shared/platformSpecs");
    const result = getBestPostingTime("instagram", "Monday");
    expect(result).not.toBeNull();
    if (result) {
      expect(result).toHaveProperty("hours");
      expect(result).toHaveProperty("peak");
      expect(Array.isArray(result.hours)).toBe(true);
    }
  });

  it("getHashtagStrategy returns valid data", async () => {
    const { getRecommendedAspectRatio } = await import("../shared/platformSpecs");
    const result = getRecommendedAspectRatio("instagram", "feed");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── Stripe Products Tests ────────────────────────────────────

describe("stripe products", () => {
  it("exports PLANS with 5 tiers", async () => {
    const { PLANS } = await import("./stripe-products");
    const planKeys = Object.keys(PLANS);
    expect(planKeys.length).toBe(5);
  });

  it("each plan has required fields", async () => {
    const { PLANS } = await import("./stripe-products");
    for (const key of Object.keys(PLANS)) {
      const plan = PLANS[key];
      expect(plan).toHaveProperty("name");
      expect(plan).toHaveProperty("price");
      expect(plan).toHaveProperty("features");
      expect(Array.isArray(plan.features)).toBe(true);
    }
  });

  it("plans include a free tier at $0", async () => {
    const { PLANS } = await import("./stripe-products");
    const plans = Object.values(PLANS);
    const free = plans.find((p: any) => p.price === 0);
    expect(free).toBeDefined();
  });

  it("getPlanLimits returns limits for each plan", async () => {
    const { PLANS, getPlanLimits } = await import("./stripe-products");
    for (const key of Object.keys(PLANS)) {
      const limits = getPlanLimits(key);
      expect(limits).toHaveProperty("contentGenerations");
      expect(limits).toHaveProperty("imageGenerations");
      expect(typeof limits.contentGenerations).toBe("number");
    }
  });
});
