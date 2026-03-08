import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginPageUrl } from "@/const";
import { Link, useLocation } from "wouter";
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
  GitBranch,
  FileQuestion,
  FileBarChart,
  Wallet,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

const IMAGES = {
  heroDashboard: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/photo-dashboard-main-JtpLfV6MWdFzxVqpEgChCZ.webp",
  adGrid: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/photo-ai-creative-KDUNYiTUKFTvaWs9K35e35.webp",
  platforms: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/landing-platforms-visual-KbAmQyLxByVxjn3pXwW4vs.webp",
  aiBrain: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/landing-ai-brain-mBbzt9w84qEH8Nk5mFkAtz.webp",
  results: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/photo-analytics-results-TbJihkAHwuXhryLdFmUyq2.webp",
  contentCreation: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/photo-content-creation-2ZgrXXCaVZz9gYz74aNSnj.webp",
  avatars: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/landing-ai-avatars-Uan8GVEFwjBPi7fVQYW5cw.webp",
  multichannel: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/photo-team-collab-9cvSAsb2b2Gvyz4VdD97ZD.webp",
};

/** Replace with your own CDN URLs: photorealistic example creatives (people, products, UGC-style) for hero strip. */
const HERO_CREATIVES = [
  { src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop", alt: "Creator" },
  { src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop", alt: "Product" },
  { src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop", alt: "Professional" },
  { src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=200&fit=crop", alt: "Team" },
  { src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=200&fit=crop", alt: "Analytics" },
];

/** Replace with real OTOBI-generated outputs: one image + label per tile. */
const EXAMPLE_CREATIVES = [
  { src: IMAGES.adGrid, label: "Ad creatives" },
  { src: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=300&fit=crop", label: "Social posts" },
  { src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=300&fit=crop", label: "UGC style" },
  { src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop", label: "Product ads" },
  { src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop", label: "Video stills" },
  { src: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=300&h=300&fit=crop", label: "Campaigns" },
];

/** Circular headshots for testimonials. Replace with real customer photos. */
const TESTIMONIAL_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
];

/** AI actor headshots for Video section. Replace with your AI avatar outputs. */
const AI_ACTOR_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=face",
];

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
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try OTOBI AI risk-free",
    features: [
      "5 AI content generations/month",
      "2 AI images/month",
      "1 product analysis",
      "Basic analytics",
    ],
    cta: "Start Free — No Card Required",
    popular: false,
  },
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "For solopreneurs getting started",
    features: [
      "50 AI content generations/month",
      "15 AI images/month",
      "All 14+ platforms",
      "Scheduler & A/B testing",
      "7-day free trial",
    ],
    cta: "Start 7-Day Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "$97",
    period: "/month",
    description: "For growing businesses and teams",
    features: [
      "200 AI generations/month",
      "50 AI images/month",
      "5 team seats included",
      "Voice AI + CRM + Predictive AI",
      "Campaign momentum analysis",
      "Priority support",
    ],
    cta: "Start 7-Day Free Trial",
    popular: true,
  },
  {
    name: "Business",
    price: "$197",
    period: "/month",
    description: "For agencies and departments",
    features: [
      "800 AI generations/month",
      "15 team seats (+$12/extra)",
      "White-label + API access",
      "All ad platform connections",
      "Dedicated account manager",
      "99.9% SLA",
    ],
    cta: "Start 7-Day Free Trial",
    popular: false,
  },
];

/* ─── Interactive Demo Component ─── */
function InteractiveDemo() {
  const [demoStep, setDemoStep] = useState(0);
  const [demoInput, setDemoInput] = useState("");
  const [demoOutput, setDemoOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");

  const demoSteps = [
    { title: "Describe Your Product", desc: "Tell the AI what you're marketing" },
    { title: "Choose Platforms", desc: "Select where to publish" },
    { title: "AI Generates Everything", desc: "Content, visuals, and strategy" },
  ];

  const demoPlatforms = [
    { id: "instagram", name: "Instagram", icon: "\uD83D\uDCF7" },
    { id: "tiktok", name: "TikTok", icon: "\uD83C\uDFB5" },
    { id: "linkedin", name: "LinkedIn", icon: "\uD83D\uDCBC" },
    { id: "email", name: "Email", icon: "\u2709\uFE0F" },
    { id: "google", name: "Google Ads", icon: "\uD83D\uDD0D" },
    { id: "youtube", name: "YouTube", icon: "\u25B6\uFE0F" },
  ];

  const sampleOutputs: Record<string, string> = {
    instagram: "\uD83D\uDD25 Stop scrolling. This changes everything.\n\nWe built the AI marketing engine that replaces your entire team.\n\n\u2714\uFE0F 22 content types\n\u2714\uFE0F 21 platforms\n\u2714\uFE0F One command center\n\nThe future of marketing isn't hiring more people.\nIt's using smarter AI.\n\n\uD83D\uDC47 Link in bio to start free\n\n#AIMarketing #MarketingAutomation #ContentCreation #DigitalMarketing #GrowthHacking",
    tiktok: "POV: You just replaced your entire marketing team with AI \uD83E\uDD2F\n\nStep 1: Describe your product\nStep 2: Pick your platforms\nStep 3: AI creates EVERYTHING\n\n- Ad copy \u2714\uFE0F\n- Video scripts \u2714\uFE0F\n- Email sequences \u2714\uFE0F\n- Social posts \u2714\uFE0F\n\nThis is not a drill. Link in bio.",
    linkedin: "I spent $50,000 on marketing agencies last year.\n\nThis year, I spent $79/month on AI.\n\nThe results? 3x better.\n\nHere's what changed:\n\n1. AI analyzes my product and competitors\n2. Generates content for 21 platforms simultaneously\n3. Optimizes based on real performance data\n4. Scales what works automatically\n\nThe marketing industry is about to change forever.\n\nWho else is making this shift?",
    email: "Subject: Your marketing team just got an upgrade\n\nHi [First Name],\n\nWhat if you could create content for 21 platforms in the time it takes to write one email?\n\nOTOBI AI is the all-in-one marketing engine that:\n\n\u2022 Generates ad copy, visuals, and video scripts\n\u2022 Optimizes for each platform automatically\n\u2022 Predicts performance before you publish\n\u2022 Scales your best content across channels\n\nStart your free trial today \u2192",
    google: "Headline 1: AI Marketing Engine | 21 Platforms, One Tool\nHeadline 2: Replace Your Marketing Team with AI\nHeadline 3: Create Ads in Seconds, Not Hours\n\nDescription 1: Generate ad copy, visuals, video scripts & email sequences for 21+ platforms. AI-powered. Start free.\nDescription 2: 22 content types. Predictive analytics. Campaign optimization. The only marketing tool you'll ever need.",
    youtube: "[HOOK - 0:00]\n\"I fired my entire marketing team... and replaced them with this.\"\n\n[PROBLEM - 0:15]\nMarketing across 21 platforms is impossible for one person.\nHiring a team costs $10K+/month.\nAgencies charge even more.\n\n[SOLUTION - 0:45]\nOTOBI AI does it all.\nOne tool. Every platform. Every content type.\n\n[DEMO - 1:15]\nWatch as I generate an entire campaign in 60 seconds...\n\n[CTA - 2:30]\nLink in description. Start free. No credit card.",
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setDemoOutput("");
    const output = sampleOutputs[selectedPlatform] || sampleOutputs.instagram;
    let i = 0;
    const interval = setInterval(() => {
      setDemoOutput(output.slice(0, i + 1));
      i++;
      if (i >= output.length) {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 15);
  };

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-[#FDFBF7] to-amber-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeSection>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-amber-100 text-sm font-medium text-[#6b5e4f] mb-4">
              <Play className="w-4 h-4 text-purple-600" /> Try It Live
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              See the AI in Action
            </h2>
            <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
              Pick a platform and watch OTOBI AI generate platform-optimized content instantly.
            </p>
          </div>
        </FadeSection>

        <FadeSection delay={200}>
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-amber-200/50 shadow-xl overflow-hidden">
              {/* Step indicators */}
              <div className="flex border-b border-amber-100">
                {demoSteps.map((step, i) => (
                  <button
                    key={i}
                    className={`flex-1 py-4 px-4 text-center transition-all ${
                      demoStep === i
                        ? "bg-gradient-to-b from-amber-50 to-white border-b-2 border-amber-500"
                        : "hover:bg-amber-50/50"
                    }`}
                    onClick={() => setDemoStep(i)}
                  >
                    <div className={`text-xs font-bold mb-1 ${demoStep === i ? "text-amber-600" : "text-[#9b8e7e]"}`}>
                      Step {i + 1}
                    </div>
                    <div className={`text-sm font-semibold ${demoStep === i ? "text-[#1a1a1a]" : "text-[#6b5e4f]"}`}>
                      {step.title}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-6 lg:p-8">
                {demoStep === 0 && (
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-[#4a3f35]">Describe what you're marketing:</label>
                    <textarea
                      className="w-full h-32 rounded-xl border border-amber-200 bg-amber-50/30 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                      placeholder="e.g., An AI-powered marketing platform that creates content for 21 platforms simultaneously..."
                      value={demoInput}
                      onChange={e => setDemoInput(e.target.value)}
                    />
                    <Button
                      onClick={() => { if (!demoInput.trim()) setDemoInput("An AI marketing platform that generates content, visuals, and campaigns for 21+ platforms"); setDemoStep(1); }}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                    >
                      Next: Choose Platforms <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {demoStep === 1 && (
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-[#4a3f35]">Select a platform to generate content for:</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {demoPlatforms.map(p => (
                        <button
                          key={p.id}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            selectedPlatform === p.id
                              ? "border-amber-500 bg-amber-50 shadow-md"
                              : "border-amber-100 hover:border-amber-300 bg-white"
                          }`}
                          onClick={() => setSelectedPlatform(p.id)}
                        >
                          <span className="text-2xl">{p.icon}</span>
                          <p className="text-sm font-semibold mt-2">{p.name}</p>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setDemoStep(0)} className="border-amber-200">
                        Back
                      </Button>
                      <Button
                        onClick={() => { setDemoStep(2); handleGenerate(); }}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                      >
                        Generate Content <Sparkles className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {demoStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{demoPlatforms.find(p => p.id === selectedPlatform)?.icon}</span>
                        <span className="font-semibold">{demoPlatforms.find(p => p.id === selectedPlatform)?.name} Content</span>
                      </div>
                      {isGenerating && (
                        <div className="flex items-center gap-2 text-amber-600">
                          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-xs font-medium">AI Generating...</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-6 min-h-[200px] font-mono text-sm text-green-400 whitespace-pre-wrap">
                      {demoOutput || <span className="text-gray-500 animate-pulse">Generating...</span>}
                      {isGenerating && <span className="animate-pulse">|</span>}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => { setDemoStep(1); setDemoOutput(""); }} className="border-amber-200">
                        Try Another Platform
                      </Button>
                      <Button
                        onClick={() => { window.location.href = getLoginPageUrl(); }}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                      >
                        Create Your Own <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </FadeSection>
      </div>
    </section>
  );
}

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      window.location.replace("/dashboard");
    }
  }, [isAuthenticated, loading]);

  const handleGetStarted = () => {
    window.location.href = getLoginPageUrl();
  };

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
                OTOBI AI
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                Your Marketing Team.
                <br />
                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  One Subscription.
                </span>
              </h1>
            </FadeSection>
            <FadeSection delay={200}>
              <p className="text-lg sm:text-xl text-[#6b5e4f] max-w-2xl mx-auto mb-8 leading-relaxed">
                One AI creates your ads, videos, blogs, SEO, emails, programmatic ads, and social posts — then publishes across 21+ platforms. Content, creatives, and DSP ad buying in one place. From product URL to live campaign in minutes.
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
            </FadeSection>
            {/* Photorealistic example creatives — people & real outputs only */}
            <FadeSection delay={350}>
              <div className="flex flex-wrap justify-center gap-3 mt-10 mb-6">
                {HERO_CREATIVES.map((img, i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden border-2 border-white shadow-xl shadow-amber-900/10 ring-1 ring-[#e8e0d4] transition-transform hover:scale-105"
                    style={{ transform: `rotate(${[-2, 1.5, -1, 2, -1.5][i] ?? 0}deg)` }}
                  >
                    <img src={img.src} alt={img.alt} className="w-20 h-20 sm:w-24 sm:h-24 object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </FadeSection>
          </div>

          {/* Hero Dashboard Image */}
          <FadeSection delay={400}>
            <div className="max-w-5xl mx-auto relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-purple-400/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-amber-900/10 border border-[#e8e0d4]/80 ring-1 ring-amber-500/10">
                <img
                  src={IMAGES.heroDashboard}
                  alt="OTOBI AI — AI Marketing Command Center with analytics, ad creatives, and global reach"
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

      {/* ═══════════════ STATS BAR (dark band) ═══════════════ */}
      <section className="py-10 bg-[#1a1a1a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
            <div><div className="text-3xl sm:text-4xl font-black text-amber-400">347%</div><div className="text-xs sm:text-sm text-white/80 mt-1 font-medium">Avg. ROI Increase</div></div>
            <div><div className="text-3xl sm:text-4xl font-black text-amber-400">12x</div><div className="text-xs sm:text-sm text-white/80 mt-1 font-medium">Return on Ad Spend</div></div>
            <div><div className="text-3xl sm:text-4xl font-black text-amber-400">21+</div><div className="text-xs sm:text-sm text-white/80 mt-1 font-medium">Platforms Published</div></div>
            <div><div className="text-3xl sm:text-4xl font-black text-amber-400">22</div><div className="text-xs sm:text-sm text-white/80 mt-1 font-medium">Content Types</div></div>
            <div><div className="text-3xl sm:text-4xl font-black text-amber-400">89K</div><div className="text-xs sm:text-sm text-white/80 mt-1 font-medium">Leads Generated</div></div>
            <div><div className="text-3xl sm:text-4xl font-black text-amber-400">10x</div><div className="text-xs sm:text-sm text-white/80 mt-1 font-medium">Faster Than Manual</div></div>
          </div>
        </div>
      </section>

      {/* ═══════════════ PROGRAMMATIC ADS (DSP) — One-Stop Ad Buying ═══════════════ */}
      <section id="programmatic-ads" className="py-20 lg:py-28 bg-gradient-to-b from-amber-50/50 to-[#FDFBF7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Programmatic Ads</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                Content, Creatives, and <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">DSP Ad Buying</span>
                <br />
                <span className="text-[#6b5e4f] font-bold">— All in One Place</span>
              </h2>
              <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
                No separate DSP tool. Fund your ad wallet, launch programmatic campaigns, and track performance from the same dashboard where you create content and creatives. True one-stop shop.
              </p>
            </div>
          </FadeSection>
          <FadeSection delay={100}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4"><Wallet className="w-6 h-6 text-amber-600" /></div>
                <h3 className="font-bold text-lg mb-2">Ad Wallet</h3>
                <p className="text-sm text-[#6b5e4f]">Add funds once. Run campaigns across programmatic inventory. Platform markup is transparent and tier-based.</p>
              </div>
              <div className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4"><Target className="w-6 h-6 text-amber-600" /></div>
                <h3 className="font-bold text-lg mb-2">Campaigns & Targeting</h3>
                <p className="text-sm text-[#6b5e4f]">Create campaigns, set budgets, target by geo and demographics. AI can score creatives and recommend audiences.</p>
              </div>
              <div className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4"><TrendingUp className="w-6 h-6 text-amber-600" /></div>
                <h3 className="font-bold text-lg mb-2">Performance in One Dashboard</h3>
                <p className="text-sm text-[#6b5e4f]">Impressions, clicks, spend, and AI insights alongside your content and creative analytics. No switching tools.</p>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ═══════════════ STACK KILLER — $725 vs $79 ═══════════════ */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-[#FDFBF7] to-amber-50/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">The Real ROI</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                Stop Paying $500+/month
                <br />
                <span className="text-[#6b5e4f] font-bold">for 6 Separate Tools</span>
              </h2>
              <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
                Every tool you're currently paying for — including programmatic ad buying (DSP) — is already built into OTOBI AI at a fraction of the combined cost.
              </p>
            </div>
          </FadeSection>
          <FadeSection delay={100}>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
              <div className="bg-white rounded-2xl border border-[#e8e0d4] p-6 shadow-lg w-full max-w-sm">
                <p className="text-xs font-semibold text-[#9b8e7e] uppercase mb-4">Your stack total</p>
                <ul className="space-y-2 text-sm">
                  {["Jasper AI — $99/mo", "AdCreative.ai — $129/mo", "Hootsuite — $99/mo", "HubSpot CRM — $50/mo", "SimilarWeb — $249/mo", "Unbounce — $99/mo"].map((line, i) => (
                    <li key={i} className="flex justify-between text-[#6b5e4f]">
                      <span className="line-through">{line.split("—")[0].trim()}</span>
                      <span className="line-through">{line.split("—")[1]}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 pt-4 border-t border-[#e8e0d4] text-lg font-black text-[#1a1a1a]">$725/month</p>
              </div>
              <div className="text-2xl text-amber-500 font-bold">→</div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl text-center w-full max-w-sm">
                <p className="text-sm font-semibold opacity-90 uppercase tracking-wider mb-1">OTOBI AI PRO</p>
                <p className="text-4xl font-black mb-1">$79<span className="text-lg font-bold opacity-90">/month</span></p>
                <p className="text-sm font-medium opacity-95">Everything included</p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-sm font-bold">
                  <Check className="w-4 h-4" /> Content, creatives, CRM, and programmatic DSP — one subscription. Save 89% vs. your current stack.
                </div>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ═══════════════ OUTPUT SHOWCASE — One URL, Infinite Campaigns ═══════════════ */}
      <section className="py-20 lg:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Real Output</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                One Product URL.{" "}
                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">Infinite Campaigns.</span>
              </h2>
              <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
                Paste any product URL and watch OTOBI AI generate every asset you need — across every platform — in seconds.
              </p>
            </div>
          </FadeSection>
          <FadeSection delay={100}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-amber-900/10 border border-[#e8e0d4]">
              <img src={IMAGES.adGrid} alt="Campaign outputs across platforms" className="w-full h-auto" loading="lazy" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {[
                "Instagram · Image Ad — 1080×1350 · Reel-ready",
                "Google Ads · Search Copy · Headlines + Descriptions",
                "TikTok · UGC Script · 30s · Trending format",
                "LinkedIn · Sponsored · B2B Lead Gen · 1200×628",
                "Email Campaign · 7-Email Welcome Series · A/B variants",
                "Blog/SEO · 2,400 Words · SEO Pillar Article",
                "Facebook · Carousel · 4-Slide Retargeting",
                "YouTube · Video Script + AI Avatar · 12 ethnicities · 30+ languages",
              ].map((label, i) => (
                <div key={i} className="rounded-xl border border-[#e8e0d4] bg-white p-4 text-sm font-medium text-[#6b5e4f] hover:border-amber-300 transition-colors">
                  {label}
                </div>
              ))}
            </div>
          </FadeSection>
          <FadeSection delay={200}>
            <div className="text-center mt-10">
              <Button size="lg" onClick={handleGetStarted} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg border-0 rounded-xl">
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
                Not days. Not weeks. Not a team of six. Just you, OTOBI AI, and results.
              </p>
            </div>
          </FadeSection>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                title: "Bring Your Product",
                description: "Paste a URL, upload images, or just describe it. OTOBI AI instantly understands your product's features, benefits, audience, positioning, and competitive landscape — in seconds.",
                icon: <Search className="w-8 h-8" />,
                gradient: "from-amber-400 to-orange-500",
              },
              {
                step: "02",
                title: "AI Creates Everything",
                description: "Blog posts, ad copy, video scripts, SEO content, email campaigns, social captions, PR releases, visual ads, AI avatar videos — all generated simultaneously across 22 content types.",
                icon: <Sparkles className="w-8 h-8" />,
                gradient: "from-orange-400 to-rose-500",
              },
              {
                step: "03",
                title: "Launch & Dominate",
                description: "Publish across 21+ platforms with optimal timing. Run funnels. A/B test automatically. Track leads. Share one-click client reports. Watch AI optimize what works and scale it.",
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

      {/* ═══════════════ WHY OTOBI AI (6 cards) ═══════════════ */}
      <section id="capabilities" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-16">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Why OTOBI AI</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                Not Another Marketing Tool.{" "}
                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">The Only One You Need.</span>
              </h2>
              <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
                Built with real marketing intelligence — not just a content generator bolted onto a scheduler.
              </p>
            </div>
          </FadeSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Brain className="w-6 h-6" />, title: "Thinks Like a CMO", desc: "Psychological targeting, persuasion frameworks (AIDA, Cialdini, PAS), audience psychographics, and emotional trigger mapping — all automated. Your AI marketing team never sleeps.", gradient: "from-purple-400 to-indigo-500", bg: "bg-purple-50" },
              { icon: <Rocket className="w-6 h-6" />, title: "Creates AND Publishes", desc: "Most tools stop at content creation. OTOBI AI deploys across 21+ platforms with optimal timing — smart scheduling built in, no third-party tools needed.", gradient: "from-amber-400 to-orange-500", bg: "bg-amber-50" },
              { icon: <TrendingUp className="w-6 h-6" />, title: "Predicts Before You Spend", desc: "Predictive scoring rates every ad before launch. A/B testing finds winners automatically. Campaign momentum analysis doubles down on what's already working.", gradient: "from-rose-400 to-pink-500", bg: "bg-rose-50" },
              { icon: <Eye className="w-6 h-6" />, title: "Competitor Intelligence", desc: "Website intelligence rivaling SimilarWeb. Traffic estimates, SEO analysis, tech stack detection, and actionable competitive insights — all inside your dashboard.", gradient: "from-emerald-400 to-teal-500", bg: "bg-emerald-50" },
              { icon: <Users className="w-6 h-6" />, title: "Runs Your Sales Pipeline", desc: "CRM, lead tracking, deal pipeline, round-robin assignment, funnels, forms, and email automation. Not just marketing assets — the full revenue operation.", gradient: "from-blue-400 to-cyan-500", bg: "bg-blue-50" },
              { icon: <Globe className="w-6 h-6" />, title: "Reach Anyone, Anywhere", desc: "30+ languages with automatic localization. Every major platform. Every ad format. From TikTok to LinkedIn to Amazon to TV/radio scripts — one tool, zero limits.", gradient: "from-orange-400 to-red-500", bg: "bg-orange-50" },
            ].map((prop, i) => (
              <FadeSection key={i} delay={i * 100}>
                <div className={`${prop.bg} rounded-2xl p-7 border border-[#e8e0d4] hover:border-amber-300 hover:shadow-lg transition-all h-full`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${prop.gradient} flex items-center justify-center text-white mb-5 shadow-lg`}>{prop.icon}</div>
                  <h3 className="text-lg font-bold mb-2 text-[#1a1a1a]">{prop.title}</h3>
                  <p className="text-[#6b5e4f] text-sm leading-relaxed">{prop.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 22 CONTENT TYPES ═══════════════ */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-[#FDFBF7] to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-10">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">22 Content Types</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                One AI Brain.{" "}
                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">Infinite Content.</span>
              </h2>
              <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
                Feed it any product, idea, or person. Watch it generate everything your marketing team would take weeks to produce.
              </p>
            </div>
          </FadeSection>
          <FadeSection delay={100}>
            <div className="flex flex-wrap justify-center gap-2.5">
              {["Ad Copy", "Video Scripts", "Email Campaigns", "Blog Posts", "SEO Content", "Social Captions", "PR Releases", "Landing Pages", "Podcast Scripts", "Product Listings", "UGC Scripts", "TV/Radio Ads", "Amazon Listings", "SMS Campaigns", "Newsletter Copy", "Funnel Pages", "Review Responses", "Competitor Briefs", "AI Avatar Videos", "Storyboards", "Client Reports", "A/B Test Variants"].map((type, i) => (
                <span key={i} className={`px-4 py-2 rounded-full border text-sm font-medium ${i < 4 ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-white border-[#e8e0d4] text-[#6b5e4f] hover:border-amber-300"}`}>
                  {type}
                </span>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ═══════════════ PLATFORMS ═══════════════ */}
      <section id="platforms" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">21+ Platforms</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                Publish Everywhere.{" "}
                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  From One Place.
                </span>
              </h2>
              <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
                Every platform has different formats, character limits, aspect ratios, and peak engagement times. OTOBI AI knows them all — and auto-optimizes for each one.
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

      {/* ═══════════════ COMPARISON TABLE — Better than Bacon ═══════════════ */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-amber-50/40 to-[#FDFBF7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">OTOBI AI vs. The Stack</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                Why Pay for 6 Tools
                <br />
                <span className="text-[#6b5e4f] font-bold">When One Does More?</span>
              </h2>
              <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
                OTOBI AI isn't just a creative tool — it's the full marketing operation, at one price.
              </p>
            </div>
          </FadeSection>
          <FadeSection delay={100}>
            <div className="overflow-x-auto rounded-2xl border border-[#e8e0d4] bg-white shadow-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e8e0d4] bg-amber-50/50">
                    <th className="text-left p-4 font-bold text-[#1a1a1a]">Capability</th>
                    <th className="p-4 font-medium text-[#9b8e7e]">Creative-Only Tools<br /><span className="text-xs">(e.g. Bacon, AdCreative)</span></th>
                    <th className="p-4 font-medium text-[#9b8e7e]">Content Tools<br /><span className="text-xs">(e.g. Jasper)</span></th>
                    <th className="p-4 font-bold text-amber-700 bg-amber-50">OTOBI AI</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["AI Image & Video Ads", "✓", "✗", "✓"],
                    ["Blog, SEO & Email Copy", "✗", "✓", "✓"],
                    ["Publish to 21+ Platforms", "✗", "✗", "✓"],
                    ["A/B Testing + Predictive Scoring", "✗", "✗", "✓"],
                    ["CRM, Leads & Deal Pipeline", "✗", "✗", "✓"],
                    ["Funnels & Landing Pages", "✗", "✗", "✓"],
                    ["Competitor Intelligence", "✗", "✗", "✓"],
                    ["AI Avatar Videos", "Partial", "✗", "12 ethnicities, 30+ languages"],
                    ["White-Label + API", "✗", "Limited", "✓ Business tier"],
                    ["Monthly Cost", "$129–$299/mo", "$99–$149/mo", "From $29/mo"],
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FDFBF7]"}>
                      <td className="p-4 font-medium text-[#1a1a1a]">{row[0]}</td>
                      <td className="p-4 text-center text-[#6b5e4f]">{row[1]}</td>
                      <td className="p-4 text-center text-[#6b5e4f]">{row[2]}</td>
                      <td className="p-4 text-center font-semibold text-amber-800 bg-amber-50/50">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <div className="mb-6">
                  <p className="text-xs font-semibold text-[#9b8e7e] uppercase tracking-wider mb-2">AI-Generated Video Actors</p>
                  <div className="flex flex-wrap gap-2">
                    {AI_ACTOR_AVATARS.map((avatar, j) => (
                      <img
                        key={j}
                        src={avatar}
                        alt=""
                        role="presentation"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md ring-1 ring-[#e8e0d4]"
                        loading="lazy"
                      />
                    ))}
                  </div>
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
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Proven Results</p>
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

      {/* ═══════════════ SOCIAL PROOF: TESTIMONIALS & TRUSTED BY ═══════════════ */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-[#FDFBF7] to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Trusted by Marketers</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                What <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">People Say</span>
              </h2>
            </div>
          </FadeSection>
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { quote: "OTOBI AI cut our content production time by 80%. One tool for everything — ads, email, social. I cancelled 4 other subscriptions in the first week.", name: "Sarah M.", role: "Head of Marketing, SaaS Company", avatar: TESTIMONIAL_AVATARS[0] },
              { quote: "We run funnels, forms, and client reports from one place. Our clients love the one-click report links — it's made us look like a much bigger agency than we are.", name: "James K.", role: "Agency Owner", avatar: TESTIMONIAL_AVATARS[1] },
              { quote: "The AI CMO agent and predictive scoring are genuinely different from anything I've used. We ship winning campaigns faster and spend way less time guessing what will work.", name: "Alex T.", role: "Growth Lead, E-commerce Brand", avatar: TESTIMONIAL_AVATARS[2] },
            ].map((t, i) => (
              <FadeSection key={i} delay={i * 100}>
                <div className="bg-white rounded-2xl p-6 border border-[#e8e0d4] shadow-sm h-full flex flex-col">
                  <div className="flex items-center gap-1 mb-3">
                    {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-[#6b5e4f] mb-4 flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-amber-100" loading="lazy" />
                    <div>
                      <span className="font-semibold text-sm text-[#1a1a1a] block">{t.name}</span>
                      <span className="text-xs text-[#9b8e7e]">{t.role}</span>
                    </div>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
          <FadeSection delay={300}>
            <div className="text-center">
              <p className="text-xs font-medium text-[#9b8e7e] uppercase tracking-wider mb-6">Trusted by teams everywhere</p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
                {["SaaS Brands", "Agencies", "E‑commerce", "Creators", "Startups"].map((label, i) => (
                  <span key={i} className="text-sm font-medium text-[#6b5e4f]">{label}</span>
                ))}
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ═══════════════ FULL CAPABILITIES GRID ═══════════════ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                22+ Integrated Modules.{" "}
                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  One Platform.
                </span>
              </h2>
              <p className="text-lg text-[#6b5e4f] max-w-2xl mx-auto">
                Everything you need to dominate marketing — create, convert, and close. Nothing you don't.
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
              { icon: <GitBranch className="w-5 h-5" />, name: "Funnels", desc: "Multi-step funnels: landing, form, payment, thank-you" },
              { icon: <FileQuestion className="w-5 h-5" />, name: "Forms", desc: "Standalone forms, share link, lead capture" },
              { icon: <Star className="w-5 h-5" />, name: "Reviews", desc: "Review sources & replies in one dashboard" },
              { icon: <FileBarChart className="w-5 h-5" />, name: "One-Click Reports", desc: "Shareable report links for clients" },
              { icon: <BarChart3 className="w-5 h-5" />, name: "A/B Testing", desc: "Auto-optimize winning variants" },
              { icon: <Clock className="w-5 h-5" />, name: "Smart Scheduler", desc: "Optimal timing, auto-posting" },
              { icon: <Users className="w-5 h-5" />, name: "Lead Manager & CRM", desc: "Pipeline, deal tracking, round-robin assignment" },
              { icon: <LineChart className="w-5 h-5" />, name: "Analytics", desc: "Cross-platform insights" },
              { icon: <Bot className="w-5 h-5" />, name: "AI Marketing Agent", desc: "Chat-based strategy advisor" },
              { icon: <Eye className="w-5 h-5" />, name: "Website Intelligence", desc: "SimilarWeb-level analysis" },
              { icon: <Search className="w-5 h-5" />, name: "SEO Audit Engine", desc: "Keywords, rank tracking, site audit" },
              { icon: <Target className="w-5 h-5" />, name: "Ad Platform Hub", desc: "Connect Meta, Google, TikTok, etc." },
              { icon: <TrendingUp className="w-5 h-5" />, name: "Predictive AI", desc: "Score ads before launch" },
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
                Try All Modules Free <ArrowRight className="w-5 h-5" />
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
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

      {/* ═══════════════ INTERACTIVE DEMO ═══════════════ */}
      <InteractiveDemo />

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
                  Join thousands of businesses using OTOBI AI to create, publish, and optimize marketing campaigns across every platform.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    size="lg"
                    onClick={handleGetStarted}
                    className="text-base px-10 py-6 gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl shadow-amber-500/30 border-0 rounded-xl"
                  >
                    Start Creating for Free <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-xl border-[#d4c9b8] text-[#6b5e4f] hover:bg-amber-50" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
                    See How It Works
                  </Button>
                </div>
                <p className="text-sm text-[#9b8e7e] mt-4">No credit card required · Free plan available forever · Cancel anytime</p>
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
                <span className="font-extrabold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">OTOBI AI</span>
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
                <a href="#capabilities" className="block text-sm text-[#6b5e4f] hover:text-[#1a1a1a]">AI Content & Creatives</a>
                <a href="#capabilities" className="block text-sm text-[#6b5e4f] hover:text-[#1a1a1a]">Funnels & Forms</a>
                <a href="#capabilities" className="block text-sm text-[#6b5e4f] hover:text-[#1a1a1a]">Reviews & Reports</a>
                <a href="#capabilities" className="block text-sm text-[#6b5e4f] hover:text-[#1a1a1a]">Lead CRM & Campaigns</a>
                <a href="#capabilities" className="block text-sm text-[#6b5e4f] hover:text-[#1a1a1a]">Video Ad Studio</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3 text-[#1a1a1a]">Company</h4>
              <div className="space-y-2">
                <Link href="/about" className="block text-sm text-[#6b5e4f] hover:text-[#1a1a1a]">About</Link>
                <Link href="/blog" className="block text-sm text-[#6b5e4f] hover:text-[#1a1a1a]">Blog</Link>
                <Link href="/contact" className="block text-sm text-[#6b5e4f] hover:text-[#1a1a1a]">Contact</Link>
                <Link href="/privacy" className="block text-sm text-[#6b5e4f] hover:text-[#1a1a1a]">Privacy Policy</Link>
                <Link href="/terms" className="block text-sm text-[#6b5e4f] hover:text-[#1a1a1a]">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[#e8e0d4] text-center text-sm text-[#9b8e7e]">
            &copy; {new Date().getFullYear()} OTOBI AI. All rights reserved. · Built for marketers who ship fast.
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
