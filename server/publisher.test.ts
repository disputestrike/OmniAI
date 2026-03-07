import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getPublisherQueueByUser: vi.fn(),
    getPublisherQueueItemById: vi.fn(),
    createPublisherQueueItem: vi.fn(),
    updatePublisherQueueItem: vi.fn(),
    deletePublisherQueueItem: vi.fn(),
    getAdPlatformConnectionById: vi.fn(),
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

describe("publisher router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list returns empty array when no items", async () => {
    vi.mocked(db.getPublisherQueueByUser).mockResolvedValue([]);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.publisher.list();
    expect(result).toEqual([]);
    expect(db.getPublisherQueueByUser).toHaveBeenCalledWith(1);
  });

  it("list returns queued items", async () => {
    const mockItems = [
      {
        id: 1, userId: 1, connectionId: 1, platform: "meta", adName: "Summer Sale Ad",
        adType: "image", headline: "Summer Sale", body: "Get 50% off", imageUrl: null, videoUrl: null,
        destinationUrl: null, callToAction: null, targetAudience: null,
        budget: "50.00", budgetType: "daily", startDate: null, endDate: null,
        publishedAt: null, externalAdId: null,
        status: "draft", errorMessage: null, createdAt: new Date(), updatedAt: new Date()
      }
    ];
    vi.mocked(db.getPublisherQueueByUser).mockResolvedValue(mockItems);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.publisher.list();
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe("meta");
    expect(result[0].status).toBe("draft");
  });

  it("create creates a new draft", async () => {
    const mockConnection = {
      id: 1, userId: 1, platform: "google", accountId: "acc_1", accountName: "My Account",
      accessToken: "token", refreshToken: null, tokenExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date()
    };
    const mockItem = {
      id: 2, userId: 1, connectionId: 1, platform: "google", adName: "Best AI Tool Ad",
      adType: "text", headline: "Best AI Tool", body: "Try free today", imageUrl: null, videoUrl: null,
      destinationUrl: null, callToAction: null, targetAudience: null,
      budget: "100.00", budgetType: "daily", startDate: null, endDate: null,
      publishedAt: null, externalAdId: null,
      status: "draft", errorMessage: null, createdAt: new Date(), updatedAt: new Date()
    };
    vi.mocked(db.getAdPlatformConnectionById).mockResolvedValue(mockConnection);
    vi.mocked(db.createPublisherQueueItem).mockResolvedValue(mockItem);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.publisher.create({
      connectionId: 1,
      adName: "Best AI Tool Ad",
      adType: "text",
      headline: "Best AI Tool",
      body: "Try free today",
      budget: "100.00",
    });
    expect(result).toEqual(mockItem);
    expect(db.createPublisherQueueItem).toHaveBeenCalledWith(expect.objectContaining({ platform: "google" }));
  });

  it("delete removes a draft", async () => {
    const mockItem = {
      id: 1, userId: 1, connectionId: 1, platform: "meta", adName: "Test Ad",
      adType: "image", headline: "Test", body: "Test", imageUrl: null, videoUrl: null,
      destinationUrl: null, callToAction: null, targetAudience: null,
      budget: null, budgetType: "daily", startDate: null, endDate: null,
      publishedAt: null, externalAdId: null,
      status: "draft", errorMessage: null, createdAt: new Date(), updatedAt: new Date()
    };
    vi.mocked(db.getPublisherQueueItemById).mockResolvedValue(mockItem);
    vi.mocked(db.deletePublisherQueueItem).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.publisher.delete({ id: 1 })).resolves.not.toThrow();
    expect(db.deletePublisherQueueItem).toHaveBeenCalledWith(1);
  });

  it("requires authentication", async () => {
    const unauthCaller = appRouter.createCaller(createUnauthContext());
    await expect(unauthCaller.publisher.list()).rejects.toThrow();
  });
});
