/**
 * Autonomous features: data flywheel, self-learning campaign engine,
 * market narrative engine, audience influence graph, referral (growth levers).
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

// ─── Flywheel (central patterns for Predictive AI) ─────────────────────
export const flywheelRouter = router({
  getPatterns: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(200).optional() }).optional())
    .query(async ({ input }) => {
      return db.getFlywheelPatterns(input?.limit ?? 100);
    }),
  aggregateFromCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const analytics = await db.getAnalyticsByCampaign(input.campaignId);
      const campaign = await db.getCampaignById(input.campaignId);
      if (!campaign || campaign.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      if (!analytics || analytics.length < 3) return { message: "Not enough data to aggregate (need 3+ events)" };
      const platform = (analytics[0]?.platform as string) || "unknown";
      const totalClicks = analytics.reduce((s, e) => s + (e.clicks || 0), 0);
      const totalImpressions = analytics.reduce((s, e) => s + (e.impressions || 0), 1);
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const ctrBand = ctr >= 5 ? "high" : ctr >= 2 ? "medium" : "low";
      await db.createFlywheelPattern({
        platform,
        format: "campaign",
        ctrBand,
        conversionBand: "unknown",
        sampleSize: analytics.length,
        patternSummary: `CTR ${ctr.toFixed(2)}% from ${analytics.length} events`,
      });
      return { ok: true, patternSummary: `Aggregated ${analytics.length} events → ${ctrBand} CTR` };
    }),
});

// ─── Self-Learning Campaign Engine ────────────────────────────────────
export const selfLearningRouter = router({
  extractWinningPatterns: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await db.getCampaignById(input.campaignId);
      if (!campaign || campaign.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      const analytics = await db.getAnalyticsByCampaign(input.campaignId);
      const abTests = await db.getAbTestsByUser(ctx.user.id);
      const campaignTests = abTests.filter((t) => t.campaignId === input.campaignId);
      let winnerSummary = "";
      for (const test of campaignTests) {
        const variants = await db.getVariantsByTest(test.id);
        const winner = variants.find((v) => v.id === test.winnerVariantId) || variants[0];
        if (winner) winnerSummary += `Winner: ${winner.name}, impressions ${winner.impressions}, clicks ${winner.clicks}, conversions ${winner.conversions}. `;
      }
      const dataForLlm = {
        campaignName: campaign.name,
        platforms: campaign.platforms,
        analyticsCount: analytics?.length ?? 0,
        recentAnalytics: (analytics || []).slice(0, 10).map((e) => ({ platform: e.platform, impressions: e.impressions, clicks: e.clicks, conversions: e.conversions })),
        abWinnerSummary: winnerSummary || "No A/B winner yet",
      };
      const res = await invokeLLM({
        messages: [
          { role: "system", content: "You are a marketing analyst. From campaign and A/B data, extract a short winning pattern: platform, format, hook length, emotion, and one-sentence summary. Return JSON: { platform, format, hookLength, emotion, summary }." },
          { role: "user", content: JSON.stringify(dataForLlm) },
        ],
        responseFormat: { type: "json_object" as const },
      });
      const text = res.choices[0]?.message?.content;
      if (!text) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No LLM response" });
      let parsed: { platform?: string; format?: string; hookLength?: string; emotion?: string; summary?: string };
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { summary: text };
      }
      await db.createCampaignWinningPattern({
        userId: ctx.user.id,
        campaignId: input.campaignId,
        platform: parsed.platform ?? undefined,
        format: parsed.format ?? undefined,
        hookLength: parsed.hookLength ?? undefined,
        emotion: parsed.emotion ?? undefined,
        summary: parsed.summary ?? text,
      });
      return { ok: true, pattern: parsed };
    }),
  listMyPatterns: protectedProcedure.query(async ({ ctx }) => {
    return db.getCampaignWinningPatternsByUser(ctx.user.id);
  }),
});

// ─── Market Narrative Engine ─────────────────────────────────────────
export const narrativeRouter = router({
  detect: protectedProcedure
    .input(z.object({ sourceText: z.string().min(1), sourceUrl: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const res = await invokeLLM({
        messages: [
          { role: "system", content: "You are a trend analyst. From the given content, detect the emerging narrative: one short summary, 3-5 topic tags, dominant emotion, and 2-3 suggested campaign angles. Return JSON: { summary, topics: string[], emotion, suggestedAngles: string[] }." },
          { role: "user", content: input.sourceText.slice(0, 8000) },
        ],
        responseFormat: { type: "json_object" as const },
      });
      const text = res.choices[0]?.message?.content;
      if (!text) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No LLM response" });
      const parsed = JSON.parse(text) as { summary: string; topics?: string[]; emotion?: string; suggestedAngles?: string[] };
      const id = await db.createNarrative({
        userId: ctx.user.id,
        summary: parsed.summary || "No summary",
        topics: parsed.topics ?? [],
        emotion: parsed.emotion ?? undefined,
        suggestedAngles: parsed.suggestedAngles ?? [],
        sourceUrl: input.sourceUrl,
      });
      return { id: id.id, ...parsed };
    }),
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getNarrativesByUser(ctx.user.id);
  }),
  getAngles: protectedProcedure
    .input(z.object({ narrativeId: z.number() }))
    .query(async ({ ctx, input }) => {
      const list = await db.getNarrativesByUser(ctx.user.id);
      const n = list.find((x) => x.id === input.narrativeId);
      if (!n) return null;
      return { suggestedAngles: n.suggestedAngles ?? [], summary: n.summary };
    }),
});

// ─── Audience Influence Graph ────────────────────────────────────────
export const influenceRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getInfluenceNodesByUser(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), type: z.enum(["persona", "channel"]), segmentId: z.number().optional(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createInfluenceNode({
        userId: ctx.user.id,
        name: input.name,
        type: input.type,
        segmentId: input.segmentId,
        notes: input.notes,
      });
      return { id: id.id };
    }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await db.deleteInfluenceNode(input.id, ctx.user.id);
    return { ok: true };
  }),
});

// ─── Referral (growth lever) ──────────────────────────────────────────
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export const referralRouter = router({
  getOrCreateCode: protectedProcedure.query(async ({ ctx }) => {
    let ref = await db.getReferralCodeByUserId(ctx.user.id);
    if (!ref) {
      let code = generateReferralCode();
      while (await db.getReferralCodeByCode(code)) code = generateReferralCode();
      await db.createReferralCode(ctx.user.id, code);
      ref = await db.getReferralCodeByUserId(ctx.user.id);
    }
    return ref ? { code: ref.code } : null;
  }),
  listMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    return db.getReferralsByReferrer(ctx.user.id);
  }),
});
