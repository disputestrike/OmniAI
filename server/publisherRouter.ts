import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// ─── One-Push Publisher Router ────────────────────────────────────────────────
export const publisherRouter = router({
  // List all queued/published ads
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getPublisherQueueByUser(ctx.user.id);
  }),

  // Get a single publisher item
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getPublisherQueueItemById(input.id);
    }),

  // Create a new ad for publishing
  create: protectedProcedure
    .input(z.object({
      connectionId: z.number(),
      adName: z.string().min(1).max(255),
      adType: z.enum(["image", "video", "carousel", "text"]).default("image"),
      headline: z.string().optional(),
      body: z.string().optional(),
      imageUrl: z.string().optional(),
      videoUrl: z.string().optional(),
      destinationUrl: z.string().optional(),
      callToAction: z.string().optional(),
      budget: z.string().optional(),
      budgetType: z.enum(["daily", "lifetime"]).default("daily"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      targetAudience: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const connection = await db.getAdPlatformConnectionById(input.connectionId);
      if (!connection || connection.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Connection not found" });
      }

      const item = await db.createPublisherQueueItem({
        userId: ctx.user.id,
        connectionId: input.connectionId,
        platform: connection.platform,
        adName: input.adName,
        adType: input.adType,
        headline: input.headline,
        body: input.body,
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl,
        destinationUrl: input.destinationUrl,
        callToAction: input.callToAction,
        budget: input.budget,
        budgetType: input.budgetType,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        targetAudience: input.targetAudience,
        status: "draft" as any,
      });

      return item;
    }),

  // Update a publisher queue item
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      adName: z.string().optional(),
      headline: z.string().optional(),
      body: z.string().optional(),
      imageUrl: z.string().optional(),
      destinationUrl: z.string().optional(),
      callToAction: z.string().optional(),
      budget: z.string().optional(),
      budgetType: z.enum(["daily", "lifetime"]).optional(),
      targetAudience: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getPublisherQueueItemById(input.id);
      if (!item || item.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ad not found" });
      }
      const { id, ...updates } = input;
      await db.updatePublisherQueueItem(id, updates as any);
      return { success: true };
    }),

  // Delete a publisher queue item
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getPublisherQueueItemById(input.id);
      if (!item || item.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ad not found" });
      }
      await db.deletePublisherQueueItem(input.id);
      return { success: true };
    }),

  // Push ad to platform (simulate publishing)
  publish: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getPublisherQueueItemById(input.id);
      if (!item || item.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ad not found" });
      }

      const connection = await db.getAdPlatformConnectionById(item.connectionId);
      if (!connection || connection.status !== "connected") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Platform not connected. Add your API credentials in Ad Platforms settings." });
      }

      // Update status to queued
      await db.updatePublisherQueueItem(input.id, { status: "queued" as any });

      // Simulate async publishing (in production, this would call the platform API)
      // For now, we simulate success after a brief delay
      const externalAdId = `ad_${connection.platform}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await db.updatePublisherQueueItem(input.id, {
        status: "live" as any,
        externalAdId,
        publishedAt: new Date(),
      });

      return {
        success: true,
        externalAdId,
        message: `Ad "${item.adName}" queued for ${connection.platform}. Connect your ${connection.platform} API credentials in Settings to enable live publishing.`,
        platform: connection.platform,
      };
    }),

  // Pause a live ad
  pause: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getPublisherQueueItemById(input.id);
      if (!item || item.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ad not found" });
      }
      await db.updatePublisherQueueItem(input.id, { status: "paused" as any });
      return { success: true };
    }),

  // Resume a paused ad
  resume: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getPublisherQueueItemById(input.id);
      if (!item || item.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ad not found" });
      }
      await db.updatePublisherQueueItem(input.id, { status: "live" as any });
      return { success: true };
    }),

  // AI-optimize ad copy before publishing
  optimizeCopy: protectedProcedure
    .input(z.object({
      id: z.number(),
      goal: z.enum(["conversions", "clicks", "awareness", "engagement"]).default("conversions"),
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getPublisherQueueItemById(input.id);
      if (!item || item.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ad not found" });
      }

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a world-class ${item.platform} advertising copywriter. Optimize ad copy for maximum ${input.goal}.`,
          },
          {
            role: "user",
            content: `Optimize this ${item.platform} ad for ${input.goal}:

Current Headline: ${item.headline || "(none)"}
Current Body: ${item.body || "(none)"}
Ad Type: ${item.adType}
CTA: ${item.callToAction || "(none)"}

Provide 3 optimized versions. Return JSON with:
- versions: array of {headline, body, callToAction, rationale}
- bestVersion: number (1-3, which is best)
- keyImprovements: array of strings`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "copy_optimization",
            strict: true,
            schema: {
              type: "object",
              properties: {
                versions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      headline: { type: "string" },
                      body: { type: "string" },
                      callToAction: { type: "string" },
                      rationale: { type: "string" },
                    },
                    required: ["headline", "body", "callToAction", "rationale"],
                    additionalProperties: false,
                  },
                },
                bestVersion: { type: "number" },
                keyImprovements: { type: "array", items: { type: "string" } },
              },
              required: ["versions", "bestVersion", "keyImprovements"],
              additionalProperties: false,
            },
          },
        },
      });

      return JSON.parse(response.choices[0].message.content as string);
    }),

  // Apply optimized copy to an ad
  applyCopy: protectedProcedure
    .input(z.object({
      id: z.number(),
      headline: z.string(),
      body: z.string(),
      callToAction: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getPublisherQueueItemById(input.id);
      if (!item || item.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ad not found" });
      }
      const { id, ...updates } = input;
      await db.updatePublisherQueueItem(id, updates as any);
      return { success: true };
    }),

  // Bulk publish multiple ads at once
  bulkPublish: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const results = [];
      for (const id of input.ids) {
        const item = await db.getPublisherQueueItemById(id);
        if (!item || item.userId !== ctx.user.id) continue;

        const externalAdId = `ad_${item.platform}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await db.updatePublisherQueueItem(id, {
          status: "live" as any,
          externalAdId,
          publishedAt: new Date(),
        });
        results.push({ id, status: "live", externalAdId });
      }
      return { published: results.length, results };
    }),
});
