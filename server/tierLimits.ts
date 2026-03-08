/**
 * Phase 1 tier limits and credit costs. Used for enforcement and API.
 * Prices are read from env (GET /api/pricing or tRPC) — never hardcode in frontend.
 */

export type TierKey = "free" | "starter" | "professional" | "business" | "enterprise";

export const TIER_LIMITS: Record<
  TierKey,
  {
    aiGenerationsMonthly: number;
    aiImagesMonthly: number;
    videoScriptsMonthly: number;
    videoGenMinutes: number;
    products: number;
    campaigns: number;
    leads: number;
    scheduledPostsMonthly: number;
    abTests: number;
    websiteAnalyses: number;
    teamSeats: number;
    creditTopupsAllowed: boolean;
    creditTopupDiscountPercent: number;
  }
> = {
  free: {
    aiGenerationsMonthly: 5,
    aiImagesMonthly: 2,
    videoScriptsMonthly: 1,
    videoGenMinutes: 0,
    products: 1,
    campaigns: 2,
    leads: 25,
    scheduledPostsMonthly: 0,
    abTests: 0,
    websiteAnalyses: 0,
    teamSeats: 1,
    creditTopupsAllowed: false,
    creditTopupDiscountPercent: 0,
  },
  starter: {
    aiGenerationsMonthly: 50,
    aiImagesMonthly: 15,
    videoScriptsMonthly: 5,
    videoGenMinutes: 0,
    products: 5,
    campaigns: 10,
    leads: 500,
    scheduledPostsMonthly: 25,
    abTests: 3,
    websiteAnalyses: 3,
    teamSeats: 1,
    creditTopupsAllowed: true,
    creditTopupDiscountPercent: 0,
  },
  professional: {
    aiGenerationsMonthly: 200,
    aiImagesMonthly: 50,
    videoScriptsMonthly: 20,
    videoGenMinutes: 2,
    products: 25,
    campaigns: -1,
    leads: -1,
    scheduledPostsMonthly: -1,
    abTests: -1,
    websiteAnalyses: 10,
    teamSeats: 5,
    creditTopupsAllowed: true,
    creditTopupDiscountPercent: 0,
  },
  business: {
    aiGenerationsMonthly: 800,
    aiImagesMonthly: 200,
    videoScriptsMonthly: -1,
    videoGenMinutes: 8,
    products: -1,
    campaigns: -1,
    leads: -1,
    scheduledPostsMonthly: -1,
    abTests: -1,
    websiteAnalyses: -1,
    teamSeats: 15,
    creditTopupsAllowed: true,
    creditTopupDiscountPercent: 10,
  },
  enterprise: {
    aiGenerationsMonthly: 3000,
    aiImagesMonthly: 500,
    videoScriptsMonthly: -1,
    videoGenMinutes: 30,
    products: -1,
    campaigns: -1,
    leads: -1,
    scheduledPostsMonthly: -1,
    abTests: -1,
    websiteAnalyses: -1,
    teamSeats: -1,
    creditTopupsAllowed: true,
    creditTopupDiscountPercent: 15,
  },
};

/** -1 means unlimited in TIER_LIMITS */
export const UNLIMITED = -1;

/** Credit cost per action (for top-up drawdown) */
export const CREDIT_COST: Record<string, number> = {
  ai_generation: 1,
  ai_image: 3,
  ai_image_hd: 5,
  video_script: 2,
  video_generation_per_minute: 30,
  ai_avatar_video_per_minute: 20,
  voice_per_minute: 5,
  content_repurpose: 2,
  seo_audit: 10,
  competitor_analysis: 5,
  email_campaign: 3,
  meme_generation: 1,
  ai_music_30s: 8,
  bulk_import_per_item: 1,
};

/** Credit pack definitions (credits, base price cents). Discount applied by tier. */
export const CREDIT_PACKS = [
  { id: "50", credits: 50, priceCents: 900, name: "Micro Pack" },
  { id: "150", credits: 150, priceCents: 1900, name: "Starter Pack" },
  { id: "400", credits: 400, priceCents: 3900, name: "Power Pack" },
  { id: "1000", credits: 1000, priceCents: 7900, name: "Agency Pack" },
  { id: "5000", credits: 5000, priceCents: 29900, name: "Enterprise" },
] as const;
