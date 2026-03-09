/**
 * Item 3 — Persistent trial countdown banner. Shows when user has active trial.
 * Dismissible (session only); "Manage billing" opens Stripe portal.
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { X, CreditCard } from "lucide-react";

const BANNER_DISMISS_KEY = "otobi-trial-banner-dismissed";

export function TrialCountdownBanner() {
  const { data: subStatus } = trpc.subscription.status.useQuery();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(BANNER_DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const trialEndsAt = subStatus?.trialEndsAt ? new Date(subStatus.trialEndsAt) : null;
  const hasActiveTrial = trialEndsAt && trialEndsAt > new Date();
  const show = hasActiveTrial && !dismissed;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(BANNER_DISMISS_KEY, "1");
      setDismissed(true);
    } catch {
      setDismissed(true);
    }
  };

  const handleManageBilling = async () => {
    if (!subStatus?.stripeCustomerId) return;
    try {
      const res = await fetch("/api/stripe/create-portal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: subStatus.stripeCustomerId }),
      });
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    } catch {
      window.location.href = "/pricing";
    }
  };

  if (!show) return null;

  const daysLeft = Math.ceil((trialEndsAt!.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  const amount = "$49";
  const dateStr = trialEndsAt!.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 text-sm flex items-center justify-center gap-4 py-2 px-4 flex-wrap min-h-[44px]">
      <span className="text-center">
        Your free trial ends on {dateStr} — your card will be charged {amount} on {dateStr}. Cancel anytime before then. ({daysLeft} day{daysLeft !== 1 ? "s" : ""} left)
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleManageBilling}
          className="inline-flex items-center gap-1 font-medium text-amber-800 dark:text-amber-200 hover:underline min-h-[44px] px-3"
        >
          <CreditCard className="h-4 w-4" />
          Manage billing
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-800/50 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
