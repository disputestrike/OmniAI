import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, Zap, Loader2, Building2, Rocket, Users, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSearch } from "wouter";
import { getLoginPageUrl } from "@/const";

const TIER_ICONS: Record<string, { icon: typeof Zap; color: string; bgColor: string; seats: string }> = {
  free: { icon: Zap, color: "text-gray-600", bgColor: "bg-gray-50", seats: "1 user" },
  starter: { icon: Rocket, color: "text-blue-600", bgColor: "bg-blue-50", seats: "1 user" },
  professional: { icon: Sparkles, color: "text-primary", bgColor: "bg-primary/5", seats: "5 seats included" },
  business: { icon: Crown, color: "text-amber-600", bgColor: "bg-amber-50", seats: "15 seats included" },
  agency: { icon: Building2, color: "text-purple-600", bgColor: "bg-purple-50", seats: "Unlimited seats" },
};

const TIER_FEATURES: Record<string, { features: string[]; limitations: string[] }> = {
  free: {
    features: ["5 AI content generations/month", "2 AI image creations/month", "1 video script", "1 product analysis", "2 campaigns", "25 leads", "Basic analytics", "CSV export"],
    limitations: ["No scheduling", "No A/B testing", "No voice input", "No ad platform connections"],
  },
  starter: {
    features: ["50 AI content generations/month", "15 AI image creations/month", "5 video scripts", "5 products", "10 campaigns", "500 leads", "25 scheduled posts", "3 A/B tests", "3 website analyses", "AI marketing agent", "CSV + JSON export"],
    limitations: ["No team seats", "No voice input"],
  },
  professional: {
    features: ["200 AI content generations/month", "50 AI image creations/month", "20 video scripts", "AI video generation (2 min/mo)", "Unlimited campaigns & leads", "5 team seats (+$15/extra)", "Unlimited scheduling & A/B tests", "10 website analyses", "Voice input", "CRM deals pipeline", "3 ad platform connections", "Predictive AI scoring", "Priority support"],
    limitations: [],
  },
  business: {
    features: ["800 AI generations/month", "200 AI images/month", "Unlimited video scripts", "AI video 8 min/mo", "15 team seats (+$12/extra)", "White-label reports", "API access", "Custom brand voice", "All ad platform connections", "SEO audit suite", "Dedicated account manager", "99.9% SLA"],
    limitations: [],
  },
  agency: {
    features: ["3,000 AI generations/month", "500 AI images/month", "AI video 30 min/mo", "Unlimited seats", "Full white-label", "Client management portal", "Custom SSO/SAML", "Custom SLA up to 99.99%", "Quarterly business reviews", "15% off credit packs"],
    limitations: [],
  },
};

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const { data: tiers } = trpc.pricing.list.useQuery();
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, { enabled: isAuthenticated });
  const { data: creditPackages } = trpc.credits.packages.useQuery(undefined, { enabled: isAuthenticated });
  const [loading, setLoading] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(true);
  const search = useSearch();

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("success") === "true") {
      toast.success("Subscription activated! Welcome aboard.");
    }
    if (params.get("credits") === "added") {
      toast.success("Credits added to your wallet! You can use them right now.");
    }
    if (params.get("canceled") === "true") {
      toast.info("Checkout canceled. No charges were made.");
    }
  }, [search]);

  const handleCheckout = async (planKey: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginPageUrl();
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
  const plans = tiers ?? [];

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
            Annual <Badge variant="secondary" className="ml-1 text-xs">Save $ when billed yearly</Badge>
          </span>
        </div>
      </div>

      {/* Pricing Cards — data from API (pricing.list) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {plans.map((tier: { key: string; name: string; monthlyPrice: number; annualPrice: number; annualTotal?: number; tagline: string; cta: string; popular: boolean; contactSales: boolean }) => {
          const isCurrentPlan = currentPlan === tier.key;
          const displayPrice = isAnnual ? tier.annualPrice : tier.monthlyPrice;
          const meta = TIER_ICONS[tier.key] ?? TIER_ICONS.free;
          const feat = TIER_FEATURES[tier.key] ?? { features: [], limitations: [] };
          const Icon = meta.icon;
          const annualSavings = tier.annualTotal != null && tier.monthlyPrice > 0 ? tier.monthlyPrice * 12 - tier.annualTotal : 0;

          return (
            <Card
              key={tier.key}
              className={`border-0 shadow-sm relative flex flex-col ${
                tier.popular ? "ring-2 ring-amber-400 shadow-lg bg-amber-50/30" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-amber-500 text-white px-3 shadow-sm">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-2 pt-6 space-y-2">
                <div className={`h-10 w-10 rounded-xl ${meta.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                </div>
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${displayPrice}</span>
                  <span className="text-sm text-muted-foreground">{tier.monthlyPrice === 0 ? "forever" : "/month"}</span>
                </div>
                {isAnnual && tier.monthlyPrice > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground line-through">${tier.monthlyPrice}/month</p>
                    {annualSavings > 0 && (
                      <p className="text-xs text-emerald-600 font-medium">Save ${annualSavings}/year</p>
                    )}
                  </>
                )}
                <p className="text-xs text-muted-foreground">{tier.tagline}</p>
                <div className="flex items-center gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{meta.seats}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <ul className="space-y-1.5">
                    {feat.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {feat.limitations.length > 0 && (
                    <ul className="space-y-1">
                      {feat.limitations.map((lim, i) => (
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
                  ) : tier.key === "free" ? (
                    <Button className="w-full rounded-xl" variant="outline" disabled>
                      {currentPlan !== "free" ? "Included" : "Current Plan"}
                    </Button>
                  ) : tier.contactSales ? (
                    <Button className="w-full rounded-xl" variant="outline"
                      onClick={() => toast.info("Contact us at sales@otobiai.com for agency pricing.")}>
                      Contact Sales
                    </Button>
                  ) : (
                    <Button
                      className={`w-full rounded-xl ${tier.popular ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                      variant={tier.popular ? "default" : "outline"}
                      onClick={() => handleCheckout(tier.key)}
                      disabled={loading === tier.key}
                    >
                      {loading === tier.key ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {tier.cta}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Credit packs — Need more? Top up from $9 */}
      {creditPackages && creditPackages.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-center mb-2">Need more? Top up with credit packs from $9</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">One-time purchase. Credits never expire.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {creditPackages.map((p: { id: string; name: string; credits: number; priceCentsAfterDiscount: number; priceCents: number; discountPercent: number }) => (
                <div key={p.id} className="rounded-xl border bg-card px-4 py-3 text-center min-w-[120px]">
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-lg font-bold text-primary">${(p.priceCentsAfterDiscount / 100).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">{p.credits} credits</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full rounded-lg"
                    onClick={async () => {
                      if (!isAuthenticated || !user?.id) {
                        window.location.href = getLoginPageUrl();
                        return;
                      }
                      setLoading(`credits-${p.id}`);
                      try {
                        const res = await fetch("/api/stripe/create-credit-checkout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: user.id, creditPackId: p.id }),
                        });
                        const data = await res.json();
                        if (data.url) window.open(data.url, "_blank");
                        else toast.error(data.error || "Failed to start checkout.");
                      } finally {
                        setLoading(null);
                      }
                    }}
                    disabled={loading === `credits-${p.id}`}
                  >
                    {loading === `credits-${p.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get credits"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Replace bar */}
      <Card className="border-0 shadow-sm bg-primary/5">
        <CardContent className="p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            OTOBI replaces: Jasper ($69) + HeyGen ($89) + Arcads ($250) + Hootsuite ($199) + AdCreative ($119) + HubSpot CRM ($200) + SimilarWeb ($167) = <span className="line-through font-semibold">$1,093/month</span>.
          </p>
          <p className="text-lg font-bold text-primary mt-2">OTOBI Professional: $97/month.</p>
        </CardContent>
      </Card>

      {/* Comparison with competitors */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-center mb-4">Why OTOBI AI is the Best Value</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Capability</th>
                  <th className="text-center py-2 px-3 font-medium text-primary">OTOBI AI<br/><span className="text-xs font-normal">from $49/mo</span></th>
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
                  <td className="text-center py-2 px-3 text-primary text-xs font-bold">$49-497/mo</td>
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
            <p className="text-xs text-muted-foreground">Professional includes 5 seats (+$15/extra). Business includes 15 seats (+$12/extra). Agency: unlimited.</p>
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
