import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "google",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  // Products
  createProduct: vi.fn().mockResolvedValue({ id: 1 }),
  getProductsByUser: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, name: "Test Product", description: "A test product", category: "tech", analysisStatus: "pending", createdAt: new Date() },
  ]),
  getProductById: vi.fn().mockResolvedValue({
    id: 1, userId: 1, name: "Test Product", description: "A great test product",
    features: ["Feature A", "Feature B"], benefits: ["Benefit 1"], targetAudience: ["Developers"],
    tone: "professional", keywords: ["test", "product"],
  }),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  // Contents
  createContent: vi.fn().mockResolvedValue({ id: 1 }),
  getContentsByUser: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, type: "ad_copy_short", title: "Test Ad", body: "Buy now!", status: "draft", createdAt: new Date() },
  ]),
  getContentById: vi.fn().mockResolvedValue({
    id: 1, userId: 1, type: "ad_copy_short", title: "Test Ad", body: "Buy now! This is the best product ever.", status: "draft",
    productId: null, campaignId: null,
  }),
  updateContent: vi.fn(),
  deleteContent: vi.fn(),
  getContentsByProduct: vi.fn().mockResolvedValue([]),
  getContentsByCampaign: vi.fn().mockResolvedValue([]),
  // Creatives
  createCreative: vi.fn().mockResolvedValue({ id: 1 }),
  getCreativesByUser: vi.fn().mockResolvedValue([]),
  getCreativeById: vi.fn().mockResolvedValue(null),
  updateCreative: vi.fn(),
  deleteCreative: vi.fn(),
  // Video Ads
  createVideoAd: vi.fn().mockResolvedValue({ id: 1 }),
  getVideoAdsByUser: vi.fn().mockResolvedValue([]),
  getVideoAdById: vi.fn().mockResolvedValue(null),
  updateVideoAd: vi.fn(),
  deleteVideoAd: vi.fn(),
  // Campaigns
  createCampaign: vi.fn().mockResolvedValue({ id: 1 }),
  getCampaignsByUser: vi.fn().mockResolvedValue([]),
  getCampaignById: vi.fn().mockResolvedValue({
    id: 1, userId: 1, name: "Test Campaign", objective: "awareness",
    platforms: ["Instagram", "TikTok"], budget: "$5000", productId: 1, status: "draft",
  }),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
  // A/B Tests
  createAbTest: vi.fn().mockResolvedValue({ id: 1 }),
  getAbTestsByUser: vi.fn().mockResolvedValue([]),
  getAbTestById: vi.fn().mockResolvedValue({ id: 1, userId: 1, name: "Test AB", status: "draft" }),
  updateAbTest: vi.fn(),
  createAbTestVariant: vi.fn().mockResolvedValue({ id: 1 }),
  getVariantsByTest: vi.fn().mockResolvedValue([]),
  updateAbTestVariant: vi.fn(),
  // Scheduled Posts
  createScheduledPost: vi.fn().mockResolvedValue({ id: 1 }),
  getScheduledPostsByUser: vi.fn().mockResolvedValue([]),
  updateScheduledPost: vi.fn(),
  deleteScheduledPost: vi.fn(),
  // Leads
  createLead: vi.fn().mockResolvedValue({ id: 1 }),
  getLeadsByUser: vi.fn().mockResolvedValue([]),
  getLeadById: vi.fn().mockResolvedValue(null),
  updateLead: vi.fn(),
  deleteLead: vi.fn(),
  getLeadsByCampaign: vi.fn().mockResolvedValue([]),
  // Analytics
  createAnalyticsEvent: vi.fn().mockResolvedValue({ id: 1 }),
  getAnalyticsByUser: vi.fn().mockResolvedValue([]),
  getAnalyticsByCampaign: vi.fn().mockResolvedValue([]),
  getAnalyticsSummary: vi.fn().mockResolvedValue({
    totalImpressions: 1000, totalClicks: 50, totalConversions: 5, totalSpend: "100.00", totalRevenue: "500.00",
  }),
  getDashboardStats: vi.fn().mockResolvedValue({
    products: 3, campaigns: 2, contents: 10, leads: 5, creatives: 4,
    analytics: { totalImpressions: 1000, totalClicks: 50, totalConversions: 5, totalSpend: "100.00", totalRevenue: "500.00" },
  }),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "AI generated content response" } }],
  }),
}));

// Mock image generation
vi.mock("./_core/imageGeneration.ts", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/image.png" }),
}));

describe("Product Router", () => {
  it("lists products for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.product.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name", "Test Product");
  });

  it("creates a product", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.product.create({
      name: "New Product",
      description: "A new product description",
      category: "SaaS",
    });
    expect(result).toHaveProperty("id");
  });

  it("deletes a product", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.product.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("rejects unauthenticated product list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.product.list()).rejects.toThrow();
  });
});

describe("Content Router", () => {
  it("lists content for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.content.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("generates content with AI", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.content.generate({
      type: "ad_copy_short",
      platform: "instagram",
      customPrompt: "Make it punchy",
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("body");
  });

  it("generates content with product context", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.content.generate({
      type: "blog_post",
      productId: 1,
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("body");
  });

  it("remixes content", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.content.remix({
      originalContent: "Buy our product! It's the best thing ever. Limited time offer.",
      instruction: "Make it more professional",
      targetType: "linkedin_article",
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("body");
    expect(result.title).toContain("[Remixed]");
  });

  it("repurposes content into multiple formats", async () => {
    // Need to mock LLM to return JSON for repurpose
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            pieces: [
              { type: "twitter_thread", title: "Thread Version", body: "1/ Here's the thread..." },
              { type: "social_caption", title: "Caption Version", body: "Check this out!" },
            ],
          }),
        },
      }],
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.content.repurpose({
      contentId: 1,
      targetTypes: ["twitter_thread", "social_caption"],
    });
    expect(result).toHaveProperty("created");
    expect(result.created.length).toBe(2);
  });

  it("deletes content", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.content.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("rejects unauthenticated content generation", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.content.generate({ type: "ad_copy_short" })).rejects.toThrow();
  });
});

describe("Campaign Router", () => {
  it("creates a campaign", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaign.create({
      name: "Summer Launch",
      description: "Summer product launch campaign",
      objective: "sales",
      platforms: ["Instagram", "TikTok", "YouTube"],
      budget: "$10,000",
    });
    expect(result).toHaveProperty("id");
  });

  it("lists campaigns", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaign.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("generates campaign strategy", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaign.generateStrategy({ campaignId: 1 });
    expect(result).toHaveProperty("strategy");
    expect(typeof result.strategy).toBe("string");
  });

  it("updates campaign status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaign.update({ id: 1, status: "active" });
    expect(result).toEqual({ success: true });
  });

  it("deletes a campaign", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaign.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

describe("A/B Testing Router", () => {
  it("creates an A/B test", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.abTest.create({ name: "Headline Test" });
    expect(result).toHaveProperty("id");
  });

  it("lists A/B tests", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.abTest.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("adds a variant to a test", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.abTest.addVariant({
      testId: 1,
      name: "Variant A",
    });
    expect(result).toHaveProperty("id");
  });

  it("updates test status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.abTest.updateStatus({ id: 1, status: "running" });
    expect(result).toEqual({ success: true });
  });
});

describe("Lead Router", () => {
  it("creates a lead", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.lead.create({
      name: "John Doe",
      email: "john@example.com",
      company: "Acme Corp",
      source: "landing_page",
      platform: "google",
    });
    expect(result).toHaveProperty("id");
  });

  it("lists leads", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.lead.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("bulk imports leads", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.lead.bulkImport({
      leads: [
        { name: "Lead 1", email: "lead1@test.com" },
        { name: "Lead 2", email: "lead2@test.com" },
        { name: "Lead 3", email: "lead3@test.com" },
      ],
    });
    expect(result).toHaveProperty("imported", 3);
  });

  it("updates lead status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.lead.update({ id: 1, status: "qualified", score: 85 });
    expect(result).toEqual({ success: true });
  });

  it("deletes a lead", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.lead.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

describe("Schedule Router", () => {
  it("creates a scheduled post", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.schedule.create({
      platform: "instagram",
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(result).toHaveProperty("id");
  });

  it("lists scheduled posts", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.schedule.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("gets optimal posting times", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            bestTimes: [{ day: "Monday", times: ["09:00", "12:00", "18:00"] }],
            reasoning: "Peak engagement hours",
            timezone: "UTC",
          }),
        },
      }],
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.schedule.getOptimalTimes({ platform: "instagram" });
    expect(result).toHaveProperty("bestTimes");
    expect(result).toHaveProperty("reasoning");
  });
});

describe("Analytics Router", () => {
  it("gets analytics summary", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analytics.summary();
    expect(result).toHaveProperty("totalImpressions");
    expect(result).toHaveProperty("totalClicks");
    expect(result).toHaveProperty("totalConversions");
  });

  it("records an analytics event", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analytics.record({
      eventType: "impression",
      platform: "instagram",
      impressions: 1000,
      clicks: 50,
      conversions: 5,
      spend: "100.00",
      revenue: "500.00",
    });
    expect(result).toHaveProperty("id");
  });

  it("generates AI insights", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analytics.getInsights();
    expect(result).toHaveProperty("insights");
    expect(typeof result.insights).toBe("string");
  });
});

describe("AI Chat Router", () => {
  it("sends a message and gets a reply", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.aiChat.send({
      message: "How do I make my product go viral?",
    });
    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
  });

  it("sends a message with history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.aiChat.send({
      message: "What about TikTok specifically?",
      history: [
        { role: "user", content: "How do I make my product go viral?" },
        { role: "assistant", content: "Here are some strategies..." },
      ],
    });
    expect(result).toHaveProperty("reply");
  });

  it("rejects unauthenticated chat", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.aiChat.send({ message: "Hello" })).rejects.toThrow();
  });
});

describe("Dashboard Router", () => {
  it("returns dashboard stats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.stats();
    expect(result).toHaveProperty("products");
    expect(result).toHaveProperty("campaigns");
    expect(result).toHaveProperty("contents");
    expect(result).toHaveProperty("leads");
    expect(result).toHaveProperty("creatives");
    expect(result).toHaveProperty("analytics");
  });
});
