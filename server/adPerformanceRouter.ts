import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// ─── Ad Performance Analyzer Router ──────────────────────────────────────────
export const adPerformanceRouter = router({
  // List all performance reports for the user
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getAdPerformanceReportsByUser(ctx.user.id);
  }),

  // Get a single report by ID
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getAdPerformanceReportById(input.id);
    }),

  // Analyze performance data for a connected ad account using AI
  analyze: protectedProcedure
    .input(z.object({
      connectionId: z.number(),
      dateRange: z.enum(["last_7_days", "last_30_days", "last_90_days", "all_time"]).default("last_30_days"),
      reportType: z.enum(["campaign", "adset", "ad", "account"]).default("campaign"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify connection belongs to user
      const connection = await db.getAdPlatformConnectionById(input.connectionId);
      if (!connection || connection.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Connection not found" });
      }

      // Get campaigns for this connection
      const campaigns = await db.getAdPlatformCampaignsByConnection(input.connectionId);

      // Create a pending report
      const report = await db.createAdPerformanceReport({
        userId: ctx.user.id,
        connectionId: input.connectionId,
        platform: connection.platform,
        reportType: input.reportType,
        dateRange: input.dateRange,
        rawData: campaigns as any,
        status: "analyzing" as any,
      });

      // Build mock performance data if no real campaigns exist
      const performanceData = campaigns.length > 0 ? campaigns : generateMockCampaignData(connection.platform);

      // Use AI to analyze the performance data
      const aiResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert digital advertising analyst specializing in ${connection.platform} campaigns. 
            Analyze the provided campaign performance data and extract actionable insights.
            Focus on: top performers, winning patterns, underperformers, and specific optimization recommendations.
            Be specific with numbers, percentages, and concrete action items.`,
          },
          {
            role: "user",
            content: `Analyze this ${connection.platform} campaign performance data for the ${input.dateRange.replace(/_/g, " ")}:
            
Platform: ${connection.platform}
Account: ${connection.accountName || "Unknown"}
Campaigns: ${JSON.stringify(performanceData, null, 2)}

Provide a comprehensive analysis including:
1. Top performing campaigns and why they work
2. Winning creative/copy patterns
3. Underperforming campaigns and what to fix
4. Budget optimization recommendations
5. Audience insights
6. Specific next actions to improve ROAS

Format as JSON with these exact fields:
- summary: string (2-3 sentence executive summary)
- topPerformers: array of {name, metric, value, reason}
- winningPatterns: array of {pattern, description, impact}
- underperformers: array of {name, issue, recommendation}
- budgetRecommendations: array of {action, campaign, reason, expectedImpact}
- audienceInsights: array of {insight, recommendation}
- nextActions: array of {priority, action, expectedResult}
- overallScore: number 1-100 (account health score)
- estimatedRoasImprovement: string`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ad_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                topPerformers: { type: "array", items: { type: "object", properties: { name: { type: "string" }, metric: { type: "string" }, value: { type: "string" }, reason: { type: "string" } }, required: ["name", "metric", "value", "reason"], additionalProperties: false } },
                winningPatterns: { type: "array", items: { type: "object", properties: { pattern: { type: "string" }, description: { type: "string" }, impact: { type: "string" } }, required: ["pattern", "description", "impact"], additionalProperties: false } },
                underperformers: { type: "array", items: { type: "object", properties: { name: { type: "string" }, issue: { type: "string" }, recommendation: { type: "string" } }, required: ["name", "issue", "recommendation"], additionalProperties: false } },
                budgetRecommendations: { type: "array", items: { type: "object", properties: { action: { type: "string" }, campaign: { type: "string" }, reason: { type: "string" }, expectedImpact: { type: "string" } }, required: ["action", "campaign", "reason", "expectedImpact"], additionalProperties: false } },
                audienceInsights: { type: "array", items: { type: "object", properties: { insight: { type: "string" }, recommendation: { type: "string" } }, required: ["insight", "recommendation"], additionalProperties: false } },
                nextActions: { type: "array", items: { type: "object", properties: { priority: { type: "string" }, action: { type: "string" }, expectedResult: { type: "string" } }, required: ["priority", "action", "expectedResult"], additionalProperties: false } },
                overallScore: { type: "number" },
                estimatedRoasImprovement: { type: "string" },
              },
              required: ["summary", "topPerformers", "winningPatterns", "underperformers", "budgetRecommendations", "audienceInsights", "nextActions", "overallScore", "estimatedRoasImprovement"],
              additionalProperties: false,
            },
          },
        },
      });

      const analysis = JSON.parse(aiResponse.choices[0].message.content as string);

      // Update the report with analysis results
      await db.updateAdPerformanceReport(report.id, {
        aiAnalysis: analysis.summary,
        topPerformers: analysis.topPerformers,
        winningPatterns: analysis.winningPatterns,
        recommendations: {
          budgetRecommendations: analysis.budgetRecommendations,
          audienceInsights: analysis.audienceInsights,
          nextActions: analysis.nextActions,
          underperformers: analysis.underperformers,
          overallScore: analysis.overallScore,
          estimatedRoasImprovement: analysis.estimatedRoasImprovement,
        } as any,
        status: "complete" as any,
      });

      return { ...report, analysis };
    }),

  // Generate alerts for underperforming campaigns
  generateAlerts: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const connection = await db.getAdPlatformConnectionById(input.connectionId);
      if (!connection || connection.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Connection not found" });
      }

      const campaigns = await db.getAdPlatformCampaignsByConnection(input.connectionId);
      const alerts = [];

      for (const campaign of campaigns) {
        const ctr = campaign.clicks && campaign.impressions
          ? (campaign.clicks / campaign.impressions) * 100
          : 0;

        if (ctr < 0.5 && campaign.impressions && campaign.impressions > 1000) {
          const alert = await db.createPerformanceAlert({
            userId: ctx.user.id,
            connectionId: input.connectionId,
            externalCampaignId: campaign.externalCampaignId,
            campaignName: campaign.name || "Unknown Campaign",
            platform: connection.platform,
            alertType: "low_ctr",
            severity: "warning",
            metric: "CTR",
            currentValue: `${ctr.toFixed(2)}%`,
            benchmarkValue: "1.5%",
            aiSuggestion: "Consider refreshing ad creative, testing new headlines, or refining audience targeting to improve click-through rate.",
          });
          alerts.push(alert);
        }
      }

      return { alertsCreated: alerts.length, alerts };
    }),

  // Get performance alerts for the user
  alerts: protectedProcedure.query(async ({ ctx }) => {
    return db.getPerformanceAlertsByUser(ctx.user.id);
  }),

  // Dismiss an alert
  dismissAlert: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.updatePerformanceAlert(input.id, { isDismissed: true });
      return { success: true };
    }),

  // Mark alert as read
  markAlertRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.updatePerformanceAlert(input.id, { isRead: true });
      return { success: true };
    }),
});

// ─── Mock data generator for demo purposes ───────────────────────────────────
function generateMockCampaignData(platform: string) {
  const platformNames: Record<string, string[]> = {
    meta_ads: ["Summer Sale - Retargeting", "Brand Awareness Q1", "Product Launch - Lookalike", "Holiday Bundle - Broad"],
    google_ads: ["Search - Brand Keywords", "Shopping - Top Products", "Display - Retargeting", "YouTube - Awareness"],
    tiktok_ads: ["Spark Ads - UGC", "TopView - New Launch", "In-Feed - Conversion", "Branded Hashtag"],
    default: ["Campaign Alpha", "Campaign Beta", "Campaign Gamma", "Campaign Delta"],
  };

  const names = platformNames[platform] || platformNames.default;

  return names.map((name, i) => ({
    name,
    externalCampaignId: `ext_${Date.now()}_${i}`,
    platform,
    status: i === 2 ? "paused" : "active",
    budget: `$${(50 + i * 25).toFixed(2)}/day`,
    spend: `$${(1200 + i * 340).toFixed(2)}`,
    impressions: 45000 + i * 12000,
    clicks: 890 + i * 180,
    conversions: 23 + i * 8,
    ctr: `${(1.8 + i * 0.3).toFixed(2)}%`,
    cpc: `$${(0.85 + i * 0.2).toFixed(2)}`,
    roas: `${(2.4 + i * 0.6).toFixed(1)}x`,
  }));
}
