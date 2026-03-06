import express from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { users, subscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

let _stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!_stripe && ENV.stripeSecretKey) {
    _stripe = new Stripe(ENV.stripeSecretKey, { apiVersion: "2025-02-24.acacia" as any });
  }
  return _stripe;
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
          const subscriptionId = session.subscription as string;

          if (userId) {
            const db = await getDb();
            if (db) {
              await db.update(users).set({
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                subscriptionPlan: "pro", // Default to pro on checkout
              }).where(eq(users.id, parseInt(userId)));

              // Fetch subscription details from Stripe
              if (subscriptionId) {
                const sub = await stripe.subscriptions.retrieve(subscriptionId);
                await db.insert(subscriptions).values({
                  userId: parseInt(userId),
                  stripeSubscriptionId: subscriptionId,
                  stripePriceId: sub.items.data[0]?.price?.id || "",
                  status: "active",
                  currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
                });
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
            await db.update(subscriptions).set({
              status: sub.status as any,
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            }).where(eq(subscriptions.stripeSubscriptionId, subId));

            // Update user plan based on status
            const existingSub = await db.select().from(subscriptions)
              .where(eq(subscriptions.stripeSubscriptionId, subId)).limit(1);
            if (existingSub.length > 0) {
              const plan = sub.status === "active" ? "pro" : "free";
              await db.update(users).set({ subscriptionPlan: plan as any })
                .where(eq(users.id, existingSub[0].userId));
            }
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

        case "invoice.paid": {
          console.log(`[Stripe Webhook] Invoice paid: ${(event.data.object as any).id}`);
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

  // Create checkout session (JSON body)
  app.post("/api/stripe/create-checkout", express.json(), async (req, res) => {
    const stripe = getStripe();
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

    const { priceId, userId, userEmail, userName, plan } = req.body;

    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
      const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, "") || "";

      const session = await stripe.checkout.sessions.create({
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
          plan: plan || "pro",
        },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[Stripe] Checkout error:", err);
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
