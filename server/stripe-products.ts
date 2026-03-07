// ─── OTOBI AI: Pricing & Unit Economics ────────────────────────
// Pricing strategy based on competitive analysis:
// Arcads.ai: $110/mo (video only), Omneky: $99/mo (ads only),
// AdCreative.ai: $25-$359/mo, Jasper: $49-$69/seat/mo
// OTOBI AI combines ALL of these + CRM + Intelligence + Campaigns
//
// API Cost Estimates Per User/Month:
// - LLM (GPT-4.1 mini): $0.40-$1.60/1M tokens → ~$0.20-$5/user
// - Image Gen (DALL-E 3): $0.04-$0.08/image → ~$0.80-$8/user
// - Voice (Whisper): $0.006/min → ~$0.18-$0.72/user
// - TTS: $15/1M chars → ~$0.75/user
// - Infrastructure (DB/S3/CDN/Compute): ~$0.70/user
// Total cost range: $2-$26/user/month depending on usage tier
//
// Target gross margin: 80-90% (SaaS benchmark)

export interface PlanLimits {
  contentGenerations: number;  // -1 = unlimited
  imageGenerations: number;
  videoScripts: number;
  products: number;
  campaigns: number;
  leads: number;
  teamSeats: number;          // included seats
  additionalSeatPrice: number; // $/seat/month
  websiteAnalyses: number;
  scheduledPosts: number;
  abTests: number;
  voiceMinutes: number;       // speech-to-text minutes
  storageGb: number;
  apiAccess: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  adPlatformConnections: number;
  exportFormats: string[];
}

export interface Plan {
  name: string;
  description: string;
  tagline: string;
  features: string[];
  limits: PlanLimits;
  price: number;              // monthly price in USD
  annualPrice: number;        // annual monthly price (discounted)
  costPerUser: number;        // estimated API + infra cost
  grossMargin: number;        // target gross margin %
  stripePriceId: string;
  stripeAnnualPriceId: string;
}

export const PLANS: Record<string, Plan> = {
  free: {
    name: "Free",
    description: "Try OTOBI AI risk-free",
    tagline: "Perfect for exploring what AI marketing can do",
    features: [
      "5 AI content generations/month",
      "2 AI image creations/month",
      "1 product analysis",
      "2 campaigns",
      "Basic analytics dashboard",
      "1 platform intelligence lookup",
      "CSV export",
    ],
    limits: {
      contentGenerations: 5,
      imageGenerations: 2,
      videoScripts: 1,
      products: 1,
      campaigns: 2,
      leads: 25,
      teamSeats: 1,
      additionalSeatPrice: 0,
      websiteAnalyses: 1,
      scheduledPosts: 5,
      abTests: 0,
      voiceMinutes: 0,
      storageGb: 0.5,
      apiAccess: false,
      whiteLabel: false,
      prioritySupport: false,
      customBranding: false,
      adPlatformConnections: 0,
      exportFormats: ["csv"],
    },
    price: 0,
    annualPrice: 0,
    costPerUser: 0.50,
    grossMargin: 0,
    stripePriceId: "",
    stripeAnnualPriceId: "",
  },

  starter: {
    name: "Starter",
    description: "Launch your first AI-powered campaigns",
    tagline: "For solopreneurs and small businesses getting started",
    features: [
      "50 AI content generations/month",
      "15 AI image creations/month",
      "5 video scripts/month",
      "5 products",
      "10 campaigns",
      "500 leads",
      "Platform intelligence (all platforms)",
      "Content scheduler (25 posts/month)",
      "Basic A/B testing (3 tests)",
      "Website intelligence (3 analyses)",
      "AI marketing agent chat",
      "CSV + JSON export",
    ],
    limits: {
      contentGenerations: 50,
      imageGenerations: 15,
      videoScripts: 5,
      products: 5,
      campaigns: 10,
      leads: 500,
      teamSeats: 1,
      additionalSeatPrice: 0,
      websiteAnalyses: 3,
      scheduledPosts: 25,
      abTests: 3,
      voiceMinutes: 10,
      storageGb: 2,
      apiAccess: false,
      whiteLabel: false,
      prioritySupport: false,
      customBranding: false,
      adPlatformConnections: 1,
      exportFormats: ["csv", "json"],
    },
    price: 29,
    annualPrice: 24,
    costPerUser: 3.00,
    grossMargin: 89.7,
    stripePriceId: "",
    stripeAnnualPriceId: "",
  },

  professional: {
    name: "Professional",
    description: "Scale your marketing with full AI power",
    tagline: "For growing businesses and marketing teams",
    features: [
      "200 AI content generations/month",
      "50 AI image creations/month",
      "20 video scripts/month",
      "25 products",
      "Unlimited campaigns",
      "Unlimited leads",
      "5 team seats included ($15/extra seat)",
      "Full platform intelligence",
      "Campaign momentum analysis",
      "Unlimited scheduling",
      "Unlimited A/B testing",
      "Website intelligence (10 analyses)",
      "Voice input for AI chat",
      "CRM deals pipeline",
      "Ad platform connections (3)",
      "Predictive AI scoring",
      "Priority AI processing",
      "Priority support",
    ],
    limits: {
      contentGenerations: 200,
      imageGenerations: 50,
      videoScripts: 20,
      products: 25,
      campaigns: -1,
      leads: -1,
      teamSeats: 5,
      additionalSeatPrice: 15,
      websiteAnalyses: 10,
      scheduledPosts: -1,
      abTests: -1,
      voiceMinutes: 60,
      storageGb: 10,
      apiAccess: false,
      whiteLabel: false,
      prioritySupport: true,
      customBranding: false,
      adPlatformConnections: 3,
      exportFormats: ["csv", "json", "pdf"],
    },
    price: 79,
    annualPrice: 66,
    costPerUser: 8.00,
    grossMargin: 89.9,
    stripePriceId: "",
    stripeAnnualPriceId: "",
  },

  business: {
    name: "Business",
    description: "Full marketing domination for teams and agencies",
    tagline: "For agencies and marketing departments",
    features: [
      "Unlimited AI content generation",
      "200 AI image creations/month",
      "Unlimited video scripts",
      "Unlimited products",
      "Unlimited everything",
      "15 team seats included ($12/extra seat)",
      "White-label reports & exports",
      "API access (REST + webhooks)",
      "Custom brand voice training",
      "All ad platform connections",
      "Unlimited website intelligence",
      "Voice input + text-to-speech",
      "Advanced approval workflows",
      "SEO audit suite",
      "Dedicated account manager",
      "Custom integrations",
      "99.9% SLA guarantee",
    ],
    limits: {
      contentGenerations: -1,
      imageGenerations: 200,
      videoScripts: -1,
      products: -1,
      campaigns: -1,
      leads: -1,
      teamSeats: 15,
      additionalSeatPrice: 12,
      websiteAnalyses: -1,
      scheduledPosts: -1,
      abTests: -1,
      voiceMinutes: 300,
      storageGb: 50,
      apiAccess: true,
      whiteLabel: true,
      prioritySupport: true,
      customBranding: true,
      adPlatformConnections: -1,
      exportFormats: ["csv", "json", "pdf", "pptx"],
    },
    price: 199,
    annualPrice: 166,
    costPerUser: 20.00,
    grossMargin: 89.9,
    stripePriceId: "",
    stripeAnnualPriceId: "",
  },

  enterprise: {
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    tagline: "For enterprises needing custom scale and support",
    features: [
      "Everything in Business",
      "Unlimited everything (no caps)",
      "Unlimited team seats",
      "Custom AI model fine-tuning",
      "Dedicated infrastructure",
      "Custom SSO/SAML integration",
      "Advanced security & compliance",
      "Custom SLA (up to 99.99%)",
      "On-boarding & training sessions",
      "Quarterly business reviews",
      "Custom feature development",
      "Multi-brand management",
      "Data residency options",
    ],
    limits: {
      contentGenerations: -1,
      imageGenerations: -1,
      videoScripts: -1,
      products: -1,
      campaigns: -1,
      leads: -1,
      teamSeats: -1,
      additionalSeatPrice: 0,
      websiteAnalyses: -1,
      scheduledPosts: -1,
      abTests: -1,
      voiceMinutes: -1,
      storageGb: -1,
      apiAccess: true,
      whiteLabel: true,
      prioritySupport: true,
      customBranding: true,
      adPlatformConnections: -1,
      exportFormats: ["csv", "json", "pdf", "pptx", "custom"],
    },
    price: 499,
    annualPrice: 416,
    costPerUser: 50.00,
    grossMargin: 90.0,
    stripePriceId: "",
    stripeAnnualPriceId: "",
  },
};

export type PlanKey = keyof typeof PLANS;

// ─── Unit Economics Summary ─────────────────────────────────────────
// | Plan         | Price/mo | Cost/user | Margin | Break-even users |
// |--------------|----------|-----------|--------|------------------|
// | Free         | $0       | $0.50     | -100%  | N/A (funnel)     |
// | Starter      | $29      | $3.00     | 89.7%  | 1                |
// | Professional | $79      | $8.00     | 89.9%  | 1                |
// | Business     | $199     | $20.00    | 89.9%  | 1                |
// | Enterprise   | $499+    | $50.00    | 90.0%  | 1                |
//
// Additional revenue streams:
// - Extra team seats: $12-$15/seat/month (90%+ margin)
// - Overage charges: $0.10/content gen, $0.20/image over limit
// - Annual billing: 17% discount but 100% upfront cash
//
// Competitive positioning:
// We offer MORE than Jasper ($49-$69) + AdCreative ($25-$359) +
// Omneky ($99) + HubSpot CRM lite + SimilarWeb lite COMBINED
// at a lower total cost than buying each separately.

export function getPlanLimits(planKey: string): PlanLimits {
  return PLANS[planKey]?.limits || PLANS.free.limits;
}

export function canPerformAction(
  planKey: string,
  action: keyof PlanLimits,
  currentUsage: number
): { allowed: boolean; limit: number; remaining: number } {
  const limits = getPlanLimits(planKey);
  const limit = limits[action] as number;

  if (typeof limit !== "number") {
    return { allowed: Boolean(limit), limit: limit ? 1 : 0, remaining: limit ? 1 : 0 };
  }

  if (limit === -1) return { allowed: true, limit: -1, remaining: -1 };
  const remaining = Math.max(0, limit - currentUsage);
  return { allowed: remaining > 0, limit, remaining };
}
