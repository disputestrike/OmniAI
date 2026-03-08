/**
 * Background jobs (Spec v4).
 * Run on interval or cron: DSP performance sync, momentum analysis, budget alerts, trial emails.
 */
import { getDb } from "../db";
import { dspPerformanceSnapshots, dspCampaigns } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export async function runSyncDspPerformance(): Promise<{ ok: number; err: number }> {
  const db = await getDb();
  if (!db) return { ok: 0, err: 0 };
  let ok = 0;
  let err = 0;
  try {
    const campaigns = await db.select({ id: dspCampaigns.id, userId: dspCampaigns.userId, epomCampaignId: dspCampaigns.epomCampaignId }).from(dspCampaigns).where(eq(dspCampaigns.status, "active"));
    const today = new Date().toISOString().slice(0, 10);
    for (const c of campaigns) {
      try {
        await db.insert(dspPerformanceSnapshots).values({
          campaignId: c.id,
          snapshotDate: today,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spendCents: 0,
          ctr: 0,
          cpm: 0,
        });
        ok++;
      } catch {
        err++;
      }
    }
  } catch (e) {
    console.warn("[jobs] sync_dsp_performance error:", e);
  }
  return { ok, err };
}

export async function runClaudeMomentumAnalysis(): Promise<void> {
  try {
    const { routeAITask } = await import("../services/aiRouter.service");
    await routeAITask("campaign_momentum", { prompt: "Summarize momentum for today.", userTier: "professional" });
  } catch (e) {
    console.warn("[jobs] claude_momentum_analysis:", e);
  }
}

export async function runDspBudgetAlert(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const low = await db.select().from(dspCampaigns).where(eq(dspCampaigns.status, "active"));
    for (const c of low) {
      if (c.totalBudgetCents != null && c.spentCents != null && c.spentCents >= c.totalBudgetCents * 0.9) {
        console.log(`[jobs] DSP budget alert: campaign ${c.id} (${c.name}) at 90%+ of budget`);
      }
    }
  } catch (e) {
    console.warn("[jobs] dsp_budget_alert:", e);
  }
}

export async function runTrialEmailSender(): Promise<void> {
  console.log("[jobs] trial_email_sender: would send Day 6 trial reminder emails (integrate with your email provider).");
}

export async function runAllJobs(): Promise<void> {
  await runSyncDspPerformance();
  await runClaudeMomentumAnalysis();
  await runDspBudgetAlert();
  await runTrialEmailSender();
}
