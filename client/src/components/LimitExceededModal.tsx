/**
 * Global modal when user hits monthly limit or feature is locked.
 * When canTopup, shows credit packs and opens Stripe checkout on Buy.
 */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard, Loader2 } from "lucide-react";
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
    const onLimit = (e: CustomEvent<LimitPayload>) => {
      setPayload(e.detail ?? {});
      setMode("limit");
      setOpen(true);
    };
    const onFeature = (e: CustomEvent<FeatureLockPayload>) => {
      setPayload(e.detail ?? {});
      setMode("feature");
      setOpen(true);
    };
    window.addEventListener(EVENT_LIMIT, onLimit as EventListener);
    window.addEventListener(EVENT_FEATURE_LOCK, onFeature as EventListener);
    return () => {
      window.removeEventListener(EVENT_LIMIT, onLimit as EventListener);
      window.removeEventListener(EVENT_FEATURE_LOCK, onFeature as EventListener);
    };
  }, []);

  const handleBuyCredits = async (creditPackId: string) => {
    setPurchasePackId(creditPackId);
    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditPackId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setPurchasePackId(null);
    } catch {
      setPurchasePackId(null);
    }
  };

  const canTopup = mode === "limit" && (payload as LimitPayload).canTopup;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" />
            {mode === "limit" ? "Monthly limit reached" : "Upgrade to unlock"}
          </DialogTitle>
          <DialogDescription>
            {mode === "limit"
              ? "You've used all your monthly generations. Upgrade your plan for more, or add credits to your wallet."
              : `${payload.feature ? `${payload.feature} is` : "This feature is"} available on higher plans. Upgrade to get access.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Link href="/pricing">
            <Button className="w-full gap-2 min-h-[44px]">
              <CreditCard className="h-4 w-4" />
              View plans & upgrade
            </Button>
          </Link>
          {canTopup && packages && packages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Or buy credits</p>
              {packages.map((p) => (
                <Button
                  key={p.id}
                  variant="outline"
                  className="w-full justify-between min-h-[44px]"
                  disabled={!!purchasePackId}
                  onClick={() => handleBuyCredits(p.id)}
                >
                  <span>{p.name} — {p.credits} credits</span>
                  <span>
                    {p.discountPercent > 0 ? (
                      <>${(p.priceCentsAfterDiscount / 100).toFixed(2)} <span className="line-through text-muted-foreground">${(p.priceCents / 100).toFixed(2)}</span></>
                    ) : (
                      `$${(p.priceCents / 100).toFixed(2)}`
                    )}
                  </span>
                  {purchasePackId === p.id && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>
              ))}
            </div>
          )}
          {canTopup && (!packages || packages.length === 0) && (
            <Link href="/pricing#credits">
              <Button variant="outline" className="w-full min-h-[44px]">
                Buy credits
              </Button>
            </Link>
          )}
          <Button variant="ghost" className="w-full min-h-[44px]" onClick={() => setOpen(false)}>
            Close
          </Button>
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
