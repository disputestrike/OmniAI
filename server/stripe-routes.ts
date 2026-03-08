import express from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { users, subscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { addCreditsToWallet } from "./creditsAndUsage";
import { resetUserUsage } from "./creditsAndUsage";
import { CREDIT_PACKS } from "./tierLimits";

let _stripe: Stripe | null = null;

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
            }
          }

          if (userId && mode === "payment" && session.payment_status === "paid") {
            const creditPackId = session.metadata?.credit_pack;
            if (creditPackId) {
              const pack = CREDIT_PACKS.find((p) => p.id === creditPackId);
              if (pack) {
                await addCreditsToWallet(parseInt(userId), pack.credits, session.payment_intent as string || null, "purchase");
              }
            }
          }
          break;
        }

        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const db = await getDb();
          if (db) {
            const subId = sub.id;
            const periodStart = new Date((sub as any).current_period_start * 1000);
            const periodEnd = new Date((sub as any).current_period_end * 1000);
            const trialEnd = (sub as any).trial_end ? new Date((sub as any).trial_end * 1000) : null;
            await db.update(subscriptions).set({
              status: sub.status as any,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              trialEndsAt: trialEnd,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            }).where(eq(subscriptions.stripeSubscriptionId, subId));

            // User plan already set at checkout; keep subscription row in sync for period/trial
          }
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const db = await getDb();
          if (db) {
            await db.update(subscriptions).set({ status: "canceled" })
              .where(eq(subscriptions.stripeSubscriptionId, sub.id));

            const existingSub = await db.select().from(subscriptions)
              .where(eq(subscriptions.stripeSubscriptionId, sub.id)).limit(1);
            if (existingSub.length > 0) {
              await db.update(users).set({
                subscriptionPlan: "free",
                stripeSubscriptionId: null,
              }).where(eq(users.id, existingSub[0].userId));
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
              }
            }
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as any;
          const db = await getDb();
          if (db && invoice.subscription) {
            await db.update(subscriptions).set({ status: "past_due" })
              .where(eq(subscriptions.stripeSubscriptionId, String(invoice.subscription)));
          }
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
