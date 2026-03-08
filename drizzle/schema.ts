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
  assignedToUserId: int("assignedToUserId"),
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

// ─── Personal Video Studio ────────────────────────────────────────
export const personalVideos = mysqlTable("personal_videos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  script: text("script"),
  videoUrl: text("videoUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  duration: int("duration"), // seconds
  aspectRatio: varchar("aspectRatio", { length: 20 }).default("16:9"),
  platform: varchar("platform", { length: 50 }),
  shareToken: varchar("shareToken", { length: 64 }),
  shareUrl: text("shareUrl"),
  embedCode: text("embedCode"),
  status: mysqlEnum("personalVideoStatus", ["draft", "recording", "processing", "ready", "shared"]).default("draft"),
  viewCount: int("viewCount").default(0),
  aiSuggestions: json("aiSuggestions").$type<{ hooks?: string[]; pacing?: string; cta?: string; improvements?: string[] }>(),
  metadata: json("personalVideoMetadata").$type<{ width?: number; height?: number; fps?: number; format?: string }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PersonalVideo = typeof personalVideos.$inferSelect;
export type InsertPersonalVideo = typeof personalVideos.$inferInsert;

// ─── Competitor Profiles (Tracked Over Time) ──────────────────────
export const competitorProfiles = mysqlTable("competitor_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }).notNull(),
  logoUrl: text("logoUrl"),
  industry: varchar("industry", { length: 100 }),
  description: text("description"),
  socialLinks: json("socialLinks").$type<{ facebook?: string; twitter?: string; linkedin?: string; instagram?: string; tiktok?: string; youtube?: string }>(),
  metrics: json("competitorMetrics").$type<{
    estimatedTraffic?: number; domainAuthority?: number; socialFollowers?: number;
    adCount?: number; contentFrequency?: string; engagementRate?: number;
  }>(),
  threatLevel: mysqlEnum("threatLevel", ["low", "medium", "high", "critical"]).default("medium"),
  lastAnalyzedAt: timestamp("lastAnalyzedAt"),
  isMonitored: boolean("isMonitored").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompetitorProfile = typeof competitorProfiles.$inferSelect;
export type InsertCompetitorProfile = typeof competitorProfiles.$inferInsert;

// ─── Competitor Snapshots (Point-in-Time Analysis) ────────────────
export const competitorSnapshots = mysqlTable("competitor_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  competitorId: int("competitorId").notNull(),
  userId: int("userId").notNull(),
  snapshotType: mysqlEnum("snapshotType", ["full_analysis", "ad_scan", "seo_check", "social_check", "content_check"]).default("full_analysis"),
  data: json("snapshotData").$type<{
    strategies?: { category: string; name: string; description: string }[];
    ads?: { platform: string; type: string; headline: string; description: string; imageUrl?: string }[];
    seoKeywords?: { keyword: string; position?: number; volume?: number }[];
    socialMetrics?: { platform: string; followers: number; engagement: number; postsPerWeek: number }[];
    contentAnalysis?: { type: string; frequency: string; topPerforming: string[] }[];
    swot?: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
    analysis?: string;
    recommendations?: string[];
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompetitorSnapshot = typeof competitorSnapshots.$inferSelect;
export type InsertCompetitorSnapshot = typeof competitorSnapshots.$inferInsert;

// ─── Competitor Alerts ────────────────────────────────────────────
export const competitorAlerts = mysqlTable("competitor_alerts", {
  id: int("id").autoincrement().primaryKey(),
  competitorId: int("competitorId").notNull(),
  userId: int("userId").notNull(),
  alertType: mysqlEnum("alertType", ["new_ad", "seo_change", "social_spike", "content_change", "traffic_change", "new_campaign"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  severity: mysqlEnum("alertSeverity", ["info", "warning", "critical"]).default("info"),
  isRead: boolean("isRead").default(false),
  data: json("alertData").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompetitorAlert = typeof competitorAlerts.$inferSelect;
export type InsertCompetitorAlert = typeof competitorAlerts.$inferInsert;

// ─── Customer Profiles (360-Degree View) ──────────────────────────
export const customerProfiles = mysqlTable("customer_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // owner
  leadId: int("leadId"), // link to existing lead
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  jobTitle: varchar("jobTitle", { length: 255 }),
  avatarUrl: text("avatarUrl"),
  demographics: json("demographics").$type<{
    age?: number; gender?: string; location?: string; income?: string; education?: string;
  }>(),
  psychographics: json("psychographics").$type<{
    interests?: string[]; values?: string[]; personality?: string; lifestyle?: string;
    painPoints?: string[]; goals?: string[];
  }>(),
  behaviorData: json("behaviorData").$type<{
    preferredChannels?: string[]; bestContactTime?: string; contentPreferences?: string[];
    purchaseHistory?: { date: string; amount: number; product: string }[];
    engagementHistory?: { date: string; type: string; channel: string; details: string }[];
  }>(),
  segment: varchar("segment", { length: 100 }),
  engagementScore: int("engagementScore").default(0),
  sentimentScore: int("sentimentScore").default(50), // 0-100
  lifetimeValue: int("lifetimeValue").default(0), // cents
  clvPrediction: int("clvPrediction").default(0), // predicted CLV in cents
  temperature: mysqlEnum("temperature", ["hot", "warm", "cold", "dormant"]).default("warm"),
  lastContactAt: timestamp("lastContactAt"),
  nextBestAction: text("nextBestAction"),
  tags: json("customerTags").$type<string[]>(),
  notes: text("customerNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = typeof customerProfiles.$inferInsert;

// ─── Customer Interactions (Touchpoint Tracking) ──────────────────
export const customerInteractions = mysqlTable("customer_interactions", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("interactionType", [
    "email_sent", "email_opened", "email_clicked",
    "call_made", "call_received", "meeting",
    "social_interaction", "ad_click", "website_visit",
    "purchase", "support_ticket", "feedback",
    "content_viewed", "form_submitted", "chat_message"
  ]).notNull(),
  channel: varchar("channel", { length: 50 }),
  subject: varchar("subject", { length: 255 }),
  details: text("interactionDetails"),
  sentiment: mysqlEnum("interactionSentiment", ["positive", "neutral", "negative"]),
  campaignId: int("campaignId"),
  contentId: int("contentId"),
  metadata: json("interactionMeta").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerInteraction = typeof customerInteractions.$inferSelect;
export type InsertCustomerInteraction = typeof customerInteractions.$inferInsert;

// ─── Customer Segments ────────────────────────────────────────────
export const customerSegments = mysqlTable("customer_segments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("segmentDescription"),
  type: mysqlEnum("segmentType", ["rfm", "behavioral", "demographic", "psychographic", "custom"]).default("custom"),
  criteria: json("segmentCriteria").$type<{
    rules: { field: string; operator: string; value: any }[];
    logic: "and" | "or";
  }>(),
  customerCount: int("customerCount").default(0),
  color: varchar("color", { length: 20 }).default("#6366f1"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerSegment = typeof customerSegments.$inferSelect;
export type InsertCustomerSegment = typeof customerSegments.$inferInsert;

// ─── Brand Kits ─────────────────────────────────────────────────────
export const brandKits = mysqlTable("brand_kits", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 32 }),
  secondaryColor: varchar("secondaryColor", { length: 32 }),
  accentColor: varchar("accentColor", { length: 32 }),
  fontHeading: varchar("fontHeading", { length: 128 }),
  fontBody: varchar("fontBody", { length: 128 }),
  toneOfVoice: varchar("toneOfVoice", { length: 64 }),
  toneDescription: text("toneDescription"),
  brandPersonality: json("brandPersonality").$type<string[]>(),
  tagline: varchar("tagline", { length: 255 }),
  missionStatement: text("missionStatement"),
  targetAudience: text("targetAudience"),
  doList: json("doList").$type<string[]>(),
  dontList: json("dontList").$type<string[]>(),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BrandKit = typeof brandKits.$inferSelect;
export type InsertBrandKit = typeof brandKits.$inferInsert;

// ─── Ad Performance Reports ────────────────────────────────────────
export const adPerformanceReports = mysqlTable("ad_performance_reports", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  connectionId: int("connectionId").notNull(),
  platform: varchar("platform", { length: 64 }).notNull(),
  reportType: mysqlEnum("reportType", ["campaign", "adset", "ad", "account"]).default("campaign"),
  dateRange: varchar("dateRange", { length: 64 }),
  rawData: json("rawData"),
  aiAnalysis: text("aiAnalysis"),
  topPerformers: json("topPerformers"),
  winningPatterns: json("winningPatterns"),
  recommendations: json("recommendations"),
  status: mysqlEnum("adReportStatus", ["pending", "analyzing", "complete", "error"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AdPerformanceReport = typeof adPerformanceReports.$inferSelect;
export type InsertAdPerformanceReport = typeof adPerformanceReports.$inferInsert;

// ─── Publisher Queue ───────────────────────────────────────────────
export const publisherQueue = mysqlTable("publisher_queue", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  connectionId: int("connectionId").notNull(),
  platform: varchar("platform", { length: 64 }).notNull(),
  adName: varchar("adName", { length: 255 }).notNull(),
  adType: mysqlEnum("adType", ["image", "video", "carousel", "text"]).default("image"),
  headline: text("headline"),
  body: text("body"),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  destinationUrl: text("destinationUrl"),
  callToAction: varchar("callToAction", { length: 64 }),
  budget: text("budget"),
  budgetType: mysqlEnum("budgetType", ["daily", "lifetime"]).default("daily"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  targetAudience: json("targetAudience"),
  status: mysqlEnum("publishStatus", ["draft", "queued", "publishing", "live", "paused", "completed", "failed"]).default("draft"),
  externalAdId: varchar("externalAdId", { length: 255 }),
  errorMessage: text("errorMessage"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PublisherQueueItem = typeof publisherQueue.$inferSelect;
export type InsertPublisherQueueItem = typeof publisherQueue.$inferInsert;

// ─── Performance Alerts ───────────────────────────────────────────
export const performanceAlerts = mysqlTable("performance_alerts", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  connectionId: int("connectionId").notNull(),
  externalCampaignId: varchar("externalCampaignId", { length: 255 }),
  campaignName: varchar("campaignName", { length: 255 }),
  platform: varchar("platform", { length: 64 }).notNull(),
  alertType: mysqlEnum("alertType", ["underperforming", "budget_depleted", "high_cpa", "low_ctr", "opportunity"]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("warning"),
  metric: varchar("metric", { length: 64 }),
  currentValue: text("currentValue"),
  benchmarkValue: text("benchmarkValue"),
  aiSuggestion: text("aiSuggestion"),
  isRead: boolean("isRead").default(false),
  isDismissed: boolean("isDismissed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PerformanceAlert = typeof performanceAlerts.$inferSelect;
export type InsertPerformanceAlert = typeof performanceAlerts.$inferInsert;

// ─── Creator Profiles ──────────────────────────────────────────────
export const creatorProfiles = mysqlTable("creator_profiles", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 128 }),
  bio: text("bio"),
  tagline: varchar("tagline", { length: 255 }),
  avatarUrl: text("avatarUrl"),
  coverImageUrl: text("coverImageUrl"),
  website: text("website"),
  instagram: varchar("instagram", { length: 128 }),
  twitter: varchar("twitter", { length: 128 }),
  linkedin: varchar("linkedin", { length: 128 }),
  tiktok: varchar("tiktok", { length: 128 }),
  specialties: json("specialties"),
  isPublic: boolean("isPublic").default(false),
  profileSlug: varchar("profileSlug", { length: 128 }).unique(),
  totalCreations: int("totalCreations").default(0),
  totalViews: int("totalViews").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type InsertCreatorProfile = typeof creatorProfiles.$inferInsert;

// ─── Portfolio Items ───────────────────────────────────────────────
export const portfolioItems = mysqlTable("portfolio_items", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  contentType: mysqlEnum("contentType", ["image", "video", "copy", "email", "social", "ad", "other"]).default("other"),
  thumbnailUrl: text("thumbnailUrl"),
  contentUrl: text("contentUrl"),
  contentText: text("contentText"),
  platform: varchar("platform", { length: 64 }),
  tags: json("tags"),
  isPublic: boolean("isPublic").default(true),
  isFeatured: boolean("isFeatured").default(false),
  views: int("views").default(0),
  likes: int("likes").default(0),
  sourceType: varchar("sourceType", { length: 64 }),
  sourceId: int("sourceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = typeof portfolioItems.$inferInsert;

// ─── Projects (workspace folders) ─────────────────────────────────────
export const projects2 = mysqlTable("projects2", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("projectStatus", ["active", "paused", "completed", "archived"]).default("active"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Chat conversations ─────────────────────────────────────────────
export const chatConversations = mysqlTable("chat_conversations", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  title: varchar("title", { length: 255 }),
  messages: json("messages"),
  agentMode: varchar("agentMode", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Content templates ──────────────────────────────────────────────
export const contentTemplates = mysqlTable("content_templates", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  contentType: varchar("contentType", { length: 100 }),
  platform: varchar("platform", { length: 100 }),
  body: text("body"),
  variables: json("variables"),
  metadata: json("metadata"),
  usageCount: int("usageCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Performance metrics ────────────────────────────────────────────
export const performanceMetrics = mysqlTable("performance_metrics", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  contentId: int("contentId"),
  platform: varchar("platform", { length: 100 }),
  postUrl: text("postUrl"),
  likes: int("likes").default(0),
  shares: int("shares").default(0),
  comments: int("comments").default(0),
  reach: int("reach").default(0),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  engagementRate: text("engagementRate"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Content Repurposing Engine (video/audio → all formats) ─────────────
export const repurposingProjects = mysqlTable("repurposing_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["video_url", "video_upload", "audio_upload", "transcript_paste"]).notNull(),
  sourceUrl: text("sourceUrl"),
  sourceTranscript: text("sourceTranscript"),
  status: mysqlEnum("status", ["pending", "transcribing", "generating", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  brandVoiceId: int("brandVoiceId"),
  metadata: json("metadata").$type<{ duration?: number; platform?: string }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RepurposingProject = typeof repurposingProjects.$inferSelect;
export type InsertRepurposingProject = typeof repurposingProjects.$inferInsert;

export const repurposedContents = mysqlTable("repurposed_contents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  formatType: varchar("formatType", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }),
  body: text("body"),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  externalId: varchar("externalId", { length: 255 }),
  publishedAt: timestamp("publishedAt"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RepurposedContent = typeof repurposedContents.$inferSelect;
export type InsertRepurposedContent = typeof repurposedContents.$inferInsert;

// ─── Native publishing credentials (Medium, Substack, WordPress) ────────
export const publishingCredentials = mysqlTable("publishing_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["medium", "substack", "wordpress"]).notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  apiUrl: text("apiUrl"),
  siteUrl: text("siteUrl"),
  status: mysqlEnum("status", ["connected", "expired", "disconnected"]).default("connected").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PublishingCredential = typeof publishingCredentials.$inferSelect;
export type InsertPublishingCredential = typeof publishingCredentials.$inferInsert;

// ─── Funnels (multi-step lead/sales) ─────────────────────────────────
export const funnels = mysqlTable("funnels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Funnel = typeof funnels.$inferSelect;
export type InsertFunnel = typeof funnels.$inferInsert;

export const funnelSteps = mysqlTable("funnel_steps", {
  id: int("id").autoincrement().primaryKey(),
  funnelId: int("funnelId").notNull(),
  orderIndex: int("orderIndex").notNull().default(0),
  stepType: mysqlEnum("stepType", ["landing", "form", "payment", "thank_you"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  landingPageId: int("landingPageId"),
  formId: int("formId"),
  stripePriceId: varchar("stripePriceId", { length: 128 }),
  config: json("config").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FunnelStep = typeof funnelSteps.$inferSelect;
export type InsertFunnelStep = typeof funnelSteps.$inferInsert;

export const funnelStepEvents = mysqlTable("funnel_step_events", {
  id: int("id").autoincrement().primaryKey(),
  funnelId: int("funnelId").notNull(),
  funnelStepId: int("funnelStepId").notNull(),
  eventType: mysqlEnum("eventType", ["view", "complete"]).notNull(),
  sessionId: varchar("sessionId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FunnelStepEvent = typeof funnelStepEvents.$inferSelect;
export type InsertFunnelStepEvent = typeof funnelStepEvents.$inferInsert;

export const funnelAbTests = mysqlTable("funnel_ab_tests", {
  id: int("id").autoincrement().primaryKey(),
  funnelId: int("funnelId").notNull(),
  funnelStepId: int("funnelStepId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["draft", "running", "completed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FunnelAbTest = typeof funnelAbTests.$inferSelect;
export type InsertFunnelAbTest = typeof funnelAbTests.$inferInsert;

export const funnelAbTestVariations = mysqlTable("funnel_ab_test_variations", {
  id: int("id").autoincrement().primaryKey(),
  testId: int("testId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  config: json("config").$type<Record<string, unknown>>(),
  trafficPercent: int("trafficPercent").notNull().default(50),
  views: int("views").default(0).notNull(),
  conversions: int("conversions").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FunnelAbTestVariation = typeof funnelAbTestVariations.$inferSelect;
export type InsertFunnelAbTestVariation = typeof funnelAbTestVariations.$inferInsert;

// ─── Reviews / Reputation ────────────────────────────────────────────
export const reviewSources = mysqlTable("review_sources", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sourceType: mysqlEnum("sourceType", ["google", "facebook", "yelp", "manual"]).notNull(),
  name: varchar("name", { length: 255 }),
  externalId: varchar("externalId", { length: 255 }),
  accessToken: text("accessToken"),
  status: mysqlEnum("status", ["connected", "disconnected", "error"]).default("connected").notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReviewSource = typeof reviewSources.$inferSelect;
export type InsertReviewSource = typeof reviewSources.$inferInsert;

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sourceId: int("sourceId").notNull(),
  externalId: varchar("externalId", { length: 255 }),
  authorName: varchar("authorName", { length: 255 }),
  rating: int("rating").notNull(),
  text: text("text"),
  reply: text("reply"),
  reviewUrl: text("reviewUrl"),
  reviewedAt: timestamp("reviewedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ─── Standalone Forms ───────────────────────────────────────────────
export const forms = mysqlTable("forms", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  submitButtonText: varchar("submitButtonText", { length: 64 }).default("Submit"),
  redirectUrl: text("redirectUrl"),
  createLeadOnSubmit: boolean("createLeadOnSubmit").default(true),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  submissionCount: int("submissionCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Form = typeof forms.$inferSelect;
export type InsertForm = typeof forms.$inferInsert;

export const formFields = mysqlTable("form_fields", {
  id: int("id").autoincrement().primaryKey(),
  formId: int("formId").notNull(),
  orderIndex: int("orderIndex").notNull().default(0),
  fieldType: mysqlEnum("fieldType", ["text", "email", "phone", "textarea", "select", "checkbox", "number"]).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  placeholder: varchar("placeholder", { length: 255 }),
  required: boolean("required").default(true),
  options: json("options").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FormField = typeof formFields.$inferSelect;
export type InsertFormField = typeof formFields.$inferInsert;

export const formResponses = mysqlTable("form_responses", {
  id: int("id").autoincrement().primaryKey(),
  formId: int("formId").notNull(),
  userId: int("userId").notNull(),
  leadId: int("leadId"),
  data: json("data").$type<Record<string, string>>(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FormResponse = typeof formResponses.$inferSelect;
export type InsertFormResponse = typeof formResponses.$inferInsert;

// ─── Report Snapshots (one-click share) ──────────────────────────────
export const reportSnapshots = mysqlTable("report_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reportType: mysqlEnum("reportType", ["dashboard", "analytics", "ad_performance", "campaign"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  shareToken: varchar("shareToken", { length: 64 }).notNull().unique(),
  payload: json("payload").$type<Record<string, unknown>>(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReportSnapshot = typeof reportSnapshots.$inferSelect;
export type InsertReportSnapshot = typeof reportSnapshots.$inferInsert;

// ─── Lead assignment (round-robin) ───────────────────────────────────
export const assignmentSettings = mysqlTable("assignment_settings", {
  userId: int("userId").primaryKey(),
  mode: mysqlEnum("mode", ["manual", "round_robin"]).default("manual").notNull(),
  memberOrder: json("memberOrder").$type<number[]>(),
  lastAssignedIndex: int("lastAssignedIndex").default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssignmentSetting = typeof assignmentSettings.$inferSelect;
export type InsertAssignmentSetting = typeof assignmentSettings.$inferInsert;

// ─── Data flywheel (anonymized aggregated patterns for central learning) ───
export const flywheelPatterns = mysqlTable("flywheel_patterns", {
  id: int("id").autoincrement().primaryKey(),
  platform: varchar("platform", { length: 64 }).notNull(),
  format: varchar("format", { length: 128 }),
  hookLengthBand: varchar("hookLengthBand", { length: 32 }),
  emotion: varchar("emotion", { length: 64 }),
  ctrBand: varchar("ctrBand", { length: 32 }),
  conversionBand: varchar("conversionBand", { length: 32 }),
  sampleSize: int("sampleSize").default(0).notNull(),
  patternSummary: text("patternSummary"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FlywheelPattern = typeof flywheelPatterns.$inferSelect;
export type InsertFlywheelPattern = typeof flywheelPatterns.$inferInsert;

// ─── Self-learning: per-campaign winning patterns (fed into flywheel when anonymized) ───
export const campaignWinningPatterns = mysqlTable("campaign_winning_patterns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId"),
  platform: varchar("platform", { length: 64 }),
  format: varchar("format", { length: 128 }),
  hookLength: varchar("hookLength", { length: 32 }),
  emotion: varchar("emotion", { length: 64 }),
  ctr: text("ctr"),
  conversionRate: text("conversionRate"),
  summary: text("summary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CampaignWinningPattern = typeof campaignWinningPatterns.$inferSelect;
export type InsertCampaignWinningPattern = typeof campaignWinningPatterns.$inferInsert;

// ─── Market narrative engine ───
export const narratives = mysqlTable("narratives", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  summary: text("summary").notNull(),
  topics: json("topics").$type<string[]>(),
  emotion: varchar("emotion", { length: 64 }),
  suggestedAngles: json("suggestedAngles").$type<string[]>(),
  sourceUrl: text("sourceUrl"),
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Narrative = typeof narratives.$inferSelect;
export type InsertNarrative = typeof narratives.$inferInsert;

// ─── Audience influence graph ───
export const influenceNodes = mysqlTable("influence_nodes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["persona", "channel"]).notNull(),
  segmentId: int("segmentId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InfluenceNode = typeof influenceNodes.$inferSelect;
export type InsertInfluenceNode = typeof influenceNodes.$inferInsert;

// ─── Referral (growth lever) ───
export const referralCodes = mysqlTable("referral_codes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

export const referralSignups = mysqlTable("referral_signups", {
  id: int("id").autoincrement().primaryKey(),
  referrerUserId: int("referrerUserId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralSignup = typeof referralSignups.$inferSelect;
export type InsertReferralSignup = typeof referralSignups.$inferInsert;
