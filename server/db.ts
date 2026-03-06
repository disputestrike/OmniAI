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
