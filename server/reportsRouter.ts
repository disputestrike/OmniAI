import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import crypto from "crypto";
import * as db from "./db";

const reportTypeEnum = z.enum(["dashboard", "analytics", "ad_performance", "campaign"]);

function generateShareToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

export const reportsRouter = router({
  generate: protectedProcedure.input(z.object({
    reportType: reportTypeEnum,
    title: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    let payload: Record<string, unknown> = {};
    if (input.reportType === "dashboard") {
      const stats = await db.getDashboardStats(ctx.user.id);
      payload = { type: "dashboard", generatedAt: new Date().toISOString(), data: stats };
    } else if (input.reportType === "analytics") {
      const events = await db.getAnalyticsByUser(ctx.user.id);
      const summary = events.slice(0, 100).reduce((acc, e) => {
        acc.impressions += e.impressions ?? 0;
        acc.clicks += e.clicks ?? 0;
        acc.conversions += e.conversions ?? 0;
        return acc;
      }, { impressions: 0, clicks: 0, conversions: 0 });
      payload = { type: "analytics", generatedAt: new Date().toISOString(), summary, totalEvents: events.length };
    } else if (input.reportType === "ad_performance") {
      const reports = await db.getAdPerformanceReportsByUser(ctx.user.id);
      payload = { type: "ad_performance", generatedAt: new Date().toISOString(), reports: reports.slice(0, 50) };
    } else {
      const stats = await db.getDashboardStats(ctx.user.id);
      payload = { type: "campaign", generatedAt: new Date().toISOString(), data: stats };
    }
    const shareToken = generateShareToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await db.createReportSnapshot({
      userId: ctx.user.id,
      reportType: input.reportType,
      title: input.title ?? `${input.reportType} Report`,
      shareToken,
      payload,
      expiresAt,
    });
    const baseUrl = process.env.RAILWAY_STATIC_URL || process.env.VITE_APP_URL || "http://localhost:5000";
    const shareUrl = `${baseUrl}/report/${shareToken}`;
    return { shareToken, shareUrl, expiresAt: expiresAt.toISOString() };
  }),

  getByToken: publicProcedure.input(z.object({ shareToken: z.string() })).query(async ({ input }) => {
    const report = await db.getReportByShareToken(input.shareToken);
    if (!report) return null;
    if (report.expiresAt && new Date(report.expiresAt) < new Date()) return null;
    return { title: report.title, payload: report.payload, reportType: report.reportType };
  }),
});
