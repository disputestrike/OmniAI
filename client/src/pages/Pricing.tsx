import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, Zap, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSearch } from "wouter";
import { getLoginUrl } from "@/const";

const plans = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic marketing tools",
    features: [
      "5 AI content generations/month",
      "2 campaigns",
      "1 product analysis",
      "Basic analytics",
      "Export to CSV",
    ],
    icon: Zap,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
  {
    key: "pro",
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "Unlimited AI marketing power for growing businesses",
    features: [
      "Unlimited AI content generation",
      "Unlimited campaigns",
      "Unlimited product analysis",
      "AI Creative Engine (images)",
      "AI Video Ad Generator",
      "A/B Testing Suite",
      "Advanced analytics & AI insights",
      "Content remixing & repurposing",
      "Lead management (unlimited)",
      "Multi-platform scheduler",
      "Priority AI processing",
    ],
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/5",
    popular: true,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "$199",
    period: "/month",
    description: "Full marketing domination for teams and agencies",
    features: [
      "Everything in Pro",
      "Team collaboration (up to 25 members)",
      "White-label reports",
      "API access",
      "Custom AI training on your brand voice",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "Bulk operations",
      "Advanced security & compliance",
    ],
    icon: Crown,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
];

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, { enabled: isAuthenticated });
  const [loading, setLoading] = useState<string | null>(null);
  const search = useSearch();

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("success") === "true") {
      toast.success("Subscription activated! Welcome to the Pro plan.");
    }
    if (params.get("canceled") === "true") {
      toast.info("Checkout canceled. No charges were made.");
    }
  }, [search]);

  const handleCheckout = async (planKey: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    setLoading(planKey);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planKey,
          priceId: planKey === "pro" ? "price_pro_monthly" : "price_enterprise_monthly",
          userId: user?.id,
          userEmail: user?.email,
          userName: user?.name,
        }),
      });
      const data = await res.json();
      if (data.url) {
        toast.info("Redirecting to checkout...");
        window.open(data.url, "_blank");
      } else {
        toast.error(data.error || "Failed to create checkout session. Stripe may not be configured yet.");
      }
    } catch (err) {
      toast.error("Failed to initiate checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!subStatus?.stripeCustomerId) return;
    setLoading("manage");
    try {
      const res = await fetch("/api/stripe/create-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: subStatus.stripeCustomerId }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error("Failed to open subscription portal");
      }
    } catch {
      toast.error("Failed to open subscription portal");
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = subStatus?.plan || "free";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Unlock the full power of AI marketing. Upgrade anytime, cancel anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.key;
          return (
            <Card key={plan.key} className={`border-0 shadow-sm relative ${plan.popular ? "ring-2 ring-primary shadow-md" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-2 pt-6">
                <div className={`h-10 w-10 rounded-xl ${plan.bgColor} flex items-center justify-center mb-2`}>
                  <plan.icon className={`h-5 w-5 ${plan.color}`} />
                </div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <div className="space-y-2">
                    <Button className="w-full rounded-xl" variant="outline" disabled>
                      Current Plan
                    </Button>
                    {currentPlan !== "free" && (
                      <Button className="w-full rounded-xl" variant="ghost" size="sm"
                        onClick={handleManageSubscription} disabled={loading === "manage"}>
                        {loading === "manage" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Manage Subscription
                      </Button>
                    )}
                  </div>
                ) : plan.key === "free" ? (
                  <Button className="w-full rounded-xl" variant="outline" disabled>
                    {currentPlan !== "free" ? "Downgrade" : "Current Plan"}
                  </Button>
                ) : (
                  <Button className="w-full rounded-xl" onClick={() => handleCheckout(plan.key)}
                    disabled={loading === plan.key}>
                    {loading === plan.key ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {currentPlan === "free" ? "Upgrade" : "Switch"} to {plan.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day money-back guarantee. Test with card <code className="bg-muted px-1.5 py-0.5 rounded text-xs">4242 4242 4242 4242</code>.
            Payments are securely processed by Stripe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
