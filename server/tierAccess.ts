/**
 * Tier gating: feature-to-minimum-tier map and checkTierAccess.
 * Used before DSP and other gated features. Free tier cannot access programmatic_ads.
 */
import type { TierKey } from "./tierLimits";

export type FeatureKey =
  | "programmatic_ads"
  | "ai_content_generation"
  | "ai_image_generation"
  | "video_generation"
  | "avatar_videos"
  | "voice_input"
  | "music_studio"
  | "white_label"
  | "api_access"
  | "webhooks"
  | "scheduler"
  | "competitor_intelligence"
  | "crm_deals"
  | "ad_platforms"
  | "seo_audits"
  | "client_portal"
  | "custom_sso"
  | "multi_brand";

/** Minimum tier required for each feature. free = all logged-in; starter+ = that tier or higher. */
// TEMP: all features unlocked for free tier for testing — restore original values from memory before launch
export const TIER_FEATURES: Record<FeatureKey, TierKey> = {
  programmatic_ads: "free",
  ai_content_generation: "free",
  ai_image_generation: "free",
  video_generation: "free",
  avatar_videos: "free",
  voice_input: "free",
  music_studio: "free",
  white_label: "free",
  api_access: "free",
  webhooks: "free",
  scheduler: "free",
  competitor_intelligence: "free",
  crm_deals: "free",
  ad_platforms: "free",
  seo_audits: "free",
  client_portal: "free",
  custom_sso: "free",
  multi_brand: "free",
};

const TIER_ORDER: TierKey[] = ["free", "starter", "professional", "business", "enterprise"];

function tierRank(t: TierKey): number {
  const i = TIER_ORDER.indexOf(t);
  return i >= 0 ? i : -1;
}

export type TierAccessResult =
  | { allowed: true }
  | { allowed: false; reason: "feature_not_on_plan"; upgrade_to: TierKey; feature: FeatureKey };

/**
 * Check if the user's tier allows access to the given feature.
 * Pass the user's subscription plan (e.g. from ctx.user.subscriptionPlan).
 */
export function checkTierAccess(userTier: string | null | undefined, feature: FeatureKey): TierAccessResult {
  const tier = (userTier || "free") as TierKey;
  const minTier = TIER_FEATURES[feature];
  if (!minTier) return { allowed: true };
  if (tierRank(tier) >= tierRank(minTier)) return { allowed: true };
  return {
    allowed: false,
    reason: "feature_not_on_plan",
    upgrade_to: minTier,
    feature,
  };
}

/** Get tier access for multiple features (e.g. for nav). */
export function getFeatureAccess(userTier: string | null | undefined): Record<FeatureKey, boolean> {
  const result: Record<string, boolean> = {};
  for (const f of Object.keys(TIER_FEATURES) as FeatureKey[]) {
    result[f] = checkTierAccess(userTier, f).allowed;
  }
  return result as Record<FeatureKey, boolean>;
}
