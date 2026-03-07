import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  products, InsertProduct, Product,
  contents, InsertContent, Content,
  creatives, InsertCreative, Creative,
  videoAds, InsertVideoAd, VideoAd,
  campaigns, InsertCampaign, Campaign,
  abTests, InsertAbTest, AbTest,
  abTestVariants, InsertAbTestVariant, AbTestVariant,
  scheduledPosts, InsertScheduledPost, ScheduledPost,
  leads, InsertLead, Lead,
  analyticsEvents, InsertAnalyticsEvent, AnalyticsEvent,
  brandVoices, InsertBrandVoice, BrandVoice,
  emailCampaigns, InsertEmailCampaign, EmailCampaign,
  emailLists, InsertEmailList, EmailList,
  emailContacts, InsertEmailContact, EmailContact,
  landingPages, InsertLandingPage, LandingPage,
  formSubmissions, InsertFormSubmission, FormSubmission,
  automationWorkflows, InsertAutomationWorkflow, AutomationWorkflow,
  socialPublishQueue, InsertSocialPublishQueue, SocialPublishQueue,
  videoRenders, InsertVideoRender, VideoRender,
  webhookEndpoints, InsertWebhookEndpoint, WebhookEndpoint,
  personalVideos, InsertPersonalVideo, PersonalVideo,
  competitorProfiles, InsertCompetitorProfile, CompetitorProfile,
  competitorSnapshots, InsertCompetitorSnapshot, CompetitorSnapshot,
  competitorAlerts, InsertCompetitorAlert, CompetitorAlert,
  customerProfiles, InsertCustomerProfile, CustomerProfile,
  customerInteractions, InsertCustomerInteraction, CustomerInteraction,
  customerSegments, InsertCustomerSegment, CustomerSegment,
  adPerformanceReports, InsertAdPerformanceReport, AdPerformanceReport,
  publisherQueue, InsertPublisherQueueItem, PublisherQueueItem,
  performanceAlerts, InsertPerformanceAlert, PerformanceAlert,
  creatorProfiles, InsertCreatorProfile, CreatorProfile,
  portfolioItems, InsertPortfolioItem, PortfolioItem,
  projects2, chatConversations, contentTemplates, performanceMetrics,
  repurposingProjects, InsertRepurposingProject, RepurposingProject,
  repurposedContents, InsertRepurposedContent, RepurposedContent,
  publishingCredentials, InsertPublishingCredential, PublishingCredential,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Products ────────────────────────────────────────────────────────
export async function createProduct(data: InsertProduct) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(products).values(data);
  return { id: result[0].insertId };
}

export async function getProductsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(products).where(eq(products.userId, userId)).orderBy(desc(products.createdAt));
}

export async function getProductById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(products).where(eq(products.id, id));
}

// ─── Contents ────────────────────────────────────────────────────────
export async function createContent(data: InsertContent) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(contents).values(data);
  return { id: result[0].insertId };
}

export async function getContentsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(contents).where(eq(contents.userId, userId)).orderBy(desc(contents.createdAt));
}

export async function getContentById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(contents).where(eq(contents.id, id)).limit(1);
  return result[0];
}

export async function updateContent(id: number, data: Partial<InsertContent>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(contents).set(data).where(eq(contents.id, id));
}

export async function deleteContent(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(contents).where(eq(contents.id, id));
}

export async function getContentsByProduct(productId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(contents).where(eq(contents.productId, productId)).orderBy(desc(contents.createdAt));
}

export async function getContentsByCampaign(campaignId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(contents).where(eq(contents.campaignId, campaignId)).orderBy(desc(contents.createdAt));
}

export async function searchContents(userId: number, opts: { query?: string; type?: string; platform?: string; status?: string; limit?: number; offset?: number }) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions = [eq(contents.userId, userId)];
  if (opts.type) conditions.push(eq(contents.type, opts.type as any));
  if (opts.platform) conditions.push(eq(contents.platform, opts.platform));
  if (opts.status) conditions.push(eq(contents.status, opts.status as any));
  if (opts.query) conditions.push(sql`(${contents.title} LIKE ${"%" + opts.query + "%"} OR ${contents.body} LIKE ${"%" + opts.query + "%"})`);
  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
  const items = await db.select().from(contents).where(whereClause).orderBy(desc(contents.createdAt)).limit(opts.limit || 50).offset(opts.offset || 0);
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(contents).where(whereClause);
  return { items, total: Number(countResult[0]?.count || 0) };
}

// ─── Creatives ───────────────────────────────────────────────────────
export async function createCreative(data: InsertCreative) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(creatives).values(data);
  return { id: result[0].insertId };
}

export async function getCreativesByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(creatives).where(eq(creatives.userId, userId)).orderBy(desc(creatives.createdAt));
}

export async function getCreativeById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(creatives).where(eq(creatives.id, id)).limit(1);
  return result[0];
}

export async function updateCreative(id: number, data: Partial<InsertCreative>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(creatives).set(data).where(eq(creatives.id, id));
}

export async function deleteCreative(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(creatives).where(eq(creatives.id, id));
}

// ─── Video Ads ───────────────────────────────────────────────────────
export async function createVideoAd(data: InsertVideoAd) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(videoAds).values(data);
  return { id: result[0].insertId };
}

export async function getVideoAdsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(videoAds).where(eq(videoAds.userId, userId)).orderBy(desc(videoAds.createdAt));
}

export async function getVideoAdById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(videoAds).where(eq(videoAds.id, id)).limit(1);
  return result[0];
}

export async function updateVideoAd(id: number, data: Partial<InsertVideoAd>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(videoAds).set(data).where(eq(videoAds.id, id));
}

export async function deleteVideoAd(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(videoAds).where(eq(videoAds.id, id));
}

// ─── Campaigns ───────────────────────────────────────────────────────
export async function createCampaign(data: InsertCampaign) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(campaigns).values(data);
  return { id: result[0].insertId };
}

export async function getCampaignsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt));
}

export async function getCampaignById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result[0];
}

export async function updateCampaign(id: number, data: Partial<InsertCampaign>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(campaigns).set(data).where(eq(campaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(campaigns).where(eq(campaigns.id, id));
}

// ─── A/B Tests ───────────────────────────────────────────────────────
export async function createAbTest(data: InsertAbTest) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(abTests).values(data);
  return { id: result[0].insertId };
}

export async function getAbTestsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(abTests).where(eq(abTests.userId, userId)).orderBy(desc(abTests.createdAt));
}

export async function getAbTestById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(abTests).where(eq(abTests.id, id)).limit(1);
  return result[0];
}

export async function updateAbTest(id: number, data: Partial<InsertAbTest>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(abTests).set(data).where(eq(abTests.id, id));
}

// ─── A/B Test Variants ──────────────────────────────────────────────
export async function createAbTestVariant(data: InsertAbTestVariant) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(abTestVariants).values(data);
  return { id: result[0].insertId };
}

export async function getVariantsByTest(testId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(abTestVariants).where(eq(abTestVariants.testId, testId));
}

export async function updateAbTestVariant(id: number, data: Partial<InsertAbTestVariant>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(abTestVariants).set(data).where(eq(abTestVariants.id, id));
}

// ─── Scheduled Posts ─────────────────────────────────────────────────
export async function createScheduledPost(data: InsertScheduledPost) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(scheduledPosts).values(data);
  return { id: result[0].insertId };
}

export async function getScheduledPostsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(scheduledPosts).where(eq(scheduledPosts.userId, userId)).orderBy(desc(scheduledPosts.scheduledAt));
}

export async function updateScheduledPost(id: number, data: Partial<InsertScheduledPost>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(scheduledPosts).set(data).where(eq(scheduledPosts.id, id));
}

export async function deleteScheduledPost(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(scheduledPosts).where(eq(scheduledPosts.id, id));
}

// ─── Leads ───────────────────────────────────────────────────────────
export async function createLead(data: InsertLead) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(leads).values(data);
  return { id: result[0].insertId };
}

export async function getLeadsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(leads).where(eq(leads.userId, userId)).orderBy(desc(leads.createdAt));
}

export async function getLeadById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0];
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(leads).where(eq(leads.id, id));
}

export async function getLeadsByCampaign(campaignId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(leads).where(eq(leads.campaignId, campaignId)).orderBy(desc(leads.createdAt));
}

// ─── Analytics ───────────────────────────────────────────────────────
export async function createAnalyticsEvent(data: InsertAnalyticsEvent) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(analyticsEvents).values(data);
  return { id: result[0].insertId };
}

export async function getAnalyticsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(analyticsEvents).where(eq(analyticsEvents.userId, userId)).orderBy(desc(analyticsEvents.recordedAt));
}

export async function getAnalyticsByCampaign(campaignId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(analyticsEvents).where(eq(analyticsEvents.campaignId, campaignId)).orderBy(desc(analyticsEvents.recordedAt));
}

export async function getAnalyticsSummary(userId: number) {
  const db = await getDb(); if (!db) return null;
  const result = await db.select({
    totalImpressions: sql<number>`COALESCE(SUM(impressions), 0)`,
    totalClicks: sql<number>`COALESCE(SUM(clicks), 0)`,
    totalConversions: sql<number>`COALESCE(SUM(conversions), 0)`,
    totalSpend: sql<string>`COALESCE(SUM(CAST(spend AS DECIMAL(10,2))), 0)`,
    totalRevenue: sql<string>`COALESCE(SUM(CAST(revenue AS DECIMAL(10,2))), 0)`,
  }).from(analyticsEvents).where(eq(analyticsEvents.userId, userId));
  return result[0];
}

// ─── Dashboard Stats ─────────────────────────────────────────────────
export async function getDashboardStats(userId: number) {
  const db = await getDb(); if (!db) return null;
  const [productCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(products).where(eq(products.userId, userId));
  const [campaignCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(campaigns).where(eq(campaigns.userId, userId));
  const [contentCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(contents).where(eq(contents.userId, userId));
  const [leadCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(leads).where(eq(leads.userId, userId));
  const [creativeCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(creatives).where(eq(creatives.userId, userId));
  const analyticsSummary = await getAnalyticsSummary(userId);
  return {
    products: productCount?.count ?? 0,
    campaigns: campaignCount?.count ?? 0,
    contents: contentCount?.count ?? 0,
    leads: leadCount?.count ?? 0,
    creatives: creativeCount?.count ?? 0,
    analytics: analyticsSummary,
  };
}

// ─── CRM Deals ──────────────────────────────────────────────────────
import {
  deals, InsertDeal, Deal,
  activities, InsertActivity, Activity,
  adPlatformConnections, InsertAdPlatformConnection, AdPlatformConnection,
  adPlatformCampaigns, InsertAdPlatformCampaign, AdPlatformCampaign,
  teamMembers, InsertTeamMember, TeamMember,
  approvalWorkflows, InsertApprovalWorkflow, ApprovalWorkflow,
  predictiveScores, InsertPredictiveScore, PredictiveScore,
  seoAudits, InsertSeoAudit, SeoAudit,
} from "../drizzle/schema";

export async function createDeal(data: InsertDeal) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(deals).values(data);
  return { id: result[0].insertId };
}

export async function getDealsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(deals).where(eq(deals.userId, userId)).orderBy(desc(deals.createdAt));
}

export async function getDealById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
  return result[0];
}

export async function updateDeal(id: number, data: Partial<InsertDeal>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(deals).set(data).where(eq(deals.id, id));
}

export async function deleteDeal(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(deals).where(eq(deals.id, id));
}

export async function getDealsByStage(userId: number, stage: string) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(deals).where(and(eq(deals.userId, userId), eq(deals.stage, stage as any))).orderBy(desc(deals.createdAt));
}

export async function getDealPipelineSummary(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select({
    stage: deals.stage,
    count: sql<number>`COUNT(*)`,
    totalValue: sql<string>`COALESCE(SUM(CAST(value AS DECIMAL(12,2))), 0)`,
  }).from(deals).where(eq(deals.userId, userId)).groupBy(deals.stage);
}

// ─── CRM Activities ─────────────────────────────────────────────────
export async function createActivity(data: InsertActivity) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(activities).values(data);
  return { id: result[0].insertId };
}

export async function getActivitiesByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.createdAt));
}

export async function getActivitiesByDeal(dealId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(activities).where(eq(activities.dealId, dealId)).orderBy(desc(activities.createdAt));
}

export async function getActivitiesByLead(leadId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(activities).where(eq(activities.leadId, leadId)).orderBy(desc(activities.createdAt));
}

export async function updateActivity(id: number, data: Partial<InsertActivity>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(activities).set(data).where(eq(activities.id, id));
}

// ─── Ad Platform Connections ─────────────────────────────────────────
export async function createAdPlatformConnection(data: InsertAdPlatformConnection) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(adPlatformConnections).values(data);
  return { id: result[0].insertId };
}

export async function getAdPlatformConnectionsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(adPlatformConnections).where(eq(adPlatformConnections.userId, userId)).orderBy(desc(adPlatformConnections.createdAt));
}

export async function getAdPlatformConnectionById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(adPlatformConnections).where(eq(adPlatformConnections.id, id)).limit(1);
  return result[0];
}

export async function updateAdPlatformConnection(id: number, data: Partial<InsertAdPlatformConnection>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(adPlatformConnections).set(data).where(eq(adPlatformConnections.id, id));
}

export async function deleteAdPlatformConnection(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(adPlatformConnections).where(eq(adPlatformConnections.id, id));
}

// ─── Ad Platform Campaigns ──────────────────────────────────────────
export async function createAdPlatformCampaign(data: InsertAdPlatformCampaign) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(adPlatformCampaigns).values(data);
  return { id: result[0].insertId };
}

export async function getAdPlatformCampaignsByConnection(connectionId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(adPlatformCampaigns).where(eq(adPlatformCampaigns.connectionId, connectionId)).orderBy(desc(adPlatformCampaigns.createdAt));
}

export async function getAdPlatformCampaignsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(adPlatformCampaigns).where(eq(adPlatformCampaigns.userId, userId)).orderBy(desc(adPlatformCampaigns.createdAt));
}

// ─── Team Members ────────────────────────────────────────────────────
export async function createTeamMember(data: InsertTeamMember) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(teamMembers).values(data);
  return { id: result[0].insertId };
}

export async function getTeamMembersByOwner(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(teamMembers).where(eq(teamMembers.ownerId, ownerId)).orderBy(desc(teamMembers.createdAt));
}

export async function updateTeamMember(id: number, data: Partial<InsertTeamMember>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(teamMembers).set(data).where(eq(teamMembers.id, id));
}

export async function deleteTeamMember(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
}

export async function getTeamMemberByToken(token: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(teamMembers).where(eq(teamMembers.inviteToken, token)).limit(1);
  return result[0];
}

// ─── Approval Workflows ─────────────────────────────────────────────
export async function createApprovalWorkflow(data: InsertApprovalWorkflow) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(approvalWorkflows).values(data);
  return { id: result[0].insertId };
}

export async function getApprovalsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(approvalWorkflows).where(eq(approvalWorkflows.userId, userId)).orderBy(desc(approvalWorkflows.createdAt));
}

export async function getPendingApprovals(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(approvalWorkflows).where(and(eq(approvalWorkflows.userId, userId), eq(approvalWorkflows.status, "pending"))).orderBy(desc(approvalWorkflows.createdAt));
}

export async function updateApprovalWorkflow(id: number, data: Partial<InsertApprovalWorkflow>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(approvalWorkflows).set(data).where(eq(approvalWorkflows.id, id));
}

// ─── Predictive Scores ──────────────────────────────────────────────
export async function createPredictiveScore(data: InsertPredictiveScore) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(predictiveScores).values(data);
  return { id: result[0].insertId };
}

export async function getPredictiveScoresByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(predictiveScores).where(eq(predictiveScores.userId, userId)).orderBy(desc(predictiveScores.scoredAt));
}

export async function getPredictiveScoreByEntity(entityType: string, entityId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(predictiveScores).where(and(eq(predictiveScores.entityType, entityType as any), eq(predictiveScores.entityId, entityId))).orderBy(desc(predictiveScores.scoredAt)).limit(1);
  return result[0];
}

// ─── SEO Audits ─────────────────────────────────────────────────────
export async function createSeoAudit(data: InsertSeoAudit) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(seoAudits).values(data);
  return { id: result[0].insertId };
}

export async function getSeoAuditsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(seoAudits).where(eq(seoAudits.userId, userId)).orderBy(desc(seoAudits.createdAt));
}

export async function getSeoAuditById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(seoAudits).where(eq(seoAudits.id, id)).limit(1);
  return result[0];
}


// ─── Brand Voices ──────────────────────────────────────────────────
export async function createBrandVoice(data: InsertBrandVoice) {
  const db = await getDb(); if (!db) return { id: 0 };
  const result = await db.insert(brandVoices).values(data);
  return { id: result[0].insertId };
}
export async function getBrandVoicesByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(brandVoices).where(eq(brandVoices.userId, userId)).orderBy(desc(brandVoices.createdAt));
}
export async function getBrandVoiceById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(brandVoices).where(eq(brandVoices.id, id)).limit(1);
  return r[0];
}
export async function updateBrandVoice(id: number, data: Partial<InsertBrandVoice>) {
  const db = await getDb(); if (!db) return;
  await db.update(brandVoices).set(data).where(eq(brandVoices.id, id));
}
export async function deleteBrandVoice(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(brandVoices).where(eq(brandVoices.id, id));
}
export async function getDefaultBrandVoice(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(brandVoices).where(and(eq(brandVoices.userId, userId), eq(brandVoices.isDefault, true))).limit(1);
  return r[0];
}

// ─── Email Lists ───────────────────────────────────────────────────
export async function createEmailList(data: InsertEmailList) {
  const db = await getDb(); if (!db) return { id: 0 };
  const result = await db.insert(emailLists).values(data);
  return { id: result[0].insertId };
}
export async function getEmailListsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(emailLists).where(eq(emailLists.userId, userId)).orderBy(desc(emailLists.createdAt));
}
export async function getEmailListById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(emailLists).where(eq(emailLists.id, id)).limit(1);
  return r[0];
}
export async function deleteEmailList(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(emailLists).where(eq(emailLists.id, id));
}

// ─── Email Contacts ────────────────────────────────────────────────
export async function createEmailContact(data: InsertEmailContact) {
  const db = await getDb(); if (!db) return { id: 0 };
  const result = await db.insert(emailContacts).values(data);
  return { id: result[0].insertId };
}
export async function getEmailContactsByList(listId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(emailContacts).where(eq(emailContacts.listId, listId));
}
export async function deleteEmailContact(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(emailContacts).where(eq(emailContacts.id, id));
}
export async function bulkCreateEmailContacts(contacts: InsertEmailContact[]) {
  const db = await getDb(); if (!db) return;
  if (contacts.length === 0) return;
  await db.insert(emailContacts).values(contacts);
}

// ─── Email Campaigns ───────────────────────────────────────────────
export async function createEmailCampaign(data: InsertEmailCampaign) {
  const db = await getDb(); if (!db) return { id: 0 };
  const result = await db.insert(emailCampaigns).values(data);
  return { id: result[0].insertId };
}
export async function getEmailCampaignsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(emailCampaigns).where(eq(emailCampaigns.userId, userId)).orderBy(desc(emailCampaigns.createdAt));
}
export async function getEmailCampaignById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id)).limit(1);
  return r[0];
}
export async function updateEmailCampaign(id: number, data: Partial<InsertEmailCampaign>) {
  const db = await getDb(); if (!db) return;
  await db.update(emailCampaigns).set(data).where(eq(emailCampaigns.id, id));
}
export async function deleteEmailCampaign(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
}

// ─── Landing Pages ─────────────────────────────────────────────────
export async function createLandingPage(data: InsertLandingPage) {
  const db = await getDb(); if (!db) return { id: 0 };
  const result = await db.insert(landingPages).values(data);
  return { id: result[0].insertId };
}
export async function getLandingPagesByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(landingPages).where(eq(landingPages.userId, userId)).orderBy(desc(landingPages.createdAt));
}
export async function getLandingPageById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(landingPages).where(eq(landingPages.id, id)).limit(1);
  return r[0];
}
export async function updateLandingPage(id: number, data: Partial<InsertLandingPage>) {
  const db = await getDb(); if (!db) return;
  await db.update(landingPages).set(data).where(eq(landingPages.id, id));
}
export async function deleteLandingPage(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(landingPages).where(eq(landingPages.id, id));
}

// ─── Form Submissions ──────────────────────────────────────────────
export async function createFormSubmission(data: InsertFormSubmission) {
  const db = await getDb(); if (!db) return { id: 0 };
  const result = await db.insert(formSubmissions).values(data);
  return { id: result[0].insertId };
}
export async function getFormSubmissionsByPage(landingPageId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(formSubmissions).where(eq(formSubmissions.landingPageId, landingPageId)).orderBy(desc(formSubmissions.createdAt));
}

// ─── Automation Workflows ──────────────────────────────────────────
export async function createAutomationWorkflow(data: InsertAutomationWorkflow) {
  const db = await getDb(); if (!db) return { id: 0 };
  const result = await db.insert(automationWorkflows).values(data);
  return { id: result[0].insertId };
}
export async function getAutomationWorkflowsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(automationWorkflows).where(eq(automationWorkflows.userId, userId)).orderBy(desc(automationWorkflows.createdAt));
}
export async function getAutomationWorkflowById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(automationWorkflows).where(eq(automationWorkflows.id, id)).limit(1);
  return r[0];
}
export async function updateAutomationWorkflow(id: number, data: Partial<InsertAutomationWorkflow>) {
  const db = await getDb(); if (!db) return;
  await db.update(automationWorkflows).set(data).where(eq(automationWorkflows.id, id));
}
export async function deleteAutomationWorkflow(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(automationWorkflows).where(eq(automationWorkflows.id, id));
}

// ─── Social Publish Queue ──────────────────────────────────────────
export async function createSocialPublish(data: InsertSocialPublishQueue) {
  const db = await getDb(); if (!db) return { id: 0 };
  const result = await db.insert(socialPublishQueue).values(data);
  return { id: result[0].insertId };
}
export async function getSocialPublishByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(socialPublishQueue).where(eq(socialPublishQueue.userId, userId)).orderBy(desc(socialPublishQueue.createdAt));
}
export async function updateSocialPublish(id: number, data: Partial<InsertSocialPublishQueue>) {
  const db = await getDb(); if (!db) return;
  await db.update(socialPublishQueue).set(data).where(eq(socialPublishQueue.id, id));
}

// ─── Video Renders ─────────────────────────────────────────────────
export async function createVideoRender(data: InsertVideoRender) {
  const db = await getDb(); if (!db) return { id: 0 };
  const result = await db.insert(videoRenders).values(data);
  return { id: result[0].insertId };
}
export async function getVideoRendersByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(videoRenders).where(eq(videoRenders.userId, userId)).orderBy(desc(videoRenders.createdAt));
}
export async function getVideoRenderById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(videoRenders).where(eq(videoRenders.id, id)).limit(1);
  return r[0];
}
export async function updateVideoRender(id: number, data: Partial<InsertVideoRender>) {
  const db = await getDb(); if (!db) return;
  await db.update(videoRenders).set(data).where(eq(videoRenders.id, id));
}

// ─── Webhook Endpoints ─────────────────────────────────────────────
export async function createWebhookEndpoint(data: InsertWebhookEndpoint) {
  const db = await getDb(); if (!db) return { id: 0 };
  const result = await db.insert(webhookEndpoints).values(data);
  return { id: result[0].insertId };
}
export async function getWebhookEndpointsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(webhookEndpoints).where(eq(webhookEndpoints.userId, userId)).orderBy(desc(webhookEndpoints.createdAt));
}
export async function getWebhookEndpointById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.id, id)).limit(1);
  return r[0];
}
export async function updateWebhookEndpoint(id: number, data: Partial<InsertWebhookEndpoint>) {
  const db = await getDb(); if (!db) return;
  await db.update(webhookEndpoints).set(data).where(eq(webhookEndpoints.id, id));
}
export async function deleteWebhookEndpoint(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, id));
}

// ─── Personal Videos ────────────────────────────────────────────────
export async function createPersonalVideo(data: InsertPersonalVideo) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(personalVideos).values(data);
  return { id: result[0].insertId };
}
export async function getPersonalVideosByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(personalVideos).where(eq(personalVideos.userId, userId)).orderBy(desc(personalVideos.createdAt));
}
export async function getPersonalVideoById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(personalVideos).where(eq(personalVideos.id, id)).limit(1);
  return r[0];
}
export async function getPersonalVideoByShareToken(token: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(personalVideos).where(eq(personalVideos.shareToken, token)).limit(1);
  return r[0];
}
export async function updatePersonalVideo(id: number, data: Partial<InsertPersonalVideo>) {
  const db = await getDb(); if (!db) return;
  await db.update(personalVideos).set(data).where(eq(personalVideos.id, id));
}
export async function deletePersonalVideo(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(personalVideos).where(eq(personalVideos.id, id));
}

// ─── Competitor Profiles ────────────────────────────────────────────
export async function createCompetitorProfile(data: InsertCompetitorProfile) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(competitorProfiles).values(data);
  return { id: result[0].insertId };
}
export async function getCompetitorProfilesByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(competitorProfiles).where(eq(competitorProfiles.userId, userId)).orderBy(desc(competitorProfiles.createdAt));
}
export async function getCompetitorProfileById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(competitorProfiles).where(eq(competitorProfiles.id, id)).limit(1);
  return r[0];
}
export async function updateCompetitorProfile(id: number, data: Partial<InsertCompetitorProfile>) {
  const db = await getDb(); if (!db) return;
  await db.update(competitorProfiles).set(data).where(eq(competitorProfiles.id, id));
}
export async function deleteCompetitorProfile(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(competitorProfiles).where(eq(competitorProfiles.id, id));
}

// ─── Competitor Snapshots ───────────────────────────────────────────
export async function createCompetitorSnapshot(data: InsertCompetitorSnapshot) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(competitorSnapshots).values(data);
  return { id: result[0].insertId };
}
export async function getCompetitorSnapshotsByCompetitor(competitorId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(competitorSnapshots).where(eq(competitorSnapshots.competitorId, competitorId)).orderBy(desc(competitorSnapshots.createdAt));
}

// ─── Competitor Alerts ──────────────────────────────────────────────
export async function createCompetitorAlert(data: InsertCompetitorAlert) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(competitorAlerts).values(data);
  return { id: result[0].insertId };
}
export async function getCompetitorAlertsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(competitorAlerts).where(eq(competitorAlerts.userId, userId)).orderBy(desc(competitorAlerts.createdAt));
}
export async function markCompetitorAlertRead(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(competitorAlerts).set({ isRead: true }).where(eq(competitorAlerts.id, id));
}

// ─── Customer Profiles ──────────────────────────────────────────────
export async function createCustomerProfile(data: InsertCustomerProfile) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(customerProfiles).values(data);
  return { id: result[0].insertId };
}
export async function getCustomerProfilesByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(customerProfiles).where(eq(customerProfiles.userId, userId)).orderBy(desc(customerProfiles.updatedAt));
}
export async function getCustomerProfileById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(customerProfiles).where(eq(customerProfiles.id, id)).limit(1);
  return r[0];
}
export async function updateCustomerProfile(id: number, data: Partial<InsertCustomerProfile>) {
  const db = await getDb(); if (!db) return;
  await db.update(customerProfiles).set(data).where(eq(customerProfiles.id, id));
}
export async function deleteCustomerProfile(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(customerProfiles).where(eq(customerProfiles.id, id));
}

// ─── Customer Interactions ──────────────────────────────────────────
export async function createCustomerInteraction(data: InsertCustomerInteraction) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(customerInteractions).values(data);
  return { id: result[0].insertId };
}
export async function getCustomerInteractionsByCustomer(customerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(customerInteractions).where(eq(customerInteractions.customerId, customerId)).orderBy(desc(customerInteractions.createdAt));
}

// ─── Customer Segments ──────────────────────────────────────────────
export async function createCustomerSegment(data: InsertCustomerSegment) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(customerSegments).values(data);
  return { id: result[0].insertId };
}
export async function getCustomerSegmentsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(customerSegments).where(eq(customerSegments.userId, userId)).orderBy(desc(customerSegments.createdAt));
}
export async function getCustomerSegmentById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(customerSegments).where(eq(customerSegments.id, id)).limit(1);
  return r[0];
}
export async function updateCustomerSegment(id: number, data: Partial<InsertCustomerSegment>) {
  const db = await getDb(); if (!db) return;
  await db.update(customerSegments).set(data).where(eq(customerSegments.id, id));
}
export async function deleteCustomerSegment(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(customerSegments).where(eq(customerSegments.id, id));
}

// ─── Ad Performance Reports ──────────────────────────────────────
export async function createAdPerformanceReport(data: InsertAdPerformanceReport) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(adPerformanceReports).values(data);
  return { id: Number(result[0].insertId), ...data };
}
export async function getAdPerformanceReportsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(adPerformanceReports).where(eq(adPerformanceReports.userId, userId)).orderBy(desc(adPerformanceReports.createdAt));
}
export async function getAdPerformanceReportById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(adPerformanceReports).where(eq(adPerformanceReports.id, id)).limit(1);
  return result[0];
}
export async function updateAdPerformanceReport(id: number, data: Partial<AdPerformanceReport>) {
  const db = await getDb(); if (!db) return;
  await db.update(adPerformanceReports).set(data).where(eq(adPerformanceReports.id, id));
}

// ─── Publisher Queue ─────────────────────────────────────────────
export async function createPublisherQueueItem(data: InsertPublisherQueueItem) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(publisherQueue).values(data);
  return { id: Number(result[0].insertId), ...data };
}
export async function getPublisherQueueByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(publisherQueue).where(eq(publisherQueue.userId, userId)).orderBy(desc(publisherQueue.createdAt));
}
export async function getPublisherQueueItemById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(publisherQueue).where(eq(publisherQueue.id, id)).limit(1);
  return result[0];
}
export async function updatePublisherQueueItem(id: number, data: Partial<PublisherQueueItem>) {
  const db = await getDb(); if (!db) return;
  await db.update(publisherQueue).set(data).where(eq(publisherQueue.id, id));
}
export async function deletePublisherQueueItem(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(publisherQueue).where(eq(publisherQueue.id, id));
}

// ─── Performance Alerts ─────────────────────────────────────────
export async function createPerformanceAlert(data: InsertPerformanceAlert) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(performanceAlerts).values(data);
  return { id: Number(result[0].insertId), ...data };
}
export async function getPerformanceAlertsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(performanceAlerts).where(eq(performanceAlerts.userId, userId)).orderBy(desc(performanceAlerts.createdAt));
}
export async function updatePerformanceAlert(id: number, data: Partial<PerformanceAlert>) {
  const db = await getDb(); if (!db) return;
  await db.update(performanceAlerts).set(data).where(eq(performanceAlerts.id, id));
}

// ─── Creator Profile ─────────────────────────────────────────────
export async function getCreatorProfileByUserId(userId: number) {
  const db = await getDb(); if (!db) return null;
  const result = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, userId)).limit(1);
  return result[0] || null;
}
export async function getCreatorProfileBySlug(slug: string) {
  const db = await getDb(); if (!db) return null;
  const result = await db.select().from(creatorProfiles).where(eq(creatorProfiles.profileSlug, slug)).limit(1);
  return result[0] || null;
}
export async function upsertCreatorProfile(userId: number, data: Partial<InsertCreatorProfile>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const existing = await getCreatorProfileByUserId(userId);
  if (existing) {
    await db.update(creatorProfiles).set({ ...data, updatedAt: new Date() }).where(eq(creatorProfiles.userId, userId));
    return getCreatorProfileByUserId(userId);
  }
  await db.insert(creatorProfiles).values({ userId, ...data } as InsertCreatorProfile);
  return getCreatorProfileByUserId(userId);
}

// ─── Portfolio Items ─────────────────────────────────────────────
export async function getPortfolioItemsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(portfolioItems).where(eq(portfolioItems.userId, userId)).orderBy(desc(portfolioItems.createdAt));
}
export async function getPublicPortfolioItems(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(portfolioItems).where(eq(portfolioItems.userId, userId)).orderBy(desc(portfolioItems.createdAt));
}
export async function getPortfolioItemById(id: number) {
  const db = await getDb(); if (!db) return null;
  const result = await db.select().from(portfolioItems).where(eq(portfolioItems.id, id)).limit(1);
  return result[0] || null;
}
export async function createPortfolioItem(data: InsertPortfolioItem) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(portfolioItems).values(data);
  const id = Number(result[0].insertId);
  return await getPortfolioItemById(id);
}
export async function updatePortfolioItem(id: number, data: Partial<InsertPortfolioItem>) {
  const db = await getDb(); if (!db) return;
  await db.update(portfolioItems).set(data).where(eq(portfolioItems.id, id));
}
export async function deletePortfolioItem(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
}

// ─── Projects ───────────────────────────────────────────────────────
export async function createProject(data: { userId: number; name: string; description?: string; metadata?: unknown }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(projects2).values(data);
  return { id: Number(result[0].insertId), ...data };
}
export async function getProjectsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(projects2).where(eq(projects2.userId, userId)).orderBy(desc(projects2.updatedAt));
}
export async function getProjectById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(projects2).where(eq(projects2.id, id)).limit(1);
  return r[0];
}
export async function updateProject(id: number, data: Partial<{ name: string; description: string; status: "active" | "paused" | "completed" | "archived"; metadata: unknown }>) {
  const db = await getDb(); if (!db) return;
  await db.update(projects2).set(data).where(eq(projects2.id, id));
}
export async function deleteProject(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(projects2).where(eq(projects2.id, id));
}

// ─── Chat conversations ───────────────────────────────────────────
export async function createConversation(data: { userId: number; projectId?: number; title?: string; messages?: unknown; agentMode?: string }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(chatConversations).values(data);
  return { id: Number(result[0].insertId), ...data };
}
export async function getConversationsByUser(userId: number, projectId?: number) {
  const db = await getDb(); if (!db) return [];
  if (projectId) {
    return db.select().from(chatConversations).where(and(eq(chatConversations.userId, userId), eq(chatConversations.projectId, projectId))).orderBy(desc(chatConversations.updatedAt));
  }
  return db.select().from(chatConversations).where(eq(chatConversations.userId, userId)).orderBy(desc(chatConversations.updatedAt));
}
export async function getConversationById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(chatConversations).where(eq(chatConversations.id, id)).limit(1);
  return r[0];
}
export async function updateConversation(id: number, data: Partial<{ title: string; messages: unknown; projectId: number }>) {
  const db = await getDb(); if (!db) return;
  await db.update(chatConversations).set(data).where(eq(chatConversations.id, id));
}
export async function deleteConversation(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(chatConversations).where(eq(chatConversations.id, id));
}

// ─── Content templates ─────────────────────────────────────────────
export async function createTemplate(data: { userId: number; name: string; description?: string; category?: string; contentType?: string; platform?: string; body?: string; variables?: unknown; metadata?: unknown }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(contentTemplates).values(data);
  return { id: Number(result[0].insertId), ...data };
}
export async function getTemplatesByUser(userId: number, category?: string) {
  const db = await getDb(); if (!db) return [];
  if (category) {
    return db.select().from(contentTemplates).where(and(eq(contentTemplates.userId, userId), eq(contentTemplates.category, category))).orderBy(desc(contentTemplates.createdAt));
  }
  return db.select().from(contentTemplates).where(eq(contentTemplates.userId, userId)).orderBy(desc(contentTemplates.createdAt));
}
export async function getTemplateById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(contentTemplates).where(eq(contentTemplates.id, id)).limit(1);
  return r[0];
}
export async function updateTemplate(id: number, data: Partial<{ name: string; description: string; category: string; body: string; variables: unknown; metadata: unknown }>) {
  const db = await getDb(); if (!db) return;
  await db.update(contentTemplates).set(data).where(eq(contentTemplates.id, id));
}
export async function deleteTemplate(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(contentTemplates).where(eq(contentTemplates.id, id));
}
export async function incrementTemplateUsage(id: number) {
  const db = await getDb(); if (!db) return;
  const row = await db.select().from(contentTemplates).where(eq(contentTemplates.id, id)).limit(1);
  if (row[0]) {
    await db.update(contentTemplates).set({ usageCount: (row[0].usageCount ?? 0) + 1 }).where(eq(contentTemplates.id, id));
  }
}

// ─── Performance metrics ───────────────────────────────────────────
export async function createPerformanceMetric(data: { userId: number; contentId?: number; platform?: string; postUrl?: string; likes?: number; shares?: number; comments?: number; reach?: number; impressions?: number; clicks?: number; engagementRate?: string; metadata?: unknown }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(performanceMetrics).values(data);
  return { id: Number(result[0].insertId), ...data };
}
export async function getPerformanceByUser(userId: number, platform?: string) {
  const db = await getDb(); if (!db) return [];
  if (platform) {
    return db.select().from(performanceMetrics).where(and(eq(performanceMetrics.userId, userId), eq(performanceMetrics.platform, platform))).orderBy(desc(performanceMetrics.createdAt));
  }
  return db.select().from(performanceMetrics).where(eq(performanceMetrics.userId, userId)).orderBy(desc(performanceMetrics.createdAt));
}
export async function getPerformanceByContent(contentId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(performanceMetrics).where(eq(performanceMetrics.contentId, contentId)).orderBy(desc(performanceMetrics.createdAt));
}
export async function updatePerformanceMetric(id: number, data: Partial<{ likes: number; shares: number; comments: number; reach: number; impressions: number; clicks: number; engagementRate: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(performanceMetrics).set(data).where(eq(performanceMetrics.id, id));
}

// ─── Content Repurposing ─────────────────────────────────────────────
export async function createRepurposingProject(data: InsertRepurposingProject) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(repurposingProjects).values(data);
  return { id: result[0].insertId };
}
export async function getRepurposingProjectsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(repurposingProjects).where(eq(repurposingProjects.userId, userId)).orderBy(desc(repurposingProjects.createdAt));
}
export async function getRepurposingProjectById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(repurposingProjects).where(eq(repurposingProjects.id, id)).limit(1);
  return r[0];
}
export async function updateRepurposingProject(id: number, data: Partial<InsertRepurposingProject>) {
  const db = await getDb(); if (!db) return;
  await db.update(repurposingProjects).set(data).where(eq(repurposingProjects.id, id));
}
export async function createRepurposedContent(data: InsertRepurposedContent) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(repurposedContents).values(data);
  return { id: result[0].insertId };
}
export async function getRepurposedContentsByProject(projectId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(repurposedContents).where(eq(repurposedContents.projectId, projectId));
}
export async function getRepurposedContentById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(repurposedContents).where(eq(repurposedContents.id, id)).limit(1);
  return r[0];
}
export async function updateRepurposedContent(id: number, data: Partial<InsertRepurposedContent>) {
  const db = await getDb(); if (!db) return;
  await db.update(repurposedContents).set(data).where(eq(repurposedContents.id, id));
}

// ─── Publishing credentials (Medium, Substack, WordPress) ─────────────
export async function getPublishingCredentialsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(publishingCredentials).where(eq(publishingCredentials.userId, userId));
}
export async function getPublishingCredentialById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(publishingCredentials).where(eq(publishingCredentials.id, id)).limit(1);
  return r[0];
}
export async function createPublishingCredential(data: InsertPublishingCredential) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const result = await db.insert(publishingCredentials).values(data);
  return { id: result[0].insertId };
}
export async function updatePublishingCredential(id: number, data: Partial<InsertPublishingCredential>) {
  const db = await getDb(); if (!db) return;
  await db.update(publishingCredentials).set(data).where(eq(publishingCredentials.id, id));
}
export async function deletePublishingCredential(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(publishingCredentials).where(eq(publishingCredentials.id, id));
}
