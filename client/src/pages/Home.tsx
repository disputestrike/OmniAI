import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, type FormEvent } from "react";
import {
  Sparkles, ArrowRight, BarChart3, Megaphone, Bot, PenTool, Palette, Video,
  TrendingUp, Users, Target, Zap, Search, Mail, Globe, Brain, ChevronRight,
} from "lucide-react";

const PROMPTS = [
  "Launch my protein powder for gym people on TikTok and Instagram",
  "Run a webinar — registration page, emails, and social posts",
  "Get more leads for my agency with a landing page and ads",
  "Create a full product launch campaign with video and email",
  "Build a 7-email welcome sequence for my SaaS free trial",
  "Generate ad creatives for my Shopify store this week",
];

const QUICK_ACTIONS = [
  { icon: PenTool,   label: "Content Studio",    desc: "22 content types",      path: "/content",         color: "from-violet-500 to-indigo-600" },
  { icon: Palette,   label: "Creative Engine",   desc: "AI image generation",   path: "/creatives",       color: "from-pink-500 to-rose-600" },
  { icon: Video,     label: "Video Ads",         desc: "Scripts + storyboards", path: "/video-ads",       color: "from-red-500 to-orange-600" },
  { icon: Megaphone, label: "Campaigns",         desc: "Multi-platform launch",  path: "/campaigns",       color: "from-amber-500 to-yellow-600" },
  { icon: Mail,      label: "Email Marketing",   desc: "Send campaigns",        path: "/email-marketing", color: "from-cyan-500 to-blue-600" },
  { icon: Target,    label: "Lead Manager",      desc: "CRM + pipeline",        path: "/leads",           color: "from-green-500 to-emerald-600" },
  { icon: Globe,     label: "Website Intel",     desc: "Competitor analysis",   path: "/intelligence",    color: "from-teal-500 to-cyan-600" },
  { icon: Brain,     label: "Predictive AI",     desc: "Score before launch",   path: "/predictive",      color: "from-purple-500 to-violet-600" },
];

export default function Home() {
  const { data: campaigns } = trpc.campaign.list.useQuery();
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");

  const activeCampaigns = (campaigns ?? []).filter(
    (c: { status: string }) => c.status === "active" || c.status === "draft"
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    setLocation(q ? `/ai-agents?prompt=${encodeURIComponent(q)}` : "/ai-agents");
  };

  const statItems = [
    { label: "Impressions", value: Number(stats?.analytics?.totalImpressions ?? 0).toLocaleString(), icon: TrendingUp, delta: "+12%", up: true },
    { label: "Clicks",      value: Number(stats?.analytics?.totalClicks ?? 0).toLocaleString(),      icon: Target,    delta: "+8%",  up: true },
    { label: "Conversions", value: Number(stats?.analytics?.totalConversions ?? 0).toLocaleString(), icon: Users,     delta: "+24%", up: true },
    { label: "Revenue",     value: `$${Number(stats?.analytics?.totalRevenue ?? 0).toLocaleString()}`, icon: BarChart3, delta: "+31%", up: true },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">

      {/* ── Command center ───────────────────────── */}
      <section className="pt-2 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">What do you want to launch?</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Describe it — the AI builds your campaign, content, and assets</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="command-bar flex items-center gap-3 px-4 py-3">
            <Bot className="h-5 w-5 text-violet-400 shrink-0" />
            <input
              type="text"
              placeholder="e.g. Launch my luxury watch brand targeting affluent men 35–55..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder:text-zinc-600 font-medium"
              autoFocus
            />
            <button
              type="submit"
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Build it
            </button>
          </div>
        </form>

        {/* Prompt chips */}
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => { setInput(p); setLocation(`/ai-agents?prompt=${encodeURIComponent(p)}`); }}
              className="text-[11px] px-3 py-1.5 rounded-full text-zinc-500 hover:text-zinc-300 transition-colors truncate max-w-[280px]"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* ── Stats ────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Performance</h2>
          <button onClick={() => setLocation("/analytics")} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
            View analytics <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statItems.map(s => (
            <div key={s.label} className="stat-card group">
              <div className="flex items-center justify-between mb-2">
                <span className="stat-label">{s.label}</span>
                <s.icon className="h-3.5 w-3.5 text-zinc-700 group-hover:text-violet-400 transition-colors" />
              </div>
              <span className="stat-value">{s.value}</span>
              <span className={`stat-delta ${s.up ? "up" : "down"}`}>{s.delta} this month</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Active campaigns ─────────────────────── */}
      {activeCampaigns.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Active Campaigns</h2>
            <button onClick={() => setLocation("/campaigns")} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {activeCampaigns.slice(0, 4).map((c: { id: number; name: string; status: string; goal?: string | null }) => (
              <button
                key={c.id}
                onClick={() => setLocation("/campaigns")}
                className="glass glass-hover rounded-xl px-4 py-3 text-left flex items-center justify-between gap-3 transition-all"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-200 truncate">{c.name}</p>
                  {c.goal && <p className="text-xs text-zinc-500 capitalize mt-0.5">{String(c.goal).replace(/_/g, " ")}</p>}
                </div>
                <span className={`agent-pill shrink-0 ${c.status === "active" ? "done" : "idle"}`}>
                  <span className="dot" />
                  {c.status}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Quick actions grid ────────────────────── */}
      <section>
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.path}
              onClick={() => setLocation(action.path)}
              className="glass glass-hover rounded-xl p-4 text-left transition-all group"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                <action.icon className="h-4.5 w-4.5 text-white" />
              </div>
              <p className="text-sm font-semibold text-zinc-200">{action.label}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">{action.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA strip ─────────────────────── */}
      <section
        className="rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(6,182,212,0.06) 100%)", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div>
          <p className="font-bold text-white text-base">Ready to run your first AI campaign?</p>
          <p className="text-sm text-zinc-400 mt-1">Describe your product to the AI — it builds everything in one shot.</p>
        </div>
        <button
          onClick={() => setLocation("/ai-agents")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Zap className="h-4 w-4" />
          Launch AI Agent
        </button>
      </section>

    </div>
  );
}
