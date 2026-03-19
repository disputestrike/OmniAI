import { useAuth } from "@/_core/hooks/useAuth";
import { Lock, Crown, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, professional: 2, business: 3, enterprise: 4 };
const PLAN_LABELS: Record<string, string> = { starter: "Starter", professional: "Professional", business: "Business", enterprise: "Enterprise" };
const PLAN_COLORS: Record<string, string> = { starter: "#3b82f6", professional: "#7c3aed", business: "#f59e0b", enterprise: "#10b981" };

type Props = {
  requiredPlan?: "starter" | "professional" | "business" | "enterprise";
  featureName?: string;
  description?: string;
  fullPage?: boolean;
  children?: React.ReactNode;
};

export function UpgradePrompt({ requiredPlan = "starter", featureName = "this feature", description, fullPage = false, children }: Props) {
  const { user } = useAuth();
  const userPlan = user?.subscriptionPlan ?? "free";
  const hasAccess = PLAN_RANK[userPlan] >= PLAN_RANK[requiredPlan];
  if (hasAccess) return <>{children}</>;

  const color = PLAN_COLORS[requiredPlan] ?? "#7c3aed";

  const prompt = (
    <div className={`flex flex-col items-center justify-center text-center gap-5 ${fullPage ? "min-h-[60vh] p-8" : "py-12 px-6"}`}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${color}14`, border: `1px solid ${color}30` }}>
        <Lock className="h-8 w-8" style={{ color }} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-2">{featureName}</h3>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
          style={{ background: `${color}14`, border: `1px solid ${color}30`, color }}>
          <Crown className="h-3 w-3" /> {PLAN_LABELS[requiredPlan]}+
        </div>
        <p className="text-sm text-zinc-500 max-w-sm">
          {description || `Upgrade to ${PLAN_LABELS[requiredPlan]} or higher to unlock ${featureName} and all premium tools.`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/pricing">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: color }}>
            <Zap className="h-4 w-4" /> Upgrade to {PLAN_LABELS[requiredPlan]} <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
        <Link href="/pricing">
          <button className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            View plans
          </button>
        </Link>
      </div>
      <p className="text-xs text-zinc-700">
        Your current plan: <span className="text-zinc-500 font-semibold capitalize">{userPlan}</span>
      </p>
    </div>
  );

  if (fullPage) return prompt;
  return (
    <div className="rounded-2xl" style={{ border: "1px solid rgba(124,58,237,0.15)", background: "rgba(124,58,237,0.04)" }}>
      {prompt}
    </div>
  );
}

export function usePlanAccess(requiredPlan: "starter" | "professional" | "business" | "enterprise" = "starter") {
  const { user } = useAuth();
  const userPlan = user?.subscriptionPlan ?? "free";
  return { hasAccess: PLAN_RANK[userPlan] >= PLAN_RANK[requiredPlan], userPlan, requiredPlan };
}
