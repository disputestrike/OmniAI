import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["free", "starter", "professional", "business", "enterprise"]).default("free").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Products ────────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  url: text("url"),
  imageUrls: json("imageUrls").$type<string[]>(),
  category: varchar("category", { length: 128 }),
  features: json("features").$type<string[]>(),
  benefits: json("benefits").$type<string[]>(),
  targetAudience: json("targetAudience").$type<string[]>(),
  positioning: text("positioning"),
  keywords: json("keywords").$type<string[]>(),
  tone: varchar("tone", { length: 64 }),
  analysisStatus: mysqlEnum("analysisStatus", ["pending", "analyzing", "completed", "failed"]).default("pending").notNull(),
  rawAnalysis: json("rawAnalysis"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Content ─────────────────────────────────────────────────────────
export const contents = mysqlTable("contents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId"),
  campaignId: int("campaignId"),
  type: mysqlEnum("type", ["ad_copy_short", "ad_copy_long", "blog_post", "seo_meta", "social_caption", "video_script", "email_copy", "pr_release", "podcast_script", "tv_script", "radio_script", "copywriting", "amazon_listing", "google_ads", "youtube_seo", "twitter_thread", "linkedin_article", "whatsapp_broadcast", "sms_copy", "story_content", "ugc_script", "landing_page"]).notNull(),
  platform: varchar("platform", { length: 64 }),
  title: varchar("title", { length: 255 }),
  body: text("body"),
  metadata: json("metadata"),
  status: mysqlEnum("status", ["draft", "approved", "published", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Content = typeof contents.$inferSelect;
export type InsertContent = typeof contents.$inferInsert;

// ─── Creatives (Images/Graphics) ─────────────────────────────────────
export const creatives = mysqlTable("creatives", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId"),
  campaignId: int("campaignId"),
  type: mysqlEnum("type", ["ad_image", "social_graphic", "thumbnail", "banner", "story"]).notNull(),
  prompt: text("prompt"),
  imageUrl: text("imageUrl"),
  platform: varchar("platform", { length: 64 }),
  dimensions: varchar("dimensions", { length: 32 }),
  status: mysqlEnum("status", ["generating", "completed", "failed", "approved"]).default("generating").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Creative = typeof creatives.$inferSelect;
export type InsertCreative = typeof creatives.$inferInsert;

// ─── Video Ads ───────────────────────────────────────────────────────
export const videoAds = mysqlTable("video_ads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId"),
  campaignId: int("campaignId"),
  platform: varchar("platform", { length: 64 }),
  script: text("script"),
  storyboard: json("storyboard").$type<{ scene: string; description: string; duration: string }[]>(),
  voiceoverText: text("voiceoverText"),
  avatarStyle: varchar("avatarStyle", { length: 64 }),
  duration: int("duration"),
  thumbnailUrl: text("thumbnailUrl"),
  status: mysqlEnum("status", ["draft", "generating", "completed", "failed"]).default("draft").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoAd = typeof videoAds.$inferSelect;
export type InsertVideoAd = typeof videoAds.$inferInsert;

// ─── Campaigns ───────────────────────────────────────────────────────
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  platforms: json("platforms").$type<string[]>(),
  objective: mysqlEnum("objective", ["awareness", "traffic", "engagement", "leads", "sales", "app_installs"]).default("awareness").notNull(),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed", "archived"]).default("draft").notNull(),
  budget: text("budget"),
  targetAudience: json("targetAudience"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ─── A/B Tests ───────────────────────────────────────────────────────
export const abTests = mysqlTable("ab_tests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId"),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["draft", "running", "completed", "cancelled"]).default("draft").notNull(),
  winnerVariantId: int("winnerVariantId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AbTest = typeof abTests.$inferSelect;
export type InsertAbTest = typeof abTests.$inferInsert;

// ─── A/B Test Variants ───────────────────────────────────────────────
export const abTestVariants = mysqlTable("ab_test_variants", {
  id: int("id").autoincrement().primaryKey(),
  testId: int("testId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  contentId: int("contentId"),
  creativeId: int("creativeId"),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  conversions: int("conversions").default(0),
  ctr: text("ctr"),
  conversionRate: text("conversionRate"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AbTestVariant = typeof abTestVariants.$inferSelect;
export type InsertAbTestVariant = typeof abTestVariants.$inferInsert;

// ─── Scheduled Posts ─────────────────────────────────────────────────
export const scheduledPosts = mysqlTable("scheduled_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId"),
  contentId: int("contentId"),
  creativeId: int("creativeId"),
  platform: varchar("platform", { length: 64 }).notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  publishedAt: timestamp("publishedAt"),
  status: mysqlEnum("status", ["scheduled", "publishing", "published", "failed", "cancelled"]).default("scheduled").notNull(),
  postUrl: text("postUrl"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertScheduledPost = typeof scheduledPosts.$inferInsert;

// ─── Leads ───────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId"),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  company: varchar("company", { length: 255 }),
  source: varchar("source", { length: 128 }),
  platform: varchar("platform", { length: 64 }),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "lost"]).default("new").notNull(),
  score: int("score").default(0),
  notes: text("notes"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Analytics Events ────────────────────────────────────────────────
export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId"),
  platform: varchar("platform", { length: 64 }),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  conversions: int("conversions").default(0),
  spend: text("spend"),
  revenue: text("revenue"),
  metadata: json("metadata"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

// ─── Subscriptions ──────────────────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }).notNull(),
  stripePriceId: varchar("stripePriceId", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["active", "past_due", "canceled", "incomplete", "trialing"]).default("active").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── CRM Deals (Pipeline Automation) ────────────────────────────────
export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId"),
  campaignId: int("campaignId"),
  title: varchar("title", { length: 255 }).notNull(),
  value: text("value"),
  currency: varchar("currency", { length: 8 }).default("USD"),
  stage: mysqlEnum("stage", ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"]).default("prospecting").notNull(),
  probability: int("probability").default(0),
  expectedCloseDate: timestamp("expectedCloseDate"),
  actualCloseDate: timestamp("actualCloseDate"),
  notes: text("notes"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

// ─── CRM Activities (Deal/Lead Activity Log) ────────────────────────
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dealId: int("dealId"),
  leadId: int("leadId"),
  type: mysqlEnum("type", ["call", "email", "meeting", "note", "task", "follow_up"]).default("note").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

// ─── Ad Platform Connections ─────────────────────────────────────────
export const adPlatformConnections = mysqlTable("ad_platform_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: varchar("platform", { length: 64 }).notNull(),
  accountId: varchar("accountId", { length: 255 }),
  accountName: varchar("accountName", { length: 255 }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  status: mysqlEnum("status", ["connected", "expired", "disconnected", "error"]).default("connected").notNull(),
  scopes: json("scopes").$type<string[]>(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdPlatformConnection = typeof adPlatformConnections.$inferSelect;
export type InsertAdPlatformConnection = typeof adPlatformConnections.$inferInsert;

// ─── Ad Platform Campaigns (Synced from platforms) ──────────────────
export const adPlatformCampaigns = mysqlTable("ad_platform_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  connectionId: int("connectionId").notNull(),
  campaignId: int("campaignId"),
  externalCampaignId: varchar("externalCampaignId", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }),
  status: varchar("status", { length: 64 }),
  budget: text("budget"),
  spend: text("spend"),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  conversions: int("conversions").default(0),
  lastSyncedAt: timestamp("lastSyncedAt"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdPlatformCampaign = typeof adPlatformCampaigns.$inferSelect;
export type InsertAdPlatformCampaign = typeof adPlatformCampaigns.$inferInsert;

// ─── Team Members ────────────────────────────────────────────────────
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  role: mysqlEnum("role", ["owner", "admin", "editor", "viewer"]).default("viewer").notNull(),
  inviteStatus: mysqlEnum("inviteStatus", ["pending", "accepted", "declined"]).default("pending").notNull(),
  inviteToken: varchar("inviteToken", { length: 128 }),
  permissions: json("permissions").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ─── Approval Workflows ─────────────────────────────────────────────
export const approvalWorkflows = mysqlTable("approval_workflows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contentId: int("contentId"),
  creativeId: int("creativeId"),
  campaignId: int("campaignId"),
  type: mysqlEnum("type", ["content", "creative", "campaign", "ad_launch"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "revision_requested"]).default("pending").notNull(),
  requestedById: int("requestedById").notNull(),
  reviewerId: int("reviewerId"),
  reviewerComment: text("reviewerComment"),
  reviewedAt: timestamp("reviewedAt"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;
export type InsertApprovalWorkflow = typeof approvalWorkflows.$inferInsert;

// ─── Predictive Scores ──────────────────────────────────────────────
export const predictiveScores = mysqlTable("predictive_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  entityType: mysqlEnum("entityType", ["campaign", "content", "creative", "ad"]).notNull(),
  entityId: int("entityId").notNull(),
  predictedCtr: text("predictedCtr"),
  predictedConversionRate: text("predictedConversionRate"),
  predictedRoas: text("predictedRoas"),
  engagementScore: int("engagementScore"),
  viralityScore: int("viralityScore"),
  qualityScore: int("qualityScore"),
  recommendations: json("recommendations").$type<string[]>(),
  confidence: text("confidence"),
  metadata: json("metadata"),
  scoredAt: timestamp("scoredAt").defaultNow().notNull(),
});

export type PredictiveScore = typeof predictiveScores.$inferSelect;
export type InsertPredictiveScore = typeof predictiveScores.$inferInsert;

// ─── SEO Audits ─────────────────────────────────────────────────────
export const seoAudits = mysqlTable("seo_audits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  url: text("url").notNull(),
  overallScore: int("overallScore"),
  technicalScore: int("technicalScore"),
  contentScore: int("contentScore"),
  authorityScore: int("authorityScore"),
  keywords: json("keywords").$type<{ keyword: string; volume: string; difficulty: string; position: string }[]>(),
  issues: json("issues").$type<{ severity: string; description: string; fix: string }[]>(),
  backlinks: json("backlinks").$type<{ domain: string; authority: number; type: string }[]>(),
  competitors: json("competitors").$type<{ domain: string; overlap: number; ranking: string }[]>(),
  recommendations: json("recommendations").$type<string[]>(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SeoAudit = typeof seoAudits.$inferSelect;
export type InsertSeoAudit = typeof seoAudits.$inferInsert;


// ─── Brand Voices ──────────────────────────────────────────────────
export const brandVoices = mysqlTable("brand_voices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  documentUrls: json("documentUrls").$type<string[]>(),
  voiceProfile: json("voiceProfile").$type<{ tone: string; style: string; vocabulary: string[]; avoidWords: string[]; samplePhrases: string[]; personality: string; formality: string }>(),
  isDefault: boolean("isDefault").default(false),
  status: mysqlEnum("status", ["processing", "ready", "failed"]).default("processing").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BrandVoice = typeof brandVoices.$inferSelect;
export type InsertBrandVoice = typeof brandVoices.$inferInsert;

// ─── Email Campaigns ───────────────────────────────────────────────
export const emailCampaigns = mysqlTable("email_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId"),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlBody: text("htmlBody"),
  textBody: text("textBody"),
  fromName: varchar("fromName", { length: 128 }),
  replyTo: varchar("replyTo", { length: 320 }),
  recipientListId: int("recipientListId"),
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "failed"]).default("draft").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  totalRecipients: int("totalRecipients").default(0),
  delivered: int("delivered").default(0),
  opened: int("opened").default(0),
  clicked: int("clicked").default(0),
  bounced: int("bounced").default(0),
  unsubscribed: int("unsubscribed").default(0),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

// ─── Email Lists ───────────────────────────────────────────────────
export const emailLists = mysqlTable("email_lists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  contactCount: int("contactCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailList = typeof emailLists.$inferSelect;
export type InsertEmailList = typeof emailLists.$inferInsert;

// ─── Email Contacts ────────────────────────────────────────────────
export const emailContacts = mysqlTable("email_contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  listId: int("listId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  tags: json("tags").$type<string[]>(),
  unsubscribed: boolean("unsubscribed").default(false),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailContact = typeof emailContacts.$inferSelect;
export type InsertEmailContact = typeof emailContacts.$inferInsert;

// ─── Landing Pages ─────────────────────────────────────────────────
export const landingPages = mysqlTable("landing_pages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId"),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  templateId: varchar("templateId", { length: 64 }),
  components: json("components").$type<{ type: string; props: Record<string, unknown>; order: number }[]>(),
  customCss: text("customCss"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  publishedUrl: text("publishedUrl"),
  visits: int("visits").default(0),
  conversions: int("conversions").default(0),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LandingPage = typeof landingPages.$inferSelect;
export type InsertLandingPage = typeof landingPages.$inferInsert;

// ─── Form Submissions ──────────────────────────────────────────────
export const formSubmissions = mysqlTable("form_submissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  landingPageId: int("landingPageId").notNull(),
  data: json("data").$type<Record<string, string>>(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = typeof formSubmissions.$inferInsert;

// ─── Automation Workflows ──────────────────────────────────────────
export const automationWorkflows = mysqlTable("automation_workflows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  triggerType: mysqlEnum("triggerType", ["form_submission", "lead_status_change", "campaign_event", "schedule", "manual"]).notNull(),
  triggerConfig: json("triggerConfig").$type<Record<string, unknown>>(),
  actions: json("actions").$type<{ type: string; config: Record<string, unknown>; order: number }[]>(),
  isActive: boolean("isActive").default(false),
  lastRunAt: timestamp("lastRunAt"),
  runCount: int("runCount").default(0),
  status: mysqlEnum("status", ["draft", "active", "paused", "error"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomationWorkflow = typeof automationWorkflows.$inferSelect;
export type InsertAutomationWorkflow = typeof automationWorkflows.$inferInsert;

// ─── Social Publishing Queue ───────────────────────────────────────
export const socialPublishQueue = mysqlTable("social_publish_queue", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scheduledPostId: int("scheduledPostId"),
  contentId: int("contentId"),
  platform: varchar("platform", { length: 64 }).notNull(),
  connectionId: int("connectionId"),
  postContent: text("postContent"),
  mediaUrls: json("mediaUrls").$type<string[]>(),
  status: mysqlEnum("status", ["queued", "publishing", "published", "failed", "cancelled"]).default("queued").notNull(),
  publishedAt: timestamp("publishedAt"),
  externalPostId: varchar("externalPostId", { length: 255 }),
  externalPostUrl: text("externalPostUrl"),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0),
  scheduledFor: timestamp("scheduledFor"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialPublishQueue = typeof socialPublishQueue.$inferSelect;
export type InsertSocialPublishQueue = typeof socialPublishQueue.$inferInsert;

// ─── Video Renders ─────────────────────────────────────────────────
export const videoRenders = mysqlTable("video_renders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  videoAdId: int("videoAdId"),
  platform: varchar("platform", { length: 64 }),
  status: mysqlEnum("status", ["queued", "rendering", "completed", "failed"]).default("queued").notNull(),
  videoUrl: text("videoUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  duration: int("duration"),
  resolution: varchar("resolution", { length: 32 }),
  format: varchar("format", { length: 16 }).default("mp4"),
  frames: json("frames").$type<{ imageUrl: string; duration: number; text?: string }[]>(),
  audioUrl: text("audioUrl"),
  errorMessage: text("errorMessage"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoRender = typeof videoRenders.$inferSelect;
export type InsertVideoRender = typeof videoRenders.$inferInsert;

// ─── Webhook Endpoints (Zapier/Make) ───────────────────────────────
export const webhookEndpoints = mysqlTable("webhook_endpoints", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  events: json("events").$type<string[]>(),
  secret: varchar("secret", { length: 128 }),
  isActive: boolean("isActive").default(true),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  failureCount: int("failureCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type InsertWebhookEndpoint = typeof webhookEndpoints.$inferInsert;
