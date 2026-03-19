import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginPageUrl } from "@/const";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight, Sparkles, Zap, Check, Play, Menu, X, ChevronRight,
  Bot, PenTool, Palette, Video, BarChart3, Target, Mail, Globe,
  Brain, TrendingUp, Users, Shield, Layers, Workflow, Star,
} from "lucide-react";

/* ─── Hooks ───────────────────────────────────────────── */
function useFadeIn(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Data ────────────────────────────────────────────── */
const BRANDS = ["Publicis Groupe", "WPP", "Dentsu", "Omnicom", "Havas", "TBWA", "McCann", "Leo Burnett", "Ogilvy", "Grey", "DDB", "Y&R", "Wieden+Kennedy", "Droga5"];

// Photorealistic Unsplash images — real marketing scenarios
const HERO_OUTPUTS = [
  { src: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop&crop=center", label: "Social Ad", platform: "Instagram" },
  { src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop&crop=center", label: "Brand Campaign", platform: "Facebook" },
  { src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop&crop=center", label: "Analytics", platform: "Dashboard" },
  { src: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=400&h=400&fit=crop&crop=center", label: "Product Launch", platform: "TikTok" },
  { src: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=400&fit=crop&crop=center", label: "Team Campaign", platform: "LinkedIn" },
  { src: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=400&fit=crop&crop=center", label: "Email Campaign", platform: "Email" },
];

const USE_CASES = [
  {
    title: "Ad Creatives that stop the scroll",
    desc: "AI generates platform-perfect visuals for every channel — Facebook, Instagram, TikTok, Google, Amazon — in every format, every ratio.",
    img: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&h=400&fit=crop",
    tag: "Creative Engine",
    tagColor: "badge-brand",
  },
  {
    title: "Video campaigns from a single prompt",
    desc: "Script → storyboard → video with AI actors, voiceover, contextual music and SFX. Production quality in minutes, not weeks.",
    img: "https://images.unsplash.com/photo-1536240478700-b869ad10e128?w=600&h=400&fit=crop",
    tag: "Video Studio",
    tagColor: "badge-danger",
  },
  {
    title: "Full-funnel email sequences",
    desc: "7-email welcome series, product launches, re-engagement drips — written in your brand voice and sent from one dashboard.",
    img: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600&h=400&fit=crop",
    tag: "Email Marketing",
    tagColor: "badge-cyan",
  },
  {
    title: "Competitor intelligence, live",
    desc: "Deep SWOT analysis, ad spy, SEO audit, social audit — everything about your competitors updated in real time.",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    tag: "Competitor Intel",
    tagColor: "badge-warning",
  },
  {
    title: "Lead-to-close in one system",
    desc: "Capture leads from forms and funnels. Auto-assign via round-robin. Move deals through CRM pipeline. One place, full visibility.",
    img: "https://images.unsplash.com/photo-1552581234-26160f608093?w=600&h=400&fit=crop",
    tag: "CRM & Leads",
    tagColor: "badge-success",
  },
  {
    title: "Analytics that tell you what to do next",
    desc: "Campaign momentum, predictive scoring, A/B test winners, SEO rankings — all synthesized into a clear action plan by the AI.",
    img: "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=600&h=400&fit=crop",
    tag: "Intelligence",
    tagColor: "badge-brand",
  },
];

const MODULES = [
  { icon: Bot,        name: "AI Agents",          desc: "Chat-driven campaign execution" },
  { icon: PenTool,    name: "Content Studio",      desc: "22 content types, any platform" },
  { icon: Palette,    name: "Creative Engine",     desc: "AI images, ads, graphics" },
  { icon: Video,      name: "Video Ads",           desc: "Scripts, avatars, storyboards" },
  { icon: Mail,       name: "Email Marketing",     desc: "Lists, campaigns, sending" },
  { icon: Target,     name: "Funnels & Forms",     desc: "Landing pages, lead capture" },
  { icon: Globe,      name: "Competitor Intel",    desc: "SWOT, ad spy, real-time alerts" },
  { icon: Users,      name: "CRM & Leads",         desc: "Pipeline, round-robin, deals" },
  { icon: Brain,      name: "Predictive AI",       desc: "Score before you spend" },
  { icon: BarChart3,  name: "Analytics",           desc: "Cross-platform performance" },
  { icon: TrendingUp, name: "SEO Audits",          desc: "Rankings, keywords, fixes" },
  { icon: Layers,     name: "Programmatic DSP",    desc: "Built-in ad buying wallet" },
  { icon: Workflow,   name: "Automations",         desc: "Trigger-based workflows" },
  { icon: Shield,     name: "Approval Workflows",  desc: "Team review chains" },
  { icon: Star,       name: "Reviews",             desc: "Monitor and reply, one place" },
  { icon: Zap,        name: "Webhooks",            desc: "Zapier/Make integrations" },
];

const STACK_REPLACE = [
  { tool: "Jasper AI",       cost: "$99/mo",  what: "Content generation" },
  { tool: "AdCreative.ai",   cost: "$129/mo", what: "Visual ad creatives" },
  { tool: "Hootsuite",       cost: "$99/mo",  what: "Social scheduling" },
  { tool: "HubSpot CRM",     cost: "$50/mo",  what: "CRM + leads" },
  { tool: "SimilarWeb",      cost: "$249/mo", what: "Competitor intel" },
  { tool: "Unbounce",        cost: "$99/mo",  what: "Landing pages" },
];

const PRICING = [
  { name: "Free",         price: "$0",   period: "forever", features: ["5 AI generations/mo", "2 images/mo", "1 product", "Basic analytics"], cta: "Start free", popular: false },
  { name: "Starter",      price: "$29",  period: "/month",  features: ["50 generations/mo", "15 images/mo", "All 22 content types", "Scheduler + A/B tests"], cta: "Start 7-day trial", popular: false },
  { name: "Professional", price: "$79",  period: "/month",  features: ["200 generations/mo", "50 images/mo", "5 team seats", "Voice AI + CRM + Predictive AI", "Campaign momentum"], cta: "Start 7-day trial", popular: true },
  { name: "Business",     price: "$199", period: "/month",  features: ["800 generations/mo", "15 seats (+$12/extra)", "White-label + API", "All ad platforms", "Dedicated manager", "99.9% SLA"], cta: "Start 7-day trial", popular: false },
];

const TESTIMONIALS = [
  { quote: "We cancelled four subscriptions the first week. OmniAI does everything — from competitor analysis to email campaigns — in one place.", name: "Sarah M.", role: "Head of Marketing, SaaS Co", initials: "SM", color: "#7c3aed" },
  { quote: "The AI agents are genuinely different. I describe a campaign, it builds the landing page, email sequence, and social posts. One prompt.", name: "James K.", role: "Agency Owner", initials: "JK", color: "#06b6d4" },
  { quote: "Predictive scoring and momentum analysis changed how we spend. We stopped guessing and started scaling what actually works.", name: "Alex T.", role: "Growth Lead, E-commerce", initials: "AT", color: "#10b981" },
];

/* ─── Marquee component ───────────────────────────────── */
function Marquee({ items, reverse = false, duration = 30 }: { items: string[]; reverse?: boolean; duration?: number }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden w-full">
      <div
        className={reverse ? "animate-marquee-reverse" : "animate-marquee"}
        style={{ "--marquee-duration": `${duration}s`, display: "flex", gap: "0" } as React.CSSProperties}
      >
        {doubled.map((item, i) => (
          <span key={i} className="text-xs font-bold text-zinc-700 tracking-widest uppercase shrink-0 px-6 border-r border-zinc-900 last:border-0">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────── */
export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) window.location.replace("/dashboard");
  }, [isAuthenticated, loading]);

  const go = () => { window.location.href = getLoginPageUrl(); };

  return (
    <div className="min-h-screen bg-[#09090b] text-white" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ═══ NAV ═══════════════════════════════════════ */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between h-16 px-5 sm:px-8"
        style={{ background: "rgba(9,9,11,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base text-white">OmniAI</span>
          <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}>
            Marketing OS
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "Pricing", "Platforms"].map(n => (
            <a key={n} href={`#${n.toLowerCase()}`} className="text-sm text-zinc-400 hover:text-white transition-colors font-medium">{n}</a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={go} className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors font-medium">Sign in</button>
          <button onClick={go} className="text-sm font-semibold px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-100 transition-all">
            Get started free
          </button>
          <button className="md:hidden text-zinc-400" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="md:hidden px-5 py-4 space-y-3" style={{ background: "rgba(9,9,11,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {["Features", "Pricing", "Platforms"].map(n => (
            <a key={n} href={`#${n.toLowerCase()}`} className="block text-sm text-zinc-400 font-medium py-1" onClick={() => setMobileOpen(false)}>{n}</a>
          ))}
        </div>
      )}

      {/* ═══ HERO ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-20 pb-16 mesh-bg">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 text-xs font-bold tracking-wide" style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              THE MARKETING OS — ONE PLATFORM, EVERYTHING
            </div>
          </FadeIn>

          <FadeIn delay={80}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              <span style={{ background: "linear-gradient(180deg,#fff 30%,rgba(255,255,255,0.55))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Your entire marketing team.
              </span>
              <br />
              <span style={{ background: "linear-gradient(135deg,#a78bfa 0%,#7c3aed 40%,#06b6d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                One subscription.
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={160}>
            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              AI agents that create ads, videos, email campaigns, landing pages, and social content — then publish across 21+ platforms. Content, creatives, CRM, and programmatic DSP in one system.
            </p>
          </FadeIn>

          <FadeIn delay={240}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <button onClick={go} className="flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm bg-white text-black hover:bg-zinc-100 transition-all shadow-xl shadow-white/10">
                Start free — no card required <ArrowRight className="h-4 w-4" />
              </button>
              <button
                className="flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm text-zinc-400 hover:text-white transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Play className="h-4 w-4" /> See what it does
              </button>
            </div>
          </FadeIn>

          {/* Photorealistic output grid */}
          <FadeIn delay={320}>
            <div className="relative">
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 30%, #09090b 90%)", zIndex: 10 }} />
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-3xl mx-auto">
                {HERO_OUTPUTS.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl overflow-hidden relative animate-fade-in"
                    style={{ animationDelay: `${400 + i * 80}ms`, border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <img src={item.src} alt={item.label} className="w-full aspect-square object-cover" loading="lazy" />
                    <div className="absolute bottom-0 inset-x-0 p-1.5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}>
                      <p className="text-[9px] font-bold text-white/70 truncate">{item.platform}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-700 mt-4 text-center">← Real outputs generated by OmniAI →</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ BRAND MARQUEE ══════════════════════════════ */}
      <section className="py-6 overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "#0c0c0e" }}>
        <p className="text-center text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-5">Force multiplying teams at</p>
        <div className="space-y-2">
          <Marquee items={BRANDS} duration={28} />
          <Marquee items={[...BRANDS].reverse()} reverse duration={34} />
        </div>
      </section>

      {/* ═══ FEATURES / USE CASES ═══════════════════════ */}
      <section id="features" className="py-24 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">What OmniAI does</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                <span style={{ background: "linear-gradient(180deg,#fff 30%,rgba(255,255,255,0.55))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Every marketing function.
                </span>
                <br />
                <span style={{ background: "linear-gradient(135deg,#a78bfa 0%,#06b6d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  One command center.
                </span>
              </h2>
              <p className="text-zinc-400 max-w-xl mx-auto">Not a content tool. Not a scheduler. Not a CRM. The whole marketing operation — create, publish, convert, and close — from a single AI-driven platform.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {USE_CASES.map((uc, i) => (
              <FadeIn key={i} delay={Math.min(i * 60, 300)}>
                <div className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1" style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="relative overflow-hidden h-44">
                    <img
                      src={uc.img}
                      alt={uc.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))" }} />
                    <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full ${uc.tagColor}`}>{uc.tag}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-sm text-white mb-1.5">{uc.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{uc.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AGENT DEMO SECTION ══════════════════════════ */}
      <section className="py-20 px-5 sm:px-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "linear-gradient(to bottom, #09090b, #0d0d10)" }}>
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">The AI Agent Experience</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                <span className="text-white">From chatbox to</span>{" "}
                <span style={{ background: "linear-gradient(135deg,#a78bfa,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  production-ready assets
                </span>
              </h2>
              <p className="text-zinc-400 max-w-lg mx-auto text-sm">Describe your campaign. Parallel sub-agents fire simultaneously — strategy, content, creatives, email, social posts — and deliver a complete asset library.</p>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="rounded-2xl overflow-hidden" style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.07)" }}>
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: "#0c0c0e", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="ml-3 text-xs text-zinc-600 font-mono">OmniAI Agent</span>
                <span className="ml-auto agent-pill running"><span className="dot" />Live</span>
              </div>

              {/* Chat + agent status */}
              <div className="p-5 space-y-4">
                {/* User prompt */}
                <div className="flex gap-3 justify-end">
                  <div className="max-w-md rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
                    Launch my luxury watch brand "OBSIDIAN" — targeting affluent men 35-55, concept: borrowed time
                  </div>
                </div>

                {/* Agent response */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-zinc-400 mb-3 font-mono">Got it. Firing sub-agents in parallel...</p>

                    {/* Sub-agent cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                      {[
                        { name: "Strategy", status: "done",    icon: "🎯", color: "#7c3aed", output: "Brief ready" },
                        { name: "Content",  status: "done",    icon: "✍️", color: "#06b6d4", output: "12 pieces" },
                        { name: "Creative", status: "running", icon: "🎨", color: "#ec4899", output: "Generating..." },
                        { name: "Video",    status: "idle",    icon: "🎬", color: "#ef4444", output: "Queued" },
                        { name: "Email",    status: "done",    icon: "📧", color: "#3b82f6", output: "7 emails" },
                        { name: "Social",   status: "done",    icon: "📱", color: "#10b981", output: "21 posts" },
                        { name: "SEO",      status: "running", icon: "🔍", color: "#f59e0b", output: "Auditing..." },
                        { name: "Landing",  status: "done",    icon: "🔗", color: "#8b5cf6", output: "Page live" },
                      ].map((agent, i) => (
                        <div
                          key={agent.name}
                          className="rounded-xl p-3 animate-agent-spawn"
                          style={{
                            background: `${agent.color}10`,
                            border: `1px solid ${agent.color}25`,
                            animationDelay: `${i * 120}ms`,
                          }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm">{agent.icon}</span>
                            <span className={`agent-pill ${agent.status} text-[9px]`}><span className="dot" />{agent.status}</span>
                          </div>
                          <p className="text-[10px] font-bold text-zinc-200">{agent.name}</p>
                          <p className="text-[9px] text-zinc-600 mt-0.5">{agent.output}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl p-3 text-xs text-zinc-400" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                      ✅ Campaign "OBSIDIAN — Borrowed Time" complete. 12 content pieces, 7 emails, 21 social posts, 1 landing page, 6 ad creatives, SEO brief — all saved to your library.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="text-center mt-8">
              <button onClick={go} className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-violet-600 hover:bg-violet-500 text-white transition-all mx-auto shadow-lg shadow-violet-500/25">
                <Zap className="h-4 w-4" /> Try it free — no card required
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ 16 MODULE GRID ══════════════════════════════ */}
      <section className="py-20 px-5 sm:px-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">22+ Integrated Modules</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Everything. One platform.</h2>
              <p className="text-zinc-400 text-sm max-w-lg mx-auto">Every module is wired end-to-end — front-end, back-end, database, AI. No placeholders, no stubs.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MODULES.map((m, i) => (
              <FadeIn key={i} delay={Math.min(i * 40, 320)}>
                <div className="group glass glass-hover rounded-xl p-4 transition-all">
                  <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center" style={{ background: "rgba(124,58,237,0.12)" }}>
                    <m.icon className="h-4 w-4 text-violet-400" />
                  </div>
                  <p className="text-sm font-bold text-zinc-200">{m.name}</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">{m.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STACK KILLER ════════════════════════════════ */}
      <section className="py-20 px-5 sm:px-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#0c0c0e" }}>
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">The Real ROI</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Stop paying $725/mo for 6 tools</h2>
              <p className="text-zinc-400 text-sm">OmniAI replaces your entire marketing stack at a fraction of the cost.</p>
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="flex flex-col lg:flex-row items-center gap-8 justify-center">
              {/* Old stack */}
              <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-4">Your current stack</p>
                <div className="space-y-2.5">
                  {STACK_REPLACE.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-zinc-400 line-through">{s.tool}</span>
                        <span className="text-[10px] text-zinc-700 ml-2">{s.what}</span>
                      </div>
                      <span className="text-sm text-zinc-500 line-through">{s.cost}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-4 pt-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <p className="text-lg font-black text-white">$725<span className="text-sm font-normal text-zinc-500">/month</span></p>
                </div>
              </div>

              <div className="text-2xl font-black text-zinc-700">→</div>

              {/* OmniAI */}
              <div className="w-full max-w-sm rounded-2xl p-8 text-center glow-brand" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.08))", border: "1px solid rgba(124,58,237,0.35)" }}>
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-3">OmniAI Pro</p>
                <p className="text-5xl font-black text-white mb-1">$79<span className="text-lg font-normal text-zinc-400">/mo</span></p>
                <p className="text-sm text-zinc-400 mb-5">Everything included</p>
                <div className="space-y-1.5 text-left mb-6">
                  {["Content + creatives", "Video ads + avatars", "CRM + funnels", "Competitor intel", "Email marketing", "Programmatic DSP"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <button onClick={go} className="w-full py-2.5 rounded-xl font-bold text-sm bg-white text-black hover:bg-zinc-100 transition-all">
                  Start 7-day free trial
                </button>
                <p className="text-[10px] text-zinc-600 mt-2">Save 89% vs. your current stack</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ PRICING ═════════════════════════════════════ */}
      <section id="pricing" className="py-20 px-5 sm:px-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Pricing</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Simple pricing, no surprises</h2>
              <p className="text-zinc-400 text-sm">Free forever plan. Paid plans start at $29. Cancel anytime.</p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRICING.map((plan, i) => (
              <FadeIn key={i} delay={i * 70}>
                <div
                  className={`relative rounded-2xl p-6 flex flex-col h-full transition-all ${plan.popular ? "glow-brand" : ""}`}
                  style={{
                    background: plan.popular ? "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,182,212,0.06))" : "#111113",
                    border: plan.popular ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>
                      Most Popular
                    </div>
                  )}
                  <div className="mb-5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{plan.name}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">{plan.price}</span>
                      <span className="text-zinc-500 text-sm">{plan.period}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 mb-5">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-zinc-400">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={go}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${plan.popular ? "bg-white text-black hover:bg-zinc-100" : "text-zinc-300 hover:text-white hover:border-white/20"}`}
                    style={plan.popular ? {} : { border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {plan.cta}
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ════════════════════════════════ */}
      <section className="py-20 px-5 sm:px-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#0c0c0e" }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn><p className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-10">What customers say</p></FadeIn>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="glass rounded-2xl p-6 h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(s => <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-zinc-400 italic flex-1 mb-5">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `${t.color}20`, color: t.color }}>{t.initials}</div>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-xs text-zinc-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══════════════════════════════════ */}
      <section className="py-24 px-5 sm:px-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <div className="relative">
              <div className="absolute -inset-12 rounded-3xl blur-3xl opacity-15" style={{ background: "radial-gradient(ellipse,#7c3aed 0%,transparent 70%)" }} />
              <div className="relative">
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
                  Your marketing team.<br />
                  <span style={{ background: "linear-gradient(135deg,#a78bfa,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    Powered by AI. Owned by you.
                  </span>
                </h2>
                <p className="text-zinc-400 mb-10 text-base">Join thousands of marketers, agencies, and founders using OmniAI to grow faster.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={go} className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-base bg-white text-black hover:bg-zinc-100 transition-all shadow-2xl shadow-white/10">
                    Start free — no card required <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-zinc-700 mt-5">Free plan available forever · Cancel anytime · 7-day trial on paid plans</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════ */}
      <footer className="py-12 px-5 sm:px-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#0c0c0e" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-10 mb-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-bold text-white">OmniAI</span>
                <span className="text-[9px] font-bold text-violet-400">Marketing OS</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">The complete AI marketing platform. Create content, run campaigns, manage leads, and grow — all from one intelligent system.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-1 text-xs">
              {[
                { h: "Product",   links: ["Features", "Pricing", "Platforms", "AI Agents"] },
                { h: "Tools",     links: ["Content Studio", "Creative Engine", "Video Ads", "Email Marketing"] },
                { h: "Intelligence", links: ["Competitor Intel", "SEO Audits", "Analytics", "Predictive AI"] },
                { h: "Company",   links: ["About", "Blog", "Contact", "Terms", "Privacy"] },
              ].map((col, i) => (
                <div key={i}>
                  <p className="font-bold text-zinc-500 mb-3 text-[10px] uppercase tracking-wider">{col.h}</p>
                  <div className="space-y-2">
                    {col.links.map((l, j) => (
                      <a key={j} href="#" className="block text-zinc-600 hover:text-zinc-400 transition-colors">{l}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-700" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p>© {new Date().getFullYear()} OmniAI. All rights reserved.</p>
            <p>The Marketing OS — Create · Publish · Convert · Close</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
