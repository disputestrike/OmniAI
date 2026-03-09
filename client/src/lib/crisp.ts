/**
 * Item 6 — Crisp chat widget. Set VITE_CRISP_WEBSITE_ID.
 */
declare global {
  interface Window {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

const WEBSITE_ID = typeof import.meta !== "undefined" && (import.meta as unknown as { env?: { VITE_CRISP_WEBSITE_ID?: string } }).env?.VITE_CRISP_WEBSITE_ID;

export function initCrisp() {
  if (!WEBSITE_ID || typeof window === "undefined") return;
  window.$crisp = [];
  window.CRISP_WEBSITE_ID = WEBSITE_ID;
  const script = document.createElement("script");
  script.src = "https://client.crisp.chat/l.js";
  script.async = true;
  document.head.appendChild(script);
}

export function setCrispUser(data: { name?: string; email?: string; tier?: string }) {
  if (!window.$crisp) return;
  (window.$crisp as unknown[]).push(["set", "user:nickname", [data.name || ""]]);
  (window.$crisp as unknown[]).push(["set", "user:email", [data.email || ""]]);
  (window.$crisp as unknown[]).push(["set", "session:data", [[["tier", data.tier || "free"]]]]);
}
