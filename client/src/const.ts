export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Login URL — Google OAuth. Redirects to /api/auth/google on current origin. */
export const getLoginUrl = () => {
  if (typeof window === "undefined") return "/api/auth/google";
  return `${window.location.origin}/api/auth/google`;
};
