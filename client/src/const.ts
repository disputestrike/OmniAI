export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Login URL — Google OAuth. Redirects to /api/auth/google on current origin. Preserves ?ref= for referral tracking. */
export const getLoginUrl = (ref?: string) => {
  if (typeof window === "undefined") return ref ? `/api/auth/google?ref=${encodeURIComponent(ref)}` : "/api/auth/google";
  const refFromUrl = ref ?? (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("ref") : null);
  const base = `${window.location.origin}/api/auth/google`;
  return refFromUrl ? `${base}?ref=${encodeURIComponent(refFromUrl)}` : base;
};
