/**
 * Email/password auth: register and login. Session is same JWT as Google (createSessionToken from auth).
 */
import crypto from "crypto";
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "./db";
import { createSessionToken } from "./_core/auth";
import { getSessionCookieOptions } from "./_core/cookies";

const SALT_LEN = 16;
const KEY_LEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LEN);
  const key = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_OPTS);
  return `${salt.toString("base64")}:${key.toString("base64")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [saltB64, keyB64] = stored.split(":");
  if (!saltB64 || !keyB64) return false;
  const salt = Buffer.from(saltB64, "base64");
  const key = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_OPTS);
  const storedKey = Buffer.from(keyB64, "base64");
  if (key.length !== storedKey.length) return false;
  return crypto.timingSafeEqual(key, storedKey);
}

function getRedirectBase(req: Request): string {
  const envBase = (process.env.PUBLIC_URL || process.env.BASE_URL || "").replace(/\/$/, "");
  if (envBase) return envBase;
  const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "";
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  const useHttps = proto === "https" || /\.railway\.app$|\.up\.railway\.app$/i.test(host);
  return `${useHttps ? "https" : proto}://${host}`;
}

export function registerEmailAuthRoutes(app: Express): void {
  app.post("/api/auth/email/register", async (req: Request, res: Response) => {
    const base = getRedirectBase(req);
    const dashboardUrl = `${base}/dashboard`;
    const loginUrl = `${base}/login`;

    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.redirect(`${loginUrl}?error=invalid_email&mode=register`);
      return;
    }
    if (!password || password.length < 8) {
      res.redirect(`${loginUrl}?error=password_too_short&mode=register`);
      return;
    }

    try {
      const passwordHash = hashPassword(password);
      await db.createEmailUser({ email, name: name || null, passwordHash });
      const openId = `email_${db.normalizeEmailForOpenId(email)}`;
      const user = await db.getUserByOpenId(openId);
      if (!user) {
        res.redirect(`${loginUrl}?error=register_failed&mode=register`);
        return;
      }
      const sessionToken = await createSessionToken(openId, {
        name: user.name || user.email || "",
        email: user.email ?? undefined,
        loginMethod: "email",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, dashboardUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "EMAIL_TAKEN") {
        res.redirect(`${loginUrl}?error=email_taken&mode=register`);
        return;
      }
      if (msg.includes("Database")) {
        res.redirect(`${loginUrl}?error=db&mode=register`);
        return;
      }
      console.error("[Email Auth] Register error:", err);
      res.redirect(`${loginUrl}?error=register_failed&mode=register`);
    }
  });

  app.post("/api/auth/email/login", async (req: Request, res: Response) => {
    const base = getRedirectBase(req);
    const dashboardUrl = `${base}/dashboard`;
    const loginUrl = `${base}/login`;

    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      res.redirect(`${loginUrl}?error=missing_credentials&mode=login`);
      return;
    }

    try {
      const openId = `email_${db.normalizeEmailForOpenId(email)}`;
      const user = await db.getUserByOpenId(openId);
      if (!user || !user.passwordHash) {
        res.redirect(`${loginUrl}?error=invalid_credentials&mode=login`);
        return;
      }
      if (!verifyPassword(password, user.passwordHash)) {
        res.redirect(`${loginUrl}?error=invalid_credentials&mode=login`);
        return;
      }
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      const sessionToken = await createSessionToken(openId, {
        name: user.name || user.email || "",
        email: user.email ?? undefined,
        loginMethod: "email",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, dashboardUrl);
    } catch (err: unknown) {
      console.error("[Email Auth] Login error:", err);
      res.redirect(`${loginUrl}?error=login_failed&mode=login`);
    }
  });
}
