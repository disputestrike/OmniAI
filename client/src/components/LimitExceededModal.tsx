import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lock, CreditCard, Loader2, Zap } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const EVENT_LIMIT = "otobi-limit-exceeded";
const EVENT_FEATURE_LOCK = "otobi-feature-lock";

type LimitPayload = { upgradeTo?: string; canTopup?: boolean; creditsNeeded?: number };
type FeatureLockPayload = { upgradeTo?: string; feature?: string };

export function LimitExceededModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"limit" | "feature">("limit");
  const [payload, setPayload] = useState<LimitPayload & FeatureLockPayload>({});
  const [purchasePackId, setPurchasePackId] = useState<string | null>(null);
  const { data: packages } = trpc.credits.packages.useQuery(undefined, { enabled: open && mode === "limit" });

  useEffect(() => {
    const onLimit = (e: CustomEvent<LimitPayload>) => { setPayload(e.detail ?? {}); setMode("limit"); setOpen(true); };
    const onFeature = (e: CustomEvent<FeatureLockPayload>) => { setPayload(e.detail ?? {}); setMode("feature"); setOpen(true); };
    window.addEventListener(EVENT_LIMIT, onLimit as EventListener);
    window.addEventListener(EVENT_FEATURE_LOCK, onFeature as EventListener);
    return () => { window.removeEventListener(EVENT_LIMIT, onLimit as EventListener); window.removeEventListener(EVENT_FEATURE_LOCK, onFeature as EventListener); };
  }, []);

  const handleBuyCredits = async (creditPackId: string) => {
    setPurchasePackId(creditPackId);
    try {
      const res = await fetch("/api/credits/purchase", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ creditPackId }) });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
    } finally { setPurchasePackId(null); }
  };

  const canTopup = mode === "limit" && (payload as LimitPayload).canTopup;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white text-sm">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)" }}>
              <Lock className="h-4 w-4 text-amber-400" />
            </div>
            {mode === "limit" ? "Monthly limit reached" : "Upgrade to unlock"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-500 mt-1">
          {mode === "limit"
            ? "You've used all your monthly generations. Upgrade your plan for more, or add credits."
            : `${payload.feature ? `${payload.feature} is` : "This feature is"} available on higher plans.`}
        </p>
        <div className="flex flex-col gap-2.5 mt-3">
          <Link href="/pricing">
            <button className="w-full h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: "rgba(124,58,237,0.8)" }}>
              <Zap className="h-4 w-4" /> View plans & upgrade
            </button>
          </Link>
          {canTopup && packages && packages.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Or buy credits</p>
              {packages.map(p => (
                <button key={p.id} onClick={() => handleBuyCredits(p.id)} disabled={!!purchasePackId}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm text-zinc-300 hover:text-white transition-all disabled:opacity-50"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="font-medium">{p.name} — {p.credits} credits</span>
                  <span className="font-bold text-violet-400">
                    ${(p.priceCentsAfterDiscount / 100).toFixed(0)}
                    {p.discountPercent > 0 && <span className="text-zinc-600 line-through ml-1 font-normal">${(p.priceCents / 100).toFixed(0)}</span>}
                  </span>
                  {purchasePackId === p.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setOpen(false)}
            className="w-full py-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function dispatchLimitExceeded(payload?: LimitPayload) {
  window.dispatchEvent(new CustomEvent(EVENT_LIMIT, { detail: payload ?? {} }));
}

export function dispatchFeatureLock(payload?: FeatureLockPayload) {
  window.dispatchEvent(new CustomEvent(EVENT_FEATURE_LOCK, { detail: payload ?? {} }));
}
