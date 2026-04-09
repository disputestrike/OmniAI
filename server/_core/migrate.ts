/**
 * Run database migrations at startup so tables exist without manual SQL.
 * Uses DATABASE_URL or MYSQL_URL (Railway injects MYSQL_* when MySQL is in the project).
 *
 * Strategy: split apply-all-migrations.sql on semicolons and run each statement
 * individually. Errors for "table/column already exists" are silently skipped —
 * all other errors are logged but do not abort the startup.
 */
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
}

/** MySQL error codes we treat as safe-to-ignore (idempotent re-runs). */
const IGNORABLE = new Set([
  1050, // ER_TABLE_EXISTS_ERROR — CREATE TABLE on existing table
  1060, // ER_DUP_FIELDNAME     — ALTER TABLE ADD COLUMN on existing column
  1061, // ER_DUP_KEY           — duplicate key name
  1091, // ER_CANT_DROP_FIELD_OR_KEY — DROP COLUMN/KEY on non-existent
]);

/** Split a SQL file into individual statements by semicolon, skipping blank/comment-only chunks. */
function splitStatements(sql: string): string[] {
  return sql
    .split(/;\s*\n/)
    .map((chunk) => {
      // Strip leading comment lines so the actual SQL statement remains
      const lines = chunk.split("\n").filter((l) => !l.trimStart().startsWith("--"));
      return lines.join("\n").trim();
    })
    .filter((s) => s.length > 0);
}

export async function runMigrations(): Promise<void> {
  const url = getDatabaseUrl();
  if (!url) {
    console.warn(
      "[migrate] No DATABASE_URL or MYSQL_URL set. Tables will not be created. " +
      "On Railway: add variable DATABASE_URL (or MYSQL_URL) on the OmniAI service and set it to your MySQL connection string (from the MySQL service Variables, e.g. MYSQL_PUBLIC_URL). Then redeploy."
    );
    return;
  }

  const sqlPath = path.join(process.cwd(), "drizzle", "apply-all-migrations.sql");
  if (!fs.existsSync(sqlPath)) {
    console.warn("[migrate] No apply-all-migrations.sql at", sqlPath, "; skipping. Ensure drizzle/ is copied in Docker.");
    return;
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  const statements = splitStatements(sql);

  if (statements.length === 0) {
    console.warn("[migrate] No statements found in SQL file.");
    return;
  }

  let connection: mysql.Connection | null = null;
  try {
    console.log(`[migrate] Connecting to database. Will run ${statements.length} statement(s)...`);
    connection = await mysql.createConnection({ uri: url, multipleStatements: false });

    let ok = 0, skipped = 0, failed = 0;
    for (const stmt of statements) {
      try {
        await connection.query(stmt);
        ok++;
      } catch (err: unknown) {
        const e = err as { errno?: number; message?: string };
        if (e.errno && IGNORABLE.has(e.errno)) {
          skipped++;
        } else {
          failed++;
          console.warn(`[migrate] Failed (${e.errno}): ${e.message?.split("\n")[0]} — SQL: ${stmt.substring(0, 80)}`);
        }
      }
    }
    console.log(`[migrate] Done. OK: ${ok} | Skipped (already exists): ${skipped} | Failed: ${failed}`);

  } catch (err: unknown) {
    console.error("[migrate] Connection or migration error:", (err as Error).message);
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
