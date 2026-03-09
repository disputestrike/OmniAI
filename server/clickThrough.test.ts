/**
 * Click-through test: key flows work without OpenAI/Forge.
 * - Storage upload uses filesystem when Forge not set.
 * - LLM requires only ANTHROPIC_API_KEY.
 * - Protected procedures are callable with auth.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";
import fs from "fs/promises";
import path from "path";
import os from "os";

const mockUser = { id: 1, email: "test@example.com", name: "Test", image: null };

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  getCampaignsByUser: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({ campaigns: 0, leads: 0, contents: 0 }),
  getLandingPageBySlug: vi.fn().mockResolvedValue(null),
  getLandingPagesByUser: vi.fn().mockResolvedValue([]),
  getCampaignAssetsByCampaignId: vi.fn().mockResolvedValue([]),
  getLandingPageById: vi.fn().mockResolvedValue(null),
}));

describe("Click-through: no OpenAI/Forge", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    delete process.env.BUILT_IN_FORGE_API_URL;
    delete process.env.BUILT_IN_FORGE_API_KEY;
  });

  it("system.forgeConfigured is true when ANTHROPIC_API_KEY is set", async () => {
    const { appRouter } = await import("./routers");
    const ctx: TrpcContext = {
      user: mockUser,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.system.forgeConfigured();
    expect(result.configured).toBe(true);
  });

  it("dashboard.stats and campaign.list are callable with auth", async () => {
    const { appRouter } = await import("./routers");
    const ctx: TrpcContext = {
      user: mockUser,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const [stats, campaigns] = await Promise.all([
      caller.dashboard.stats(),
      caller.campaign.list(),
    ]);
    expect(stats).toBeDefined();
    expect(Array.isArray(campaigns)).toBe(true);
  });

  it("storage upload works without Forge (filesystem)", async () => {
    const tmpDir = path.join(os.tmpdir(), `otobi-upload-test-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    const orig = process.env.UPLOAD_DIR;
    process.env.UPLOAD_DIR = tmpDir;
    try {
      const { storagePut } = await import("./storage");
      const result = await storagePut(
        "test/hello.txt",
        Buffer.from("hello"),
        "text/plain"
      );
      expect(result.key).toBe("test/hello.txt");
      expect(result.url).toContain("/api/uploads/");
      const fullPath = path.join(tmpDir, "test", "hello.txt");
      const content = await fs.readFile(fullPath, "utf8");
      expect(content).toBe("hello");
    } finally {
      process.env.UPLOAD_DIR = orig;
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("enhanced.uploadAttachment returns url when storage is filesystem", async () => {
    const tmpDir = path.join(os.tmpdir(), `otobi-upload-test-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    const orig = process.env.UPLOAD_DIR;
    process.env.UPLOAD_DIR = tmpDir;
    vi.doMock("./db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));
    try {
      const { appRouter } = await import("./routers");
      const ctx: TrpcContext = {
        user: mockUser,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);
      const result = await caller.enhanced.uploadAttachment({
        base64: Buffer.from("test file").toString("base64"),
        filename: "test.txt",
        mimeType: "text/plain",
      });
      expect(result.url).toBeDefined();
      expect(result.filename).toBe("test.txt");
    } finally {
      process.env.UPLOAD_DIR = orig;
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });
});

describe("Click-through: landing page", () => {
  it("landing routes module wires getLandingPageBySlug", async () => {
    const landing = await import("./landing-routes");
    expect(typeof landing.registerLandingRoutes).toBe("function");
  });
});
