import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { X, CreditCard } from "lucide-react";

const KEY = "omni-trial-dismissed";

export function TrialCountdownBanner() {
  const { data: sub } = trpc.subscription.status.useQuery();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try { setDismissed(sessionStorage.getItem(KEY) === "1"); } catch { setDismissed(false); }
  }, []);

  const trialEndsAt = sub?.trialEndsAt ? new Date(sub.trialEndsAt) : null;
  const hasActiveTrial = trialEndsAt && trialEndsAt > new Date();
  if (!hasActiveTrial || dismissed) return null;

  const daysLeft = Math.ceil((trialEndsAt!.getTime() - Date.now()) / 86400000);
  const dateStr = trialEndsAt!.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleBilling = async () => {
    if (!sub?.stripeCustomerId) return;
    try {
      const res = await fetch("/api/stripe/create-portal", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId: sub.stripeCustomerId }) });
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank"); else window.location.href = "/pricing";
    } catch { window.location.href = "/pricing"; }
  };

  const dismiss = () => { try { sessionStorage.setItem(KEY, "1"); } catch {} setDismissed(true); };

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap py-2 px-4 text-xs font-medium"
      style={{ background: "rgba(245,158,11,0.08)", borderBottom: "1px solid rgba(245,158,11,0.2)", color: "#fbbf24" }}>
      <span>
        Free trial ends {dateStr} — {daysLeft} day{daysLeft !== 1 ? "s" : ""} left. No charge if you cancel before then.
      </span>
      <div className="flex items-center gap-2">
        <button onClick={handleBilling} className="flex items-center gap-1 hover:text-white transition-colors">
          <CreditCard className="h-3.5 w-3.5" /> Manage billing
        </button>
        <button onClick={dismiss} className="hover:text-white transition-colors p-1 rounded">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
