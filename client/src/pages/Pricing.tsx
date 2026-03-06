import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, Zap, Loader2, Building2, Rocket, Users, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSearch } from "wouter";
import { getLoginUrl } from "@/const";

const plans = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    period: "forever",
    tagline: "Perfect for exploring what AI marketing can do",
    features: [
      "5 AI content generations/month",
      "2 AI image creations/month",
      "1 video script/month",
      "1 product analysis",
      "2 campaigns",
      "25 leads",
      "Basic analytics",
      "CSV export",
    ],
    limitations: [
      "No team seats",
      "No voice input",
      "No A/B testing",
      "No ad platform connections",
    ],
    icon: Zap,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    seats: "1 user",
  },
  {
    key: "starter",
    name: "Starter",
    monthlyPrice: 29,
    annualPrice: 24,
    period: "/month",
    tagline: "For solopreneurs getting started",
    features: [
      "50 AI content generations/month",
      "15 AI image creations/month",
      "5 video scripts/month",
      "5 products",
      "10 campaigns",
      "500 leads",
      "Platform intelligence (all 14 platforms)",
      "Scheduler (25 posts/month)",
      "3 A/B tests",
      "3 website analyses",
      "AI marketing agent",
      "CSV + JSON export",
    ],
    limitations: [
      "No team seats",
      "No voice input",
    ],
    icon: Rocket,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    seats: "1 user",
  },
  {
    key: "professional",
    name: "Professional",
    monthlyPrice: 79,
    annualPrice: 66,
    period: "/month",
    tagline: "For growing businesses and marketing teams",
    features: [
      "200 AI content generations/month",
      "50 AI image creations/month",
      "20 video scripts/month",
      "25 products",
      "Unlimited campaigns",
      "Unlimited leads",
      "5 team seats included",
      "+$15/extra seat/month",
      "Full platform intelligence",
      "Campaign momentum analysis",
      "Unlimited scheduling",
      "Unlimited A/B testing",
      "10 website analyses",
      "Voice input for AI chat",
      "CRM deals pipeline",
      "3 ad platform connections",
      "Predictive AI scoring",
      "Priority support",
    ],
    limitations: [],
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/5",
    popular: true,
    seats: "5 seats included",
  },
  {
    key: "business",
    name: "Business",
    monthlyPrice: 199,
    annualPrice: 166,
    period: "/month",
    tagline: "For agencies and marketing departments",
    features: [
      "Unlimited AI content generation",
      "200 AI images/month",
      "Unlimited video scripts",
      "Unlimited everything",
      "15 team seats included",
      "+$12/extra seat/month",
      "White-label reports",
      "API access (REST + webhooks)",
      "Custom brand voice training",
      "All ad platform connections",
      "Unlimited website intelligence",
      "Voice + text-to-speech",
      "Approval workflows",
      "SEO audit suite",
      "Dedicated account manager",
      "99.9% SLA guarantee",
    ],
    limitations: [],
    icon: Crown,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    seats: "15 seats included",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: 499,
    annualPrice: 416,
    period: "/month",
    tagline: "Custom solutions for large organizations",
    features: [
      "Everything in Business",
      "Unlimited everything (no caps)",
      "Unlimited team seats",
      "Custom AI model fine-tuning",
      "Dedicated infrastructure",
      "Custom SSO/SAML",
      "Advanced security & compliance",
      "Custom SLA (up to 99.99%)",
      "On-boarding & training",
      "Quarterly business reviews",
      "Custom feature development",
      "Multi-brand management",
    ],
    limitations: [],
    icon: Building2,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    seats: "Unlimited seats",
  },
];

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, { enabled: isAuthenticated });
  const [loading, setLoading] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(true);
  const search = useSearch();

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("success") === "true") {
      toast.success("Subscription activated! Welcome aboard.");
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
          billing: isAnnual ? "annual" : "monthly",
          userId: user?.id,
          userEmail: user?.email,
          userName: user?.name,
        }),
      });
      const data = await res.json();
      if (data.url) {
        toast.info("Redirecting to secure checkout...");
        window.open(data.url, "_blank");
      } else {
        toast.error(data.error || "Failed to create checkout session.");
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          One platform that replaces Jasper + AdCreative.ai + Omneky + HubSpot CRM + SimilarWeb.
          Save thousands per month.
        </p>

        {/* Annual/Monthly Toggle */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isAnnual ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${isAnnual ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            Annual <Badge variant="secondary" className="ml-1 text-xs">Save 17%</Badge>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.key;
          const displayPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;

          return (
            <Card key={plan.key} className={`border-0 shadow-sm relative flex flex-col ${plan.popular ? "ring-2 ring-primary shadow-lg" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground px-3 shadow-sm">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-2 pt-6 space-y-2">
                <div className={`h-10 w-10 rounded-xl ${plan.bgColor} flex items-center justify-center`}>
                  <plan.icon className={`h-5 w-5 ${plan.color}`} />
                </div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${displayPrice}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                {isAnnual && plan.monthlyPrice > 0 && (
                  <p className="text-xs text-muted-foreground line-through">${plan.monthlyPrice}/month</p>
                )}
                <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                <div className="flex items-center gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{plan.seats}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <ul className="space-y-1.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.limitations.length > 0 && (
                    <ul className="space-y-1">
                      {plan.limitations.map((lim, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <X className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
                          <span>{lim}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
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
                      {currentPlan !== "free" ? "Included" : "Current Plan"}
                    </Button>
                  ) : plan.key === "enterprise" ? (
                    <Button className="w-full rounded-xl" variant="outline"
                      onClick={() => toast.info("Contact us at sales@omnimarket.ai for enterprise pricing.")}>
                      Contact Sales
                    </Button>
                  ) : (
                    <Button className={`w-full rounded-xl ${plan.popular ? "" : ""}`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleCheckout(plan.key)}
                      disabled={loading === plan.key}>
                      {loading === plan.key ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {currentPlan === "free" ? "Start Free Trial" : "Switch"} to {plan.name}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison with competitors */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-center mb-4">Why OmniMarket AI is the Best Value</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Capability</th>
                  <th className="text-center py-2 px-3 font-medium text-primary">OmniMarket AI<br/><span className="text-xs font-normal">from $29/mo</span></th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Jasper<br/><span className="text-xs font-normal">$49-69/seat</span></th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">AdCreative<br/><span className="text-xs font-normal">$25-359/mo</span></th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Omneky<br/><span className="text-xs font-normal">$99/mo</span></th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Arcads<br/><span className="text-xs font-normal">$110/mo</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { cap: "AI Content (22 types)", us: true, j: true, a: false, o: false, ar: false },
                  { cap: "AI Image Generation", us: true, j: false, a: true, o: true, ar: false },
                  { cap: "AI Video Scripts", us: true, j: false, a: false, o: false, ar: true },
                  { cap: "14+ Platform Intelligence", us: true, j: false, a: false, o: false, ar: false },
                  { cap: "Campaign Management", us: true, j: false, a: false, o: true, ar: false },
                  { cap: "A/B Testing Suite", us: true, j: false, a: true, o: true, ar: false },
                  { cap: "CRM & Lead Management", us: true, j: false, a: false, o: false, ar: false },
                  { cap: "Website Intelligence", us: true, j: false, a: false, o: false, ar: false },
                  { cap: "Content Scheduler", us: true, j: false, a: false, o: false, ar: false },
                  { cap: "Voice AI Chat", us: true, j: false, a: false, o: false, ar: false },
                  { cap: "Team Collaboration", us: true, j: true, a: true, o: true, ar: false },
                  { cap: "Ad Platform Connections", us: true, j: false, a: true, o: true, ar: false },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 text-xs">{row.cap}</td>
                    <td className="text-center py-2 px-3">{row.us ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}</td>
                    <td className="text-center py-2 px-3">{row.j ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}</td>
                    <td className="text-center py-2 px-3">{row.a ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}</td>
                    <td className="text-center py-2 px-3">{row.o ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}</td>
                    <td className="text-center py-2 px-3">{row.ar ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}</td>
                  </tr>
                ))}
                <tr className="border-t-2 font-medium">
                  <td className="py-2 px-3 text-xs">Total cost for all features</td>
                  <td className="text-center py-2 px-3 text-primary text-xs font-bold">$29-199/mo</td>
                  <td className="text-center py-2 px-3 text-muted-foreground text-xs">$49-69/seat</td>
                  <td className="text-center py-2 px-3 text-muted-foreground text-xs">$25-359/mo</td>
                  <td className="text-center py-2 px-3 text-muted-foreground text-xs">$99/mo</td>
                  <td className="text-center py-2 px-3 text-muted-foreground text-xs">$110/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ / Trust */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h4 className="font-semibold text-sm mb-1">14-Day Free Trial</h4>
            <p className="text-xs text-muted-foreground">Try any paid plan free for 14 days. No credit card required for the Free plan. Cancel anytime.</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h4 className="font-semibold text-sm mb-1">Team Seat Pricing</h4>
            <p className="text-xs text-muted-foreground">Professional includes 5 seats (+$15/extra). Business includes 15 seats (+$12/extra). Enterprise: unlimited.</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h4 className="font-semibold text-sm mb-1">Secure Payments</h4>
            <p className="text-xs text-muted-foreground">
              Powered by Stripe. Test with <code className="bg-muted px-1 py-0.5 rounded text-[10px]">4242 4242 4242 4242</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
