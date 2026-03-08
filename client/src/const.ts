export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Path to the login/sign-up choice page (Google or email). Use this for "Get started" and "Sign in" entry points. */
export const LOGIN_PAGE_PATH = "/login";

/** Full URL for the login page (choice between Google and email). */
export const getLoginPageUrl = () =>
  typeof window !== "undefined" ? `${window.location.origin}${LOGIN_PAGE_PATH}` : LOGIN_PAGE_PATH;

/** Google OAuth URL — use only from the Login page "Continue with Google" button. */
export const getLoginUrl = (ref?: string) => {
  if (typeof window === "undefined") return ref ? `/api/auth/google?ref=${encodeURIComponent(ref)}` : "/api/auth/google";
  const refFromUrl = ref ?? (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("ref") : null);
  const base = `${window.location.origin}/api/auth/google`;
  return refFromUrl ? `${base}?ref=${encodeURIComponent(refFromUrl)}` : base;
};
