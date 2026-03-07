import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

// ─── Optimal Posting Times by Platform (UTC offsets from peak hours) ──
const OPTIMAL_TIMES: Record<string, { days: number[]; hours: number[] }> = {
  instagram: { days: [1, 2, 3, 4, 5], hours: [11, 13, 17, 19] },       // Mon-Fri, 11am/1pm/5pm/7pm
  tiktok: { days: [2, 4, 5], hours: [10, 14, 19, 21] },                 // Tue/Thu/Fri, 10am/2pm/7pm/9pm
  youtube: { days: [4, 5, 6], hours: [12, 15, 17, 20] },                // Thu/Fri/Sat, 12pm/3pm/5pm/8pm
  twitter: { days: [1, 2, 3, 4, 5], hours: [8, 12, 17, 21] },          // Mon-Fri, 8am/12pm/5pm/9pm
  facebook: { days: [1, 3, 5], hours: [9, 13, 16, 19] },                // Mon/Wed/Fri, 9am/1pm/4pm/7pm
  linkedin: { days: [2, 3, 4], hours: [7, 10, 12, 17] },                // Tue/Wed/Thu, 7am/10am/12pm/5pm
  pinterest: { days: [5, 6, 0], hours: [14, 20, 21, 22] },              // Fri/Sat/Sun, 2pm/8pm/9pm/10pm
  threads: { days: [1, 2, 3, 4, 5], hours: [9, 12, 18, 20] },          // Mon-Fri, 9am/12pm/6pm/8pm
};

function getNextOptimalSlots(platform: string, count: number, startFrom?: Date): Date[] {
  const config = OPTIMAL_TIMES[platform.toLowerCase()] || OPTIMAL_TIMES.instagram;
  const slots: Date[] = [];
  const now = startFrom || new Date();
  const cursor = new Date(now);
  cursor.setMinutes(0, 0, 0);
  cursor.setHours(cursor.getHours() + 1); // Start from next hour

  let safety = 0;
  while (slots.length < count && safety < 500) {
    safety++;
    const dayOfWeek = cursor.getDay();
    const hour = cursor.getHours();
    if (config.days.includes(dayOfWeek) && config.hours.includes(hour)) {
      slots.push(new Date(cursor));
    }
    cursor.setHours(cursor.getHours() + 1);
    if (cursor.getHours() === 0) {
      // Rolled over to next day, skip to first optimal hour
      cursor.setHours(Math.min(...config.hours));
    }
  }
  return slots;
}

export const contentLibraryRouter = router({
  // ─── Search & Browse Content Library ──────────────────────────────
  search: protectedProcedure.input(z.object({
    query: z.string().optional(),
    type: z.string().optional(),
    platform: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().min(1).max(100).optional(),
    offset: z.number().min(0).optional(),
  })).query(async ({ ctx, input }) => {
    return db.searchContents(ctx.user.id, {
      query: input.query,
      type: input.type,
      platform: input.platform,
      status: input.status,
      limit: input.limit || 50,
      offset: input.offset || 0,
    });
  }),

  // ─── Get Content Stats ────────────────────────────────────────────
  stats: protectedProcedure.query(async ({ ctx }) => {
    const all = await db.getContentsByUser(ctx.user.id);
    const byType: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const c of all) {
      byType[c.type] = (byType[c.type] || 0) + 1;
      if (c.platform) byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1;
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    }
    return { total: all.length, byType, byPlatform, byStatus };
  }),

  // ─── Bulk Actions ─────────────────────────────────────────────────
  bulkDelete: protectedProcedure.input(z.object({
    ids: z.array(z.number()).min(1).max(100),
  })).mutation(async ({ ctx, input }) => {
    let deleted = 0;
    for (const id of input.ids) {
      const content = await db.getContentById(id);
      if (content && content.userId === ctx.user.id) {
        await db.deleteContent(id);
        deleted++;
      }
    }
    return { deleted };
  }),

  bulkUpdateStatus: protectedProcedure.input(z.object({
    ids: z.array(z.number()).min(1).max(100),
    status: z.enum(["draft", "approved", "published", "archived"]),
  })).mutation(async ({ ctx, input }) => {
    let updated = 0;
    for (const id of input.ids) {
      const content = await db.getContentById(id);
      if (content && content.userId === ctx.user.id) {
        await db.updateContent(id, { status: input.status });
        updated++;
      }
    }
    return { updated };
  }),

  // ─── Get Optimal Times for Platform ───────────────────────────────
  getOptimalTimes: protectedProcedure.input(z.object({
    platform: z.string(),
    count: z.number().min(1).max(20).optional(),
  })).query(async ({ input }) => {
    const slots = getNextOptimalSlots(input.platform, input.count || 5);
    const config = OPTIMAL_TIMES[input.platform.toLowerCase()] || OPTIMAL_TIMES.instagram;
    return {
      platform: input.platform,
      optimalDays: config.days.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]),
      optimalHours: config.hours.map(h => `${h}:00`),
      nextSlots: slots.map(s => s.toISOString()),
    };
  }),

  // ─── Auto-Schedule Content ────────────────────────────────────────
  autoSchedule: protectedProcedure.input(z.object({
    contentId: z.number(),
    platforms: z.array(z.string()).min(1).max(10),
    startFrom: z.string().optional(), // ISO date string
  })).mutation(async ({ ctx, input }) => {
    const content = await db.getContentById(input.contentId);
    if (!content || content.userId !== ctx.user.id) throw new Error("Content not found");

    const scheduled = [];
    const startDate = input.startFrom ? new Date(input.startFrom) : new Date();

    for (const platform of input.platforms) {
      const slots = getNextOptimalSlots(platform, 1, startDate);
      if (slots.length > 0) {
        const post = await db.createScheduledPost({
          userId: ctx.user.id,
          contentId: input.contentId,
          platform,
          scheduledAt: slots[0],
          status: "scheduled",
          metadata: { autoScheduled: true, optimalTime: true },
        });
        scheduled.push({ platform, scheduledAt: slots[0].toISOString(), postId: post.id });
      }
    }
    return { scheduled, count: scheduled.length };
  }),

  // ─── Bulk Auto-Schedule Multiple Contents ─────────────────────────
  bulkAutoSchedule: protectedProcedure.input(z.object({
    items: z.array(z.object({
      contentId: z.number(),
      platforms: z.array(z.string()).min(1),
    })).min(1).max(50),
  })).mutation(async ({ ctx, input }) => {
    const allScheduled = [];
    let cursor = new Date();

    for (const item of input.items) {
      const content = await db.getContentById(item.contentId);
      if (!content || content.userId !== ctx.user.id) continue;

      for (const platform of item.platforms) {
        const slots = getNextOptimalSlots(platform, 1, cursor);
        if (slots.length > 0) {
          const post = await db.createScheduledPost({
            userId: ctx.user.id,
            contentId: item.contentId,
            platform,
            scheduledAt: slots[0],
            status: "scheduled",
            metadata: { autoScheduled: true, bulkScheduled: true },
          });
          allScheduled.push({ contentId: item.contentId, platform, scheduledAt: slots[0].toISOString(), postId: post.id });
          // Move cursor forward to avoid scheduling at same time
          cursor = new Date(slots[0].getTime() + 60 * 60 * 1000);
        }
      }
    }
    return { scheduled: allScheduled, count: allScheduled.length };
  }),

  // ─── AI Suggest Best Schedule ─────────────────────────────────────
  aiSuggestSchedule: protectedProcedure.input(z.object({
    contentId: z.number(),
    platforms: z.array(z.string()).min(1),
    goal: z.string().optional(), // e.g., "maximize engagement", "drive traffic"
  })).mutation(async ({ ctx, input }) => {
    const content = await db.getContentById(input.contentId);
    if (!content || content.userId !== ctx.user.id) throw new Error("Content not found");

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a social media scheduling expert. Given content and target platforms, suggest the best posting schedule. Return JSON with: schedule (array of { platform, dayOfWeek, hour, reason }), overallStrategy (string), tips (array of strings)." },
        { role: "user", content: `Content type: ${content.type}\nPlatforms: ${input.platforms.join(", ")}\nGoal: ${input.goal || "maximize engagement"}\nContent preview: ${(content.body || "").substring(0, 500)}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "schedule_suggestion",
          strict: true,
          schema: {
            type: "object",
            properties: {
              schedule: { type: "array", items: { type: "object", properties: { platform: { type: "string" }, dayOfWeek: { type: "string" }, hour: { type: "integer" }, reason: { type: "string" } }, required: ["platform", "dayOfWeek", "hour", "reason"], additionalProperties: false } },
              overallStrategy: { type: "string" },
              tips: { type: "array", items: { type: "string" } },
            },
            required: ["schedule", "overallStrategy", "tips"],
            additionalProperties: false,
          },
        },
      },
    });

    return JSON.parse(response.choices[0].message.content as string);
  }),

  // ─── Calendar View ────────────────────────────────────────────────
  calendar: protectedProcedure.input(z.object({
    month: z.number().min(1).max(12),
    year: z.number(),
  })).query(async ({ ctx, input }) => {
    const allPosts = await db.getScheduledPostsByUser(ctx.user.id);
    // Filter to the requested month
    return allPosts.filter((p: any) => {
      if (!p.scheduledAt) return false;
      const d = new Date(p.scheduledAt);
      return d.getMonth() + 1 === input.month && d.getFullYear() === input.year;
    });
  }),
});
