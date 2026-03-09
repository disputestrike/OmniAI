import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { users, userMonthlyUsage, creditWallets, creditTransactions, subscriptions } from "../drizzle/schema";
import { TIER_LIMITS, CREDIT_COST, UNLIMITED, type TierKey } from "./tierLimits";

export type UsageKey =
  | "aiGenerationsUsed"
  | "aiImagesUsed"
  | "videoScriptsUsed"
  | "videoMinutesUsed"
  | "websiteAnalysesUsed"
  | "abTestsUsed"
  | "scheduledPostsUsed";

const USAGE_KEY_TO_ACTION: Record<string, { key: UsageKey; creditCost: number }> = {
  ai_generation: { key: "aiGenerationsUsed", creditCost: CREDIT_COST.ai_generation ?? 1 },
  ai_image: { key: "aiImagesUsed", creditCost: CREDIT_COST.ai_image ?? 3 },
  video_script: { key: "videoScriptsUsed", creditCost: CREDIT_COST.video_script ?? 2 },
  video_generation: { key: "videoMinutesUsed", creditCost: CREDIT_COST.video_generation_per_minute ?? 30 },
  website_analysis: { key: "websiteAnalysesUsed", creditCost: CREDIT_COST.seo_audit ?? 10 },
  ab_test: { key: "abTestsUsed", creditCost: 0 },
  scheduled_post: { key: "scheduledPostsUsed", creditCost: 0 },
};

export async function getOrCreateUserUsage(userId: number, periodStart: Date, periodEnd: Date) {
  const db = await getDb();
  if (!db || typeof db.select !== "function") return null;
  try {
  const existing = await db.select().from(userMonthlyUsage).where(eq(userMonthlyUsage.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(userMonthlyUsage).values({
    userId,
    periodStart,
    periodEnd,
    aiGenerationsUsed: 0,
    aiImagesUsed: 0,
    videoScriptsUsed: 0,
    videoMinutesUsed: 0,
    websiteAnalysesUsed: 0,
    abTestsUsed: 0,
    scheduledPostsUsed: 0,
  });
  const created = await db.select().from(userMonthlyUsage).where(eq(userMonthlyUsage.userId, userId)).limit(1);
  return created[0] ?? null;
  } catch {
    return null;
  }
}

export async function resetUserUsage(userId: number, periodStart: Date, periodEnd: Date) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(userMonthlyUsage)
    .set({
      periodStart,
      periodEnd,
      aiGenerationsUsed: 0,
      aiImagesUsed: 0,
      videoScriptsUsed: 0,
      videoMinutesUsed: 0,
      websiteAnalysesUsed: 0,
      abTestsUsed: 0,
      scheduledPostsUsed: 0,
    })
    .where(eq(userMonthlyUsage.userId, userId));
}

export async function getOrCreateCreditWallet(userId: number) {
  const db = await getDb();
  if (!db || typeof db.select !== "function") return null;
  try {
  const existing = await db.select().from(creditWallets).where(eq(creditWallets.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(creditWallets).values({
    userId,
    purchasedCredits: 0,
    lifetimePurchased: 0,
    lifetimeUsed: 0,
  });
  const created = await db.select().from(creditWallets).where(eq(creditWallets.userId, userId)).limit(1);
  return created[0] ?? null;
  } catch {
    return null;
  }
}

export async function addCreditsToWallet(
  userId: number,
  amount: number,
  stripePaymentId: string | null,
  actionType: string
) {
  const db = await getDb();
  if (!db) return null;
  let wallet = await getOrCreateCreditWallet(userId);
  if (!wallet) return null;
  const newBalance = wallet.purchasedCredits + amount;
  await db
    .update(creditWallets)
    .set({
      purchasedCredits: newBalance,
      lifetimePurchased: wallet.lifetimePurchased + amount,
      lastPurchaseAt: new Date(),
    })
    .where(eq(creditWallets.userId, userId));
  await db.insert(creditTransactions).values({
    userId,
    amount: +amount,
    actionType,
    stripePaymentId,
    balanceAfter: newBalance,
  });
  return newBalance;
}

export async function deductCreditsFromWallet(userId: number, amount: number, actionType: string): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const wallet = await getOrCreateCreditWallet(userId);
  if (!wallet || wallet.purchasedCredits < amount) return null;
  const newBalance = wallet.purchasedCredits - amount;
  await db
    .update(creditWallets)
    .set({
      purchasedCredits: newBalance,
      lifetimeUsed: wallet.lifetimeUsed + amount,
    })
    .where(eq(creditWallets.userId, userId));
  await db.insert(creditTransactions).values({
    userId,
    amount: -amount,
    actionType,
    stripePaymentId: null,
    balanceAfter: newBalance,
  });
  return newBalance;
}

export async function getUserTier(userId: number): Promise<TierKey> {
  const db = await getDb();
  if (!db || typeof db.select !== "function") return "free";
  try {
  const rows = await db.select({ plan: users.subscriptionPlan }).from(users).where(eq(users.id, userId)).limit(1);
  const plan = rows[0]?.plan ?? "free";
  return plan as TierKey;
  } catch {
    return "free";
  }
}

export type CheckLimitResult =
  | { allowed: true; useMonthly: true }
  | { allowed: true; useMonthly: false; creditsToDeduct: number }
  | {
      allowed: false;
      reason: "limit_exceeded";
      canTopup: boolean;
      creditsNeeded: number;
      upgradeTo: TierKey;
    };

/** Get current period for user from subscription or default to current month. */
export async function getCurrentPeriod(userId: number): Promise<{ start: Date; end: Date }> {
  const db = await getDb();
  if (db && typeof db.select === "function") {
    try {
      const sub = await db
        .select({ currentPeriodStart: subscriptions.currentPeriodStart, currentPeriodEnd: subscriptions.currentPeriodEnd })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.currentPeriodEnd))
        .limit(1);
      if (sub[0]?.currentPeriodStart && sub[0]?.currentPeriodEnd) {
        return {
          start: new Date(sub[0].currentPeriodStart),
          end: new Date(sub[0].currentPeriodEnd),
        };
      }
    } catch {
      // fall through to default
    }
  }
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export async function checkLimit(userId: number, actionType: string): Promise<CheckLimitResult> {
  const tier = await getUserTier(userId);
  const limits = TIER_LIMITS[tier];
  const meta = USAGE_KEY_TO_ACTION[actionType];
  if (!meta) return { allowed: true, useMonthly: true };

  const period = await getCurrentPeriod(userId);
  let usage = await getOrCreateUserUsage(userId, period.start, period.end);
  if (!usage) return { allowed: true, useMonthly: true };

  const monthlyLimit =
    meta.key === "aiGenerationsUsed"
      ? limits.aiGenerationsMonthly
      : meta.key === "aiImagesUsed"
        ? limits.aiImagesMonthly
        : meta.key === "videoScriptsUsed"
          ? limits.videoScriptsMonthly
          : meta.key === "videoMinutesUsed"
            ? limits.videoGenMinutes
            : meta.key === "websiteAnalysesUsed"
              ? limits.websiteAnalyses
              : meta.key === "abTestsUsed"
                ? limits.abTests
                : meta.key === "scheduledPostsUsed"
                  ? limits.scheduledPostsMonthly
                  : 0;

  const used = usage[meta.key] ?? 0;
  const creditCost = meta.creditCost;

  if (monthlyLimit !== UNLIMITED && used < monthlyLimit) {
    return { allowed: true, useMonthly: true };
  }

  if (limits.creditTopupsAllowed && creditCost > 0) {
    const wallet = await getOrCreateCreditWallet(userId);
    const balance = wallet?.purchasedCredits ?? 0;
    if (balance >= creditCost) {
      return { allowed: true, useMonthly: false, creditsToDeduct: creditCost };
    }
  }

  const nextTier: TierKey =
    tier === "free"
      ? "starter"
      : tier === "starter"
        ? "professional"
        : tier === "professional"
          ? "business"
          : "enterprise";
  return {
    allowed: false,
    reason: "limit_exceeded",
    canTopup: limits.creditTopupsAllowed,
    creditsNeeded: creditCost,
    upgradeTo: nextTier,
  };
}

/** Get subscription row for user (for trialEndsAt, periodEnd). */
export async function getSubscriptionForUser(userId: number) {
  const db = await getDb();
  if (!db || typeof db.select !== "function") return null;
  try {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.currentPeriodEnd))
    .limit(1);
  return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Call after checkLimit returns allowed: true — increments monthly usage or deducts credits. */
export async function consumeLimit(userId: number, actionType: string, checkResult: CheckLimitResult): Promise<boolean> {
  if (!checkResult.allowed) return false;
  const period = await getCurrentPeriod(userId);
  const db = await getDb();
  if (!db) return false;

  if (checkResult.useMonthly) {
    const usage = await getOrCreateUserUsage(userId, period.start, period.end);
    if (!usage || typeof db.update !== "function") return true;
    const meta = USAGE_KEY_TO_ACTION[actionType];
    if (!meta) return true;
    try {
      const col = meta.key;
      const current = Number((usage as unknown as Record<string, unknown>)[col]) || 0;
      const tier = await getUserTier(userId);
      const limits = TIER_LIMITS[tier];
      const monthlyLimit =
        col === "aiGenerationsUsed" ? limits.aiGenerationsMonthly
        : col === "aiImagesUsed" ? limits.aiImagesMonthly
        : col === "videoScriptsUsed" ? limits.videoScriptsMonthly
        : col === "videoMinutesUsed" ? limits.videoGenMinutes
        : col === "websiteAnalysesUsed" ? limits.websiteAnalyses
        : 0;
      await db
        .update(userMonthlyUsage)
        .set({ [col]: current + 1 } as unknown as Partial<typeof userMonthlyUsage.$inferInsert>)
        .where(eq(userMonthlyUsage.userId, userId));
      // EMAIL 10 — Usage 80% (once per period)
      const usage80Sent = (usage as unknown as { usage80EmailSent?: boolean }).usage80EmailSent;
      if (
        monthlyLimit !== UNLIMITED &&
        monthlyLimit > 0 &&
        current + 1 >= 0.8 * monthlyLimit &&
        !usage80Sent
      ) {
        try {
          const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
          if (u?.email) {
            const { sendEmail, getUsage80Html, getBaseUrl } = await import("./email.service");
            const base = getBaseUrl();
            const generationsLeft = Math.max(0, monthlyLimit - (current + 1));
            const resetDate = period.end.toLocaleDateString("en-US");
            await sendEmail(
              u.email,
              "You have used 80% of your monthly generations",
              getUsage80Html(generationsLeft, resetDate, `${base}/pricing#credits`, `${base}/pricing`),
            );
            await db.update(userMonthlyUsage).set({ usage80EmailSent: true }).where(eq(userMonthlyUsage.userId, userId));
          }
        } catch {
          // ignore email errors
        }
      }
    } catch {
      // e.g. mock db without update in tests
    }
    return true;
  }

  const deducted = await deductCreditsFromWallet(userId, checkResult.creditsToDeduct, actionType);
  return deducted !== null;
}
