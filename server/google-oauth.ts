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

  // Initiate Google OAuth flow
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!isGoogleOAuthConfigured()) {
      res.status(503).json({ error: "Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Settings > Secrets." });
      return;
    }

    const config = getGoogleConfig();
    const redirectUri = `${req.headers.origin || `${req.protocol}://${req.get("host")}`}/api/auth/google/callback`;
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state: btoa(JSON.stringify({ origin: req.headers.origin || req.protocol + "://" + req.get("host") })),
    });

    res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  });

  // Google OAuth callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const stateParam = req.query.state as string;
    const error = req.query.error as string;

    if (error) {
      console.error("[Google OAuth] Error:", error);
      res.redirect("/?error=google_auth_failed");
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    let origin = "";
    try {
      const stateData = JSON.parse(atob(stateParam || ""));
      origin = stateData.origin || "";
    } catch {
      origin = `${req.protocol}://${req.get("host")}`;
    }

    const config = getGoogleConfig();
    const redirectUri = `${origin}/api/auth/google/callback`;

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error("[Google OAuth] Token exchange failed:", errorData);
        res.redirect("/?error=google_token_failed");
        return;
      }

      const tokens = await tokenResponse.json() as { access_token: string; id_token?: string; refresh_token?: string };

      // Get user info from Google
      const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoResponse.ok) {
        console.error("[Google OAuth] Failed to get user info");
        res.redirect("/?error=google_userinfo_failed");
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
        res.redirect("/?error=google_missing_info");
        return;
      }

      const googleOpenId = `google_${googleUser.id}`;

      await db.upsertUser({
        openId: googleOpenId,
        name: googleUser.name || null,
        email: googleUser.email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await createSessionToken(googleOpenId, {
        name: googleUser.name || googleUser.email,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (err) {
      console.error("[Google OAuth] Callback error:", err);
      res.redirect("/?error=google_auth_error");
    }
  });
}
