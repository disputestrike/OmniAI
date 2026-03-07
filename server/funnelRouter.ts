import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
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

  recordStepEvent: publicProcedure.input(z.object({
    funnelId: z.number(),
    funnelStepId: z.number(),
    eventType: z.enum(["view", "complete"]),
    sessionId: z.string().optional(),
  })).mutation(async ({ input }) => {
    await db.createFunnelStepEvent({
      funnelId: input.funnelId,
      funnelStepId: input.funnelStepId,
      eventType: input.eventType,
      sessionId: input.sessionId ?? null,
    });
    return { ok: true };
  }),

  getFunnelAnalytics: protectedProcedure.input(z.object({ funnelId: z.number() })).query(async ({ ctx, input }) => {
    const funnel = await db.getFunnelById(input.funnelId);
    if (!funnel || funnel.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Funnel not found" });
    const counts = await db.getFunnelStepEventCounts(input.funnelId);
    return counts.map(c => ({
      stepId: c.stepId,
      stepTitle: c.stepTitle,
      orderIndex: c.orderIndex,
      views: c.views,
      completes: c.completes,
      dropOffPercent: c.views > 0 ? Math.round(((c.views - c.completes) / c.views) * 100) : 0,
    }));
  }),

  listFunnelAbTests: protectedProcedure.input(z.object({ funnelId: z.number() })).query(async ({ ctx, input }) => {
    const funnel = await db.getFunnelById(input.funnelId);
    if (!funnel || funnel.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Funnel not found" });
    return db.getFunnelAbTestsByFunnel(input.funnelId);
  }),

  createFunnelAbTest: protectedProcedure.input(z.object({
    funnelId: z.number(),
    funnelStepId: z.number(),
    name: z.string().min(1),
    variationNames: z.array(z.string().min(1)).min(2).max(5),
  })).mutation(async ({ ctx, input }) => {
    const funnel = await db.getFunnelById(input.funnelId);
    if (!funnel || funnel.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Funnel not found" });
    const { id } = await db.createFunnelAbTest({
      funnelId: input.funnelId,
      funnelStepId: input.funnelStepId,
      name: input.name,
      status: "draft",
    });
    const pct = Math.floor(100 / input.variationNames.length);
    for (let i = 0; i < input.variationNames.length; i++) {
      await db.createFunnelAbTestVariation({
        testId: id,
        name: input.variationNames[i],
        config: {},
        trafficPercent: i === input.variationNames.length - 1 ? 100 - pct * (input.variationNames.length - 1) : pct,
      });
    }
    return { id };
  }),

  getFunnelAbTestResults: protectedProcedure.input(z.object({ testId: z.number() })).query(async ({ ctx, input }) => {
    const test = await db.getFunnelAbTestById(input.testId);
    if (!test) throw new TRPCError({ code: "NOT_FOUND", message: "Test not found" });
    const funnel = await db.getFunnelById(test.funnelId);
    if (!funnel || funnel.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
    const variations = await db.getFunnelAbTestVariations(input.testId);
    return { test, variations: variations.map(v => ({ ...v, conversionRate: (v.views ?? 0) > 0 ? Math.round(((v.conversions ?? 0) / (v.views ?? 1)) * 10000) / 100 : 0 })) };
  }),

  updateFunnelAbTestStatus: protectedProcedure.input(z.object({ testId: z.number(), status: z.enum(["draft", "running", "completed"]) })).mutation(async ({ ctx, input }) => {
    const test = await db.getFunnelAbTestById(input.testId);
    if (!test) throw new TRPCError({ code: "NOT_FOUND" });
    const funnel = await db.getFunnelById(test.funnelId);
    if (!funnel || funnel.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
    await db.updateFunnelAbTest(input.testId, { status: input.status });
    return { success: true };
  }),

  recordFunnelAbView: publicProcedure.input(z.object({ variationId: z.number() })).mutation(async ({ input }) => {
    await db.incrementFunnelAbVariationViews(input.variationId);
    return { ok: true };
  }),

  recordFunnelAbConversion: publicProcedure.input(z.object({ variationId: z.number() })).mutation(async ({ input }) => {
    await db.incrementFunnelAbVariationConversions(input.variationId);
    return { ok: true };
  }),
});
