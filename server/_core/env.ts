export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? process.env.MYSQL_URL ?? process.env.MYSQL_PUBLIC_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  forgeStorageUrl: process.env.BUILT_IN_FORGE_STORAGE_URL ?? "",
  forgeModel: process.env.BUILT_IN_FORGE_MODEL ?? "",
  /** Local uploads when not using Forge storage (Railway: set UPLOAD_DIR or use default ./uploads). */
  uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
  /** Public base URL for uploaded files (e.g. https://yourapp.railway.app). Railway often sets PUBLIC_URL. */
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? process.env.PUBLIC_URL ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePublishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "",
  trialDays: parseInt(process.env.TRIAL_DAYS ?? "7", 10) || 7,
  // Subscription price IDs (from Stripe Dashboard)
  stripePriceStarterMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "",
  stripePriceStarterAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL ?? "",
  stripePriceProMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
  stripePriceProAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "",
  stripePriceBizMonthly: process.env.STRIPE_PRICE_BIZ_MONTHLY ?? "",
  stripePriceBizAnnual: process.env.STRIPE_PRICE_BIZ_ANNUAL ?? "",
  stripePriceAgencyMonthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY ?? "",
  stripePriceAgencyAnnual: process.env.STRIPE_PRICE_AGENCY_ANNUAL ?? "",
  // Credit pack one-time price IDs
  stripePriceCredits50: process.env.STRIPE_PRICE_CREDITS_50 ?? "",
  stripePriceCredits150: process.env.STRIPE_PRICE_CREDITS_150 ?? "",
  stripePriceCredits400: process.env.STRIPE_PRICE_CREDITS_400 ?? "",
  stripePriceCredits1000: process.env.STRIPE_PRICE_CREDITS_1000 ?? "",
  stripePriceCredits5000: process.env.STRIPE_PRICE_CREDITS_5000 ?? "",
  // Video Generation APIs (user provides key later)
  runwayApiKey: process.env.RUNWAY_API_KEY ?? "",
  lumaApiKey: process.env.LUMA_API_KEY ?? "",
  klingApiKey: process.env.KLING_API_KEY ?? "",
  // Voiceover APIs
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  // Claude Haiku (Spec v4: strategy/analysis tasks)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  // Epom DSP (Spec v4: programmatic ad buying)
  epomApiKey: process.env.EPOM_API_KEY ?? "",
  epomBaseUrl: process.env.EPOM_BASE_URL ?? "https://api.epom.com/v1",
  epomAccountId: process.env.EPOM_ACCOUNT_ID ?? "",
  dspEnabled: process.env.DSP_ENABLED === "true",
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
  // Resend (email sequences)
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  // Sentry
  sentryDsn: process.env.SENTRY_DSN ?? "",
};
