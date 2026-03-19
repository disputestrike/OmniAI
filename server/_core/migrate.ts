/**
 * Run database migrations at startup so tables exist without manual SQL.
 * Uses DATABASE_URL or MYSQL_URL (Railway injects MYSQL_* when MySQL is in the project).
 */
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
}

/** MySQL error code for "table already exists" - we treat migration as idempotent. */
const ER_TABLE_EXISTS = 1050;

export async function runMigrations(): Promise<void> {
  const url = getDatabaseUrl();
  if (!url) {
    console.warn(
      "[migrate] No DATABASE_URL or MYSQL_URL set. Tables will not be created. " +
      "On Railway: add variable DATABASE_URL (or MYSQL_URL) on the OmniAI service and set it to your MySQL connection string (from the MySQL service Variables, e.g. MYSQL_PUBLIC_URL). Then redeploy."
    );
    return;
  }

  // SQL file lives in repo root drizzle/; at runtime cwd is /app in Docker
  const sqlPath = path.join(process.cwd(), "drizzle", "apply-all-migrations.sql");
  if (!fs.existsSync(sqlPath)) {
    console.warn("[migrate] No apply-all-migrations.sql at", sqlPath, "; skipping. Ensure drizzle/ is copied in Docker.");
    return;
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  let connection: mysql.Connection | null = null;

  // Split before each "CREATE TABLE" (after the first) so each part is one full CREATE TABLE ... ); statement.
  const parts = sql.split(/\s*;\s*\n\s*CREATE\s+TABLE\s+/i);
  const statements = parts
    .map((p, i) => {
      const t = p.trim();
      if (!t) return "";
      return i === 0 ? t : "CREATE TABLE " + t;
    })
    .filter((s) => s.length > 0);

  if (statements.length === 0) {
    console.warn("[migrate] No CREATE TABLE statements found in SQL file.");
    return;
  }

  try {
    console.log("[migrate] Connecting to database. Will run", statements.length, "CREATE TABLE statement(s)...");
    connection = await mysql.createConnection({
      uri: url,
      multipleStatements: false,
    });

    let ok = 0;
    let skipped = 0;
    let failed = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      const tableMatch = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`([^`]+)`/i);
      const tableName = tableMatch ? tableMatch[1] : `#${i + 1}`;
      try {
        await connection!.query(stmt);
        ok++;
        console.log("[migrate] Created table:", tableName);
      } catch (err: unknown) {
        const e = err as { errno?: number; code?: string; message?: string };
        if (e.errno === ER_TABLE_EXISTS || e.code === "ER_TABLE_EXISTS") {
          skipped++;
          // Table already exists — expected when re-running
        } else {
          failed++;
          console.error("[migrate] Failed table", tableName, ":", e.message || e);
        }
      }
    }
    console.log("[migrate] Done. Created:", ok, "| Already existed:", skipped, "| Failed:", failed);

    // Ensure users table has required columns (ALTERs may not have run if CREATE TABLE failed earlier)
    const ER_DUP_FIELD = 1060;
    const runAlter = async (sql: string, name: string) => {
      try {
        await connection!.query(sql);
        console.log("[migrate] Added users." + name);
      } catch (err: unknown) {
        const e = err as { errno?: number };
        if (e.errno !== ER_DUP_FIELD) console.warn("[migrate]", name, ":", (err as Error).message);
      }
    };
    await runAlter("ALTER TABLE `users` ADD COLUMN `passwordHash` varchar(255) NULL", "passwordHash");
    await runAlter("ALTER TABLE `users` ADD COLUMN `stripeCustomerId` varchar(128) NULL", "stripeCustomerId");
    await runAlter("ALTER TABLE `users` ADD COLUMN `stripeSubscriptionId` varchar(128) NULL", "stripeSubscriptionId");
    await runAlter(
      "ALTER TABLE `users` ADD COLUMN `subscriptionPlan` enum('free','starter','professional','business','enterprise') NOT NULL DEFAULT 'free'",
      "subscriptionPlan"
    );
    await runAlter("ALTER TABLE `users` ADD COLUMN `trialUsed` boolean DEFAULT false", "trialUsed");
    // Expand enum if column already existed with old values (free/pro/enterprise)
    try {
      await connection!.query(
        "ALTER TABLE `users` MODIFY COLUMN `subscriptionPlan` enum('free','starter','professional','business','enterprise') NOT NULL DEFAULT 'free'"
      );
      console.log("[migrate] Updated users.subscriptionPlan enum.");
    } catch {
      // Column may not exist or already correct
    }
    // Subscriptions: add period start and trial end for usage reset and trial banner
    try {
      await connection!.query("ALTER TABLE `subscriptions` ADD COLUMN `currentPeriodStart` timestamp NULL");
      console.log("[migrate] Added subscriptions.currentPeriodStart");
    } catch (e: unknown) {
      const err = e as { errno?: number };
      if (err.errno !== ER_DUP_FIELD) console.warn("[migrate] subscriptions.currentPeriodStart:", (e as Error).message);
    }
    try {
      await connection!.query("ALTER TABLE `subscriptions` ADD COLUMN `trialEndsAt` timestamp NULL");
      console.log("[migrate] Added subscriptions.trialEndsAt");
    } catch (e: unknown) {
      const err = e as { errno?: number };
      if (err.errno !== ER_DUP_FIELD) console.warn("[migrate] subscriptions.trialEndsAt:", (e as Error).message);
    }
    try {
      await connection!.query("ALTER TABLE `subscriptions` ADD COLUMN `pastDueAt` timestamp NULL");
      console.log("[migrate] Added subscriptions.pastDueAt");
    } catch (e: unknown) {
      const err = e as { errno?: number };
      if (err.errno !== ER_DUP_FIELD) console.warn("[migrate] subscriptions.pastDueAt:", (e as Error).message);
    }
    try {
      await connection!.query("ALTER TABLE `subscriptions` ADD COLUMN `canceledAt` timestamp NULL");
      console.log("[migrate] Added subscriptions.canceledAt");
    } catch (e: unknown) {
      const err = e as { errno?: number };
      if (err.errno !== ER_DUP_FIELD) console.warn("[migrate] subscriptions.canceledAt:", (e as Error).message);
    }
    try {
      await connection!.query("ALTER TABLE `user_monthly_usage` ADD COLUMN `usage80EmailSent` boolean DEFAULT false");
      console.log("[migrate] Added user_monthly_usage.usage80EmailSent");
    } catch (e: unknown) {
      const err = e as { errno?: number };
      if (err.errno !== ER_DUP_FIELD) console.warn("[migrate] user_monthly_usage.usage80EmailSent:", (e as Error).message);
    }

    // Campaigns: goal + totals (Phase 1)
    const campaignAlters = [
      "ALTER TABLE `campaigns` ADD COLUMN `goal` varchar(64) NULL",
      "ALTER TABLE `campaigns` ADD COLUMN `totalBudget` decimal(12,2) NULL",
      "ALTER TABLE `campaigns` ADD COLUMN `totalSpend` decimal(12,2) NULL",
      "ALTER TABLE `campaigns` ADD COLUMN `totalLeads` int DEFAULT 0",
      "ALTER TABLE `campaigns` ADD COLUMN `totalRevenue` decimal(12,2) NULL",
    ];
    for (const sql of campaignAlters) {
      try {
        await connection!.query(sql);
        console.log("[migrate] Campaign column added");
      } catch (e: unknown) {
        const err = e as { errno?: number };
        if (err.errno !== ER_DUP_FIELD) console.warn("[migrate] campaigns alter:", (e as Error).message);
      }
    }

    // campaign_assets table (Phase 1)
    try {
      await connection!.query(`
        CREATE TABLE IF NOT EXISTS \`campaign_assets\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`campaignId\` int NOT NULL,
          \`assetType\` varchar(32) NOT NULL,
          \`assetId\` int NOT NULL,
          \`status\` enum('draft','approved','live','paused','completed') NOT NULL DEFAULT 'draft',
          \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        )
      `);
      console.log("[migrate] campaign_assets table ready");
    } catch (e: unknown) {
      console.warn("[migrate] campaign_assets:", (e as Error).message);
    }

    // campaignId columns — added later, must ALTER TABLE on existing DBs
    const campaignIdAlters = [
      "ALTER TABLE `contents` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `creatives` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `video_ads` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `video_renders` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `scheduled_posts` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `leads` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `analytics_events` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `deals` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `email_campaigns` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `landing_pages` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `ab_tests` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `approval_workflows` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `ad_platform_campaigns` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `customer_interactions` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `social_publish_queue` ADD COLUMN `campaignId` int NULL",
      "ALTER TABLE `report_snapshots` ADD COLUMN `campaignId` int NULL",
    ];
    for (const sql of campaignIdAlters) {
      try {
        await connection!.query(sql);
        const col = sql.match(/ADD COLUMN `([^`]+)`/)?.[1] ?? "";
        const tbl = sql.match(/TABLE `([^`]+)`/)?.[1] ?? "";
        console.log(`[migrate] Added ${tbl}.${col}`);
      } catch (e: unknown) {
        const err = e as { errno?: number };
        if (err.errno !== ER_DUP_FIELD) console.warn("[migrate] campaignId alter:", (e as Error).message);
        // ER_DUP_FIELD (1060) = column already exists, safe to ignore
      }
    }

    // Seed tier_limits_config (Spec v4) — ON DUPLICATE KEY UPDATE so safe to re-run
    const seedTierLimits = `
INSERT INTO tier_limits_config (tier, displayName, priceMonthlyCents, priceAnnualCents, maxAiGenerations, maxAiImages, maxVideoScripts, maxVideoMinutes, maxScheduledPosts, maxAbTests, maxWebsiteAnalyses, maxProducts, maxCampaigns, maxLeads, maxTeamSeats, maxAdPlatformConnections, featureScheduling, featureAbTesting, featureVoiceInput, featureVideoGeneration, featureAvatars, featureCrm, featureCompetitorIntel, featurePredictiveAi, featureApiAccess, featureWhiteLabel, featureMusicStudio, featureDspAccess, dspMinAdSpendCents, dspMarkupRateBps, creditTopupDiscountBps, watermarkContent, aiChatModel)
VALUES
('free','Free',0,0,5,2,1,0,0,0,0,1,2,25,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,'forge'),
('starter','Starter',4900,49200,50,15,5,0,25,3,3,5,10,500,1,0,1,1,0,0,0,0,1,0,0,0,0,1,10000,4000,0,0,'forge'),
('professional','Professional',9700,97200,200,50,20,2,-1,-1,10,25,-1,-1,5,3,1,1,1,1,1,1,1,1,0,0,0,1,25000,3500,0,0,'claude_haiku'),
('business','Business',19700,195600,800,200,-1,8,-1,-1,-1,-1,-1,-1,15,-1,1,1,1,1,1,1,1,1,1,1,1,1,50000,3000,1000,0,'claude_haiku'),
('agency','Agency',49700,495600,3000,500,-1,30,-1,-1,-1,-1,-1,-1,-1,-1,1,1,1,1,1,1,1,1,1,1,1,1,100000,2500,1500,0,'claude_haiku')
ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP`;
    try {
      await connection!.query(seedTierLimits);
      console.log("[migrate] Seeded tier_limits_config");
    } catch (e: unknown) {
      console.warn("[migrate] tier_limits_config seed:", (e as Error).message);
    }
  } catch (err: unknown) {
    console.error("[migrate] Connection or migration error:", (err as Error).message);
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
