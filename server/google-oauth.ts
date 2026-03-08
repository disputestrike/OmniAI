/**
 * Google OAuth — sole authentication for OTOBI AI.
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
 * Flow: /api/auth/google → Google consent → /api/auth/google/callback → session cookie → app.
 */

import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { createSessionToken } from "./_core/auth";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function getGoogleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  };
}

function isGoogleOAuthConfigured(): boolean {
  const config = getGoogleConfig();
  return !!(config.clientId && config.clientSecret);
}

export function registerGoogleOAuthRoutes(app: Express) {
  // Check if Google OAuth is configured
  app.get("/api/auth/google/status", (_req: Request, res: Response) => {
    res.json({ configured: isGoogleOAuthConfigured() });
  });

  // Build callback base URL for OAuth. Must be HTTPS in production; Railway often sends http internally.
  function getCallbackBaseUrl(req: Request): string {
    const envBase = (process.env.PUBLIC_URL || process.env.BASE_URL || "").replace(/\/$/, "");
    if (envBase) return envBase;
    const origin = req.headers.origin;
    if (origin && origin.startsWith("https://")) return origin;
    const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "";
    const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
    // Railway/public hosts: always use HTTPS for OAuth (Google requires it)
    const useHttps = proto === "https" || /\.railway\.app$|\.up\.railway\.app$/i.test(host);
    return `${useHttps ? "https" : proto}://${host}`;
  }

  // Initiate Google OAuth flow — no DB check here; if DB is missing we'll fail at callback when upserting user
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!isGoogleOAuthConfigured()) {
      res.status(503).json({ error: "Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Settings > Secrets." });
      return;
    }

    const config = getGoogleConfig();
    const base = getCallbackBaseUrl(req);
    const redirectUri = `${base.replace(/\/$/, "")}/api/auth/google/callback`;
    
    const ref = (req.query.ref as string) || "";
    const state = btoa(JSON.stringify({
      origin: req.headers.origin || req.protocol + "://" + req.get("host"),
      ref: ref || undefined,
    }));
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  });

  // Google OAuth callback — always redirect to /dashboard (never "/") so user never lands on landing page.
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const base = getCallbackBaseUrl(req).replace(/\/$/, "");
    const dashboardUrl = `${base}/dashboard`;

    const code = req.query.code as string;
    const stateParam = req.query.state as string;
    const error = req.query.error as string;

    if (error) {
      console.error("[Google OAuth] Error:", error);
      res.redirect(`${dashboardUrl}?error=google_auth_failed`);
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    let refCode: string | undefined;
    try {
      const stateData = JSON.parse(atob(stateParam || ""));
      refCode = stateData.ref;
    } catch {
      // state invalid; refCode stays undefined
    }

    // Must match EXACTLY the redirect_uri used when sending the user to Google (use same base as this request).
    const callbackRedirectUri = `${base}/api/auth/google/callback`;
    const config = getGoogleConfig();

    try {
      console.log("[Google OAuth] Exchanging code for tokens...");
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: callbackRedirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error("[Google OAuth] Token exchange failed:", errorData);
        res.redirect(`${dashboardUrl}?error=google_token_failed`);
        return;
      }

      const tokens = await tokenResponse.json() as { access_token: string; id_token?: string; refresh_token?: string };
      console.log("[Google OAuth] Tokens received, fetching user info...");

      const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoResponse.ok) {
        console.error("[Google OAuth] Failed to get user info");
        res.redirect(`${dashboardUrl}?error=google_userinfo_failed`);
        return;
      }

      const googleUser = await userInfoResponse.json() as {
        id: string;
        email: string;
        name: string;
        picture?: string;
        verified_email?: boolean;
      };

      if (!googleUser.id || !googleUser.email) {
        res.redirect(`${dashboardUrl}?error=google_missing_info`);
        return;
      }

      const googleOpenId = `google_${googleUser.id}`;

      // Optional: write user to DB now if available (same as Manus: DB optional at login, sync on first request)
      try {
        await db.upsertUser({
          openId: googleOpenId,
          name: googleUser.name || null,
          email: googleUser.email,
          loginMethod: "google",
          lastSignedIn: new Date(),
        });
        const referredUser = await db.getUserByOpenId(googleOpenId);
        if (refCode && referredUser) {
          const refRow = await db.getReferralCodeByCode(refCode);
          if (refRow && refRow.userId !== referredUser.id) {
            await db.recordReferralSignup(refRow.userId, referredUser.id);
          }
        }
      } catch (dbErr: unknown) {
        console.warn("[Google OAuth] DB upsert/referral skipped (will sync on first request):", dbErr instanceof Error ? dbErr.message : dbErr);
      }

      const sessionToken = await createSessionToken(googleOpenId, {
        name: googleUser.name || googleUser.email,
        email: googleUser.email,
        loginMethod: "google",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      console.log("[Google OAuth] Session set, redirecting to dashboard");
      res.redirect(302, dashboardUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      console.error("[Google OAuth] Callback error:", msg, stack ?? "");
      const hint = msg.includes("Database") || msg.includes("ECONNREFUSED") || msg.includes("connect") ? "&hint=database" : "";
      res.redirect(`${dashboardUrl}?error=google_auth_error${hint}`);
    }
  });
}
