import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

const stepTypeEnum = z.enum(["landing", "form", "payment", "thank_you"]);

export const funnelRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getFunnelsByUser(ctx.user.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const funnel = await db.getFunnelById(input.id);
    if (!funnel || funnel.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Funnel not found" });
    const steps = await db.getFunnelSteps(input.id);
    return { ...funnel, steps };
  }),

  getBySlug: protectedProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    const funnel = await db.getFunnelBySlug(ctx.user.id, input.slug);
    if (!funnel) return null;
    const steps = await db.getFunnelSteps(funnel.id);
    return { ...funnel, steps };
  }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  })).mutation(async ({ ctx, input }) => {
    const existing = await db.getFunnelBySlug(ctx.user.id, input.slug);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Slug already in use" });
    return db.createFunnel({
      userId: ctx.user.id,
      name: input.name,
      slug: input.slug,
      status: "draft",
    });
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
    status: z.enum(["draft", "active", "archived"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    const funnel = await db.getFunnelById(input.id);
    if (!funnel || funnel.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Funnel not found" });
    const { id, ...data } = input;
    await db.updateFunnel(id, data);
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const funnel = await db.getFunnelById(input.id);
    if (!funnel || funnel.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Funnel not found" });
    const steps = await db.getFunnelSteps(input.id);
    for (const step of steps) await db.deleteFunnelStep(step.id);
    await db.deleteFunnel(input.id);
    return { success: true };
  }),

  addStep: protectedProcedure.input(z.object({
    funnelId: z.number(),
    stepType: stepTypeEnum,
    title: z.string().min(1),
    orderIndex: z.number().optional(),
    landingPageId: z.number().optional(),
    formId: z.number().optional(),
    stripePriceId: z.string().optional(),
    config: z.record(z.unknown()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const funnel = await db.getFunnelById(input.funnelId);
    if (!funnel || funnel.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Funnel not found" });
    const steps = await db.getFunnelSteps(input.funnelId);
    const orderIndex = input.orderIndex ?? steps.length;
    return db.createFunnelStep({
      funnelId: input.funnelId,
      orderIndex,
      stepType: input.stepType,
      title: input.title,
      landingPageId: input.landingPageId ?? null,
      formId: input.formId ?? null,
      stripePriceId: input.stripePriceId ?? null,
      config: input.config ?? null,
    });
  }),

  updateStep: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().min(1).optional(),
    orderIndex: z.number().optional(),
    landingPageId: z.number().nullable().optional(),
    formId: z.number().nullable().optional(),
    stripePriceId: z.string().nullable().optional(),
    config: z.record(z.unknown()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    await db.updateFunnelStep(id, data);
    return { success: true };
  }),

  deleteStep: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteFunnelStep(input.id);
    return { success: true };
  }),
});
