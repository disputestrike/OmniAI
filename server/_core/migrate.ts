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
    console.log("[migrate] No DATABASE_URL or MYSQL_URL; skipping migrations.");
    return;
  }

  // SQL file lives in repo root drizzle/; at runtime cwd is /app in Docker
  const sqlPath = path.join(process.cwd(), "drizzle", "apply-all-migrations.sql");
  if (!fs.existsSync(sqlPath)) {
    console.log("[migrate] No apply-all-migrations.sql at", sqlPath, "; skipping.");
    return;
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  let connection: mysql.Connection | null = null;

  try {
    connection = await mysql.createConnection({
      uri: url,
      multipleStatements: true,
    });
    await connection.query(sql);
    console.log("[migrate] Applied migrations successfully.");
  } catch (err: unknown) {
    const e = err as { errno?: number; code?: string };
    if (e.errno === ER_TABLE_EXISTS || e.code === "ER_TABLE_EXISTS") {
      console.log("[migrate] Tables already exist; no changes needed.");
      return;
    }
    console.warn("[migrate] Migration failed (non-fatal):", e);
    // Do not throw: app can still start and work if some tables already exist
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
