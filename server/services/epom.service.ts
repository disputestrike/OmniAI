/**
 * Epom DSP service (Spec v4).
 * Programmatic ad buying: create account, fund wallet, create campaign, stats, status.
 */
import { ENV } from "../_core/env";

const BASE = ENV.epomBaseUrl || "https://api.epom.com/v1";
const KEY = ENV.epomApiKey;

async function epom<T = unknown>(
  path: string,
  method: "GET" | "POST" | "PATCH" = "GET",
  body?: unknown
): Promise<T> {
  if (!KEY) throw new Error("EPOM_API_KEY is not configured");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Epom ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export function createEpomAccount(userId: string, email: string) {
  return epom<{ id?: string; accountId?: string }>("/accounts", "POST", {
    email,
    reference: userId,
  });
}

export function fundEpomWallet(epomAccountId: string, netCents: number) {
  return epom(`/accounts/${epomAccountId}/fund`, "POST", {
    amount_cents: netCents,
  });
}

export function createEpomCampaign(
  epomAccountId: string,
  params: Record<string, unknown>
) {
  return epom<{ id?: string; campaignId?: string }>(
    `/accounts/${epomAccountId}/campaigns`,
    "POST",
    params
  );
}

export function getEpomStats(
  epomAccountId: string,
  campaignId: string,
  from: string,
  to: string
) {
  return epom<{ impressions?: number; clicks?: number; spend?: number }>(
    `/accounts/${epomAccountId}/campaigns/${campaignId}/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
}

export function setEpomStatus(
  epomAccountId: string,
  campaignId: string,
  status: "active" | "paused"
) {
  return epom(
    `/accounts/${epomAccountId}/campaigns/${campaignId}/status`,
    "PATCH",
    { status }
  );
}

export function isEpomConfigured(): boolean {
  return !!KEY && !!ENV.epomAccountId && ENV.dspEnabled;
}
