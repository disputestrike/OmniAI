export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? process.env.MYSQL_URL ?? process.env.MYSQL_PUBLIC_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePublishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "",
  // Video Generation APIs (user provides key later)
  runwayApiKey: process.env.RUNWAY_API_KEY ?? "",
  lumaApiKey: process.env.LUMA_API_KEY ?? "",
  klingApiKey: process.env.KLING_API_KEY ?? "",
  // Voiceover APIs
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  // AI Avatar APIs
  heygenApiKey: process.env.HEYGEN_API_KEY ?? "",
  // Social Media OAuth
  metaAppId: process.env.META_APP_ID ?? "",
  metaAppSecret: process.env.META_APP_SECRET ?? "",
  twitterApiKey: process.env.TWITTER_API_KEY ?? "",
  twitterApiSecret: process.env.TWITTER_API_SECRET ?? "",
  linkedinClientId: process.env.LINKEDIN_CLIENT_ID ?? "",
  linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
  tiktokClientKey: process.env.TIKTOK_CLIENT_KEY ?? "",
  tiktokClientSecret: process.env.TIKTOK_CLIENT_SECRET ?? "",
  // E-commerce
  shopifyApiKey: process.env.SHOPIFY_API_KEY ?? "",
  shopifyApiSecret: process.env.SHOPIFY_API_SECRET ?? "",
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // Music Studio APIs
  sunoApiKey: process.env.SUNO_API_KEY ?? "",
  mubertApiKey: process.env.MUBERT_API_KEY ?? "",
  soundrawApiKey: process.env.SOUNDRAW_API_KEY ?? "",
};
