import express from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { users, subscriptions, dspAdWallets, dspWalletTransactions } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { addCreditsToWallet } from "./creditsAndUsage";
import { resetUserUsage } from "./creditsAndUsage";
import { CREDIT_PACKS } from "./tierLimits";
import { createEpomAccount, fundEpomWallet, isEpomConfigured } from "./services/epom.service";

let _stripe: Stripe | null = null;

/** Create DSP fund checkout URL (for tRPC or server use). */
export async function createDspFundCheckout(userId: number, amountCents: number, origin: string): Promise<{ url: string | null }> {
  const stripe = getStripe();
  if (!stripe) return { url: null };
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(amountCents)),
          product_data: { name: "OTOBI AI — Ad Wallet Fund" },
        },
        quantity: 1,
      }],
      success_url: `${origin}/programmatic-ads?fund=success`,
      cancel_url: `${origin}/programmatic-ads`,
      client_reference_id: String(userId),
      metadata: { type: "dsp_fund", user_id: String(userId) },
    });
    return { url: session.url };
  } catch (err: any) {
    console.error("[Stripe] DSP fund checkout error:", err);
    return { url: null };
  }
}

function getStripe(): Stripe | null {
  if (!_stripe && ENV.stripeSecretKey) {
    _stripe = new Stripe(ENV.stripeSecretKey, { apiVersion: "2025-02-24.acacia" as any });
  }
  return _stripe;
}

/** Map plan key + billing to Stripe Price ID from env. */
function getPriceId(plan: string, billing: string): string | null {
  const key = `${plan}_${billing}`.toLowerCase();
  const map: Record<string, string> = {
    starter_monthly: ENV.stripePriceStarterMonthly,
    starter_annual: ENV.stripePriceStarterAnnual,
    professional_monthly: ENV.stripePriceProMonthly,
    professional_annual: ENV.stripePriceProAnnual,
    pro_monthly: ENV.stripePriceProMonthly,
    pro_annual: ENV.stripePriceProAnnual,
    business_monthly: ENV.stripePriceBizMonthly,
    business_annual: ENV.stripePriceBizAnnual,
    biz_monthly: ENV.stripePriceBizMonthly,
    biz_annual: ENV.stripePriceBizAnnual,
    agency_monthly: ENV.stripePriceAgencyMonthly,
    agency_annual: ENV.stripePriceAgencyAnnual,
    enterprise_monthly: ENV.stripePriceAgencyMonthly,
    enterprise_annual: ENV.stripePriceAgencyAnnual,
  };
  const id = map[key];
  return id && id.length > 0 ? id : null;
}

export function registerStripeRoutes(app: express.Application) {
  // Webhook must use raw body for signature verification
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const stripe = getStripe();
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, ENV.stripeWebhookSecret || "");
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Stripe Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.user_id;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string | null;
          const mode = session.mode;

          if (userId && mode === "subscription" && subscriptionId) {
            const db = await getDb();
            if (db) {
              const plan = (session.metadata?.plan as string) || "starter";
              await db.update(users).set({
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                subscriptionPlan: plan as any,
                trialUsed: true,
              }).where(eq(users.id, parseInt(userId)));

              const sub = await stripe.subscriptions.retrieve(subscriptionId);
              const item = sub.items.data[0];
              const periodEnd = new Date((sub as any).current_period_end * 1000);
              const periodStart = new Date((sub as any).current_period_start * 1000);
              const trialEnd = (sub as any).trial_end ? new Date((sub as any).trial_end * 1000) : null;
              await db.insert(subscriptions).values({
                userId: parseInt(userId),
                stripeSubscriptionId: subscriptionId,
                stripePriceId: item?.price?.id || "",
                status: (sub.status as any) || "active",
                currentPeriodEnd: periodEnd,
                currentPeriodStart: periodStart,
                trialEndsAt: trialEnd,
              });
              // EMAIL 2 — Trial Started
              if (trialEnd && trialEnd > new Date()) {
                try {
                  const [u] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, parseInt(userId))).limit(1);
                  if (u?.email) {
                    const { sendEmail, getTrialStartedHtml, getBaseUrl } = await import("./email.service");
                    const base = getBaseUrl();
                    const tierNames: Record<string, string> = { starter: "Starter", professional: "Professional", pro: "Professional", business: "Business", biz: "Business", agency: "Agency", enterprise: "Enterprise" };
                    const chargeDate = trialEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
                    const fiveThings = ["Try Product Analyzer with a product URL", "Generate a week of social posts in Content Studio", "Create an ad image in Creative Engine", "Run the AI Campaign Wizard", "Check out Programmatic Ads (Starter+)"];
                    const limitsSummary = plan === "starter" ? "50 generations, 15 images, 5 video scripts/month" : plan === "professional" || plan === "pro" ? "200 generations, 50 images, 20 video scripts/month" : "See your plan for full limits.";
                    await sendEmail(
                      u.email,
                      "Your 7-day free trial has started — here's what to do first",
                      getTrialStartedHtml(
                        u.name || "there",
                        tierNames[plan] || plan,
                        chargeDate,
                        fiveThings,
                        limitsSummary,
                        `${base}/dashboard`,
                        `${base}/pricing`,
                      ),
                    );
                  }
                } catch (e) {
                  console.warn("[Stripe] Trial started email failed:", e);
                }
              }
            }
          }

          if (userId && mode === "payment" && session.payment_status === "paid") {
            const metaType = session.metadata?.type;
            if (metaType === "dsp_fund") {
              const grossCents = session.amount_total ?? 0;
              const db = await getDb();
              if (grossCents > 0 && db) {
                const uid = parseInt(userId);
                const userRows = await db.select({ subscriptionPlan: users.subscriptionPlan }).from(users).where(eq(users.id, uid)).limit(1);
                const tier = (userRows[0]?.subscriptionPlan ?? "free") as string;
                const markupBps = { free: 0, starter: 4000, professional: 3500, pro: 3500, business: 3000, agency: 2500, enterprise: 2500 }[tier] ?? 0;
                const markupCents = Math.round((grossCents * markupBps) / 10000);
                const netCents = grossCents - markupCents;
                let walletRows = await db.select().from(dspAdWallets).where(eq(dspAdWallets.userId, uid)).limit(1);
                if (walletRows.length === 0) {
                  await db.insert(dspAdWallets).values({ userId: uid, balanceCents: 0, totalDepositedCents: 0, totalSpentCents: 0, totalMarkupEarnedCents: 0 });
                  walletRows = await db.select().from(dspAdWallets).where(eq(dspAdWallets.userId, uid)).limit(1);
                }
                let wallet = walletRows[0];
                let epomAccountId = wallet?.epomAccountId ?? null;
                if (isEpomConfigured() && netCents > 0) {
                  if (!epomAccountId) {
                    const userRows = await db.select({ email: users.email }).from(users).where(eq(users.id, uid)).limit(1);
                    const email = userRows[0]?.email ?? `user-${uid}@otobi.local`;
                    try {
                      const epomRes = await createEpomAccount(String(uid), email);
                      epomAccountId = (epomRes as any).accountId ?? (epomRes as any).id ?? null;
                      if (epomAccountId && wallet) await db.update(dspAdWallets).set({ epomAccountId, isActive: true, activatedAt: new Date() }).where(eq(dspAdWallets.userId, uid));
                      else if (epomAccountId) wallet = (await db.select().from(dspAdWallets).where(eq(dspAdWallets.userId, uid)).limit(1))[0];
                    } catch (e) {
                      console.warn("[Stripe Webhook] Epom account create failed:", e);
                    }
                  }
                  if (epomAccountId) await fundEpomWallet(epomAccountId, netCents);
                }
                const balanceAfter = (wallet?.balanceCents ?? 0) + grossCents;
                await db.insert(dspWalletTransactions).values({
                  userId: uid,
                  transactionType: "deposit",
                  grossAmountCents: grossCents,
                  markupCents,
                  netAmountCents: netCents,
                  stripePaymentId: session.payment_intent as string ?? null,
                  balanceAfterCents: balanceAfter,
                });
                await db.update(dspAdWallets).set({
                  balanceCents: balanceAfter,
                  totalDepositedCents: (wallet?.totalDepositedCents ?? 0) + grossCents,
                  totalMarkupEarnedCents: (wallet?.totalMarkupEarnedCents ?? 0) + markupCents,
                }).where(eq(dspAdWallets.userId, uid));
              }
            } else {
              const creditPackId = session.metadata?.credit_pack;
              if (creditPackId) {
                const pack = CREDIT_PACKS.find((p) => p.id === creditPackId);
                if (pack) {
                  await addCreditsToWallet(parseInt(userId), pack.credits, session.payment_intent as string || null, "purchase");
                }
              }
            }
          }
          break;
        }

        case "customer.subscription.trial_will_end": {
          const sub = event.data.object as Stripe.Subscription;
          const trialEnd = (sub as any).trial_end;
          if (trialEnd) {
            const daysLeft = Math.ceil((trialEnd * 1000 - Date.now()) / (24 * 60 * 60 * 1000));
            console.log(`[Stripe Webhook] Trial will end in ${daysLeft} days for subscription ${sub.id}. Send Day 6 email / show in-app banner.`);
          }
          break;
        }

        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const db = await getDb();
          if (db) {
            const subId = sub.id;
            const existingRows = await db.select({ userId: subscriptions.userId }).from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, subId)).limit(1);
            const userRows = existingRows[0] ? await db.select({ subscriptionPlan: users.subscriptionPlan, email: users.email, name: users.name }).from(users).where(eq(users.id, existingRows[0].userId)).limit(1) : [];
            const oldPlan = userRows[0]?.subscriptionPlan ?? "free";

            const periodStart = new Date((sub as any).current_period_start * 1000);
            const periodEnd = new Date((sub as any).current_period_end * 1000);
            const trialEnd = (sub as any).trial_end ? new Date((sub as any).trial_end * 1000) : null;
            const newPlan = (sub.metadata?.plan as string) || (sub.items?.data?.[0] ? "starter" : oldPlan);
            await db.update(subscriptions).set({
              status: sub.status as any,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              trialEndsAt: trialEnd,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            }).where(eq(subscriptions.stripeSubscriptionId, subId));
            if (existingRows[0]) await db.update(users).set({ subscriptionPlan: newPlan as any }).where(eq(users.id, existingRows[0].userId));

            // EMAIL 11 — Upgrade Confirmed (tier changed to higher)
            const order: Record<string, number> = { free: 0, starter: 1, professional: 2, pro: 2, business: 3, biz: 3, agency: 4, enterprise: 4 };
            if (existingRows[0] && userRows[0]?.email && (order[newPlan] ?? 0) > (order[String(oldPlan)] ?? 0)) {
              try {
                const { sendEmail, getUpgradeConfirmedHtml, getBaseUrl } = await import("./email.service");
                const base = getBaseUrl();
                const tierNames: Record<string, string> = { starter: "Starter", professional: "Professional", pro: "Professional", business: "Business", agency: "Agency", enterprise: "Enterprise" };
                const tierName = tierNames[newPlan] || newPlan;
                const amount = sub.items?.data?.[0]?.price?.unit_amount ? `$${((sub.items.data[0].price.unit_amount / 100) * (sub.items.data[0].price.recurring?.interval === "year" ? 1 / 12 : 1)).toFixed(0)}/mo` : "";
                const features: string[] = newPlan === "starter" ? ["50 AI generations/month", "15 images", "5 video scripts", "Programmatic Ads"] : newPlan === "professional" || newPlan === "pro" ? ["200 generations", "50 images", "20 video scripts", "AI video", "Team seats"] : ["Higher limits", "More team seats", "Priority support"];
                const limits = newPlan === "starter" ? "50 generations, 15 images, 5 video scripts" : "See your plan";
                await sendEmail(
                  userRows[0].email,
                  "You are now on OTOBI " + tierName,
                  getUpgradeConfirmedHtml(tierName, amount, features, limits, `${base}/dashboard`),
                );
              } catch (e) {
                console.warn("[Stripe] Upgrade confirmed email failed:", e);
              }
            }
          }
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const db = await getDb();
          if (db) {
            const existingSub = await db.select().from(subscriptions)
              .where(eq(subscriptions.stripeSubscriptionId, sub.id)).limit(1);
            const hadTrial = (sub as any).trial_end && (sub as any).trial_end > Math.floor(Date.now() / 1000);
            const wasTrialing = sub.status === "trialing" || (existingSub[0]?.trialEndsAt && new Date(existingSub[0].trialEndsAt) > new Date());
            await db.update(subscriptions).set({ status: "canceled", canceledAt: new Date() })
              .where(eq(subscriptions.stripeSubscriptionId, sub.id));

            if (existingSub.length > 0) {
              await db.update(users).set({
                subscriptionPlan: "free",
                stripeSubscriptionId: null,
              }).where(eq(users.id, existingSub[0].userId));
              // EMAIL 6 — Trial Cancelled (no charge was made)
              if (wasTrialing || hadTrial) {
                try {
                  const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, existingSub[0].userId)).limit(1);
                  if (u?.email) {
                    const { sendEmail, getTrialCancelledHtml, getBaseUrl } = await import("./email.service");
                    const base = getBaseUrl();
                    await sendEmail(
                      u.email,
                      "Your trial has been cancelled — no charge was made",
                      getTrialCancelledHtml(`${base}/pricing`, "support@otobi.ai"),
                    );
                  }
                } catch (e) {
                  console.warn("[Stripe] Trial cancelled email failed:", e);
                }
              }
            }
          }
          break;
        }

        case "invoice.paid":
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice & { subscription?: string; billing_reason?: string };
          if (invoice.subscription && invoice.billing_reason === "subscription_cycle") {
            const db = await getDb();
            if (db) {
              const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
              const existingSub = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, sub.id)).limit(1);
              if (existingSub.length > 0) {
                const uid = existingSub[0].userId;
                const periodStart = new Date((sub as any).current_period_start * 1000);
                const periodEnd = new Date((sub as any).current_period_end * 1000);
                await db.update(subscriptions).set({
                  currentPeriodStart: periodStart,
                  currentPeriodEnd: periodEnd,
                }).where(eq(subscriptions.stripeSubscriptionId, sub.id));
                await resetUserUsage(uid, periodStart, periodEnd);
                // EMAIL 5 — Charge Confirmed
                try {
                  const [u] = await db.select({ name: users.name, email: users.email, subscriptionPlan: users.subscriptionPlan }).from(users).where(eq(users.id, uid)).limit(1);
                  if (u?.email) {
                    const { sendEmail, getChargeConfirmedHtml, getBaseUrl } = await import("./email.service");
                    const base = getBaseUrl();
                    const tierNames: Record<string, string> = { starter: "Starter", professional: "Professional", pro: "Professional", business: "Business", agency: "Agency", enterprise: "Enterprise" };
                    const amount = invoice.amount_paid != null ? `$${(invoice.amount_paid / 100).toFixed(2)}` : "your plan amount";
                    const date = new Date().toLocaleDateString("en-US");
                    const nextBilling = periodEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
                    const portalUrl = `${base}/pricing`;
                    await sendEmail(
                      u.email,
                      "Payment confirmed — welcome to OTOBI " + (tierNames[String(u.subscriptionPlan)] || u.subscriptionPlan),
                      getChargeConfirmedHtml(
                        tierNames[String(u.subscriptionPlan)] || String(u.subscriptionPlan),
                        amount,
                        date,
                        nextBilling,
                        invoice.number || invoice.id || "—",
                        portalUrl,
                        `${base}/dashboard`,
                      ),
                    );
                  }
                } catch (e) {
                  console.warn("[Stripe] Charge confirmed email failed:", e);
                }
              }
            }
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as any;
          const db = await getDb();
          if (db && invoice.subscription) {
            await db.update(subscriptions).set({ status: "past_due", pastDueAt: new Date() })
              .where(eq(subscriptions.stripeSubscriptionId, String(invoice.subscription)));
            // EMAIL 8 — Payment Failed
            try {
              const sub = await stripe.subscriptions.retrieve(String(invoice.subscription));
              const customerId = sub.customer as string;
              const portalSession = await stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: (process.env.PUBLIC_URL || process.env.BASE_URL || "https://app.otobi.ai").replace(/\/$/, "") + "/pricing",
              });
              const subs = await db.select({ userId: subscriptions.userId }).from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, sub.id)).limit(1);
              if (subs[0]) {
                const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, subs[0].userId)).limit(1);
                if (u?.email) {
                  const { sendEmail, getPaymentFailedHtml } = await import("./email.service");
                  await sendEmail(
                    u.email,
                    "Action required — your OTOBI payment failed",
                    getPaymentFailedHtml(portalSession.url || ""),
                  );
                }
              }
            } catch (e) {
              console.warn("[Stripe] Payment failed email error:", e);
            }
          }
          break;
        }

        case "payment_intent.succeeded": {
          // Ad wallet and credit pack purchases are handled in checkout.session.completed.
          // This event can be used for idempotency or logging if needed.
          console.log("[Stripe Webhook] payment_intent.succeeded:", (event.data.object as any)?.id);
          break;
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[Stripe Webhook] Processing error:", err);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Create checkout session (JSON body). Accepts plan + billing; resolves priceId from env. 7-day trial if user has not used trial.
  app.post("/api/stripe/create-checkout", express.json(), async (req, res) => {
    const stripe = getStripe();
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

    const { priceId: bodyPriceId, userId, userEmail, userName, plan, billing } = req.body;

    if (!userId) return res.status(400).json({ error: "User ID required" });

    const priceId = bodyPriceId || (plan && billing ? getPriceId(plan, billing) : null);
    if (!priceId) return res.status(400).json({ error: "Invalid plan or billing. Provide plan + billing or priceId." });

    try {
      const db = await getDb();
      let trialUsed = true;
      if (db) {
        const rows = await db.select({ trialUsed: users.trialUsed }).from(users).where(eq(users.id, parseInt(userId))).limit(1);
        trialUsed = rows[0]?.trialUsed ?? true;
      }

      const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, "") || "";
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/pricing?success=true`,
        cancel_url: `${origin}/pricing?canceled=true`,
        client_reference_id: userId.toString(),
        customer_email: userEmail || undefined,
        allow_promotion_codes: true,
        metadata: {
          user_id: userId.toString(),
          customer_email: userEmail || "",
          customer_name: userName || "",
          plan: (plan || "starter").toString(),
        },
      };
      if (!trialUsed && ENV.trialDays > 0) {
        sessionParams.subscription_data = { trial_period_days: ENV.trialDays };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[Stripe] Checkout error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Create checkout for one-time credit pack purchase.
  app.post("/api/stripe/create-credit-checkout", express.json(), async (req, res) => {
    const stripe = getStripe();
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

    const { userId, creditPackId } = req.body;
    if (!userId || !creditPackId) return res.status(400).json({ error: "userId and creditPackId required" });

    const pack = CREDIT_PACKS.find((p) => p.id === creditPackId);
    const priceIdMap: Record<string, string> = {
      "50": ENV.stripePriceCredits50,
      "150": ENV.stripePriceCredits150,
      "400": ENV.stripePriceCredits400,
      "1000": ENV.stripePriceCredits1000,
      "5000": ENV.stripePriceCredits5000,
    };
    const priceId = priceIdMap[creditPackId];
    if (!pack || !priceId) return res.status(400).json({ error: "Invalid credit pack" });

    try {
      const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, "") || "";
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/pricing?credits=added`,
        cancel_url: `${origin}/pricing`,
        client_reference_id: userId.toString(),
        metadata: {
          user_id: userId.toString(),
          credit_pack: creditPackId,
        },
      });
      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[Stripe] Credit checkout error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/stripe/create-dsp-fund-checkout", express.json(), async (req, res) => {
    const { userId, amountCents } = req.body;
    if (!userId || !amountCents || amountCents < 100) return res.status(400).json({ error: "userId and amountCents (min 100) required" });
    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, "") || "";
    const { url } = await createDspFundCheckout(parseInt(userId), amountCents, origin);
    if (!url) return res.status(500).json({ error: "Stripe not configured or session failed" });
    res.json({ url });
  });

  // Create customer portal session for managing subscription
  app.post("/api/stripe/create-portal", express.json(), async (req, res) => {
    const stripe = getStripe();
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ error: "Customer ID required" });

    try {
      const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, "") || "";
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/pricing`,
      });
      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[Stripe] Portal error:", err);
      res.status(500).json({ error: err.message });
    }
  });
}
