import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getCreatorProfileByUserId: vi.fn(),
    getCreatorProfileBySlug: vi.fn(),
    upsertCreatorProfile: vi.fn(),
    getPortfolioItemsByUser: vi.fn(),
    getPublicPortfolioItems: vi.fn(),
    createPortfolioItem: vi.fn(),
    getPortfolioItemById: vi.fn(),
    updatePortfolioItem: vi.fn(),
    deletePortfolioItem: vi.fn(),
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

describe("creatorProfile router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getMyProfile returns null when no profile exists", async () => {
    vi.mocked(db.getCreatorProfileByUserId).mockResolvedValue(null);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.creatorProfile.getMyProfile();
    expect(result).toBeNull();
    expect(db.getCreatorProfileByUserId).toHaveBeenCalledWith(1);
  });

  it("getMyProfile returns profile when it exists", async () => {
    const mockProfile = {
      id: 1, userId: 1, displayName: "Test User", bio: "Test bio",
      tagline: "Marketer", website: null, instagram: null, twitter: null,
      linkedin: null, tiktok: null, profileSlug: "test-user", isPublic: true,
      specialties: ["Social Media Ads"], totalViews: 42, createdAt: new Date(), updatedAt: new Date()
    };
    vi.mocked(db.getCreatorProfileByUserId).mockResolvedValue(mockProfile);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.creatorProfile.getMyProfile();
    expect(result).toEqual(mockProfile);
    expect(result?.displayName).toBe("Test User");
  });

  it("getMyPortfolio returns empty array when no items", async () => {
    vi.mocked(db.getPortfolioItemsByUser).mockResolvedValue([]);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.creatorProfile.getMyPortfolio();
    expect(result).toEqual([]);
    expect(db.getPortfolioItemsByUser).toHaveBeenCalledWith(1);
  });

  it("upsertProfile creates or updates profile", async () => {
    const mockProfile = {
      id: 1, userId: 1, displayName: "Updated Name", bio: "New bio",
      tagline: null, website: null, instagram: null, twitter: null,
      linkedin: null, tiktok: null, profileSlug: "updated-name", isPublic: false,
      specialties: [], totalViews: 0, createdAt: new Date(), updatedAt: new Date()
    };
    vi.mocked(db.getCreatorProfileBySlug).mockResolvedValue(null);
    vi.mocked(db.upsertCreatorProfile).mockResolvedValue(mockProfile);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.creatorProfile.upsertProfile({
      displayName: "Updated Name",
      bio: "New bio",
      isPublic: false,
      specialties: [],
    });
    expect(result).toEqual(mockProfile);
    expect(db.upsertCreatorProfile).toHaveBeenCalledWith(1, expect.objectContaining({ displayName: "Updated Name" }));
  });

  it("addPortfolioItem adds a new item", async () => {
    const mockItem = {
      id: 1, userId: 1, title: "Test Ad Copy", description: null,
      contentType: "copy", contentText: "Buy now!", contentUrl: null,
      thumbnailUrl: null, platform: "Meta Ads", isPublic: true, isFeatured: false,
      createdAt: new Date()
    };
    vi.mocked(db.createPortfolioItem).mockResolvedValue(mockItem);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.creatorProfile.addPortfolioItem({
      title: "Test Ad Copy",
      contentType: "copy",
      contentText: "Buy now!",
      platform: "Meta Ads",
      isPublic: true,
    });
    expect(result).toEqual(mockItem);
    expect(db.createPortfolioItem).toHaveBeenCalledWith(expect.objectContaining({ title: "Test Ad Copy" }));
  });

  it("deletePortfolioItem removes an item", async () => {
    const mockItem = { id: 1, userId: 1, title: "Test", description: null, contentType: "copy", contentText: null, contentUrl: null, thumbnailUrl: null, platform: null, isPublic: true, isFeatured: false, createdAt: new Date() };
    vi.mocked(db.getPortfolioItemById).mockResolvedValue(mockItem);
    vi.mocked(db.deletePortfolioItem).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.creatorProfile.deletePortfolioItem({ id: 1 })).resolves.not.toThrow();
    expect(db.deletePortfolioItem).toHaveBeenCalledWith(1);
  });

  it("toggleFeatured flips the featured state", async () => {
    const mockItem = { id: 1, userId: 1, title: "Test", description: null, contentType: "copy", contentText: null, contentUrl: null, thumbnailUrl: null, platform: null, isPublic: true, isFeatured: false, createdAt: new Date() };
    const mockUpdated = { ...mockItem, isFeatured: true };
    vi.mocked(db.getPortfolioItemById).mockResolvedValue(mockItem);
    vi.mocked(db.updatePortfolioItem).mockResolvedValue(mockUpdated);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.creatorProfile.toggleFeatured({ id: 1 });
    expect(result.isFeatured).toBe(true);
    expect(db.updatePortfolioItem).toHaveBeenCalledWith(1, { isFeatured: true });
  });

  it("requires authentication for all procedures", async () => {
    const unauthCaller = appRouter.createCaller(createUnauthContext());
    await expect(unauthCaller.creatorProfile.getMyProfile()).rejects.toThrow();
    await expect(unauthCaller.creatorProfile.getMyPortfolio()).rejects.toThrow();
  });
});
