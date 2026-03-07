import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

const sourceTypeEnum = z.enum(["google", "facebook", "yelp", "manual"]);

export const reviewsRouter = router({
  listSources: protectedProcedure.query(async ({ ctx }) => {
    return db.getReviewSourcesByUser(ctx.user.id);
  }),

  listReviews: protectedProcedure.input(z.object({ sourceId: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    if (input?.sourceId != null) {
      const sources = await db.getReviewSourcesByUser(ctx.user.id);
      if (!sources.some(s => s.id === input.sourceId)) throw new TRPCError({ code: "NOT_FOUND", message: "Source not found" });
      return db.getReviewsBySource(input.sourceId);
    }
    return db.getReviewsByUser(ctx.user.id);
  }),

  addSource: protectedProcedure.input(z.object({
    sourceType: sourceTypeEnum,
    name: z.string().optional(),
    externalId: z.string().optional(),
    accessToken: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    return db.createReviewSource({
      userId: ctx.user.id,
      sourceType: input.sourceType,
      name: input.name ?? null,
      externalId: input.externalId ?? null,
      accessToken: input.accessToken ?? null,
      status: "connected",
    });
  }),

  updateSource: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    status: z.enum(["connected", "disconnected", "error"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    const sources = await db.getReviewSourcesByUser(ctx.user.id);
    if (!sources.some(s => s.id === input.id)) throw new TRPCError({ code: "NOT_FOUND", message: "Source not found" });
    const { id, ...data } = input;
    await db.updateReviewSource(id, data);
    return { success: true };
  }),

  addReview: protectedProcedure.input(z.object({
    sourceId: z.number(),
    authorName: z.string().optional(),
    rating: z.number().min(1).max(5),
    text: z.string().optional(),
    reviewUrl: z.string().optional(),
    reviewedAt: z.string().datetime().or(z.date()),
  })).mutation(async ({ ctx, input }) => {
    const sources = await db.getReviewSourcesByUser(ctx.user.id);
    if (!sources.some(s => s.id === input.sourceId)) throw new TRPCError({ code: "NOT_FOUND", message: "Source not found" });
    const reviewedAt = typeof input.reviewedAt === "string" ? new Date(input.reviewedAt) : input.reviewedAt;
    return db.createReview({
      userId: ctx.user.id,
      sourceId: input.sourceId,
      authorName: input.authorName ?? null,
      rating: input.rating,
      text: input.text ?? null,
      reviewUrl: input.reviewUrl ?? null,
      reviewedAt,
    });
  }),

  replyToReview: protectedProcedure.input(z.object({ id: z.number(), reply: z.string() })).mutation(async ({ ctx, input }) => {
    const reviews = await db.getReviewsByUser(ctx.user.id);
    if (!reviews.some(r => r.id === input.id)) throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });
    await db.updateReview(input.id, { reply: input.reply });
    return { success: true };
  }),
});
