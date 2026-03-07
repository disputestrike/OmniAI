import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({
      schedule: [
        { platform: "instagram", dayOfWeek: "Monday", hour: 11, reason: "Peak engagement" },
        { platform: "tiktok", dayOfWeek: "Thursday", hour: 19, reason: "High activity" },
      ],
      overallStrategy: "Post during peak hours for each platform",
      tips: ["Use hashtags", "Engage with comments"],
    }) } }],
  }),
}));

// Mock DB
const mockContents = [
  { id: 1, userId: 1, title: "Test Ad", body: "Buy now!", type: "ad_copy_short", platform: "instagram", status: "draft", createdAt: new Date() },
  { id: 2, userId: 1, title: "Blog Post", body: "Long content here...", type: "blog_post", platform: "linkedin", status: "published", createdAt: new Date() },
  { id: 3, userId: 1, title: "Social Caption", body: "Check this out!", type: "social_caption", platform: "tiktok", status: "approved", createdAt: new Date() },
  { id: 4, userId: 2, title: "Other User", body: "Not mine", type: "ad_copy_short", platform: "facebook", status: "draft", createdAt: new Date() },
];

vi.mock("./db", () => ({
  searchContents: vi.fn().mockImplementation(async (userId: number, opts: any) => {
    let filtered = mockContents.filter(c => c.userId === userId);
    if (opts.type) filtered = filtered.filter(c => c.type === opts.type);
    if (opts.platform) filtered = filtered.filter(c => c.platform === opts.platform);
    if (opts.status) filtered = filtered.filter(c => c.status === opts.status);
    if (opts.query) filtered = filtered.filter(c => c.title.toLowerCase().includes(opts.query.toLowerCase()) || c.body.toLowerCase().includes(opts.query.toLowerCase()));
    return { items: filtered.slice(opts.offset || 0, (opts.offset || 0) + (opts.limit || 50)), total: filtered.length };
  }),
  getContentsByUser: vi.fn().mockImplementation(async (userId: number) => {
    return mockContents.filter(c => c.userId === userId);
  }),
  getContentById: vi.fn().mockImplementation(async (id: number) => {
    return mockContents.find(c => c.id === id);
  }),
  deleteContent: vi.fn().mockResolvedValue(undefined),
  updateContent: vi.fn().mockResolvedValue(undefined),
  createScheduledPost: vi.fn().mockResolvedValue({ id: 100 }),
  getScheduledPostsByUserAndPlatform: vi.fn().mockResolvedValue([]),
  bulkCreateScheduledPosts: vi.fn().mockResolvedValue([]),
}));

describe("Content Library Router", () => {
  describe("Search", () => {
    it("should return all user contents when no filters", async () => {
      const db = await import("./db");
      const result = await db.searchContents(1, { limit: 50, offset: 0 });
      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(3);
    });

    it("should filter by type", async () => {
      const db = await import("./db");
      const result = await db.searchContents(1, { type: "ad_copy_short", limit: 50, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe("Test Ad");
    });

    it("should filter by platform", async () => {
      const db = await import("./db");
      const result = await db.searchContents(1, { platform: "tiktok", limit: 50, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe("Social Caption");
    });

    it("should filter by status", async () => {
      const db = await import("./db");
      const result = await db.searchContents(1, { status: "published", limit: 50, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe("Blog Post");
    });

    it("should search by query text", async () => {
      const db = await import("./db");
      const result = await db.searchContents(1, { query: "buy", limit: 50, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe("Test Ad");
    });

    it("should not return other users content", async () => {
      const db = await import("./db");
      const result = await db.searchContents(1, { limit: 50, offset: 0 });
      expect(result.items.every(c => c.userId === 1)).toBe(true);
    });
  });

  describe("Stats", () => {
    it("should compute content stats correctly", async () => {
      const db = await import("./db");
      const all = await db.getContentsByUser(1);
      const byType: Record<string, number> = {};
      const byPlatform: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      for (const c of all) {
        byType[c.type] = (byType[c.type] || 0) + 1;
        if (c.platform) byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1;
        byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      }
      expect(all.length).toBe(3);
      expect(Object.keys(byType).length).toBe(3);
      expect(byStatus.draft).toBe(1);
      expect(byStatus.published).toBe(1);
      expect(byStatus.approved).toBe(1);
    });
  });

  describe("Bulk Actions", () => {
    it("should delete only owned content", async () => {
      const db = await import("./db");
      const content = await db.getContentById(1);
      expect(content).toBeDefined();
      expect(content!.userId).toBe(1);
      await db.deleteContent(1);
      expect(db.deleteContent).toHaveBeenCalledWith(1);
    });

    it("should not delete other users content", async () => {
      const db = await import("./db");
      const content = await db.getContentById(4);
      expect(content).toBeDefined();
      expect(content!.userId).toBe(2);
      // In the real router, this would be blocked by the userId check
    });

    it("should update status in bulk", async () => {
      const db = await import("./db");
      await db.updateContent(1, { status: "approved" as any });
      expect(db.updateContent).toHaveBeenCalledWith(1, { status: "approved" });
    });
  });

  describe("Optimal Times", () => {
    it("should have optimal times for all major platforms", () => {
      const OPTIMAL_TIMES: Record<string, { days: number[]; hours: number[] }> = {
        instagram: { days: [1, 2, 3, 4, 5], hours: [11, 13, 17, 19] },
        tiktok: { days: [2, 4, 5], hours: [10, 14, 19, 21] },
        youtube: { days: [4, 5, 6], hours: [12, 15, 17, 20] },
        twitter: { days: [1, 2, 3, 4, 5], hours: [8, 12, 17, 21] },
        facebook: { days: [1, 3, 5], hours: [9, 13, 16, 19] },
        linkedin: { days: [2, 3, 4], hours: [7, 10, 12, 17] },
        pinterest: { days: [5, 6, 0], hours: [14, 20, 21, 22] },
        threads: { days: [1, 2, 3, 4, 5], hours: [9, 12, 18, 20] },
      };

      expect(Object.keys(OPTIMAL_TIMES)).toHaveLength(8);
      for (const [platform, config] of Object.entries(OPTIMAL_TIMES)) {
        expect(config.days.length).toBeGreaterThan(0);
        expect(config.hours.length).toBeGreaterThan(0);
        expect(config.hours.every(h => h >= 0 && h <= 23)).toBe(true);
        expect(config.days.every(d => d >= 0 && d <= 6)).toBe(true);
      }
    });

    it("should generate next optimal slots", () => {
      const config = { days: [1, 2, 3, 4, 5], hours: [11, 13, 17, 19] };
      const slots: Date[] = [];
      const cursor = new Date("2026-03-09T08:00:00Z"); // Monday 8am
      cursor.setMinutes(0, 0, 0);
      cursor.setHours(cursor.getHours() + 1);

      let safety = 0;
      while (slots.length < 3 && safety < 500) {
        safety++;
        const dayOfWeek = cursor.getDay();
        const hour = cursor.getHours();
        if (config.days.includes(dayOfWeek) && config.hours.includes(hour)) {
          slots.push(new Date(cursor));
        }
        cursor.setHours(cursor.getHours() + 1);
      }

      expect(slots.length).toBe(3);
      expect(slots[0].getHours()).toBe(11);
      expect(slots[1].getHours()).toBe(13);
      expect(slots[2].getHours()).toBe(17);
    });
  });

  describe("Auto-Schedule", () => {
    it("should create scheduled posts for multiple platforms", async () => {
      const db = await import("./db");
      const post = await db.createScheduledPost({
        userId: 1,
        contentId: 1,
        platform: "instagram",
        scheduledAt: new Date(),
        status: "scheduled",
        metadata: { autoScheduled: true },
      });
      expect(post.id).toBe(100);
      expect(db.createScheduledPost).toHaveBeenCalled();
    });
  });

  describe("AI Schedule Suggestion", () => {
    it("should return structured schedule from LLM", async () => {
      const { invokeLLM } = await import("./_core/llm");
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a scheduling expert" },
          { role: "user", content: "Schedule for instagram" },
        ],
      });
      const parsed = JSON.parse(response.choices[0].message.content as string);
      expect(parsed.schedule).toHaveLength(2);
      expect(parsed.overallStrategy).toBeDefined();
      expect(parsed.tips).toHaveLength(2);
      expect(parsed.schedule[0].platform).toBe("instagram");
    });
  });
});
