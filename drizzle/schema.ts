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
  // AI-extracted fields
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
