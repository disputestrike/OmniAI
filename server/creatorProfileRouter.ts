import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// ─── Creator Profile Router ───────────────────────────────────────────────────
export const creatorProfileRouter = router({
  // Get the current user's creator profile
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    return db.getCreatorProfileByUserId(ctx.user.id);
  }),

  // Get a public profile by slug
  getPublicProfile: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const profile = await db.getCreatorProfileBySlug(input.slug);
      if (!profile || !profile.isPublic) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found or is private" });
      }
      return profile;
    }),

  // Create or update the creator profile
  upsertProfile: protectedProcedure
    .input(z.object({
      displayName: z.string().max(128).optional(),
      bio: z.string().max(1000).optional(),
      tagline: z.string().max(255).optional(),
      avatarUrl: z.string().optional(),
      coverImageUrl: z.string().optional(),
      website: z.string().optional(),
      instagram: z.string().max(128).optional(),
      twitter: z.string().max(128).optional(),
      linkedin: z.string().max(128).optional(),
      tiktok: z.string().max(128).optional(),
      specialties: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
      profileSlug: z.string().max(128).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only").optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check slug uniqueness if provided
      if (input.profileSlug) {
        const existing = await db.getCreatorProfileBySlug(input.profileSlug);
        if (existing && existing.userId !== ctx.user.id) {
          throw new TRPCError({ code: "CONFLICT", message: "This profile URL is already taken" });
        }
      }
      return db.upsertCreatorProfile(ctx.user.id, input as any);
    }),

  // Get portfolio items for the current user
  getMyPortfolio: protectedProcedure.query(async ({ ctx }) => {
    return db.getPortfolioItemsByUser(ctx.user.id);
  }),

  // Get public portfolio items for a user by userId
  getPublicPortfolio: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return db.getPublicPortfolioItems(input.userId);
    }),

  // Add a portfolio item
  addPortfolioItem: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      contentType: z.enum(["image", "video", "copy", "email", "social", "ad", "other"]).default("other"),
      thumbnailUrl: z.string().optional(),
      contentUrl: z.string().optional(),
      contentText: z.string().optional(),
      platform: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().default(true),
      isFeatured: z.boolean().default(false),
      sourceType: z.string().optional(),
      sourceId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createPortfolioItem({
        userId: ctx.user.id,
        ...input,
        tags: input.tags as any,
      });
    }),

  // Update a portfolio item
  updatePortfolioItem: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      contentUrl: z.string().optional(),
      contentText: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getPortfolioItemById(input.id);
      if (!item || item.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Portfolio item not found" });
      }
      const { id, ...updates } = input;
      await db.updatePortfolioItem(id, updates as any);
      return { success: true };
    }),

  // Delete a portfolio item
  deletePortfolioItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getPortfolioItemById(input.id);
      if (!item || item.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Portfolio item not found" });
      }
      await db.deletePortfolioItem(input.id);
      return { success: true };
    }),

  // Toggle featured status
  toggleFeatured: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getPortfolioItemById(input.id);
      if (!item || item.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Portfolio item not found" });
      }
      await db.updatePortfolioItem(input.id, { isFeatured: !item.isFeatured });
      return { success: true, isFeatured: !item.isFeatured };
    }),
});
