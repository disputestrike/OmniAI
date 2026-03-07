import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  sanitizeString,
  sanitizeObject,
  isValidEmail,
  isValidUrl,
  isValidPhone,
  enforceMaxLength,
  hasSQLInjectionPatterns,
  hasXSSPatterns,
} from "./security";

// ═══════════════════════════════════════════════════════════════════════
// CONTEXT FACTORIES
// ═══════════════════════════════════════════════════════════════════════

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
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
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionPlan: "free",
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createAuthContext({ role: "admin", id: 99 });
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ═══════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  createProduct: vi.fn().mockResolvedValue({ id: 1 }),
  getProductsByUser: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, name: "Test Product", description: "A test product", category: "tech", analysisStatus: "completed", createdAt: new Date() },
  ]),
  getProductById: vi.fn().mockResolvedValue({
    id: 1, userId: 1, name: "Test Product", description: "A great test product",
    features: ["Feature A", "Feature B"], benefits: ["Benefit 1"], targetAudience: ["Developers"],
    tone: "professional", keywords: ["test", "product"],
  }),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
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
  createCreative: vi.fn().mockResolvedValue({ id: 1 }),
  getCreativesByUser: vi.fn().mockResolvedValue([{ id: 1, userId: 1, prompt: "test", imageUrl: "https://example.com/img.png", style: "photorealistic", createdAt: new Date() }]),
  getCreativeById: vi.fn().mockResolvedValue({ id: 1, userId: 1, prompt: "test", imageUrl: "https://example.com/img.png" }),
  updateCreative: vi.fn(),
  deleteCreative: vi.fn(),
  createVideoAd: vi.fn().mockResolvedValue({ id: 1 }),
  getVideoAdsByUser: vi.fn().mockResolvedValue([]),
  getVideoAdById: vi.fn().mockResolvedValue({ id: 1, userId: 1, title: "Test Video", platform: "tiktok" }),
  updateVideoAd: vi.fn(),
  deleteVideoAd: vi.fn(),
  createCampaign: vi.fn().mockResolvedValue({ id: 1 }),
  getCampaignsByUser: vi.fn().mockResolvedValue([{ id: 1, userId: 1, name: "Test Campaign", status: "draft" }]),
  getCampaignById: vi.fn().mockResolvedValue({
    id: 1, userId: 1, name: "Test Campaign", objective: "awareness",
    platforms: ["Instagram", "TikTok"], budget: "$5000", productId: 1, status: "draft",
  }),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
  createAbTest: vi.fn().mockResolvedValue({ id: 1 }),
  getAbTestsByUser: vi.fn().mockResolvedValue([{ id: 1, userId: 1, name: "Test AB", status: "draft" }]),
  getAbTestById: vi.fn().mockResolvedValue({ id: 1, userId: 1, name: "Test AB", status: "draft" }),
  updateAbTest: vi.fn(),
  createAbTestVariant: vi.fn().mockResolvedValue({ id: 1 }),
  getVariantsByTest: vi.fn().mockResolvedValue([]),
  updateAbTestVariant: vi.fn(),
  createScheduledPost: vi.fn().mockResolvedValue({ id: 1 }),
  getScheduledPostsByUser: vi.fn().mockResolvedValue([]),
  updateScheduledPost: vi.fn(),
  deleteScheduledPost: vi.fn(),
  createLead: vi.fn().mockResolvedValue({ id: 1 }),
  getLeadsByUser: vi.fn().mockResolvedValue([{ id: 1, userId: 1, name: "John", email: "john@test.com", status: "new" }]),
  getLeadById: vi.fn().mockResolvedValue({ id: 1, userId: 1, name: "John", email: "john@test.com" }),
  updateLead: vi.fn(),
  deleteLead: vi.fn(),
  getLeadsByCampaign: vi.fn().mockResolvedValue([]),
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

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "AI generated content response" } }],
  }),
}));

vi.mock("./_core/imageGeneration.ts", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/generated-image.png" }),
}));

// ═══════════════════════════════════════════════════════════════════════
// 1. AUTHENTICATION & AUTHORIZATION TESTS
// ═══════════════════════════════════════════════════════════════════════

describe("Authentication & Authorization", () => {
  describe("Protected routes reject unauthenticated users", () => {
    const protectedRoutes = [
      { name: "dashboard.stats", fn: (c: any) => c.dashboard.stats() },
      { name: "product.list", fn: (c: any) => c.product.list() },
      { name: "product.create", fn: (c: any) => c.product.create({ name: "test" }) },
      { name: "product.delete", fn: (c: any) => c.product.delete({ id: 1 }) },
      { name: "content.list", fn: (c: any) => c.content.list() },
      { name: "content.generate", fn: (c: any) => c.content.generate({ type: "ad_copy_short" }) },
      { name: "content.delete", fn: (c: any) => c.content.delete({ id: 1 }) },
      { name: "creative.list", fn: (c: any) => c.creative.list() },
      { name: "creative.generate", fn: (c: any) => c.creative.generate({ prompt: "test", style: "photorealistic" }) },
      { name: "videoAd.list", fn: (c: any) => c.videoAd.list() },
      { name: "campaign.list", fn: (c: any) => c.campaign.list() },
      { name: "campaign.create", fn: (c: any) => c.campaign.create({ name: "test", objective: "awareness", platforms: ["Instagram"] }) },
      { name: "abTest.list", fn: (c: any) => c.abTest.list() },
      { name: "schedule.list", fn: (c: any) => c.schedule.list() },
      { name: "lead.list", fn: (c: any) => c.lead.list() },
      { name: "lead.create", fn: (c: any) => c.lead.create({ name: "test" }) },
      { name: "analytics.summary", fn: (c: any) => c.analytics.summary() },
      { name: "aiChat.send", fn: (c: any) => c.aiChat.send({ message: "hello" }) },
      { name: "subscription.status", fn: (c: any) => c.subscription.status() },
    ];

    protectedRoutes.forEach(({ name, fn }) => {
      it(`rejects unauthenticated access to ${name}`, async () => {
        const ctx = createUnauthContext();
        const caller = appRouter.createCaller(ctx);
        await expect(fn(caller)).rejects.toThrow();
      });
    });
  });

  describe("Authenticated users can access protected routes", () => {
    it("dashboard.stats returns data", async () => {
      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.dashboard.stats();
      expect(result).toHaveProperty("products");
      expect(result).toHaveProperty("campaigns");
    });

    it("subscription.status returns plan info", async () => {
      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.subscription.status();
      expect(result).toHaveProperty("plan");
      expect(result.plan).toBe("free");
    });
  });

  describe("Auth routes", () => {
    it("auth.me returns null for unauthenticated", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      const result = await caller.auth.me();
      expect(result).toBeNull();
    });

    it("auth.me returns user for authenticated", async () => {
      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.auth.me();
      expect(result).toHaveProperty("id", 1);
      expect(result).toHaveProperty("email", "test@example.com");
    });

    it("auth.logout clears cookie", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();
      expect(result).toEqual({ success: true });
      expect(ctx.res.clearCookie).toHaveBeenCalled();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. PRODUCT ROUTER COMPREHENSIVE TESTS
// ═══════════════════════════════════════════════════════════════════════

describe("Product Router - Comprehensive", () => {
  it("creates product with minimal input", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.product.create({ name: "Minimal Product" });
    expect(result).toHaveProperty("id");
  });

  it("creates product with full input", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.product.create({
      name: "Full Product",
      description: "A comprehensive product description with all details",
      url: "https://example.com/product",
      imageUrls: ["https://example.com/img1.png", "https://example.com/img2.png"],
      category: "E-Commerce",
    });
    expect(result).toHaveProperty("id");
  });

  it("rejects product with empty name", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.product.create({ name: "" })).rejects.toThrow();
  });

  it("lists products", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.product.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("gets product by id", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.product.get({ id: 1 });
    expect(result).toHaveProperty("name", "Test Product");
  });

  it("analyzes product with AI", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            features: ["Feature 1"], benefits: ["Benefit 1"],
            targetAudience: ["Developers"], positioning: "Best product",
            keywords: ["test"], tone: "professional",
            competitiveAdvantages: ["Fast"], painPoints: ["Slow alternatives"],
          }),
        },
      }],
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.product.analyze({ id: 1 });
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("analysis");
  });

  it("deletes product", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.product.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. CONTENT ROUTER COMPREHENSIVE TESTS
// ═══════════════════════════════════════════════════════════════════════

describe("Content Router - Comprehensive", () => {
  const contentTypes = [
    "ad_copy_short", "ad_copy_long", "blog_post", "seo_meta", "social_caption",
    "video_script", "email_copy", "pr_release", "podcast_script", "tv_script",
    "radio_script", "copywriting", "amazon_listing", "google_ads", "youtube_seo",
    "twitter_thread", "linkedin_article", "whatsapp_broadcast", "sms_copy",
    "story_content", "ugc_script", "landing_page",
  ] as const;

  contentTypes.forEach((type) => {
    it(`generates ${type} content`, async () => {
      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.content.generate({ type });
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("body");
    });
  });

  it("generates content with product context", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.content.generate({ type: "blog_post", productId: 1 });
    expect(result).toHaveProperty("id");
  });

  it("generates content with campaign context", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.content.generate({ type: "social_caption", campaignId: 1 });
    expect(result).toHaveProperty("id");
  });

  it("generates content with platform specification", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.content.generate({ type: "social_caption", platform: "tiktok" });
    expect(result).toHaveProperty("id");
  });

  it("generates content with custom prompt", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.content.generate({ type: "ad_copy_short", customPrompt: "Make it funny and viral" });
    expect(result).toHaveProperty("id");
  });

  it("remixes content", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.content.remix({
      originalContent: "Original marketing copy here",
      instruction: "Make it more persuasive",
      targetType: "ad_copy_long",
    });
    expect(result).toHaveProperty("id");
    expect(result.title).toContain("[Remixed]");
  });

  it("repurposes content into multiple formats", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            pieces: [
              { type: "twitter_thread", title: "Thread", body: "1/ Thread content..." },
              { type: "sms_copy", title: "SMS", body: "Short SMS version" },
            ],
          }),
        },
      }],
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.content.repurpose({
      contentId: 1,
      targetTypes: ["twitter_thread", "sms_copy"],
    });
    expect(result).toHaveProperty("created");
    expect(result.created.length).toBe(2);
  });

  it("updates content", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.content.update({ id: 1, title: "Updated Title", body: "Updated body" });
    expect(result).toEqual({ success: true });
  });

  it("deletes content", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.content.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. CREATIVE ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════

describe("Creative Engine - Comprehensive", () => {
  it("generates creative with prompt", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.creative.generate({ prompt: "A stunning product photo", style: "photorealistic", type: "ad_image" });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("imageUrl");
    expect(result.imageUrl).toContain("https://");
  });

  it("generates creative with product context", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.creative.generate({ prompt: "Product ad", style: "minimal", type: "social_graphic", productId: 1 });
    expect(result).toHaveProperty("id");
  });

  it("lists creatives", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.creative.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deletes creative", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.creative.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. VIDEO AD TESTS
// ═══════════════════════════════════════════════════════════════════════

describe("Video Ad Router - Comprehensive", () => {
  it("generates video ad script", async () => {
    const { invokeLLM } = await import("./_core/llm");
    // Mock must match the exact JSON schema the router expects
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            script: "Scene 1: Open with hook...",
            voiceoverText: "Introducing the best product ever...",
            storyboard: [
              { scene: "Scene 1", description: "Product close-up with dramatic lighting", duration: "3s" },
              { scene: "Scene 2", description: "Features demo with text overlay", duration: "5s" },
            ],
            hook: "Stop scrolling! You need to see this.",
            cta: "Shop now - link in bio!",
          }),
        },
      }],
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.videoAd.generate({
      platform: "tiktok",
      duration: 30,
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("script");
    expect(result).toHaveProperty("hook");
    expect(result).toHaveProperty("storyboard");
  });

  it("lists video ads", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.videoAd.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deletes video ad", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.videoAd.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. CAMPAIGN ROUTER COMPREHENSIVE TESTS
// ═══════════════════════════════════════════════════════════════════════

describe("Campaign Router - Comprehensive", () => {
  it("creates campaign with all platforms", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.campaign.create({
      name: "Global Launch",
      description: "Multi-platform global campaign",
      objective: "sales",
      platforms: ["Instagram", "TikTok", "YouTube", "Facebook", "LinkedIn", "Twitter/X", "Google Ads", "Amazon"],
      budget: "$50,000",
      productId: 1,
    });
    expect(result).toHaveProperty("id");
  });

  it("creates campaign with minimal input", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.campaign.create({
      name: "Quick Campaign",
      objective: "awareness",
      platforms: ["Instagram"],
    });
    expect(result).toHaveProperty("id");
  });

  it("generates campaign strategy", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.campaign.generateStrategy({ campaignId: 1 });
    expect(result).toHaveProperty("strategy");
    expect(typeof result.strategy).toBe("string");
  });

  it("updates campaign", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.campaign.update({ id: 1, status: "active" });
    expect(result).toEqual({ success: true });
  });

  it("deletes campaign", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.campaign.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 7. A/B TESTING COMPREHENSIVE
// ═══════════════════════════════════════════════════════════════════════

describe("A/B Testing - Comprehensive", () => {
  it("creates test", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.abTest.create({ name: "Headline Test", campaignId: 1 });
    expect(result).toHaveProperty("id");
  });

  it("adds variant", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.abTest.addVariant({ testId: 1, name: "Variant A", contentId: 1 });
    expect(result).toHaveProperty("id");
  });

  it("updates test status to running", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.abTest.updateStatus({ id: 1, status: "running" });
    expect(result).toEqual({ success: true });
  });

  it("updates variant metrics", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.abTest.updateVariant({ id: 1, impressions: 5000, clicks: 250, conversions: 25 });
    expect(result).toEqual({ success: true });
  });

  it("lists tests", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.abTest.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 8. SCHEDULER TESTS
// ═══════════════════════════════════════════════════════════════════════

describe("Scheduler - Comprehensive", () => {
  it("creates scheduled post", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.schedule.create({
      platform: "instagram",
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      contentId: 1,
    });
    expect(result).toHaveProperty("id");
  });

  it("creates scheduled post for future date", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const futureDate = new Date(Date.now() + 7 * 86400000); // 7 days from now
    const result = await caller.schedule.create({
      platform: "youtube",
      scheduledAt: futureDate.toISOString(),
    });
    expect(result).toHaveProperty("id");
  });

  it("gets optimal posting times", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            bestTimes: [
              { day: "Monday", times: ["09:00", "12:00", "18:00"] },
              { day: "Wednesday", times: ["10:00", "14:00", "20:00"] },
            ],
            reasoning: "Based on audience engagement patterns",
            timezone: "UTC",
          }),
        },
      }],
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.schedule.getOptimalTimes({ platform: "tiktok" });
    expect(result).toHaveProperty("bestTimes");
    expect(Array.isArray(result.bestTimes)).toBe(true);
  });

  it("lists scheduled posts", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.schedule.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deletes scheduled post", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.schedule.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 9. LEAD MANAGEMENT COMPREHENSIVE
// ═══════════════════════════════════════════════════════════════════════

describe("Lead Management - Comprehensive", () => {
  it("creates lead with full info", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.lead.create({
      name: "Jane Smith",
      email: "jane@company.com",
      phone: "+1-555-0123",
      company: "TechCorp",
      source: "landing_page",
      platform: "google",
      campaignId: 1,
    });
    expect(result).toHaveProperty("id");
  });

  it("creates lead with minimal info", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.lead.create({ name: "Quick Lead" });
    expect(result).toHaveProperty("id");
  });

  it("bulk imports leads", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.lead.bulkImport({
      leads: [
        { name: "Lead 1", email: "l1@test.com" },
        { name: "Lead 2", email: "l2@test.com" },
        { name: "Lead 3", email: "l3@test.com" },
        { name: "Lead 4", email: "l4@test.com" },
        { name: "Lead 5", email: "l5@test.com" },
      ],
    });
    expect(result).toHaveProperty("imported", 5);
  });

  it("updates lead status through pipeline", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const statuses = ["contacted", "qualified", "converted"] as const;
    for (const status of statuses) {
      const result = await caller.lead.update({ id: 1, status });
      expect(result).toEqual({ success: true });
    }
  });

  it("updates lead score", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.lead.update({ id: 1, score: 95 });
    expect(result).toEqual({ success: true });
  });

  it("deletes lead", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.lead.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 10. ANALYTICS COMPREHENSIVE
// ═══════════════════════════════════════════════════════════════════════

describe("Analytics - Comprehensive", () => {
  it("returns summary with all metrics", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.analytics.summary();
    expect(result).toHaveProperty("totalImpressions");
    expect(result).toHaveProperty("totalClicks");
    expect(result).toHaveProperty("totalConversions");
    expect(result).toHaveProperty("totalSpend");
    expect(result).toHaveProperty("totalRevenue");
  });

  it("records analytics event", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.analytics.record({
      eventType: "impression",
      platform: "instagram",
      campaignId: 1,
      impressions: 10000,
      clicks: 500,
      conversions: 50,
      spend: "200.00",
      revenue: "1500.00",
    });
    expect(result).toHaveProperty("id");
  });

  it("generates AI insights", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.analytics.getInsights();
    expect(result).toHaveProperty("insights");
    expect(typeof result.insights).toBe("string");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 11. AI CHAT / AGENTS COMPREHENSIVE
// ═══════════════════════════════════════════════════════════════════════

describe("AI Chat / Agents - Comprehensive", () => {
  it("sends basic message", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.aiChat.send({ message: "How do I create a viral TikTok campaign?" });
    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
  });

  it("sends message with conversation history", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.aiChat.send({
      message: "What about Instagram Reels?",
      history: [
        { role: "user", content: "How do I create viral content?" },
        { role: "assistant", content: "Here are strategies for viral content..." },
        { role: "user", content: "Focus on short-form video" },
        { role: "assistant", content: "For short-form video, consider..." },
      ],
    });
    expect(result).toHaveProperty("reply");
  });

  it("handles long messages", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const longMessage = "I need a comprehensive marketing strategy. ".repeat(50);
    const result = await caller.aiChat.send({ message: longMessage });
    expect(result).toHaveProperty("reply");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 12. SECURITY TESTS - INPUT SANITIZATION
// ═══════════════════════════════════════════════════════════════════════

describe("Security - Input Sanitization", () => {
  it("sanitizes XSS in script tags", () => {
    const result = sanitizeString("<script>alert('xss')</script>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("sanitizes nested XSS attempts", () => {
    const result = sanitizeString('"><img src=x onerror=alert(1)>');
    expect(result).not.toContain("<img");
  });

  it("sanitizes event handler injection", () => {
    const result = sanitizeString('<div onmouseover="steal()">');
    // sanitizeString HTML-encodes the angle brackets, making the tag inert
    expect(result).not.toContain("<div");
    expect(result).toContain("&lt;div");
  });

  it("preserves normal text", () => {
    expect(sanitizeString("Hello World 123")).toBe("Hello World 123");
  });

  it("preserves unicode", () => {
    const unicode = "日本語 العربية 한국어";
    expect(sanitizeString(unicode)).toBe(unicode);
  });

  it("deep sanitizes objects", () => {
    const input = {
      name: "<script>bad</script>",
      nested: { value: '<img onerror="alert(1)">' },
      arr: ["<b>bold</b>", "normal"],
    };
    const result = sanitizeObject(input);
    expect(result.name).not.toContain("<script>");
    expect(result.nested.value).not.toContain("<img");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 13. SECURITY TESTS - VALIDATION
// ═══════════════════════════════════════════════════════════════════════

describe("Security - Validation", () => {
  describe("Email validation", () => {
    it("accepts valid emails", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("user.name+tag@domain.co.uk")).toBe(true);
    });

    it("rejects invalid emails", () => {
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("notanemail")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
    });

    it("rejects oversized emails", () => {
      expect(isValidEmail("a".repeat(310) + "@example.com")).toBe(false);
    });
  });

  describe("URL validation", () => {
    it("accepts valid URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://localhost:3000")).toBe(true);
    });

    it("rejects dangerous protocols", () => {
      expect(isValidUrl("javascript:alert(1)")).toBe(false);
      expect(isValidUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isValidUrl("ftp://files.example.com")).toBe(false);
    });
  });

  describe("Phone validation", () => {
    it("accepts valid phones", () => {
      expect(isValidPhone("+1234567890")).toBe(true);
      expect(isValidPhone("(555) 123-4567")).toBe(true);
    });

    it("rejects invalid phones", () => {
      expect(isValidPhone("abc")).toBe(false);
      expect(isValidPhone("12")).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 14. SECURITY TESTS - INJECTION DETECTION
// ═══════════════════════════════════════════════════════════════════════

describe("Security - Injection Detection", () => {
  describe("SQL injection", () => {
    it("detects DROP TABLE", () => {
      expect(hasSQLInjectionPatterns("'; DROP TABLE users; --")).toBe(true);
    });

    it("detects OR 1=1", () => {
      expect(hasSQLInjectionPatterns("1 OR 1=1")).toBe(true);
    });

    it("detects UNION SELECT", () => {
      expect(hasSQLInjectionPatterns("UNION SELECT password FROM users")).toBe(true);
    });

    it("detects SELECT FROM", () => {
      expect(hasSQLInjectionPatterns("SELECT * FROM users")).toBe(true);
    });

    it("allows normal text", () => {
      expect(hasSQLInjectionPatterns("My product is great")).toBe(false);
      expect(hasSQLInjectionPatterns("Buy 2 get 1 free")).toBe(false);
    });
  });

  describe("XSS detection", () => {
    it("detects script tags", () => {
      expect(hasXSSPatterns("<script>alert('xss')</script>")).toBe(true);
    });

    it("detects javascript: protocol", () => {
      expect(hasXSSPatterns("javascript:alert(1)")).toBe(true);
    });

    it("detects event handlers", () => {
      expect(hasXSSPatterns('<img onerror="alert(1)">')).toBe(true);
    });

    it("detects iframe", () => {
      expect(hasXSSPatterns('<iframe src="evil.com">')).toBe(true);
    });

    it("allows normal text", () => {
      expect(hasXSSPatterns("Hello World")).toBe(false);
      expect(hasXSSPatterns("Great product!")).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 15. EDGE CASE TESTS
// ═══════════════════════════════════════════════════════════════════════

describe("Edge Cases", () => {
  it("handles max length enforcement", () => {
    expect(enforceMaxLength("Hello World", 5)).toBe("Hello");
    expect(enforceMaxLength("Short", 100)).toBe("Short");
    expect(enforceMaxLength("", 10)).toBe("");
    expect(enforceMaxLength(null as any, 10)).toBe("");
    expect(enforceMaxLength(undefined as any, 10)).toBe("");
  });

  it("handles very long product names (Zod validation)", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    // Zod min(1) should pass for long strings
    const result = await caller.product.create({ name: "A".repeat(1000) });
    expect(result).toHaveProperty("id");
  });

  it("handles special characters in product names", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.product.create({ name: "Product™ — Pro Edition (v2.0) [Limited]" });
    expect(result).toHaveProperty("id");
  });

  it("handles emoji in content", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.content.generate({
      type: "social_caption",
      customPrompt: "Include lots of emojis 🚀🔥💯",
    });
    expect(result).toHaveProperty("id");
  });

  it("handles concurrent list operations", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const [products, contents, campaigns, leads, creatives] = await Promise.all([
      caller.product.list(),
      caller.content.list(),
      caller.campaign.list(),
      caller.lead.list(),
      caller.creative.list(),
    ]);
    expect(Array.isArray(products)).toBe(true);
    expect(Array.isArray(contents)).toBe(true);
    expect(Array.isArray(campaigns)).toBe(true);
    expect(Array.isArray(leads)).toBe(true);
    expect(Array.isArray(creatives)).toBe(true);
  });

  it("handles rapid-fire mutations", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        caller.product.create({ name: `Rapid Product ${i}` })
      )
    );
    results.forEach(r => expect(r).toHaveProperty("id"));
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 16. SUBSCRIPTION TESTS
// ═══════════════════════════════════════════════════════════════════════

describe("Subscription", () => {
  it("returns free plan for new user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.subscription.status();
    expect(result.plan).toBe("free");
    expect(result.stripeCustomerId).toBeNull();
  });

  it("returns pro plan for subscribed user", async () => {
    const caller = appRouter.createCaller(createAuthContext({
      subscriptionPlan: "pro",
      stripeCustomerId: "cus_test123",
      stripeSubscriptionId: "sub_test123",
    }));
    const result = await caller.subscription.status();
    expect(result.plan).toBe("pro");
    expect(result.stripeCustomerId).toBe("cus_test123");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 17. CHAOS TESTS - CONCURRENT OPERATIONS
// ═══════════════════════════════════════════════════════════════════════

describe("Chaos Tests - Stability", () => {
  it("handles 20 concurrent content generations", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const types = ["ad_copy_short", "blog_post", "social_caption", "email_copy", "seo_meta"] as const;
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        caller.content.generate({ type: types[i % types.length] })
      )
    );
    results.forEach(r => {
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("body");
    });
  });

  it("handles mixed read/write operations concurrently", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const results = await Promise.allSettled([
      caller.product.list(),
      caller.product.create({ name: "Concurrent Product" }),
      caller.content.list(),
      caller.content.generate({ type: "ad_copy_short" }),
      caller.campaign.list(),
      caller.lead.list(),
      caller.analytics.summary(),
      caller.dashboard.stats(),
    ]);
    results.forEach(r => expect(r.status).toBe("fulfilled"));
  });

  it("handles rapid create-delete cycles", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    for (let i = 0; i < 5; i++) {
      const created = await caller.product.create({ name: `Cycle Product ${i}` });
      expect(created).toHaveProperty("id");
      const deleted = await caller.product.delete({ id: created.id });
      expect(deleted).toEqual({ success: true });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 12. WEBSITE INTELLIGENCE ANALYZER TESTS
// ═══════════════════════════════════════════════════════════════════════

describe("Website Intelligence Analyzer", () => {
  it("analyzes website with quick depth", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            overview: {
              domain: "example.com",
              industry: "Technology",
              estimatedMonthlyTraffic: "500K",
              globalRank: "15000",
              bounceRate: "45%",
              avgVisitDuration: "3:20",
              pagesPerVisit: "4.2",
            },
            trafficSources: { organic: "40%", paid: "20%", social: "15%", direct: "15%", referral: "10%" },
            audienceDemographics: {
              topCountries: [{ country: "USA", percentage: "45%" }],
              ageDistribution: [{ range: "25-34", percentage: "35%" }],
              genderSplit: { male: "55%", female: "45%" },
              interests: ["Technology", "Business"],
            },
            seoAnalysis: {
              domainAuthority: "65",
              backlinks: "12K",
              organicTraffic: "200K",
              topKeywords: [{ keyword: "marketing tools", position: "3", volume: "12K" }],
              contentGaps: ["AI marketing", "Video ads"],
            },
            socialPresence: [{ platform: "Instagram", followers: "50K", engagement: "3.2%", postFrequency: "Daily" }],
            contentStrategy: {
              blogFrequency: "3x/week",
              contentTypes: ["Blog", "Video"],
              tone: "Professional",
              topContent: [{ title: "Marketing Guide", estimatedViews: "50K" }],
            },
            competitors: [{ name: "Competitor A", url: "https://competitor.com", overlapScore: "72%", strengths: ["SEO", "Content"] }],
            swotAnalysis: {
              strengths: ["Strong brand"],
              weaknesses: ["Limited social"],
              opportunities: ["AI adoption"],
              threats: ["New competitors"],
            },
            actionableRecommendations: [
              { priority: "High", category: "SEO", recommendation: "Improve backlinks", expectedImpact: "20% traffic increase" },
            ],
            marketingBudgetSuggestion: {
              monthly: "$10,000",
              breakdown: [{ channel: "SEO", percentage: "30%", amount: "$3,000" }],
            },
            technologyStack: ["React", "Node.js"],
            marketingChannels: [{ channel: "SEO", effectiveness: "High", recommendation: "Increase content" }],
          }),
        },
      }],
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.intelligence.analyzeWebsite({ url: "https://example.com", depth: "quick" });
    expect(result).toHaveProperty("overview");
    expect(result.overview).toHaveProperty("domain");
    expect(result).toHaveProperty("trafficSources");
    expect(result).toHaveProperty("seoAnalysis");
    expect(result).toHaveProperty("swotAnalysis");
    expect(result).toHaveProperty("competitors");
    expect(result).toHaveProperty("actionableRecommendations");
  });

  it("analyzes website with deep depth", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            overview: { domain: "deep.com", industry: "SaaS", estimatedMonthlyTraffic: "1M", globalRank: "5000", bounceRate: "35%", avgVisitDuration: "5:00", pagesPerVisit: "6" },
            trafficSources: { organic: "50%", paid: "15%", social: "20%", direct: "10%", referral: "5%" },
            audienceDemographics: { topCountries: [], ageDistribution: [], genderSplit: { male: "50%", female: "50%" }, interests: [] },
            seoAnalysis: { domainAuthority: "80", backlinks: "100K", organicTraffic: "500K", topKeywords: [], contentGaps: [] },
            socialPresence: [],
            contentStrategy: { blogFrequency: "Daily", contentTypes: [], tone: "Casual", topContent: [] },
            competitors: [],
            swotAnalysis: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
            actionableRecommendations: [],
            marketingBudgetSuggestion: { monthly: "$50,000", breakdown: [] },
            technologyStack: [],
            marketingChannels: [],
          }),
        },
      }],
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.intelligence.analyzeWebsite({ url: "https://deep.com", depth: "deep" });
    expect(result.overview.domain).toBe("deep.com");
  });

  it("generates hook variations", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            hooks: [
              { hook: "Stop scrolling!", angle: "curiosity", platform: "TikTok" },
              { hook: "You won't believe this", angle: "shock", platform: "Instagram" },
            ],
          }),
        },
      }],
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.intelligence.generateHookVariations({
      topic: "AI marketing tools",
      platform: "tiktok",
      count: 5,
    });
    expect(result).toHaveProperty("hooks");
    expect(Array.isArray(result.hooks)).toBe(true);
  });

  it("rejects intelligence analysis without URL", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.intelligence.analyzeWebsite({ url: "", depth: "quick" })).rejects.toThrow();
  });

  it("rejects unauthenticated intelligence access", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.intelligence.analyzeWebsite({ url: "https://example.com", depth: "quick" })).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 13. EXPANDED VIDEO AD FEATURES TESTS
// ═══════════════════════════════════════════════════════════════════════

describe("Video Ad - Expanded Features", () => {
  it("gets AI actor library", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.videoAd.getActors();
    expect(result).toHaveProperty("actors");
    expect(Array.isArray(result.actors)).toBe(true);
    expect(result.actors.length).toBeGreaterThan(0);
    expect(result.actors[0]).toHaveProperty("name");
    expect(result.actors[0]).toHaveProperty("style");
    expect(result.actors[0]).toHaveProperty("languages");
  });

  it("creates custom AI avatar", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.videoAd.createAvatar({
      name: "TestAvatar",
      description: "Young professional woman with dark hair",
      gender: "female",
      ageRange: "25-35",
      style: "professional",
      languages: ["English", "Spanish"],
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("imageUrl");
    expect(result.name).toBe("TestAvatar");
  });

  it("generates video ad with emotion and preset", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            script: "Hey! You need to see this amazing product...",
            voiceoverText: "Introducing the revolutionary new product...",
            storyboard: [
              { scene: "Scene 1", description: "Avatar speaks to camera with excited expression", duration: "5s" },
              { scene: "Scene 2", description: "Product demo with B-roll", duration: "10s" },
            ],
            hook: "This changed everything for me!",
            cta: "Link in bio - grab yours now!",
          }),
        },
      }],
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.videoAd.generate({
      platform: "instagram_reels",
      duration: 30,
      emotion: "excited",
      adPreset: "ugc_testimonial",
      language: "English",
      avatarName: "Sarah",
      includeSubtitles: true,
      includeBroll: true,
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("script");
    expect(result).toHaveProperty("hook");
  });

  it("localizes video ad to another language", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            translatedScript: "¡Oye! Necesitas ver este producto increíble...",
            translatedVoiceover: "Presentamos el nuevo producto revolucionario...",
            culturalNotes: "Adjusted for Latin American Spanish market",
          }),
        },
      }],
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.videoAd.localize({
      videoAdId: 1,
      targetLanguage: "Spanish",
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("translatedScript");
  });

  it("generates video ad for all supported platforms", async () => {
    const platforms = ["tiktok", "youtube_shorts", "instagram_reels", "youtube"] as const;
    const { invokeLLM } = await import("./_core/llm");

    for (const platform of platforms) {
      (invokeLLM as any).mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              script: `Script for ${platform}`,
              voiceoverText: `Voiceover for ${platform}`,
              storyboard: [{ scene: "Scene 1", description: "Opening", duration: "3s" }],
              hook: `Hook for ${platform}`,
              cta: "Buy now!",
            }),
          },
        }],
      });

      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.videoAd.generate({ platform, duration: 30 });
      expect(result).toHaveProperty("id");
    }
  });

  it("rejects video ad with invalid duration", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.videoAd.generate({ platform: "tiktok", duration: 0 })).rejects.toThrow();
  });

  it("rejects unauthenticated actor access", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.videoAd.getActors()).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 14. AI CHAT AGENT TESTS
// ═══════════════════════════════════════════════════════════════════════

describe("AI Chat Agent", () => {
  it("sends message and gets response", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.aiChat.send({ message: "Help me create a marketing plan for my SaaS product" });
    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
    expect(result.reply.length).toBeGreaterThan(0);
  });

  it("sends message with conversation history", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.aiChat.send({
      message: "Now make it more aggressive",
      history: [
        { role: "user", content: "Help me with marketing" },
        { role: "assistant", content: "Here's a marketing plan..." },
      ],
    });
    expect(result).toHaveProperty("reply");
  });

  it("handles empty message gracefully", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.aiChat.send({ message: "" })).rejects.toThrow();
  });

  it("rejects unauthenticated chat", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.aiChat.send({ message: "hello" })).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 15. SUBSCRIPTION ROUTER TESTS
// ═══════════════════════════════════════════════════════════════════════

describe("Subscription Router", () => {
  it("returns subscription status for free user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.subscription.status();
    expect(result).toHaveProperty("plan", "free");
    expect(result).toHaveProperty("stripeCustomerId");
    expect(result).toHaveProperty("stripeSubscriptionId");
  });

  it("returns subscription status for pro user", async () => {
    const caller = appRouter.createCaller(createAuthContext({ subscriptionPlan: "pro" }));
    const result = await caller.subscription.status();
    expect(result).toHaveProperty("plan", "pro");
  });

  it("returns subscription status for enterprise user", async () => {
    const caller = appRouter.createCaller(createAuthContext({ subscriptionPlan: "enterprise" }));
    const result = await caller.subscription.status();
    expect(result).toHaveProperty("plan", "enterprise");
  });

  it("rejects unauthenticated subscription status", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.subscription.status()).rejects.toThrow();
  });
});
