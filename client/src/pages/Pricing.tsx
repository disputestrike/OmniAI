import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Check, Sparkles, Crown, Zap, Loader2, Building2, Rocket, Users, X, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSearch } from "wouter";
import { getLoginPageUrl } from "@/const";
import { TESTIMONIALS } from "@/config/testimonials";

const TIER_META: Record<string, { icon: typeof Zap; color: string; glow: string; seats: string }> = {
  free:         { icon: Zap,       color: "#71717a", glow: "rgba(113,113,122,0.15)", seats: "1 user" },
  starter:      { icon: Rocket,    color: "#3b82f6", glow: "rgba(59,130,246,0.15)",  seats: "1 user" },
  professional: { icon: Sparkles,  color: "#7c3aed", glow: "rgba(124,58,237,0.2)",   seats: "5 seats included" },
  business:     { icon: Crown,     color: "#f59e0b", glow: "rgba(245,158,11,0.15)",  seats: "15 seats included" },
  agency:       { icon: Building2, color: "#ec4899", glow: "rgba(236,72,153,0.15)",  seats: "Unlimited seats" },
};

const TIER_FEATURES: Record<string, { features: string[]; limitations: string[] }> = {
  free:         { features: ["5 AI generations/mo","2 AI images/mo","1 video script","1 product analysis","2 campaigns","25 leads","Basic analytics"], limitations: ["No scheduling","No A/B testing","No voice input"] },
  starter:      { features: ["50 AI generations/mo","15 AI images/mo","5 video scripts","5 products","10 campaigns","500 leads","25 scheduled posts","3 A/B tests","AI marketing agent"], limitations: ["No team seats"] },
  professional: { features: ["200 AI generations/mo","50 AI images/mo","20 video scripts","AI video 2 min/mo","Unlimited campaigns & leads","5 team seats (+$15/extra)","Unlimited scheduling & A/B tests","Voice input","CRM deals pipeline","3 ad platform connections","Predictive AI scoring","Priority support"], limitations: [] },
  business:     { features: ["800 AI generations/mo","200 AI images/mo","Unlimited video scripts","AI video 8 min/mo","15 team seats (+$12/extra)","White-label reports","API access","Custom brand voice","All ad platforms","SEO audit suite","Dedicated account manager","99.9% SLA"], limitations: [] },
  agency:       { features: ["3,000 AI generations/mo","500 AI images/mo","AI video 30 min/mo","Unlimited seats","Full white-label","Client management portal","Custom SSO/SAML","Custom SLA 99.99%","Quarterly business reviews","15% off credit packs"], limitations: [] },
};

const COMPARE_ROWS = [
  { cap: "AI Content (22 types)",      us: true,  j: true,  a: false, o: false, ar: false },
  { cap: "AI Image Generation",        us: true,  j: false, a: true,  o: true,  ar: false },
  { cap: "AI Video Scripts",           us: true,  j: false, a: false, o: false, ar: true  },
  { cap: "14+ Platform Intelligence",  us: true,  j: false, a: false, o: false, ar: false },
  { cap: "Campaign Management",        us: true,  j: false, a: false, o: true,  ar: false },
  { cap: "A/B Testing Suite",          us: true,  j: false, a: true,  o: true,  ar: false },
  { cap: "CRM & Lead Management",      us: true,  j: false, a: false, o: false, ar: false },
  { cap: "Competitor Intelligence",    us: true,  j: false, a: false, o: false, ar: false },
  { cap: "Content Scheduler",          us: true,  j: false, a: false, o: false, ar: false },
  { cap: "Voice AI Chat",              us: true,  j: false, a: false, o: false, ar: false },
  { cap: "Team Collaboration",         us: true,  j: true,  a: true,  o: true,  ar: false },
  { cap: "Ad Platform Connections",    us: true,  j: false, a: true,  o: true,  ar: false },
];

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const { data: tiers } = trpc.pricing.list.useQuery();
  const { data: userCount } = trpc.pricing.userCount.useQuery();
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, { enabled: isAuthenticated });
  const { data: creditPackages } = trpc.credits.packages.useQuery(undefined, { enabled: isAuthenticated });
  const [loading, setLoading] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(true);
  const search = useSearch();

  useEffect(() => {
    const p = new URLSearchParams(search);
    if (p.get("success") === "true")   toast.success("Subscription activated! Welcome aboard.");
    if (p.get("credits") === "added")  toast.success("Credits added to your wallet!");
    if (p.get("canceled") === "true")  toast.info("Checkout canceled. No charges made.");
  }, [search]);

  const handleCheckout = async (planKey: string) => {
    if (!isAuthenticated) { window.location.href = getLoginPageUrl(); return; }
    setLoading(planKey);
    try {
      const res = await fetch("/api/stripe/create-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: planKey, billing: isAnnual ? "annual" : "monthly", userId: user?.id, userEmail: user?.email, userName: user?.name }) });
      const data = await res.json();
      if (data.url) { toast.info("Redirecting to secure checkout..."); window.open(data.url, "_blank"); }
      else toast.error(data.error || "Failed to create checkout session.");
    } catch { toast.error("Failed to initiate checkout."); }
    finally { setLoading(null); }
  };

  const handleManage = async () => {
    if (!subStatus?.stripeCustomerId) return;
    setLoading("manage");
    try {
      const res = await fetch("/api/stripe/create-portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId: subStatus.stripeCustomerId }) });
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank"); else toast.error("Failed to open portal");
    } catch { toast.error("Failed to open portal."); }
    finally { setLoading(null); }
  };

  const currentPlan = subStatus?.plan || "free";
  const plans = tiers ?? [];

  const Tick = ({ v }: { v: boolean }) => v
    ? <Check className="h-4 w-4 text-emerald-400 mx-auto" />
    : <X className="h-3.5 w-3.5 text-zinc-700 mx-auto" />;

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12 animate-fade-up">

      {/* ── Header ────────────────────────────────── */}
      <div className="text-center space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa" }}>
          <Sparkles className="h-3.5 w-3.5" /> Simple, transparent pricing
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          One platform. <span style={{ background: "linear-gradient(135deg,#a78bfa,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Everything included.</span>
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto text-sm">
          Replaces Jasper + AdCreative.ai + Omneky + HubSpot CRM + SimilarWeb. Save $700+/month.
        </p>

        {/* Annual/Monthly toggle */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <span className={`text-sm font-medium ${!isAnnual ? "text-white" : "text-zinc-600"}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ background: isAnnual ? "#7c3aed" : "#27272a" }}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isAnnual ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm font-medium flex items-center gap-2 ${isAnnual ? "text-white" : "text-zinc-600"}`}>
            Annual
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-success">Save up to 20%</span>
          </span>
        </div>

        {/* Social proof count */}
        {typeof userCount === "number" && userCount > 0 && (
          <p className="text-xs text-zinc-600">
            {userCount >= 100 ? `Join ${userCount.toLocaleString()}+ marketers already using OmniAI` : "Join our growing community of marketers"}
          </p>
        )}
      </div>

      {/* ── Pricing cards ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {plans.map((tier: any) => {
          const isCurrentPlan = currentPlan === tier.key;
          const displayPrice = isAnnual ? tier.annualPrice : tier.monthlyPrice;
          const meta = TIER_META[tier.key] ?? TIER_META.free;
          const feat = TIER_FEATURES[tier.key] ?? { features: [], limitations: [] };
          const Icon = meta.icon;
          const annualSavings = tier.annualTotal != null && tier.monthlyPrice > 0 ? tier.monthlyPrice * 12 - tier.annualTotal : 0;
          const isPopular = tier.popular;

          return (
            <div key={tier.key} className="relative flex flex-col rounded-2xl p-5 transition-all"
              style={{
                background: isPopular ? `linear-gradient(135deg, ${meta.glow}, rgba(255,255,255,0.02))` : "#111113",
                border: isPopular ? `1px solid ${meta.color}40` : "1px solid rgba(255,255,255,0.07)",
                boxShadow: isPopular ? `0 0 30px ${meta.glow}` : "none",
              }}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white z-10"
                  style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)` }}>
                  Most Popular
                </div>
              )}

              {/* Icon + name */}
              <div className="mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${meta.color}18` }}>
                  <Icon className="h-5 w-5" style={{ color: meta.color }} />
                </div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{tier.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">${displayPrice}</span>
                  <span className="text-zinc-500 text-sm">{tier.monthlyPrice === 0 ? "forever" : "/mo"}</span>
                </div>
                {isAnnual && tier.monthlyPrice > 0 && (
                  <p className="text-xs text-zinc-600 mt-0.5">
                    <span className="line-through">${tier.monthlyPrice}/mo</span>
                    {annualSavings > 0 && <span className="text-emerald-400 ml-2">Save ${annualSavings}/yr</span>}
                  </p>
                )}
                <p className="text-[11px] text-zinc-600 mt-1">{tier.tagline}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="h-3 w-3 text-zinc-700" />
                  <span className="text-[10px] text-zinc-600">{meta.seats}</span>
                </div>
              </div>

              {/* Features */}
              <div className="flex-1 space-y-1.5 mb-5">
                {feat.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="h-3 w-3 shrink-0 mt-0.5" style={{ color: meta.color }} />
                    <span className="text-[11px] text-zinc-400">{f}</span>
                  </div>
                ))}
                {feat.limitations.map((lim, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <X className="h-3 w-3 text-zinc-700 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-zinc-600">{lim}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {isCurrentPlan ? (
                <div className="space-y-1.5">
                  <button disabled className="w-full py-2.5 rounded-xl text-xs font-bold text-zinc-500 cursor-not-allowed"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                    Current Plan
                  </button>
                  {currentPlan !== "free" && (
                    <button onClick={handleManage} disabled={loading === "manage"}
                      className="w-full py-2 rounded-xl text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1">
                      {loading === "manage" && <Loader2 className="h-3 w-3 animate-spin" />}
                      Manage subscription
                    </button>
                  )}
                </div>
              ) : tier.key === "free" ? (
                <button disabled className="w-full py-2.5 rounded-xl text-xs font-bold text-zinc-600 cursor-not-allowed"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                  {currentPlan !== "free" ? "Included" : "Current Plan"}
                </button>
              ) : tier.contactSales ? (
                <button onClick={() => toast.info("Contact us at sales@omni.ai for agency pricing.")}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  Contact Sales
                </button>
              ) : (
                <button onClick={() => handleCheckout(tier.key)} disabled={loading === tier.key}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ background: isPopular ? meta.color : "rgba(124,58,237,0.6)", border: isPopular ? "none" : "1px solid rgba(124,58,237,0.3)" }}>
                  {loading === tier.key && <Loader2 className="h-3 w-3 animate-spin" />}
                  {tier.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Credit packs ──────────────────────────── */}
      {creditPackages && creditPackages.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="text-center mb-5">
            <h3 className="text-base font-bold text-white mb-1">Need more? Top up with credit packs</h3>
            <p className="text-xs text-zinc-500">One-time purchase. Credits never expire.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {creditPackages.map((p: any) => (
              <div key={p.id} className="rounded-xl px-5 py-4 text-center min-w-[120px]"
                style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="font-bold text-sm text-white">{p.name}</p>
                <p className="text-xl font-black text-violet-400 my-1">${(p.priceCentsAfterDiscount / 100).toFixed(0)}</p>
                <p className="text-[10px] text-zinc-600 mb-3">{p.credits} credits</p>
                <button
                  onClick={async () => {
                    if (!isAuthenticated || !user?.id) { window.location.href = getLoginPageUrl(); return; }
                    setLoading(`credits-${p.id}`);
                    try {
                      const res = await fetch("/api/stripe/create-credit-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, creditPackId: p.id }) });
                      const data = await res.json();
                      if (data.url) window.open(data.url, "_blank"); else toast.error(data.error || "Failed.");
                    } finally { setLoading(null); }
                  }}
                  disabled={loading === `credits-${p.id}`}
                  className="w-full py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  {loading === `credits-${p.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : "Get credits"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stack killer bar ──────────────────────── */}
      <div className="rounded-2xl p-5 text-center"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))", border: "1px solid rgba(124,58,237,0.15)" }}>
        <p className="text-sm text-zinc-400">
          OmniAI replaces: Jasper ($69) + HeyGen ($89) + Arcads ($250) + Hootsuite ($199) + AdCreative ($119) + HubSpot CRM ($200) + SimilarWeb ($167) = <span className="line-through text-zinc-600">$1,093/month</span>
        </p>
        <p className="text-base font-black text-white mt-1.5">OmniAI Professional: <span className="text-violet-400">$97/month</span></p>
      </div>

      {/* ── Comparison table ──────────────────────── */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h3 className="font-bold text-white">OmniAI vs. the competition</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm data-table">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th className="text-left py-3 px-4 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Capability</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-violet-400 uppercase tracking-wider">OmniAI</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Jasper</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">AdCreative</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Omneky</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Arcads</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="py-2.5 px-4 text-xs text-zinc-400">{row.cap}</td>
                  <td className="py-2.5 px-4"><Tick v={row.us} /></td>
                  <td className="py-2.5 px-4"><Tick v={row.j} /></td>
                  <td className="py-2.5 px-4"><Tick v={row.a} /></td>
                  <td className="py-2.5 px-4"><Tick v={row.o} /></td>
                  <td className="py-2.5 px-4"><Tick v={row.ar} /></td>
                </tr>
              ))}
              <tr style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <td className="py-3 px-4 text-xs font-bold text-zinc-300">Total cost</td>
                <td className="text-center py-3 px-4 text-xs font-black text-violet-400">$29–497/mo</td>
                <td className="text-center py-3 px-4 text-xs text-zinc-600">$49–69/seat</td>
                <td className="text-center py-3 px-4 text-xs text-zinc-600">$25–359/mo</td>
                <td className="text-center py-3 px-4 text-xs text-zinc-600">$99/mo</td>
                <td className="text-center py-3 px-4 text-xs text-zinc-600">$110/mo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Testimonials ──────────────────────────── */}
      <div>
        <p className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-6">What marketers say</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <div className="flex gap-0.5 mb-3">
                {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm text-zinc-400 italic mb-4">"{t.quote}"</p>
              <p className="text-xs font-semibold text-zinc-300">— {t.author}, {t.title} at {t.company}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust strip ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "7-Day Free Trial", desc: "Try any paid plan free for 7 days. No credit card required for the Free plan. Cancel anytime." },
          { title: "Team Seat Pricing", desc: "Professional includes 5 seats (+$15/extra). Business includes 15 seats (+$12/extra). Agency: unlimited." },
          { title: "Secure Payments", desc: "Powered by Stripe. Your payment data never touches our servers. PCI DSS compliant." },
        ].map((item, i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <h4 className="font-bold text-sm text-white mb-2">{item.title}</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer links */}
      <div className="text-center py-4 text-xs text-zinc-700">
        <a href="/refund-policy" className="hover:text-zinc-400 transition-colors underline">Refund Policy</a>
        <span className="mx-2">·</span>
        <a href="/terms" className="hover:text-zinc-400 transition-colors underline">Terms of Service</a>
        <span className="mx-2">·</span>
        <a href="/privacy" className="hover:text-zinc-400 transition-colors underline">Privacy Policy</a>
      </div>
    </div>
  );
}
