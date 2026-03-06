// Stripe product and pricing configuration
// These will be created in Stripe on first use if they don't exist

export const PLANS = {
  free: {
    name: "Free",
    description: "Get started with basic marketing tools",
    features: [
      "5 AI content generations/month",
      "2 campaigns",
      "1 product analysis",
      "Basic analytics",
      "Export to CSV",
    ],
    limits: {
      contentGenerations: 5,
      campaigns: 2,
      products: 1,
      creatives: 3,
      leads: 50,
    },
    price: 0,
  },
  pro: {
    name: "Pro",
    description: "Unlimited AI marketing power for growing businesses",
    features: [
      "Unlimited AI content generation",
      "Unlimited campaigns",
      "Unlimited product analysis",
      "AI Creative Engine (images)",
      "AI Video Ad Generator",
      "A/B Testing Suite",
      "Advanced analytics & AI insights",
      "Content remixing & repurposing",
      "Lead management (unlimited)",
      "Multi-platform scheduler",
      "Priority AI processing",
    ],
    limits: {
      contentGenerations: -1, // unlimited
      campaigns: -1,
      products: -1,
      creatives: -1,
      leads: -1,
    },
    price: 49,
    stripePriceId: "", // Will be set from env or created dynamically
  },
  enterprise: {
    name: "Enterprise",
    description: "Full marketing domination for teams and agencies",
    features: [
      "Everything in Pro",
      "Team collaboration (up to 25 members)",
      "White-label reports",
      "API access",
      "Custom AI training on your brand voice",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "Bulk operations",
      "Advanced security & compliance",
    ],
    limits: {
      contentGenerations: -1,
      campaigns: -1,
      products: -1,
      creatives: -1,
      leads: -1,
    },
    price: 199,
    stripePriceId: "",
  },
} as const;

export type PlanKey = keyof typeof PLANS;
