import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard, Megaphone, BarChart3, Library, CheckCircle, Share2, CreditCard,
  Rocket, Bot, Package, PenTool, Shuffle, Image, Video, Film, Scissors, Mic,
  Languages, UserCircle, Smile, BookDown, LayoutTemplate, Gauge, Upload, Palette,
  Music, Mic2, FileQuestion, Target, GitBranch, FlaskConical, Calendar, Users,
  Handshake, BarChart2, Flame, Send, Mail, CalendarDays, Activity, CalendarCheck,
  Globe, Star, Layers, Search, TrendingUp, Zap, Eye, UsersRound, ArrowUpDown,
  Webhook, FileCode, Workflow, FolderKanban, User, HelpCircle, Shield, LogOut,
  CreditCard as CreditCardIcon, ChevronRight, ChevronDown, Wrench, PanelLeft,
  Sun, Moon, Sparkles, Menu, X,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { getLoginPageUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useTheme } from "@/contexts/ThemeContext";
import { TrialCountdownBanner } from "@/components/TrialCountdownBanner";
import DashboardLayoutSkeleton from "@/components/DashboardLayoutSkeleton";
import { setCrispUser } from "@/lib/crisp";

/* ─── Nav data ───────────────────────────────────────── */
const MAIN_NAV = [
  { icon: LayoutDashboard, label: "Home",        path: "/dashboard" },
  { icon: Megaphone,       label: "Campaigns",   path: "/campaigns" },
  { icon: BarChart3,       label: "Analytics",   path: "/analytics" },
  { icon: Library,         label: "Library",     path: "/content" },
  { icon: CheckCircle,     label: "Approvals",   path: "/approvals" },
  { icon: Share2,          label: "Integrations",path: "/ad-platforms" },
  { icon: CreditCard,      label: "Account",     path: "/pricing" },
];

const TOOL_SECTIONS = [
  { label: "Create", items: [
    { icon: Bot,           label: "AI Agents",         path: "/ai-agents" },
    { icon: Rocket,        label: "Campaign Wizard",   path: "/campaign-wizard" },
    { icon: Package,       label: "Product Analyzer",  path: "/products" },
    { icon: PenTool,       label: "Content Studio",    path: "/content" },
    { icon: Shuffle,       label: "Repurposer",        path: "/content-repurposer" },
    { icon: Palette,       label: "Creative Engine",   path: "/creatives" },
    { icon: Video,         label: "Video Ads",         path: "/video-ads" },
    { icon: Film,          label: "Video Render",      path: "/video-render" },
    { icon: Video,         label: "Video Studio",      path: "/video-studio" },
    { icon: Scissors,      label: "Image Editor",      path: "/image-editor" },
    { icon: Mic,           label: "Brand Voice",       path: "/brand-voice" },
    { icon: Languages,     label: "Translate",         path: "/translate" },
    { icon: UserCircle,    label: "AI Avatars",        path: "/ai-avatars" },
    { icon: Smile,         label: "Meme Generator",    path: "/meme-generator" },
    { icon: BookDown,      label: "Content Ingest",    path: "/content-ingest" },
    { icon: Library,       label: "Content Library",   path: "/content-library" },
    { icon: LayoutTemplate,label: "Templates",         path: "/content-templates" },
    { icon: Gauge,         label: "Content Scorer",    path: "/content-scorer" },
    { icon: Upload,        label: "Bulk Import",       path: "/bulk-import" },
    { icon: Palette,       label: "Brand Kit",         path: "/brand-kit" },
    { icon: Music,         label: "Music Studio",      path: "/music-studio" },
    { icon: Mic2,          label: "Voiceover Studio",  path: "/voiceover-studio" },
    { icon: FileQuestion,  label: "Forms",             path: "/forms" },
  ]},
  { label: "Manage", items: [
    { icon: Target,        label: "Programmatic Ads",  path: "/programmatic-ads" },
    { icon: GitBranch,     label: "Funnels",           path: "/funnels" },
    { icon: FlaskConical,  label: "A/B Testing",       path: "/ab-testing" },
    { icon: Calendar,      label: "Scheduler",         path: "/scheduler" },
    { icon: Users,         label: "Lead Manager",      path: "/leads" },
    { icon: Handshake,     label: "CRM Deals",         path: "/deals" },
    { icon: BarChart2,     label: "Ad Performance",    path: "/ad-performance" },
    { icon: Rocket,        label: "One-Push Publisher",path: "/one-push-publisher" },
    { icon: Flame,         label: "Momentum",          path: "/momentum" },
    { icon: Send,          label: "Social Publish",    path: "/social-publish" },
    { icon: Mail,          label: "Email Marketing",   path: "/email-marketing" },
    { icon: CalendarDays,  label: "Content Calendar",  path: "/content-calendar" },
    { icon: Activity,      label: "Performance",       path: "/performance" },
    { icon: CalendarCheck, label: "Social Planner",    path: "/social-planner" },
  ]},
  { label: "Intelligence", items: [
    { icon: Globe,         label: "Website Intel",     path: "/intelligence" },
    { icon: Star,          label: "Reviews",           path: "/reviews" },
    { icon: Layers,        label: "Platform Intel",    path: "/platform-intel" },
    { icon: Search,        label: "SEO Audits",        path: "/seo-audits" },
    { icon: TrendingUp,    label: "Predictive AI",     path: "/predictive" },
    { icon: Zap,           label: "Growth & Learning", path: "/growth-learning" },
    { icon: Eye,           label: "Competitor Intel",  path: "/competitor-intelligence" },
    { icon: Users,         label: "Customer Intel",    path: "/customer-intel" },
  ]},
  { label: "Workspace", items: [
    { icon: UsersRound,    label: "Collaboration",     path: "/collaboration" },
    { icon: ArrowUpDown,   label: "Export / Import",   path: "/export-import" },
    { icon: Webhook,       label: "Webhooks",          path: "/webhooks" },
    { icon: FileCode,      label: "Landing Pages",     path: "/landing-pages" },
    { icon: Workflow,      label: "Automations",       path: "/automations" },
    { icon: FolderKanban,  label: "Projects",          path: "/projects" },
    { icon: User,          label: "Creator Profile",   path: "/creator-profile" },
    { icon: HelpCircle,    label: "Help & Docs",       path: "/help" },
  ]},
];

const ALL_ITEMS = [
  ...MAIN_NAV,
  ...TOOL_SECTIONS.flatMap(s => s.items),
  { icon: Shield, label: "Admin Panel", path: "/admin" },
];

const W_KEY = "omni-sw";
const W_DEFAULT = 240;
const W_MIN = 200;
const W_MAX = 320;

/* ─── Root ───────────────────────────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const reloadRef = useRef(false);

  const shouldReload = typeof window !== "undefined" && !loading && !user && !sessionStorage.getItem("omni_reload");
  useEffect(() => {
    if (!shouldReload || reloadRef.current) return;
    reloadRef.current = true;
    sessionStorage.setItem("omni_reload", "1");
    window.location.reload();
  }, [shouldReload]);

  if (loading || (shouldReload && !user)) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#09090b" }}>
        <div className="flex flex-col items-center gap-6 p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-2">OmniAI</h1>
            <p className="text-sm text-zinc-400">Sign in to continue.</p>
          </div>
          <button onClick={() => { window.location.href = getLoginPageUrl(); }}
            className="w-full h-10 rounded-xl text-white font-semibold text-sm transition-colors"
            style={{ background: "#7c3aed" }}>
            Sign in to get started
          </button>
        </div>
      </div>
    );
  }

  return <Inner>{children}</Inner>;
}

/* ─── Inner layout ───────────────────────────────────── */
function Inner({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, { enabled: !!user });
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("omni-collapsed") === "1"; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [sidebarW, setSidebarW] = useState(() => {
    try { return parseInt(localStorage.getItem(W_KEY) ?? String(W_DEFAULT), 10) || W_DEFAULT; } catch { return W_DEFAULT; }
  });
  const [resizing, setResizing] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("omni-collapsed", next ? "1" : "0"); } catch {}
  };

  useEffect(() => {
    try { localStorage.setItem(W_KEY, String(sidebarW)); } catch {}
  }, [sidebarW]);

  // Resize drag
  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const rect = resizeRef.current?.getBoundingClientRect();
      if (!rect) return;
      const w = e.clientX;
      if (w >= W_MIN && w <= W_MAX) setSidebarW(w);
    };
    const onUp = () => setResizing(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizing]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  const activePage = ALL_ITEMS.find(i => i.path === location);
  const w = collapsed ? 48 : sidebarW;

  /* ── Nav item renderer ── */
  const NavItem = ({ icon: Icon, label, path, size = "md" }: { icon: any; label: string; path: string; size?: "sm" | "md" }) => {
    const active = location === path;
    const h = size === "sm" ? "32px" : "36px";
    const fs = size === "sm" ? "11.5px" : "13px";
    return (
      <button
        onClick={() => { setLocation(path); if (isMobile) setMobileOpen(false); }}
        title={collapsed ? label : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          height: h,
          padding: collapsed ? "0 12px" : "0 10px",
          borderRadius: "8px",
          fontSize: fs,
          fontWeight: 500,
          color: active ? "#a78bfa" : "#71717a",
          background: active ? "rgba(124,58,237,0.12)" : "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.15s",
          overflow: "hidden",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "#e4e4e7"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = active ? "rgba(124,58,237,0.12)" : "transparent"; (e.currentTarget as HTMLButtonElement).style.color = active ? "#a78bfa" : "#71717a"; }}
      >
        <Icon style={{ width: size === "sm" ? 14 : 16, height: size === "sm" ? 14 : 16, flexShrink: 0, color: active ? "#7c3aed" : "inherit" }} />
        {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>}
      </button>
    );
  };

  /* ── Sidebar content ── */
  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        height: 56, display: "flex", alignItems: "center", gap: 8,
        padding: "0 12px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <button onClick={toggleCollapsed} title="Toggle sidebar"
          style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#71717a", flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <PanelLeft style={{ width: 16, height: 16 }} />
        </button>
        {!collapsed && (
          <button onClick={() => setLocation("/dashboard")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", minWidth: 0, overflow: "hidden" }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles style={{ width: 13, height: 13, color: "white" }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>OmniAI</span>
          </button>
        )}
      </div>

      {/* Scrollable nav */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 6px" }}>
        {/* Main nav */}
        <div style={{ marginBottom: 4 }}>
          {MAIN_NAV.map(item => <NavItem key={item.path} {...item} />)}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 4px" }} />

        {/* All Tools toggle */}
        {!collapsed && (
          <button
            onClick={() => setToolsOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 6, width: "100%", height: 28,
              padding: "0 10px", borderRadius: 6, border: "none", background: "transparent",
              cursor: "pointer", color: "#52525b", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.07em", textTransform: "uppercase",
            }}
          >
            <Wrench style={{ width: 11, height: 11, flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: "left" }}>All Tools</span>
            {toolsOpen
              ? <ChevronDown style={{ width: 11, height: 11, flexShrink: 0 }} />
              : <ChevronRight style={{ width: 11, height: 11, flexShrink: 0 }} />
            }
          </button>
        )}

        {/* Tool sections */}
        {(toolsOpen || collapsed) && (
          <div style={{ marginTop: 2 }}>
            {TOOL_SECTIONS.map(section => (
              <div key={section.label} style={{ marginBottom: 12 }}>
                {!collapsed && (
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3f3f46", padding: "0 10px", marginBottom: 3, marginTop: 4 }}>
                    {section.label}
                  </div>
                )}
                {section.items.map(item => <NavItem key={item.path} {...item} size="sm" />)}
              </div>
            ))}
          </div>
        )}

        {/* Admin */}
        {(user as any)?.role === "admin" && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {!collapsed && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3f3f46", padding: "0 10px", marginBottom: 3 }}>Admin</div>}
            <NavItem icon={Shield} label="Admin Panel" path="/admin" size="sm" />
          </div>
        )}
      </div>

      {/* Footer — user */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 6px", flexShrink: 0, position: "relative" }} ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 8px",
            borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", textAlign: "left",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>
              {(user as any)?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </span>
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(user as any)?.name ?? "—"}</div>
              <div style={{ fontSize: 10, color: "#71717a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{(user as any)?.email ?? "—"}</div>
            </div>
          )}
        </button>

        {/* User dropdown */}
        {userMenuOpen && (
          <div style={{
            position: "absolute", bottom: "100%", left: 6, right: 6, marginBottom: 4,
            background: "#18181b", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10,
            padding: 4, zIndex: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}>
            {[
              { label: theme === "dark" ? "Light mode" : "Dark mode", icon: theme === "dark" ? Sun : Moon, action: () => { toggleTheme(); setUserMenuOpen(false); } },
              ...(subStatus?.stripeCustomerId ? [{ label: "Manage billing", icon: CreditCardIcon, action: async () => {
                setUserMenuOpen(false);
                try {
                  const res = await fetch("/api/stripe/create-portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId: subStatus.stripeCustomerId }) });
                  const d = await res.json();
                  if (d?.url) window.open(d.url, "_blank");
                } catch {}
              }}] : []),
              { label: "Contact support", icon: Mail, action: () => { window.location.href = "mailto:support@omni.ai"; setUserMenuOpen(false); } },
              { label: "Sign out", icon: LogOut, action: () => { logout(); setUserMenuOpen(false); }, danger: true },
            ].map((item, i) => (
              <button key={i} onClick={item.action}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px",
                  borderRadius: 7, border: "none", background: "transparent", cursor: "pointer",
                  fontSize: 13, color: (item as any).danger ? "#f87171" : "#d4d4d8", textAlign: "left",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <item.icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#09090b" }}>
      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <div ref={resizeRef} style={{ width: w, minWidth: w, maxWidth: w, height: "100vh", background: "#0c0c0e", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transition: resizing ? "none" : "width 0.2s ease", flexShrink: 0 }}>
          <SidebarContent />
          {/* Resize handle */}
          {!collapsed && (
            <div
              onMouseDown={() => setResizing(true)}
              style={{ position: "absolute", top: 0, right: 0, width: 4, height: "100%", cursor: "col-resize", zIndex: 10 }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.3)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            />
          )}
        </div>
      )}

      {/* ── Mobile overlay sidebar ── */}
      {isMobile && mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }} />
          <div style={{ position: "fixed", top: 0, left: 0, width: 280, height: "100vh", background: "#0c0c0e", borderRight: "1px solid rgba(255,255,255,0.06)", zIndex: 50, display: "flex", flexDirection: "column" }}>
            <SidebarContent />
          </div>
        </>
      )}

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <TrialCountdownBanner />

        {/* Mobile topbar */}
        {isMobile && (
          <div style={{ height: 56, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(9,9,11,0.9)", backdropFilter: "blur(12px)", flexShrink: 0 }}>
            <button onClick={() => setMobileOpen(true)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#71717a" }}>
              <Menu style={{ width: 20, height: 20 }} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e7" }}>{activePage?.label ?? "OmniAI"}</span>
          </div>
        )}

        {/* Usage bar */}
        {subStatus?.usage && subStatus.usage.aiGenerationsUsed != null && (
          <div style={{ padding: "6px 16px", textAlign: "center", fontSize: 11, color: "#52525b", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
            {subStatus.usage.aiGenerationsUsed} generations used this period
            {subStatus.purchasedCredits != null && subStatus.purchasedCredits > 0 && ` · ${subStatus.purchasedCredits} credits`}
          </div>
        )}

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px" : "28px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
