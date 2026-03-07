import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const PLAN_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  business: 3,
  enterprise: 4,
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  business: "Business",
  enterprise: "Enterprise",
};

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-blue-100 text-blue-700",
  professional: "bg-purple-100 text-purple-700",
  business: "bg-amber-100 text-amber-700",
  enterprise: "bg-emerald-100 text-emerald-700",
};

type Props = {
  requiredPlan?: "starter" | "professional" | "business" | "enterprise";
  featureName?: string;
  description?: string;
  fullPage?: boolean;
  children?: React.ReactNode;
};

export function UpgradePrompt({
  requiredPlan = "starter",
  featureName = "this feature",
  description,
  fullPage = false,
  children,
}: Props) {
  const { user } = useAuth();
  const userPlan = user?.subscriptionPlan ?? "free";
  const hasAccess = PLAN_RANK[userPlan] >= PLAN_RANK[requiredPlan];

  if (hasAccess) return <>{children}</>;

  const prompt = (
    <div className={`flex flex-col items-center justify-center text-center gap-4 ${fullPage ? "min-h-[60vh] p-8" : "py-12 px-6"}`}>
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Lock className="h-8 w-8 text-primary" />
      </div>
      <div>
        <div className="flex flex-col items-center justify-center gap-2 mb-2">
          <h3 className="text-xl font-bold">{featureName}</h3>
          <Badge className={`${PLAN_COLORS[requiredPlan]} text-xs`}>
            <Crown className="h-3 w-3 mr-1" />
            {PLAN_LABELS[requiredPlan]}+
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm max-w-sm">
          {description || `Upgrade to ${PLAN_LABELS[requiredPlan]} or higher to unlock ${featureName} and all premium tools.`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/pricing">
          <Button className="gap-2">
            <Zap className="h-4 w-4" /> Upgrade to {PLAN_LABELS[requiredPlan]}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/pricing">
          <Button variant="outline">View All Plans</Button>
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">
        Your current plan: <Badge variant="outline" className="text-xs capitalize ml-1">{userPlan}</Badge>
      </p>
    </div>
  );

  if (fullPage) return prompt;

  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5">
      {prompt}
    </div>
  );
}

export function usePlanAccess(requiredPlan: "starter" | "professional" | "business" | "enterprise" = "starter") {
  const { user } = useAuth();
  const userPlan = user?.subscriptionPlan ?? "free";
  return {
    hasAccess: PLAN_RANK[userPlan] >= PLAN_RANK[requiredPlan],
    userPlan,
    requiredPlan,
  };
}
