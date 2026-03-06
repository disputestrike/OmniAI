import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Target,
  BarChart3,
  Video,
  PenTool,
  Users,
  Brain,
  TrendingUp,
  Shield,
  Check,
  ChevronRight,
  Play,
  Star,
  Rocket,
  Eye,
  MessageSquare,
  Search,
  Mail,
  Share2,
  Megaphone,
  Clock,
  Palette,
  Bot,
  LineChart,
  Layers,
  Workflow,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

const IMAGES = {
  heroDashboard: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/landing-hero-v2-WDUNbjWF77vGgKXNaTKd8c.webp",
  adGrid: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/landing-ad-grid-3yeRyLqW5LXmqYEsh3QyRF.webp",
  platforms: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/landing-platforms-visual-KbAmQyLxByVxjn3pXwW4vs.webp",
  aiBrain: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/landing-ai-brain-mBbzt9w84qEH8Nk5mFkAtz.webp",
  results: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/landing-results-chart-JZftxHLAMHFQqvDVJWEd44.webp",
  contentCreation: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/landing-content-creation-bGubcWd5PcWE6LF8NMT34j.webp",
  avatars: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/landing-ai-avatars-Uan8GVEFwjBPi7fVQYW5cw.webp",
  multichannel: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/landing-multichannel-katK5SCsCXQWQQBye6Gjem.webp",
};

/* ─── Animated counter hook ─── */
function useCounter(end: number, duration = 2000, start = 0) {
  const [count, setCount] = useState(start);
  const ref = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          const startTime = Date.now();
          const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(start + (end - start) * eased));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, start]);

  return { count, ref };
}

/* ─── Fade-in on scroll hook ─── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function FadeSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const platforms = [
  "Instagram", "TikTok", "YouTube", "Facebook", "LinkedIn",
  "Twitter/X", "Google Ads", "Amazon", "Pinterest", "WhatsApp",
  "eBay", "Snapchat", "Reddit", "Spotify", "Podcast Networks",
  "Email", "SMS", "Blog/SEO", "TV/Radio Scripts", "PR Wires",
  "Newsletters",
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Get started with AI marketing",
    features: [
      "5 AI content generations/month",
      "3 platforms",
      "Basic analytics",
      "1 product",
      "Community support",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For serious marketers and growing businesses",
    features: [
      "Unlimited AI generations",
      "All 21+ platforms",
      "Advanced analytics & predictive AI",
      "Unlimited products",
      "AI avatar video ads",
      "A/B testing suite",
      "Lead management CRM",
      "SEO audit engine",
      "Team collaboration (5 seats)",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    description: "For agencies and large teams",
    features: [
      "Everything in Pro",
      "Unlimited team seats",
      "Custom AI training on your brand",
      "White-label reports",
      "API access",
      "Ad platform integrations",
      "Approval workflows",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleGetStarted = () => {
    window.location.href = getLoginUrl();
  };

  const stat1 = useCounter(22, 1500);
  const stat2 = useCounter(21, 1500);
  const stat3 = useCounter(30, 1500);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1a1a1a]">
      {/* ═══════════════ NAVIGATION ═══════════════ */}
      <nav className="sticky top-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-[#e8e0d4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
                OmniMarket AI
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm font-medium text-[#6b5e4f] hover:text-[#1a1a1a] transition-colors">How It Works</a>
              <a href="#capabilities" className="text-sm font-medium text-[#6b5e4f] hover:text-[#1a1a1a] transition-colors">Capabilities</a>
              <a href="#platforms" className="text-sm font-medium text-[#6b5e4f] hover:text-[#1a1a1a] transition-colors">Platforms</a>
              <a href="#pricing" className="text-sm font-medium text-[#6b5e4f] hover:text-[#1a1a1a] transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleGetStarted} className="text-[#6b5e4f] hover:text-[#1a1a1a]">
                Log In
              </Button>
              <Button size="sm" onClick={handleGetStarted} className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 border-0">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="relative overflow-hidden pt-16 pb-8 lg:pt-24 lg:pb-12">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-200/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <FadeSection>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold mb-6 border border-amber-200/50">
                <Sparkles className="w-4 h-4" />
                Replaces Your Entire Marketing Team
              </div>
            </FadeSection>
            <FadeSection delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-6">
                Market{" "}
                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  Anything
                </span>{" "}
                to{" "}
                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  Anyone
                </span>
                <br />
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#6b5e4f]">
                  Across Every Platform, Instantly
                </span>
              </h1>
            </FadeSection>
            <FadeSection delay={200}>
              <p className="text-lg sm:text-xl text-[#6b5e4f] max-w-2xl mx-auto mb-8 leading-relaxed">
                One AI creates your ads, videos, blogs, SEO, emails, and social posts — then publishes across 21+ platforms. From product to viral campaign in minutes.
              </p>
            </FadeSection>
            <FadeSection delay={300}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="text-base px-8 py-6 gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl shadow-amber-500/30 border-0 rounded-xl"
                >
                  Start Creating for Free <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 py-6 gap-2 border-[#d4c9b8] text-[#6b5e4f] hover:bg-[#f5efe6] rounded-xl"
                  onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <Play className="w-5 h-5" /> See How It Works
                </Button>
              </div>
              <p className="text-sm text-[#9b8e7e]">No credit card required. Free plan available forever.</p>
            </FadeSection>
          </div>

          {/* Hero Dashboard Image */}
          <FadeSection delay={400}>
            <div className="max-w-5xl mx-auto relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-purple-400/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-amber-900/10 border border-[#e8e0d4]/80 ring-1 ring-amber-500/10">
                <img
                  src={IMAGES.heroDashboard}
                  alt="OmniMarket AI — AI Marketing Command Center with analytics, ad creatives, and global reach"
                  className="w-full h-auto"
                  loading="eager"
                />
              </div>
              {/* Floating metric badges */}
              <div className="absolute -top-3 -left-3 sm:top-4 sm:-left-6 bg-white rounded-xl px-4 py-2.5 shadow-xl border border-[#e8e0d4] animate-bounce-slow hidden sm:block">
                <div className="text-xs text-[#9b8e7e] font-medium">Conversions</div>
                <div className="text-lg font-bold text-emerald-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> +347%
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 sm:bottom-8 sm:-right-6 bg-white rounded-xl px-4 py-2.5 shadow-xl border border-[#e8e0d4] animate-bounce-slow hidden sm:block" style={{ animationDelay: "0.5s" }}>
                <div className="text-xs text-[#9b8e7e] font-medium">ROAS</div>
                <div className="text-lg font-bold text-amber-600 flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" /> 12x
                </div>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ═══════════════ STATS BAR ═══════════════ */}
      <section className="py-12 bg-gradient-to-r from-amber-50/80 via-[#FDFBF7] to-orange-50/80 border-y border-[#e8e0d4]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div ref={stat1.ref}>
              <div className="text-4xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{stat1.count}+</div>
              <div className="text-sm text-[#6b5e4f] mt-1 font-medium">Content Types</div>
            </div>
            <div ref={stat2.ref}>
              <div className="text-4xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{stat2.count}+</div>
              <div className="text-sm text-[#6b5e4f] mt-1 font-medium">Platforms</div>
            </div>
            <div ref={stat3.ref}>
              <div className="text-4xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{stat3.count}+</div>
              <div className="text-sm text-[#6b5e4f] mt-1 font-medium">Languages</div>
            </div>
            <div>
              <div className="text-4xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">10x</div>
              <div className="text-sm text-[#6b5e4f] mt-1 font-medium">Faster Than Manual</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ AD EXAMPLES SHOWCASE ═══════════════ */}
      <section className="py-16 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                AI Creates <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">Scroll-Stopping Ads</span> in Seconds
              </h2>
              <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
                From fashion to SaaS, food to real estate — our AI generates professional ad creatives for every industry and platform.
              </p>
            </div>
          </FadeSection>
          <FadeSection delay={200}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-amber-900/10 border border-[#e8e0d4]">
              <img
                src={IMAGES.adGrid}
                alt="Grid of 12 AI-generated marketing ad creatives across different industries"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </FadeSection>
          <FadeSection delay={300}>
            <div className="text-center mt-8">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 border-0 rounded-xl"
              >
                Create Your First Ad <Sparkles className="w-5 h-5" />
              </Button>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-gradient-to-b from-[#FDFBF7] to-amber-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-4 uppercase tracking-wider">
                Simple 3-Step Process
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                From Product to <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">Viral Campaign</span> in Minutes
              </h2>
              <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
                Not days. Not weeks. Minutes. Here's how it works.
              </p>
            </div>
          </FadeSection>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                title: "Bring Your Product",
                description: "Paste a URL, upload images, or just describe it. Our AI instantly understands features, benefits, audience, positioning, and competitive landscape.",
                icon: <Search className="w-8 h-8" />,
                gradient: "from-amber-400 to-orange-500",
              },
              {
                step: "02",
                title: "AI Creates Everything",
                description: "Blog posts, ad copy, video scripts, SEO content, email campaigns, social captions, PR releases, visual ads, AI avatar videos — all generated in seconds.",
                icon: <Sparkles className="w-8 h-8" />,
                gradient: "from-orange-400 to-rose-500",
              },
              {
                step: "03",
                title: "Launch & Dominate",
                description: "Publish across 21+ platforms with optimal timing. A/B test variants automatically. Track leads. Watch AI optimize and scale what works.",
                icon: <Megaphone className="w-8 h-8" />,
                gradient: "from-rose-400 to-purple-500",
              },
            ].map((step, i) => (
              <FadeSection key={i} delay={i * 150}>
                <div className="relative group h-full">
                  <div className="bg-white rounded-2xl p-8 border border-[#e8e0d4] hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-500 h-full">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white shadow-lg`}>
                        {step.icon}
                      </div>
                      <span className="text-5xl font-black text-amber-100">{step.step}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-[#1a1a1a]">{step.title}</h3>
                    <p className="text-[#6b5e4f] leading-relaxed">{step.description}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:flex absolute top-1/2 -right-6 lg:-right-8 transform -translate-y-1/2 z-10">
                      <ChevronRight className="w-8 h-8 text-amber-300" />
                    </div>
                  )}
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ AI BRAIN — VALUE PROP ═══════════════ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeSection>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-purple-400/10 to-amber-400/10 rounded-3xl blur-2xl" />
                <img
                  src={IMAGES.aiBrain}
                  alt="AI Marketing Brain processing ads, videos, social media, and analytics simultaneously"
                  className="relative w-full h-auto rounded-2xl shadow-2xl"
                  loading="lazy"
                />
              </div>
            </FadeSection>
            <FadeSection delay={200}>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold mb-4 uppercase tracking-wider">
                  AI-Powered Intelligence
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-6">
                  An AI That Thinks Like a{" "}
                  <span className="bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
                    Chief Marketing Officer
                  </span>
                </h2>
                <p className="text-lg text-[#6b5e4f] mb-8 leading-relaxed">
                  Psychological targeting, persuasion frameworks, audience psychographics, emotional trigger mapping, and micro-targeting — all automated. Your AI marketing team never sleeps.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: <Brain className="w-5 h-5" />, label: "6 AI Strategy Modes" },
                    { icon: <Target className="w-5 h-5" />, label: "Psychographic Targeting" },
                    { icon: <TrendingUp className="w-5 h-5" />, label: "Viral Amplification" },
                    { icon: <Globe className="w-5 h-5" />, label: "30+ Languages" },
                    { icon: <Eye className="w-5 h-5" />, label: "Competitor Intelligence" },
                    { icon: <Shield className="w-5 h-5" />, label: "Predictive Scoring" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#e8e0d4]">
                      <span className="text-amber-600">{item.icon}</span>
                      <span className="text-sm font-medium text-[#1a1a1a]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ═══════════════ CONTENT CREATION ═══════════════ */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-[#FDFBF7] to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeSection>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-4 uppercase tracking-wider">
                  22 Content Types
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-6">
                  One AI Brain.{" "}
                  <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                    Infinite Content.
                  </span>
                </h2>
                <p className="text-lg text-[#6b5e4f] mb-8 leading-relaxed">
                  Feed it any product, idea, or person. Watch it generate blog posts, ad copy, video scripts, SEO content, email campaigns, social captions, PR releases, podcast outlines, landing pages, and more.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    "Ad Copy", "Blog Posts", "Video Scripts", "SEO Content",
                    "Email Campaigns", "Social Captions", "PR Releases", "Podcast Scripts",
                    "Landing Pages", "Product Listings", "UGC Scripts", "TV/Radio Ads",
                  ].map((type, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#e8e0d4] text-sm font-medium text-[#1a1a1a] hover:border-amber-300 transition-colors">
                      <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      {type}
                    </div>
                  ))}
                </div>
              </div>
            </FadeSection>
            <FadeSection delay={200}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-emerald-400/10 to-amber-400/10 rounded-3xl blur-2xl" />
                <img
                  src={IMAGES.contentCreation}
                  alt="AI Content Creation — Blog posts, ads, videos, SEO, emails generated simultaneously"
                  className="relative w-full h-auto rounded-2xl shadow-2xl border border-[#e8e0d4]"
                  loading="lazy"
                />
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ═══════════════ PLATFORMS ═══════════════ */}
      <section id="platforms" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-4 uppercase tracking-wider">
                Omnichannel Distribution
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                Publish Everywhere.{" "}
                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  From One Place.
                </span>
              </h2>
              <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
                Every platform has different formats, character limits, aspect ratios, and peak engagement times. Our AI knows them all.
              </p>
            </div>
          </FadeSection>
          <FadeSection delay={200}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-amber-900/10 border border-[#e8e0d4] mb-10">
              <img
                src={IMAGES.platforms}
                alt="21+ Social media and advertising platforms connected in a network"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </FadeSection>
          <FadeSection delay={300}>
            <div className="flex flex-wrap justify-center gap-2.5">
              {platforms.map((platform, i) => (
                <span
                  key={i}
                  className="px-4 py-2 rounded-full bg-white border border-[#e8e0d4] text-sm font-medium text-[#1a1a1a] hover:border-amber-300 hover:bg-amber-50 transition-all cursor-default shadow-sm"
                >
                  {platform}
                </span>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ═══════════════ AI VIDEO ADS ═══════════════ */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-[#FDFBF7] to-purple-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeSection>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold mb-4 uppercase tracking-wider">
                  AI Video Studio
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-6">
                  AI Video Ads with{" "}
                  <span className="bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
                    Diverse AI Actors
                  </span>
                </h2>
                <p className="text-lg text-[#6b5e4f] mb-6 leading-relaxed">
                  Create professional UGC-style video ads with AI-generated actors of every ethnicity, age, and appearance. No filming required.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    "12 ethnicities, 7 skin tones, 14 hair styles",
                    "Emotion control: excited, calm, urgent, friendly, authoritative",
                    "Ad presets: UGC testimonial, product demo, before/after, unboxing",
                    "30+ languages with automatic localization",
                    "Platform-optimized: TikTok, YouTube Shorts, Instagram Reels",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center mt-0.5 shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-[#6b5e4f]">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleGetStarted}
                  className="gap-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-lg shadow-rose-500/25 border-0 rounded-xl"
                >
                  Create Your First Video Ad <Video className="w-4 h-4" />
                </Button>
              </div>
            </FadeSection>
            <FadeSection delay={200}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-rose-400/10 to-purple-400/10 rounded-3xl blur-2xl" />
                <img
                  src={IMAGES.avatars}
                  alt="Diverse AI-Generated Video Actors for UGC-style marketing videos"
                  className="relative w-full h-auto rounded-2xl shadow-2xl border border-[#e8e0d4]"
                  loading="lazy"
                />
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ═══════════════ VALUE PROPOSITIONS ═══════════════ */}
      <section id="capabilities" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-4 uppercase tracking-wider">
                Why OmniMarket AI
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                Not Another Marketing Tool.{" "}
                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  The Only One You Need.
                </span>
              </h2>
              <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
                Stop paying $500+/month for 6 different tools. Get everything in one place.
              </p>
            </div>
          </FadeSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Rocket className="w-6 h-6" />,
                title: "Launch in Minutes",
                description: "Complete marketing campaign — ads, copy, visuals, video scripts, SEO — ready to publish across 21+ platforms.",
                gradient: "from-amber-400 to-orange-500",
                bg: "bg-amber-50",
              },
              {
                icon: <Brain className="w-6 h-6" />,
                title: "AI CMO Intelligence",
                description: "Psychological targeting, persuasion frameworks (AIDA, Cialdini, PAS), audience psychographics, emotional triggers.",
                gradient: "from-purple-400 to-indigo-500",
                bg: "bg-purple-50",
              },
              {
                icon: <Target className="w-6 h-6" />,
                title: "Reach Anyone, Anywhere",
                description: "30+ languages, every major platform, every ad format. From TikTok to LinkedIn to Amazon to TV scripts.",
                gradient: "from-blue-400 to-cyan-500",
                bg: "bg-blue-50",
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "Make Anything Viral",
                description: "Viral amplification, trend detection, content remixing, A/B testing with AI-powered winner selection.",
                gradient: "from-rose-400 to-pink-500",
                bg: "bg-rose-50",
              },
              {
                icon: <Eye className="w-6 h-6" />,
                title: "Competitor Intelligence",
                description: "Website intelligence rivaling SimilarWeb. Traffic estimates, SEO analysis, tech stack detection, actionable insights.",
                gradient: "from-emerald-400 to-teal-500",
                bg: "bg-emerald-50",
              },
              {
                icon: <Layers className="w-6 h-6" />,
                title: "Replace Your Entire Stack",
                description: "Content + design + video + scheduling + CRM + analytics + SEO + ad management + team collaboration — all in one.",
                gradient: "from-orange-400 to-red-500",
                bg: "bg-orange-50",
              },
            ].map((prop, i) => (
              <FadeSection key={i} delay={i * 100}>
                <div className={`${prop.bg} rounded-2xl p-7 border border-[#e8e0d4] hover:border-amber-300 hover:shadow-lg transition-all duration-300 h-full`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${prop.gradient} flex items-center justify-center text-white mb-5 shadow-lg`}>
                    {prop.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-[#1a1a1a]">{prop.title}</h3>
                  <p className="text-[#6b5e4f] text-sm leading-relaxed">{prop.description}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ RESULTS / EVIDENCE ═══════════════ */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-[#FDFBF7] to-amber-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeSection>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-3xl blur-2xl" />
                <img
                  src={IMAGES.results}
                  alt="Campaign Performance — 347% ROI, 2.4M Impressions, 89K Leads, 12x ROAS"
                  className="relative w-full h-auto rounded-2xl shadow-2xl border border-[#e8e0d4]"
                  loading="lazy"
                />
              </div>
            </FadeSection>
            <FadeSection delay={200}>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-4 uppercase tracking-wider">
                  Proven Results
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-6">
                  Results That{" "}
                  <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                    Speak for Themselves
                  </span>
                </h2>
                <p className="text-lg text-[#6b5e4f] mb-8 leading-relaxed">
                  Predictive scoring rates every piece before launch. A/B testing finds winners automatically. Campaign continuity doubles down on what works.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { metric: "347%", label: "Average ROI Increase", color: "text-emerald-600" },
                    { metric: "12x", label: "Return on Ad Spend", color: "text-amber-600" },
                    { metric: "89K", label: "Leads Generated", color: "text-blue-600" },
                    { metric: "10x", label: "Faster Than Manual", color: "text-purple-600" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-[#e8e0d4] text-center shadow-sm">
                      <div className={`text-2xl font-black ${stat.color}`}>{stat.metric}</div>
                      <div className="text-xs text-[#9b8e7e] mt-1 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ═══════════════ FULL CAPABILITIES GRID ═══════════════ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                18 Integrated Modules.{" "}
                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  One Platform.
                </span>
              </h2>
              <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
                Everything you need to dominate marketing. Nothing you don't.
              </p>
            </div>
          </FadeSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: <Search className="w-5 h-5" />, name: "AI Product Analyzer", desc: "Instant product understanding & positioning" },
              { icon: <PenTool className="w-5 h-5" />, name: "Content Studio", desc: "22 content types, remix & repurpose" },
              { icon: <Palette className="w-5 h-5" />, name: "Creative Engine", desc: "AI-generated visual ads & graphics" },
              { icon: <Video className="w-5 h-5" />, name: "Video Ad Studio", desc: "AI actors, UGC, multi-language" },
              { icon: <Megaphone className="w-5 h-5" />, name: "Campaign Builder", desc: "Multi-platform campaign management" },
              { icon: <BarChart3 className="w-5 h-5" />, name: "A/B Testing", desc: "Auto-optimize winning variants" },
              { icon: <Clock className="w-5 h-5" />, name: "Smart Scheduler", desc: "Optimal timing, auto-posting" },
              { icon: <Users className="w-5 h-5" />, name: "Lead Manager & CRM", desc: "Full pipeline with deal tracking" },
              { icon: <LineChart className="w-5 h-5" />, name: "Analytics", desc: "Cross-platform insights" },
              { icon: <Bot className="w-5 h-5" />, name: "AI Marketing Agent", desc: "Chat-based strategy advisor" },
              { icon: <Eye className="w-5 h-5" />, name: "Website Intelligence", desc: "SimilarWeb-level analysis" },
              { icon: <Search className="w-5 h-5" />, name: "SEO Audit Engine", desc: "Keywords, rank tracking, site audit" },
              { icon: <Target className="w-5 h-5" />, name: "Ad Platform Hub", desc: "Connect Meta, Google, TikTok, etc." },
              { icon: <Star className="w-5 h-5" />, name: "Predictive AI", desc: "Score ads before launch" },
              { icon: <Workflow className="w-5 h-5" />, name: "Approval Workflows", desc: "Team review & approval chains" },
              { icon: <Users className="w-5 h-5" />, name: "Team Collaboration", desc: "Roles, permissions, activity feed" },
              { icon: <Share2 className="w-5 h-5" />, name: "Export/Import", desc: "Bulk data, CSV, JSON" },
              { icon: <Zap className="w-5 h-5" />, name: "Stripe Billing", desc: "Subscription management" },
            ].map((mod, i) => (
              <FadeSection key={i} delay={Math.min(i * 50, 400)}>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-[#e8e0d4] hover:border-amber-300 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-600 shrink-0">
                    {mod.icon}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#1a1a1a]">{mod.name}</div>
                    <div className="text-xs text-[#9b8e7e]">{mod.desc}</div>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>

          <FadeSection delay={500}>
            <div className="text-center mt-10">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 border-0 rounded-xl"
              >
                Try All 18 Modules Free <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section id="pricing" className="py-20 lg:py-28 bg-gradient-to-b from-[#FDFBF7] to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-4 uppercase tracking-wider">
                Simple Pricing
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                Stop Paying $500+/month for 6 Tools
              </h2>
              <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
                Get everything in one platform at a fraction of the cost.
              </p>
            </div>
          </FadeSection>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <FadeSection key={i} delay={i * 150}>
                <div
                  className={`relative bg-white rounded-2xl p-8 border ${
                    plan.popular
                      ? "border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02] ring-2 ring-amber-400/30"
                      : "border-[#e8e0d4]"
                  } transition-all duration-300 hover:shadow-lg h-full`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-lg">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-2 text-[#1a1a1a]">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-[#1a1a1a]">{plan.price}</span>
                      <span className="text-[#9b8e7e]">{plan.period}</span>
                    </div>
                    <p className="text-sm text-[#6b5e4f] mt-2">{plan.description}</p>
                  </div>
                  <Button
                    className={`w-full mb-6 rounded-xl ${
                      plan.popular
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 border-0"
                        : "border-[#d4c9b8] text-[#6b5e4f] hover:bg-amber-50"
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={handleGetStarted}
                  >
                    {plan.cta}
                  </Button>
                  <div className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-[#6b5e4f]">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeSection>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-amber-400/20 via-orange-400/10 to-purple-400/20 rounded-3xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-3xl p-12 lg:p-16 border border-amber-200/50 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-amber-500/30">
                  <Rocket className="w-8 h-8" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                  Ready to Replace Your Entire Marketing Team?
                </h2>
                <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto mb-8">
                  Join thousands of businesses using OmniMarket AI to create, publish, and optimize marketing campaigns across every platform.
                </p>
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="text-base px-10 py-6 gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl shadow-amber-500/30 border-0 rounded-xl"
                >
                  Start Creating for Free <ArrowRight className="w-5 h-5" />
                </Button>
                <p className="text-sm text-[#9b8e7e] mt-4">No credit card required. Cancel anytime.</p>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="py-12 border-t border-[#e8e0d4] bg-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-extrabold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">OmniMarket AI</span>
              </div>
              <p className="text-sm text-[#6b5e4f]">
                The ultimate AI-powered marketing suite. Market anything to anybody, instantly.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3 text-[#1a1a1a]">Product</h4>
              <div className="space-y-2">
                <a href="#capabilities" className="block text-sm text-[#6b5e4f] hover:text-[#1a1a1a]">Features</a>
                <a href="#pricing" className="block text-sm text-[#6b5e4f] hover:text-[#1a1a1a]">Pricing</a>
                <a href="#platforms" className="block text-sm text-[#6b5e4f] hover:text-[#1a1a1a]">Platforms</a>
                <a href="#how-it-works" className="block text-sm text-[#6b5e4f] hover:text-[#1a1a1a]">How It Works</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3 text-[#1a1a1a]">Capabilities</h4>
              <div className="space-y-2">
                <span className="block text-sm text-[#6b5e4f]">AI Content Generation</span>
                <span className="block text-sm text-[#6b5e4f]">Video Ad Studio</span>
                <span className="block text-sm text-[#6b5e4f]">Campaign Management</span>
                <span className="block text-sm text-[#6b5e4f]">Lead CRM</span>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3 text-[#1a1a1a]">Company</h4>
              <div className="space-y-2">
                <span className="block text-sm text-[#6b5e4f]">About</span>
                <span className="block text-sm text-[#6b5e4f]">Blog</span>
                <span className="block text-sm text-[#6b5e4f]">Contact</span>
                <span className="block text-sm text-[#6b5e4f]">Privacy Policy</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[#e8e0d4] text-center text-sm text-[#9b8e7e]">
            &copy; {new Date().getFullYear()} OmniMarket AI. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Custom animation keyframes */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
