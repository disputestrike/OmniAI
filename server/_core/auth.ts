/**
 * OTOBI AI — Google-only authentication.
 * Session is JWT (signed with JWT_SECRET). No Manus or other OAuth providers.
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const APP_ID = "otobi-ai";

function getSecret(): Uint8Array {
  const secret = ENV.cookieSecret;
  if (!secret) throw new Error("JWT_SECRET is required for authentication");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  openId: string,
  options: { expiresInMs?: number; name?: string } = {}
): Promise<string> {
  const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
  const exp = Math.floor((Date.now() + expiresInMs) / 1000);
  return new SignJWT({
    openId,
    appId: APP_ID,
    name: options.name ?? "",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(exp)
    .sign(getSecret());
}

export async function verifySession(
  cookieValue: string | undefined | null
): Promise<{ openId: string; appId: string; name: string } | null> {
  if (!cookieValue) return null;
  try {
    const { payload } = await jwtVerify(cookieValue, getSecret(), { algorithms: ["HS256"] });
    const openId = payload.openId as string;
    const appId = payload.appId as string;
    const name = (payload.name as string) ?? "";
    if (typeof openId !== "string" || openId.length === 0) return null;
    return { openId, appId, name };
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  if (!cookieHeader) return new Map();
  const parsed = parseCookieHeader(cookieHeader);
  return new Map(Object.entries(parsed));
}

export async function authenticateRequest(req: Request): Promise<User | null> {
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies.get(COOKIE_NAME);
  const session = await verifySession(sessionCookie);
  if (!session) return null;

  const user = await db.getUserByOpenId(session.openId);
  if (!user) return null;

  await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
  return user;
}
