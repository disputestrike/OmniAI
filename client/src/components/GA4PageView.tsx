import { useEffect } from "react";
import { useLocation } from "wouter";
import { pageView } from "@/lib/analytics";

/** Fires GA4 page_view on every route change. */
export function GA4PageView() {
  const [path] = useLocation();
  useEffect(() => {
    pageView(path || "/", document.title);
  }, [path]);
  return null;
}
