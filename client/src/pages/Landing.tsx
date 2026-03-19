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
  Check,
  ChevronRight,
  Play,
  Star,
  Rocket,
  Eye,
  Search,
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
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

/* ─────────────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────────────── */
function useFadeIn(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeIn({
  children,
  className = "",
  delay = 0,
  from = "bottom",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  from?: "bottom" | "left" | "right" | "none";
}) {
  const { ref, visible } = useFadeIn();
  const map: Record<string, string> = { bottom: "translate-y-10", left: "-translate-x-10", right: "translate-x-10", none: "" };
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${map[from]}`} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   SCROLLING MARQUEE
───────────────────────────────────────────────────── */
function Marquee({ items, speed = 40, reverse = false }: { items: string[]; speed?: number; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden w-full">
      <div
        className={reverse ? "omni-marquee-reverse" : "omni-marquee"}
        style={{ "--ms": `${speed}s` } as React.CSSProperties}
      >
        {doubled.map((item, i) => (
          <span key={i} className="text-xs font-bold text-white/30 tracking-widest uppercase shrink-0 px-6 border-r border-white/10 last:border-0">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────── */
const BRANDS = ["Publicis Groupe", "Serviceplan", "Mazda", "Dentsu", "Adidas", "Humain", "WPP", "Omnicom", "Havas", "TBWA", "Leo Burnett", "Wieden+Kennedy"];

const USE_CASES = [
  { title: "Infinite brand identity explorations", desc: "Direct a full, multi-asset campaign with cohesive visuals and variations, ready to run everywhere.", emoji: "🎨" },
  { title: "Product visuals in all angles", desc: "Create polished lifestyle and hero shots for e-commerce, social, and marketplaces, in every format.", emoji: "📸" },
  { title: "Social media video ads for every channel", desc: "Quickly create short-form video ads with hooks, captions, and formats tailored for every platform.", emoji: "🎬" },
  { title: "Presentation-ready slide decks", desc: "Turn ideas into clean, well-structured slide decks using flexible templates.", emoji: "📊" },
  { title: "Storyboards for every possible arc", desc: "Develop characters, story arcs, and episode boards — then bring the pilot to life.", emoji: "🎭" },
  { title: "Smarter A/B testing variants", desc: "Design polished app screenshots with clear benefits, layouts, and platform-specific framing.", emoji: "⚡" },
  { title: "On-model photography with every angle", desc: "Produce realistic on-model photography with diverse poses, body types, and styling contexts.", emoji: "👗" },
  { title: "Explore packaging & label mockups", desc: "Visualize packaging and labels in photorealistic 3D — from shelf views to close-ups.", emoji: "📦" },
  { title: "Localize a video into multiple languages", desc: "Translate and localize videos with natural voiceovers and synced visuals across languages.", emoji: "🌍" },
  { title: "Transform data into infographics", desc: "Transform data and ideas into clear, visually engaging infographics.", emoji: "📈" },
  { title: "Turn a podcast clip into a video", desc: "Turn podcast audio into engaging video clips with captions, visuals, and B-roll.", emoji: "🎙️" },
  { title: "Property storytelling at scale", desc: "Craft compelling real estate narratives across all formats and channels.", emoji: "🏠" },
];

const MODELS = [
  { name: "Uni-1", tag: "Understanding + Generation", color: "#6366f1" },
  { name: "Ray3.14", tag: "Native 1080p · 3x cheaper", color: "#8b5cf6" },
  { name: "Ray3.14 HDR", tag: "World's first HDR model", color: "#a855f7" },
  { name: "Sora 2", tag: "OpenAI Video", color: "#06b6d4" },
  { name: "Veo 3.1", tag: "Google DeepMind", color: "#10b981" },
  { name: "GPT Image 1.5", tag: "OpenAI Image", color: "#f59e0b" },
  { name: "ElevenLabs v3", tag: "Voice Synthesis", color: "#ef4444" },
  { name: "Kling", tag: "Video Generation", color: "#ec4899" },
  { name: "Seedream", tag: "Creative Generation", color: "#14b8a6" },
];

const TESTIMONIALS = [
  { quote: "OmniAI allows us to embed generative AI directly into the production pipeline in a way that strengthens storytelling, protects performance, and accelerates innovation.", name: "Jon Erwin", role: "Founder, The Wonder Project", initials: "JE", color: "#6366f1" },
  { quote: "We believe the next era of creativity will be defined by how intelligently we integrate AI into the core of our operating model. OmniAI lets us move beyond isolated AI experiments and toward a unified, scalable creative system.", name: "Bassel Kakish", role: "CEO, Publicis Groupe Middle East & Turkey", initials: "BK", color: "#8b5cf6" },
  { quote: "OmniAI cut our content production time by 80%. One tool for everything — ads, email, social. We cancelled four other subscriptions in the first week.", name: "Sarah M.", role: "Head of Marketing, SaaS Company", initials: "SM", color: "#06b6d4" },
];

const PRICING_PLANS = [
  { name: "Plus", price: 30, period: "/month", desc: "OmniAI and third-party image and video models", features: ["Edit access for guest collaborators", "Commercial use", "All major models included"], cta: "Try for free", popular: false },
  { name: "Pro", price: 90, period: "/month", desc: "Everything in Plus, with:", features: ["4× usage with OmniAI Agents", "Priority generation queue", "Advanced analytics dashboard"], cta: "Try for free", popular: true },
  { name: "Ultra", price: 300, period: "/month", desc: "Everything in Pro, with:", features: ["15× usage with OmniAI Agents", "Dedicated support channel", "Custom fine-tuning access"], cta: "Try for free", popular: false },
  { name: "Enterprise", price: 0, period: "", desc: "Everything in Ultra, plus:", features: ["Enterprise commitments & SLA", "Dedicated education and training", "SSO + usage analytics + spend limits"], cta: "Contact us", popular: false, custom: true },
];

const DIFF_PILLARS = [
  { icon: <Bot className="w-5 h-5" />, title: "Creative Agents", desc: "Physically intelligent creative agents embedded into your workflow, advancing creative work end-to-end while maintaining shared context across teams." },
  { icon: <Layers className="w-5 h-5" />, title: "Shared Context", desc: "Context moves through agents across teams, carrying shared intelligence across video, image, audio, and text so work advances from concept to delivery." },
  { icon: <Users className="w-5 h-5" />, title: "Collaboration", desc: "Enable internal teams, external partners, and agents to operate in parallel under shared intelligence, accelerating output without added overhead." },
  { icon: <TrendingUp className="w-5 h-5" />, title: "Scaled Production", desc: "Redefine scale by expanding what a single team can produce, enabling organizations to operate at levels of creative output previously out of reach." },
];

/* ─────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────── */
export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [annual, setAnnual] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) window.location.replace("/dashboard");
  }, [isAuthenticated, loading]);

  const go = () => { window.location.href = getLoginPageUrl(); };

  return (
    <div className="omni-root min-h-screen bg-[#080808] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&display=swap');
        .omni-root { font-family: 'Sora', system-ui, sans-serif; }
        .omni-display { font-family: 'Cormorant Garamond', Georgia, serif; }
        @keyframes omni-march { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes omni-march-r { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
        .omni-marquee { display:flex; gap:0; white-space:nowrap; animation: omni-march var(--ms,40s) linear infinite; }
        .omni-marquee-reverse { display:flex; gap:0; white-space:nowrap; animation: omni-march-r var(--ms,40s) linear infinite; }
        @keyframes omni-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        .omni-float { animation: omni-float 6s ease-in-out infinite; }
        .omni-float-2 { animation: omni-float 6s ease-in-out 1.5s infinite; }
        .omni-float-3 { animation: omni-float 6s ease-in-out 3s infinite; }
        .omni-border { border-color: rgba(255,255,255,0.07); }
        .omni-card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); }
        .omni-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.12); }
        .omni-glow-v { background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.2) 0%, transparent 70%); }
        .omni-tg-white { background: linear-gradient(135deg, #fff 20%, rgba(255,255,255,0.55) 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .omni-tg-violet { background: linear-gradient(135deg, #a5b4fc 0%, #c084fc 60%, #f0abfc 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .omni-popular { background: linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%); border-color: rgba(99,102,241,0.35) !important; }
        .omni-btn-white { background:#fff; color:#000; border-radius:9999px; font-weight:600; font-size:.875rem; padding:.75rem 1.75rem; transition:all .2s; display:inline-flex; align-items:center; gap:.5rem; }
        .omni-btn-white:hover { background:rgba(255,255,255,.9); }
        .omni-btn-ghost { background:transparent; color:rgba(255,255,255,.55); border:1px solid rgba(255,255,255,.1); border-radius:9999px; font-weight:600; font-size:.875rem; padding:.75rem 1.75rem; transition:all .2s; display:inline-flex; align-items:center; gap:.5rem; }
        .omni-btn-ghost:hover { color:#fff; border-color:rgba(255,255,255,.25); }
      `}</style>

      {/* NAV */}
      <nav style={{ position:"sticky", top:0, zIndex:50, background:"rgba(8,8,8,0.88)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">OmniAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Product","Pricing","Enterprise","News"].map(n=>(
              <a key={n} href={`#${n.toLowerCase()}`} className="text-sm text-white/50 hover:text-white transition-colors font-medium">{n}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={go} className="hidden md:block text-sm text-white/50 hover:text-white transition-colors font-medium">Sign In</button>
            <button onClick={go} className="omni-btn-white text-xs py-2 px-4">Join us</button>
            <button className="md:hidden text-white/50" onClick={()=>setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }} className="px-4 py-4 space-y-3 md:hidden">
            {["Product","Pricing","Enterprise","News"].map(n=>(
              <a key={n} href={`#${n.toLowerCase()}`} className="block text-sm text-white/50 hover:text-white font-medium py-1" onClick={()=>setMobileOpen(false)}>{n}</a>
            ))}
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="omni-glow-v relative overflow-hidden pt-28 pb-20">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-3xl opacity-[0.07]" style={{background:"#6366f1"}}/>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 text-xs font-semibold tracking-wide" style={{background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.25)",color:"#a5b4fc"}}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"/>
              CREATIVE AGENTS
            </div>
          </FadeIn>
          <FadeIn delay={80}>
            <h1 className="omni-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] tracking-tight mb-6">
              <span className="omni-tg-white">Creative agents</span>
              <br />
              <em className="omni-tg-violet">that make you</em>
              <br />
              <span className="omni-tg-white">prolific</span>
            </h1>
          </FadeIn>
          <FadeIn delay={180}>
            <p className="text-base sm:text-lg text-white/40 max-w-xl mx-auto mb-10 leading-relaxed font-light">
              OmniAI Agents are the force multiplier for your team. They plan, generate, iterate, and refine with full context across every stage of creative work.
            </p>
          </FadeIn>
          <FadeIn delay={260}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
              <button onClick={go} className="omni-btn-white">Get started <ArrowRight className="w-4 h-4"/></button>
              <button onClick={go} className="omni-btn-ghost">OmniAI for teams</button>
            </div>
          </FadeIn>

          {/* Agent workflow visual */}
          <FadeIn delay={350}>
            <div className="relative mx-auto max-w-3xl rounded-3xl overflow-hidden" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div className="flex items-center justify-around px-8 py-14 gap-4">
                {[{l:"Plan",e:"🧠",cls:"omni-float"},{l:"Generate",e:"✨",cls:"omni-float-2"},{l:"Iterate",e:"🔄",cls:"omni-float"},{l:"Deliver",e:"🚀",cls:"omni-float-3"}].map((s,i)=>(
                  <div key={i} className={`flex flex-col items-center gap-3 ${s.cls}`}>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl" style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)"}}>
                      {s.e}
                    </div>
                    <span className="text-[10px] font-bold text-white/30 tracking-widest uppercase">{s.l}</span>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse at center, transparent 40%, rgba(8,8,8,0.7) 100%)"}}/>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* BRAND MARQUEE */}
      <section style={{borderTop:"1px solid rgba(255,255,255,0.07)",borderBottom:"1px solid rgba(255,255,255,0.07)"}} className="py-7 overflow-hidden">
        <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-widest mb-5">Force multiplying teams at</p>
        <div className="space-y-2.5">
          <Marquee items={BRANDS} speed={30}/>
          <Marquee items={[...BRANDS].reverse()} speed={38} reverse/>
        </div>
      </section>

      {/* CORE DIFFERENTIATION */}
      <section id="product" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-4">Core Product Differentiation</p>
              <h2 className="omni-display text-4xl sm:text-5xl font-bold leading-tight">
                <span className="omni-tg-white">Foundations for</span><br/>
                <em className="omni-tg-violet">a new era of creativity</em>
              </h2>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DIFF_PILLARS.map((p,i)=>(
              <FadeIn key={i} delay={i*80}>
                <div className="omni-card rounded-2xl p-6 transition-all duration-300 h-full cursor-default">
                  <div className="w-10 h-10 rounded-xl mb-5 flex items-center justify-center" style={{background:"rgba(99,102,241,0.12)",color:"#818cf8"}}>
                    {p.icon}
                  </div>
                  <h3 className="font-bold text-sm mb-2 text-white">{p.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{p.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section style={{borderTop:"1px solid rgba(255,255,255,0.07)"}} className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-3">Designed for Professional Creative Workflows</p>
                <h2 className="omni-display text-4xl sm:text-5xl font-bold omni-tg-white">Explore use cases</h2>
              </div>
              <button onClick={go} className="hidden md:flex items-center gap-1.5 text-sm text-white/30 hover:text-white transition-colors font-medium">
                More <ArrowRight className="w-4 h-4"/>
              </button>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {USE_CASES.map((uc,i)=>(
              <FadeIn key={i} delay={Math.min(i*35,280)}>
                <div className="omni-card rounded-2xl p-5 transition-all duration-300 cursor-pointer h-full group">
                  <div className="text-xl mb-3">{uc.emoji}</div>
                  <h3 className="font-semibold text-sm mb-1.5 text-white/80 group-hover:text-white transition-colors">{uc.title}</h3>
                  <p className="text-[11px] text-white/30 leading-relaxed">{uc.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* AGENTS TRANSFORM EXECUTION */}
      <section style={{borderTop:"1px solid rgba(255,255,255,0.07)"}} className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-4">Creative Agents That Transform Execution</p>
              <h2 className="omni-display text-4xl sm:text-5xl font-bold mb-4">
                <span className="omni-tg-white">One continuous workflow.</span><br/>
                <em className="omni-tg-violet">Concept to final delivery.</em>
              </h2>
              <p className="text-white/35 max-w-lg mx-auto text-sm leading-relaxed">OmniAI unifies specialized multimodal models, advancing creative work end-to-end.</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {icon:<Zap className="w-5 h-5"/>,title:"Scale Execution in Parallel",desc:"Increase creative throughput and decision velocity as OmniAI Agents advance multiple directions simultaneously, preserving shared context.",color:"#818cf8"},
              {icon:<Workflow className="w-5 h-5"/>,title:"Eliminate Production Friction",desc:"Reduce operational overhead as OmniAI Agents coordinate built-in editing and refinement within the same project, removing manual handoffs.",color:"#c084fc"},
              {icon:<Globe className="w-5 h-5"/>,title:"Deliver with Continuity at Scale",desc:"Maintain brand and asset consistency as OmniAI Agents carry context from planning through final assembly, ensuring reliable delivery.",color:"#06b6d4"},
            ].map((item,i)=>(
              <FadeIn key={i} delay={i*100}>
                <div className="omni-card rounded-2xl p-6 h-full">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{background:`${item.color}18`,color:item.color}}>{item.icon}</div>
                  <h3 className="font-bold text-sm mb-2 text-white">{item.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{borderTop:"1px solid rgba(255,255,255,0.07)",background:"linear-gradient(to bottom, transparent, rgba(99,102,241,0.025) 50%, transparent)"}} className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <FadeIn><p className="text-center text-[10px] font-bold text-white/25 uppercase tracking-widest mb-12">Business stories</p></FadeIn>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t,i)=>(
              <FadeIn key={i} delay={i*100}>
                <div className="omni-card rounded-2xl p-7 h-full flex flex-col">
                  <p className="text-sm text-white/50 leading-relaxed italic flex-1 mb-6">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{background:`${t.color}20`,color:t.color}}>{t.initials}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-white/30">{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* MODELS */}
      <section style={{borderTop:"1px solid rgba(255,255,255,0.07)"}} className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Physically intelligent creative agents, with the best models</p>
              <h2 className="text-xl font-bold text-white/60">Orchestrating category-defining models across every stage of creative work</h2>
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="flex flex-wrap justify-center gap-2.5">
              {MODELS.map((m,i)=>(
                <div key={i} className="rounded-full px-4 py-2 flex items-center gap-2.5 cursor-default transition-all duration-200 hover:border-white/15" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{background:m.color}}/>
                  <span className="text-sm font-semibold text-white">{m.name}</span>
                  <span className="text-[11px] text-white/30">{m.tag}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{borderTop:"1px solid rgba(255,255,255,0.07)"}} className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10">
              <h2 className="omni-display text-4xl sm:text-5xl font-bold omni-tg-white mb-3">Plans & Pricing</h2>
              <p className="text-white/35 text-sm mb-7">All OmniAI plans come with free trial credits</p>
              <div className="inline-flex items-center gap-0 p-1 rounded-full" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
                {["Monthly","Yearly"].map((label,i)=>(
                  <button key={label} onClick={()=>setAnnual(i===1)} className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${annual===((i===1)) ? "bg-white text-black" : "text-white/40 hover:text-white"}`}>
                    {label}
                    {i===1 && <span className="text-[10px] font-bold text-indigo-400">Save 20%</span>}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {PRICING_PLANS.map((plan,i)=>(
              <FadeIn key={i} delay={i*70}>
                <div className={`relative rounded-2xl p-7 border transition-all duration-300 h-full flex flex-col ${plan.popular ? "omni-popular" : "omni-card"}`} style={plan.popular ? {} : {}}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold text-white" style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
                      Most Popular
                    </div>
                  )}
                  <div className="mb-5">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">{plan.name}</p>
                    <div className="flex items-baseline gap-1 mb-1.5">
                      {plan.custom ? (
                        <span className="text-2xl font-black text-white">Custom</span>
                      ) : (
                        <>
                          <span className="text-3xl font-black text-white">${annual ? Math.round(plan.price * 0.8) : plan.price}</span>
                          <span className="text-white/25 text-sm">{plan.period}</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-white/30 leading-relaxed">{plan.desc}</p>
                  </div>
                  <div className="flex-1 space-y-2 mb-6">
                    {plan.features.map((f,j)=>(
                      <div key={j} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0"/>
                        <span className="text-[11px] text-white/40">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={go} className={`w-full py-2.5 rounded-full text-sm font-semibold transition-all ${plan.popular ? "bg-white text-black hover:bg-white/90" : "border text-white/50 hover:text-white hover:border-white/20"}`} style={plan.popular ? {} : {borderColor:"rgba(255,255,255,0.1)"}}>
                    {plan.cta}
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={350}>
            <div className="mt-5 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 omni-card">
              <div>
                <p className="font-bold text-sm text-white mb-1">Team plan <span className="text-[10px] font-normal text-white/30 ml-1">Coming soon</span></p>
                <p className="text-xs text-white/35">Manage and add team members, projects, team-wide sharing, usage analytics, user spend limits, and SSO.</p>
              </div>
              <button onClick={go} className="omni-btn-ghost shrink-0 text-xs py-2 px-5">Get in touch</button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{borderTop:"1px solid rgba(255,255,255,0.07)"}} className="py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <div className="relative">
              <div className="absolute -inset-12 rounded-3xl blur-3xl opacity-10" style={{background:"radial-gradient(ellipse,#6366f1 0%,transparent 70%)"}}/>
              <div className="relative">
                <h2 className="omni-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
                  <span className="omni-tg-white">Everything we can</span><br/>
                  <em className="omni-tg-violet">imagine should be real</em>
                </h2>
                <p className="text-white/35 text-base mb-10 max-w-md mx-auto leading-relaxed">
                  Join millions of creators and teams using OmniAI to transform their creative process.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button onClick={go} className="omni-btn-white">Get started free <ArrowRight className="w-4 h-4"/></button>
                  <button onClick={go} className="omni-btn-ghost">OmniAI for teams</button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:"1px solid rgba(255,255,255,0.07)"}} className="py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 mb-12">
            <div className="max-w-xs shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white"/>
                </div>
                <span className="font-bold text-sm">OmniAI</span>
              </div>
              <p className="text-xs text-white/25 leading-relaxed">Creative agents that make you prolific. Our mission is to build unified general intelligence that can generate, understand, and operate in the physical world.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-1 text-xs">
              {[
                {h:"Product",links:["Pricing","Use Cases","API","Enterprise"]},
                {h:"Join Us",links:["Creative Partner Program","Education Program","Careers","Learning Hub"]},
                {h:"Resources",links:["Media kit","News","Blog","Research"]},
                {h:"Legal",links:["Terms of Service","Privacy Policy"]},
              ].map((col,i)=>(
                <div key={i}>
                  <p className="font-bold text-white/40 mb-3 text-[10px] uppercase tracking-wider">{col.h}</p>
                  <div className="space-y-2">
                    {col.links.map((l,j)=>(
                      <a key={j} href="#" className="block text-white/25 hover:text-white/60 transition-colors">{l}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{borderTop:"1px solid rgba(255,255,255,0.07)"}} className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-white/15">© {new Date().getFullYear()} OmniAI. All rights reserved.</p>
            <p className="text-[11px] text-white/10">Creative agents that make you prolific</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
