/**
 * Background jobs (Spec v4).
 * Run on interval or cron: DSP performance sync (hourly), momentum analysis, budget alerts, trial emails, renewal, downgrade, win-back.
 */
import { getDb } from "../db";
import { dspPerformanceSnapshots, dspCampaigns, dspAdWallets, subscriptions, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getEpomStats } from "../services/epom.service";

export async function runSyncDspPerformance(): Promise<{ ok: number; err: number }> {
  const db = await getDb();
  if (!db) return { ok: 0, err: 0 };
  let ok = 0;
  let err = 0;
  try {
    const campaigns = await db.select({ id: dspCampaigns.id, userId: dspCampaigns.userId, epomCampaignId: dspCampaigns.epomCampaignId }).from(dspCampaigns).where(eq(dspCampaigns.status, "active"));
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    for (const c of campaigns) {
      try {
        let impressions = 0;
        let clicks = 0;
        let spendCents = 0;
        let ctr = 0;
        let cpm = 0;
        if (c.epomCampaignId) {
          const [wallet] = await db.select({ epomAccountId: dspAdWallets.epomAccountId }).from(dspAdWallets).where(eq(dspAdWallets.userId, c.userId)).limit(1);
          if (wallet?.epomAccountId) {
            try {
              const stats = await getEpomStats(wallet.epomAccountId, c.epomCampaignId, yesterday, today);
              impressions = stats?.impressions ?? 0;
              clicks = stats?.clicks ?? 0;
              spendCents = Math.round((stats?.spend ?? 0) * 100);
              ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) : 0;
              cpm = impressions > 0 ? Math.round((spendCents / (impressions / 1000))) : 0;
            } catch (e) {
              console.warn("[jobs] Epom getEpomStats failed for campaign", c.id, e);
            }
          }
        }
        await db.insert(dspPerformanceSnapshots).values({
          campaignId: c.id,
          snapshotDate: today,
          impressions,
          clicks,
          conversions: 0,
          spendCents,
          ctr,
          cpm,
        });
        const [row] = await db.select({ impressions: dspCampaigns.impressions, clicks: dspCampaigns.clicks, spentCents: dspCampaigns.spentCents }).from(dspCampaigns).where(eq(dspCampaigns.id, c.id)).limit(1);
        if (row) {
          await db.update(dspCampaigns).set({
            impressions: (row.impressions ?? 0) + impressions,
            clicks: (row.clicks ?? 0) + clicks,
            spentCents: (row.spentCents ?? 0) + spendCents,
            ctr,
          }).where(eq(dspCampaigns.id, c.id));
        }
        ok++;
      } catch (e) {
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

/** EMAIL 3 — Day 3 nurture; EMAIL 4 — Day 6 last warning. Send to trials ending in 4 days or 1 day. */
export async function runTrialEmailSender(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const now = new Date();
    const inFourDays = new Date(now.getTime() + 4 * 86400000);
    const inOneDay = new Date(now.getTime() + 1 * 86400000);
    const day3Start = new Date(inFourDays.getTime() - 43200000);
    const day3End = new Date(inFourDays.getTime() + 43200000);
    const day6Start = new Date(inOneDay.getTime() - 43200000);
    const day6End = new Date(inOneDay.getTime() + 43200000);

    const subs = await db.select().from(subscriptions).where(eq(subscriptions.status, "trialing"));
    const { sendEmail, getTrialDay3Html, getTrialDay6Html, getBaseUrl } = await import("../email.service");
    const base = getBaseUrl();

    for (const sub of subs) {
      const trialEnd = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
      if (!trialEnd || trialEnd < now) continue;
      const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, sub.userId)).limit(1);
      if (!u?.email) continue;

      if (trialEnd >= day3Start && trialEnd <= day3End) {
        await sendEmail(u.email, "Day 3 — are you getting value from OTOBI?", getTrialDay3Html(`${base}/dashboard`));
      }
      if (trialEnd >= day6Start && trialEnd <= day6End) {
        const amount = "$49";
        const cancelUrl = `${base}/pricing`;
        await sendEmail(
          u.email,
          `Your trial ends tomorrow — your card will be charged ${amount}`,
          getTrialDay6Html(amount, trialEnd.toLocaleDateString("en-US"), `${base}/dashboard`, cancelUrl),
        );
      }
    }
  } catch (e) {
    console.warn("[jobs] trial_email_sender:", e);
  }
}

/** EMAIL 7 — Renewal reminder 3 days before period end. */
export async function runRenewalReminder(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const in3Days = new Date(Date.now() + 3 * 86400000);
    const windowStart = new Date(in3Days.getTime() - 43200000);
    const windowEnd = new Date(in3Days.getTime() + 43200000);
    const subs = await db.select().from(subscriptions).where(eq(subscriptions.status, "active"));
    const { sendEmail, getRenewalReminderHtml, getBaseUrl } = await import("../email.service");
    const base = getBaseUrl();

    for (const sub of subs) {
      const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
      if (!periodEnd || periodEnd < windowStart || periodEnd > windowEnd) continue;
      const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, sub.userId)).limit(1);
      if (!u?.email) continue;
      const portalUrl = `${base}/pricing`;
      const amount = "$49";
      const usageSummary = "See your dashboard for usage.";
      await sendEmail(
        u.email,
        "Your OTOBI subscription renews in 3 days",
        getRenewalReminderHtml(amount, periodEnd.toLocaleDateString("en-US"), portalUrl, usageSummary),
      );
    }
  } catch (e) {
    console.warn("[jobs] renewal_reminder:", e);
  }
}

/** EMAIL 9 — Downgrade after 3 days past_due with no resolution. */
export async function runDowngradePastDue(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const cutoff = new Date(Date.now() - 3 * 86400000);
    const pastDue = await db.select().from(subscriptions).where(eq(subscriptions.status, "past_due"));
    const { sendEmail, getDowngradedHtml, getBaseUrl } = await import("../email.service");
    const base = getBaseUrl();

    for (const sub of pastDue) {
      const dueAt = sub.pastDueAt ? new Date(sub.pastDueAt) : null;
      if (!dueAt || dueAt > cutoff) continue;
      const uid = sub.userId;
      await db.update(subscriptions).set({ status: "canceled", canceledAt: new Date() }).where(eq(subscriptions.stripeSubscriptionId, sub.stripeSubscriptionId));
      await db.update(users).set({ subscriptionPlan: "free", stripeSubscriptionId: null }).where(eq(users.id, uid));
      const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, uid)).limit(1);
      if (u?.email) {
        await sendEmail(
          u.email,
          "Your account has been downgraded to Free",
          getDowngradedHtml(
            ["Programmatic Ads", "Higher AI limits", "Team seats", "Priority support"],
            `${base}/pricing`,
            "COMEBACK10",
          ),
        );
      }
    }
  } catch (e) {
    console.warn("[jobs] downgrade_past_due:", e);
  }
}

/** EMAIL 12 — Win-back 30 days after cancel. */
export async function runWinBack(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const windowStart = new Date(thirtyDaysAgo.getTime() - 86400000);
    const windowEnd = new Date(thirtyDaysAgo.getTime() + 86400000);
    const allCanceled = await db.select().from(subscriptions).where(eq(subscriptions.status, "canceled"));
    const { sendEmail, getWinBackHtml, getBaseUrl } = await import("../email.service");
    const base = getBaseUrl();

    for (const sub of allCanceled) {
      const canceledAt = sub.canceledAt ? new Date(sub.canceledAt) : null;
      if (!canceledAt || canceledAt < windowStart || canceledAt > windowEnd) continue;
      const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, sub.userId)).limit(1);
      if (!u?.email) continue;
      await sendEmail(
        u.email,
        "We have been building since you left — here is what is new",
        getWinBackHtml(
          ["Programmatic Ads (DSP) integration", "AI Campaign Wizard", "Improved Content Studio"],
          `${base}/pricing`,
        ),
      );
    }
  } catch (e) {
    console.warn("[jobs] win_back:", e);
  }
}

export async function runAllJobs(): Promise<void> {
  await runSyncDspPerformance();
  await runClaudeMomentumAnalysis();
  await runDspBudgetAlert();
  await runTrialEmailSender();
  await runRenewalReminder();
  await runDowngradePastDue();
  await runWinBack();
}
