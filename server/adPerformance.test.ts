import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getAdPerformanceReportsByUser: vi.fn(),
    getAdPerformanceReportById: vi.fn(),
    createAdPerformanceReport: vi.fn(),
    updateAdPerformanceReport: vi.fn(),
    getPerformanceAlertsByUser: vi.fn(),
    updatePerformanceAlert: vi.fn(),
    createPerformanceAlert: vi.fn(),
    getAdPlatformConnectionById: vi.fn(),
    getAdPlatformCampaignsByConnection: vi.fn(),
  };
});

import * as db from "./db";

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionPlan: "free",
    },
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

describe("adPerformance router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list returns empty array when no reports", async () => {
    vi.mocked(db.getAdPerformanceReportsByUser).mockResolvedValue([]);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.adPerformance.list();
    expect(result).toEqual([]);
    expect(db.getAdPerformanceReportsByUser).toHaveBeenCalledWith(1);
  });

  it("list returns reports", async () => {
    const mockReports = [
      {
        id: 1, userId: 1, connectionId: 1, platform: "meta", campaignId: "camp_1", campaignName: "Summer Sale",
        adSetId: null, adSetName: null, adId: null, adName: null,
        impressions: 10000, clicks: 500, spend: "150.00", conversions: 25,
        ctr: "5.00", cpc: "0.30", cpm: "15.00", roas: "3.50",
        analysisResult: null, topPatterns: null, recommendations: null,
        status: "pending", dateFrom: new Date(), dateTo: new Date(), createdAt: new Date()
      }
    ];
    vi.mocked(db.getAdPerformanceReportsByUser).mockResolvedValue(mockReports);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.adPerformance.list();
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe("meta");
    expect(result[0].campaignName).toBe("Summer Sale");
  });

  it("alerts returns performance alerts", async () => {
    vi.mocked(db.getPerformanceAlertsByUser).mockResolvedValue([]);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.adPerformance.alerts();
    expect(result).toEqual([]);
    expect(db.getPerformanceAlertsByUser).toHaveBeenCalledWith(1);
  });

  it("alerts returns active alerts", async () => {
    const mockAlerts = [
      {
        id: 1, userId: 1, reportId: 1, alertType: "high_cpc",
        message: "CPC is 2x above average", severity: "warning",
        isDismissed: false, isRead: false, createdAt: new Date()
      }
    ];
    vi.mocked(db.getPerformanceAlertsByUser).mockResolvedValue(mockAlerts);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.adPerformance.alerts();
    expect(result).toHaveLength(1);
    expect(result[0].alertType).toBe("high_cpc");
    expect(result[0].severity).toBe("warning");
  });

  it("dismissAlert marks alert as dismissed", async () => {
    vi.mocked(db.updatePerformanceAlert).mockResolvedValue(undefined as any);
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.adPerformance.dismissAlert({ id: 1 })).resolves.not.toThrow();
    expect(db.updatePerformanceAlert).toHaveBeenCalledWith(1, { isDismissed: true });
  });

  it("requires authentication", async () => {
    const unauthCaller = appRouter.createCaller(createUnauthContext());
    await expect(unauthCaller.adPerformance.list()).rejects.toThrow();
    await expect(unauthCaller.adPerformance.alerts()).rejects.toThrow();
  });
});
