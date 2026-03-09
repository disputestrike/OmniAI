/**
 * REST API for credit pack purchase and balance (Items 2).
 * POST /api/credits/purchase — create Stripe checkout, return URL
 * GET /api/credits/balance — return purchased_credits, monthly remaining, reset_date
 */
import express from "express";
import { authenticateRequest } from "./_core/auth";
import { getOrCreateCreditWallet, getCurrentPeriod, getOrCreateUserUsage } from "./creditsAndUsage";
import { TIER_LIMITS, CREDIT_PACKS } from "./tierLimits";
import { ENV } from "./_core/env";
import Stripe from "stripe";

let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!_stripe && ENV.stripeSecretKey) {
    _stripe = new Stripe(ENV.stripeSecretKey, { apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion });
  }
  return _stripe;
}

const priceIdMap: Record<string, string> = {
  "50": ENV.stripePriceCredits50,
  "150": ENV.stripePriceCredits150,
  "400": ENV.stripePriceCredits400,
  "1000": ENV.stripePriceCredits1000,
  "5000": ENV.stripePriceCredits5000,
};

export function registerCreditsRoutes(app: express.Application) {
  app.get("/api/credits/balance", async (req, res) => {
    try {
      const user = await authenticateRequest(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const wallet = await getOrCreateCreditWallet(user.id);
      const period = await getCurrentPeriod(user.id);
      const usage = await getOrCreateUserUsage(user.id, period.start, period.end);
      const tier = (user.subscriptionPlan || "free") as keyof typeof TIER_LIMITS;
      const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
      const genLimit = limits.aiGenerationsMonthly < 0 ? 999999 : limits.aiGenerationsMonthly;
      const imgLimit = limits.aiImagesMonthly < 0 ? 999999 : limits.aiImagesMonthly;
      const genUsed = usage?.aiGenerationsUsed ?? 0;
      const imgUsed = usage?.aiImagesUsed ?? 0;
      return res.json({
        purchased_credits: wallet?.purchasedCredits ?? 0,
        monthly_generations_remaining: Math.max(0, genLimit - genUsed),
        monthly_images_remaining: Math.max(0, imgLimit - imgUsed),
        reset_date: period.end.toISOString().slice(0, 10),
      });
    } catch {
      return res.status(500).json({ error: "Failed to get balance" });
    }
  });

  app.post("/api/credits/purchase", express.json(), async (req, res) => {
    try {
      const user = await authenticateRequest(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const { creditPackId } = req.body;
      if (!creditPackId || typeof creditPackId !== "string") return res.status(400).json({ error: "creditPackId required" });
      const pack = CREDIT_PACKS.find((p) => p.id === creditPackId);
      const priceId = priceIdMap[creditPackId];
      if (!pack || !priceId) return res.status(400).json({ error: "Invalid credit pack" });

      const stripe = getStripe();
      if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

      const origin = (req.headers.origin || req.headers.referer || "").toString().replace(/\/$/, "") || (process.env.PUBLIC_URL || "https://app.otobi.ai");
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/dashboard?credits=added`,
        cancel_url: `${origin}/dashboard`,
        client_reference_id: String(user.id),
        metadata: { user_id: String(user.id), credit_pack: creditPackId },
      });
      return res.json({ url: session.url });
    } catch (e) {
      console.error("[credits] purchase error:", e);
      return res.status(500).json({ error: "Failed to create checkout" });
    }
  });
}
