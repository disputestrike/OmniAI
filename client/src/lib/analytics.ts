/**
 * Item 5 — GA4 analytics. Page view on route change; custom events via trackEvent.
 * Set VITE_GA4_MEASUREMENT_ID in env.
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const MEASUREMENT_ID = typeof import.meta !== "undefined" && import.meta.env?.VITE_GA4_MEASUREMENT_ID;

export function initGA4() {
  if (!MEASUREMENT_ID || typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };
  window.gtag("js", new Date());
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });
}

export function pageView(path: string, title?: string) {
  if (!MEASUREMENT_ID || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title || document.title,
  });
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  if (!MEASUREMENT_ID || !window.gtag) return;
  window.gtag("event", name, params);
}
