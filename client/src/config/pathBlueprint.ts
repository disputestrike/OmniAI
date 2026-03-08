/**
 * Path blueprint: defines the natural progression through the product so the app
 * can suggest "what to do next" and feel like one integrated system (e.g. make
 * someone go viral: 1 → 2 → 3 → 4 → 5). Users can still do one thing at a time;
 * the path is there to make the full flow obvious and easy.
 */

export type DashboardStats = {
  products?: number;
  campaigns?: number;
  contents?: number;
  leads?: number;
  creatives?: number;
  videoAds?: number;
  analytics?: { totalImpressions?: number; totalClicks?: number; totalConversions?: number; totalRevenue?: number | string; totalSpend?: string } | null;
};

/** Pipeline IDs for the three main goals (used for progress). */
export type GoalPipelineId = "product" | "person" | "concept";

/** Step definition for a goal pipeline (path + label for progress and "next step"). */
export interface PipelineStepDef {
  label: string;
  path: string;
}

/**
 * Steps per goal pipeline, in order. Used to compute "step X of 6" and "Continue from step X".
 * Index 0..3 are tied to stats (products, contents, creatives|videoAds, campaigns); 4–5 are follow-ups.
 */
export const GOAL_PIPELINE_STEPS: Record<GoalPipelineId, PipelineStepDef[]> = {
  product: [
    { label: "Add Your Product", path: "/products" },
    { label: "Generate All Content", path: "/content" },
    { label: "Create Visuals & Video", path: "/creatives" },
    { label: "Launch Campaigns", path: "/campaigns" },
    { label: "A/B Test & Optimize", path: "/ab-testing" },
    { label: "Capture & Convert Leads", path: "/leads" },
  ],
  person: [
    { label: "Build the Brand Profile", path: "/products" },
    { label: "Create Viral Content", path: "/content" },
    { label: "Design Visual Identity", path: "/creatives" },
    { label: "Launch Multi-Platform Push", path: "/campaigns" },
    { label: "Schedule & Auto-Post", path: "/scheduler" },
    { label: "Track & Amplify", path: "/analytics" },
  ],
  concept: [
    { label: "Define the Concept", path: "/products" },
    { label: "Create Persuasion Content", path: "/content" },
    { label: "Build Visual Campaign", path: "/creatives" },
    { label: "Multi-Channel Saturation", path: "/campaigns" },
    { label: "Micro-Target Segments", path: "/ai-agents" },
    { label: "Measure Consciousness", path: "/analytics" },
  ],
};

export interface PathProgress {
  completedCount: number;
  totalSteps: number;
  nextStepIndex: number;
  nextStepLabel: string;
  nextStepPath: string;
}

/**
 * Returns progress along a goal pipeline so the UI can show "Step X of 6" and
 * "Continue" (go to next step). Step 0–3 are inferred from stats; 4–5 are shown as next when 0–3 are done.
 */
export function getPathProgress(stats: DashboardStats | null | undefined, pipelineId: GoalPipelineId): PathProgress | null {
  const steps = GOAL_PIPELINE_STEPS[pipelineId];
  if (!steps?.length) return null;
  const totalSteps = steps.length;
  const products = (stats?.products ?? 0) > 0;
  const contents = (stats?.contents ?? 0) > 0;
  const creativesOrVideo = ((stats?.creatives ?? 0) + (stats?.videoAds ?? 0)) > 0;
  const campaigns = (stats?.campaigns ?? 0) > 0;
  const completedCount = [products, contents, creativesOrVideo, campaigns].filter(Boolean).length;
  const nextStepIndex = Math.min(completedCount, totalSteps - 1);
  const next = steps[nextStepIndex];
  return {
    completedCount,
    totalSteps,
    nextStepIndex,
    nextStepLabel: next?.label ?? steps[0].label,
    nextStepPath: next?.path ?? steps[0].path,
  };
}

export interface NextStepOption {
  label: string;
  path: string;
  description?: string;
}

/** Next steps to show on each key page (in order of the natural path). */
export const NEXT_STEPS_BY_PAGE: Record<string, NextStepOption[]> = {
  "/products": [
    { label: "Generate content from this product", path: "/content", description: "22 content types: ads, blogs, social, video scripts" },
    { label: "Create a video ad", path: "/video-ads", description: "Scripts + storyboards for TikTok, Reels, Shorts" },
    { label: "Create visuals & thumbnails", path: "/creatives", description: "AI ad images, banners, social graphics" },
    { label: "Launch a campaign", path: "/campaigns", description: "Multi-platform campaigns across 21+ channels" },
  ],
  "/content": [
    { label: "Create visuals & thumbnails", path: "/creatives", description: "Turn copy into ad images and graphics" },
    { label: "Create a video ad", path: "/video-ads", description: "Scripts + storyboards for short-form video" },
    { label: "Launch a campaign", path: "/campaigns", description: "Deploy across social, search, email" },
  ],
  "/content-repurposer": [
    { label: "Create a video ad", path: "/video-ads", description: "Turn repurposed content into ad scripts" },
    { label: "Launch a campaign", path: "/campaigns", description: "Use content in multi-platform campaigns" },
  ],
  "/creatives": [
    { label: "Create a video ad", path: "/video-ads", description: "Pair visuals with video scripts and storyboards" },
    { label: "Launch a campaign", path: "/campaigns", description: "Use creatives in campaigns" },
  ],
  "/video-ads": [
    { label: "Launch a campaign", path: "/campaigns", description: "Add video ads to multi-platform campaigns" },
    { label: "Schedule & publish", path: "/scheduler", description: "Post at optimal times across platforms" },
  ],
  "/campaigns": [
    { label: "Schedule & publish", path: "/scheduler", description: "Auto-post at optimal times" },
    { label: "View analytics", path: "/analytics", description: "Track performance and AI insights" },
    { label: "Capture leads", path: "/leads", description: "Collect and nurture leads from campaigns" },
  ],
  "/scheduler": [
    { label: "View analytics", path: "/analytics", description: "Monitor performance and engagement" },
  ],
  "/leads": [
    { label: "View analytics", path: "/analytics", description: "See conversion and funnel metrics" },
  ],
};

/**
 * Returns the single best "suggested next step" for the dashboard based on
 * what the user has already done. Follows the natural path: product → content →
 * creatives/video → campaign → schedule/analytics.
 */
export function getSuggestedNextStep(stats: DashboardStats | null | undefined): NextStepOption | null {
  if (!stats) return null;
  const products = stats.products ?? 0;
  const contents = stats.contents ?? 0;
  const creatives = stats.creatives ?? 0;
  const videoAds = stats.videoAds ?? 0;
  const campaigns = stats.campaigns ?? 0;

  if (products === 0) {
    return { label: "Add your first product", path: "/products", description: "Upload product info — AI will analyze and power all content and campaigns." };
  }
  if (contents === 0) {
    return { label: "Generate content from your product", path: "/content", description: "22 content types: ads, blogs, social, video scripts, and more." };
  }
  if (videoAds === 0) {
    return { label: "Create a video ad", path: "/video-ads", description: "Scripts and storyboards for TikTok, Reels, Shorts, and more." };
  }
  if (creatives === 0) {
    return { label: "Create visuals & thumbnails", path: "/creatives", description: "AI-generated ad images, banners, and social graphics." };
  }
  if (campaigns === 0) {
    return { label: "Launch a campaign", path: "/campaigns", description: "Deploy across 21+ platforms: social, search, email, and more." };
  }
  return { label: "Track performance & optimize", path: "/analytics", description: "View cross-platform performance and AI recommendations." };
}
