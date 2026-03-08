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

    // Optional: ensure users.passwordHash exists for email auth (ignore if already present)
    const ER_DUP_FIELD = 1060;
    try {
      await connection!.query("ALTER TABLE `users` ADD COLUMN `passwordHash` varchar(255) NULL");
      console.log("[migrate] Added users.passwordHash for email auth.");
    } catch (alterErr: unknown) {
      const e = alterErr as { errno?: number };
      if (e.errno === ER_DUP_FIELD) {
        // Column already exists
      } else {
        console.warn("[migrate] passwordHash column:", (alterErr as Error).message);
      }
    }
  } catch (err: unknown) {
    console.error("[migrate] Connection or migration error:", (err as Error).message);
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
