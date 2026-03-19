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
  CreditCard as CreditCardIcon, ChevronRight, ChevronDown, Wrench, PanelLeft, Sun, Moon, Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useRef, useEffect, type CSSProperties } from "react";
import { getLoginPageUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrialCountdownBanner } from "@/components/TrialCountdownBanner";
import DashboardLayoutSkeleton from "@/components/DashboardLayoutSkeleton";
import { setCrispUser } from "@/lib/crisp";

/* ─── Navigation data ─────────────────────────────────── */
const mainNavItems = [
  { icon: LayoutDashboard, label: "Home",             path: "/dashboard" },
  { icon: Megaphone,       label: "Campaigns",        path: "/campaigns" },
  { icon: BarChart3,       label: "Analytics",        path: "/analytics" },
  { icon: Library,         label: "Library",          path: "/content" },
  { icon: CheckCircle,     label: "Approvals",        path: "/approvals" },
  { icon: Share2,          label: "Integrations",     path: "/ad-platforms" },
  { icon: CreditCard,      label: "Account",          path: "/pricing" },
];

const toolsNavSections = [
  { label: "Create", items: [
    { icon: Bot,           label: "AI Agents",          path: "/ai-agents" },
    { icon: Rocket,        label: "Campaign Wizard",    path: "/campaign-wizard" },
    { icon: Package,       label: "Product Analyzer",   path: "/products" },
    { icon: PenTool,       label: "Content Studio",     path: "/content" },
    { icon: Shuffle,       label: "Repurposer",         path: "/content-repurposer" },
    { icon: Palette,       label: "Creative Engine",    path: "/creatives" },
    { icon: Video,         label: "Video Ads",          path: "/video-ads" },
    { icon: Film,          label: "Video Render",       path: "/video-render" },
    { icon: Video,         label: "Video Studio",       path: "/video-studio" },
    { icon: Scissors,      label: "Image Editor",       path: "/image-editor" },
    { icon: Mic,           label: "Brand Voice",        path: "/brand-voice" },
    { icon: Languages,     label: "Translate",          path: "/translate" },
    { icon: UserCircle,    label: "AI Avatars",         path: "/ai-avatars" },
    { icon: Smile,         label: "Meme Generator",     path: "/meme-generator" },
    { icon: BookDown,      label: "Content Ingest",     path: "/content-ingest" },
    { icon: Library,       label: "Content Library",    path: "/content-library" },
    { icon: LayoutTemplate,label: "Templates",          path: "/content-templates" },
    { icon: Gauge,         label: "Content Scorer",     path: "/content-scorer" },
    { icon: Upload,        label: "Bulk Import",        path: "/bulk-import" },
    { icon: Palette,       label: "Brand Kit",          path: "/brand-kit" },
    { icon: Music,         label: "Music Studio",       path: "/music-studio" },
    { icon: Mic2,          label: "Voiceover Studio",   path: "/voiceover-studio" },
    { icon: FileQuestion,  label: "Forms",              path: "/forms" },
  ]},
  { label: "Manage", items: [
    { icon: Target,        label: "Programmatic Ads",   path: "/programmatic-ads" },
    { icon: GitBranch,     label: "Funnels",            path: "/funnels" },
    { icon: FlaskConical,  label: "A/B Testing",        path: "/ab-testing" },
    { icon: Calendar,      label: "Scheduler",          path: "/scheduler" },
    { icon: Users,         label: "Lead Manager",       path: "/leads" },
    { icon: Handshake,     label: "CRM Deals",          path: "/deals" },
    { icon: BarChart2,     label: "Ad Performance",     path: "/ad-performance" },
    { icon: Rocket,        label: "One-Push Publisher", path: "/one-push-publisher" },
    { icon: Flame,         label: "Momentum",           path: "/momentum" },
    { icon: Send,          label: "Social Publish",     path: "/social-publish" },
    { icon: Mail,          label: "Email Marketing",    path: "/email-marketing" },
    { icon: CalendarDays,  label: "Content Calendar",   path: "/content-calendar" },
    { icon: Activity,      label: "Performance",        path: "/performance" },
    { icon: CalendarCheck, label: "Social Planner",     path: "/social-planner" },
  ]},
  { label: "Intelligence", items: [
    { icon: Globe,         label: "Website Intel",      path: "/intelligence" },
    { icon: Star,          label: "Reviews",            path: "/reviews" },
    { icon: Layers,        label: "Platform Intel",     path: "/platform-intel" },
    { icon: Search,        label: "SEO Audits",         path: "/seo-audits" },
    { icon: TrendingUp,    label: "Predictive AI",      path: "/predictive" },
    { icon: Zap,           label: "Growth & Learning",  path: "/growth-learning" },
    { icon: Eye,           label: "Competitor Intel",   path: "/competitor-intelligence" },
    { icon: Users,         label: "Customer Intel",     path: "/customer-intel" },
  ]},
  { label: "Workspace", items: [
    { icon: UsersRound,    label: "Collaboration",      path: "/collaboration" },
    { icon: ArrowUpDown,   label: "Export / Import",    path: "/export-import" },
    { icon: Webhook,       label: "Webhooks",           path: "/webhooks" },
    { icon: FileCode,      label: "Landing Pages",      path: "/landing-pages" },
    { icon: Workflow,      label: "Automations",        path: "/automations" },
    { icon: FolderKanban,  label: "Projects",           path: "/projects" },
    { icon: User,          label: "Creator Profile",    path: "/creator-profile" },
    { icon: HelpCircle,    label: "Help & Docs",        path: "/help" },
  ]},
];

const allMenuItems = [
  ...mainNavItems,
  ...toolsNavSections.flatMap(s => s.items),
  { icon: Shield, label: "Admin Panel", path: "/admin" },
];

const SIDEBAR_WIDTH_KEY = "omni-sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 200;
const MAX_WIDTH = 320;

/* ─── Root layout ─────────────────────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(SIDEBAR_WIDTH_KEY) : null;
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const reloadAttempted = useRef(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  const shouldRetryReload = typeof window !== "undefined" && !loading && !user && !sessionStorage.getItem("omni_dashboard_reload");
  useEffect(() => {
    if (!shouldRetryReload || reloadAttempted.current) return;
    reloadAttempted.current = true;
    sessionStorage.setItem("omni_dashboard_reload", "1");
    window.location.reload();
  }, [shouldRetryReload]);

  if (loading || (shouldRetryReload && !user)) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen mesh-bg">
        <div className="flex flex-col items-center gap-6 p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-2">OmniAI</h1>
            <p className="text-sm text-zinc-400">The Marketing OS. Create, publish, and grow — all from one place.</p>
          </div>
          <button
            onClick={() => { window.location.href = getLoginPageUrl(); }}
            className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
          >
            Sign in to get started
          </button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

/* ─── Layout content ──────────────────────────────────── */
function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, { enabled: !!user });
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const activeMenuItem = allMenuItems.find(item => item.path === location);

  useEffect(() => {
    if (user?.email) {
      setCrispUser({ name: user.name || undefined, email: user.email || undefined, tier: subStatus?.plan || "free" });
    }
  }, [user?.id, user?.email, user?.name, subStatus?.plan]);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newW = e.clientX - left;
      if (newW >= MIN_WIDTH && newW <= MAX_WIDTH) setSidebarWidth(newW);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const planLabel = subStatus?.plan ?? "free";
  const planColor: Record<string, string> = {
    free: "badge-neutral", starter: "badge-brand", professional: "badge-brand",
    business: "badge-cyan", enterprise: "badge-warning",
  };

  return (
    <>
      <TrialCountdownBanner />
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          style={{ background: "var(--sidebar)" } as CSSProperties}
        >
          {/* ── Header ─────────────────────────────── */}
          <SidebarHeader className="h-14 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2.5 px-3 h-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors shrink-0"
                aria-label="Toggle sidebar"
              >
                <PanelLeft className="h-4 w-4 text-zinc-400" />
              </button>
              {!isCollapsed && (
                <div
                  className="flex items-center gap-2 cursor-pointer min-w-0"
                  onClick={() => setLocation("/dashboard")}
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-bold text-sm text-white tracking-tight truncate">OmniAI</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* ── Nav ────────────────────────────────── */}
          <SidebarContent className="gap-0 px-2 py-2 overflow-y-auto">
            {/* Main nav */}
            <SidebarMenu className="gap-0.5">
              {mainNavItems.map(item => {
                const active = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={active}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={cn(
                        "h-9 rounded-lg text-[13px] font-medium transition-all",
                        active
                          ? "bg-violet-600/15 text-violet-300"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", active && "text-violet-400")} />
                      <span className="truncate">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {/* Tools collapsible */}
            <Collapsible defaultOpen className="mt-3 group/tools">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 h-8 w-full rounded-md px-2 text-[11px] font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <Wrench className="h-3 w-3 shrink-0" />
                  <span className="truncate">All Tools</span>
                  <ChevronRight className="h-3 w-3 shrink-0 ml-auto group-data-[state=open]/tools:hidden" />
                  <ChevronDown className="h-3 w-3 shrink-0 ml-auto hidden group-data-[state=open]/tools:block" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1 space-y-4">
                  {toolsNavSections.map(section => (
                    <div key={section.label}>
                      {!isCollapsed && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 px-2 mb-1">
                          {section.label}
                        </p>
                      )}
                      <SidebarMenu className="gap-0.5">
                        {section.items.map(item => {
                          const active = location === item.path;
                          return (
                            <SidebarMenuItem key={item.path}>
                              <SidebarMenuButton
                                isActive={active}
                                onClick={() => setLocation(item.path)}
                                tooltip={item.label}
                                className={cn(
                                  "h-8 rounded-lg text-[12px] font-medium transition-all",
                                  active
                                    ? "bg-violet-600/12 text-violet-300"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/4"
                                )}
                              >
                                <item.icon className={cn("h-3.5 w-3.5 shrink-0", active && "text-violet-400")} />
                                <span className="truncate">{item.label}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Admin */}
            {user?.role === "admin" && (
              <div className="mt-3">
                {!isCollapsed && <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 px-2 mb-1">Admin</p>}
                <SidebarMenu className="gap-0.5">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={location === "/admin"}
                      onClick={() => setLocation("/admin")}
                      tooltip="Admin Panel"
                      className={cn(
                        "h-8 rounded-lg text-[12px] font-medium transition-all",
                        location === "/admin"
                          ? "bg-violet-600/12 text-violet-300"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/4"
                      )}
                    >
                      <Shield className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Admin Panel</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}
          </SidebarContent>

          {/* ── Footer ─────────────────────────────── */}
          <SidebarFooter className="p-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 w-full rounded-lg px-2 py-2 hover:bg-white/5 transition-colors focus:outline-none">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[11px] font-bold bg-violet-600/20 text-violet-300">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-zinc-200 truncate leading-none">{user?.name || "—"}</p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{user?.email || "—"}</p>
                    </div>
                  )}
                  {!isCollapsed && (
                    <span className={cn("agent-pill text-[10px] shrink-0", planColor[planLabel] ?? "badge-neutral")}>
                      {planLabel}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52" style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)" }}>
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer text-zinc-300 hover:text-white focus:text-white">
                  {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                </DropdownMenuItem>
                {subStatus?.stripeCustomerId && (
                  <DropdownMenuItem
                    className="cursor-pointer text-zinc-300 hover:text-white focus:text-white"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/stripe/create-portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId: subStatus.stripeCustomerId }) });
                        const data = await res.json();
                        if (data?.url) window.open(data.url, "_blank");
                      } catch {}
                    }}
                  >
                    <CreditCardIcon className="mr-2 h-4 w-4" />
                    <span>Manage billing</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="cursor-pointer text-zinc-300 hover:text-white focus:text-white" asChild>
                  <a href="mailto:support@omni.ai">
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Contact support</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={cn("absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-violet-500/20 transition-colors z-50", isCollapsed && "hidden")}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
        />
      </div>

      {/* ── Main content ───────────────────────────── */}
      <SidebarInset style={{ background: "#09090b" }}>
        {/* Mobile topbar */}
        {isMobile && (
          <div className="flex h-14 items-center justify-between px-4 border-b sticky top-0 z-40" style={{ background: "rgba(9,9,11,0.9)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8 rounded-lg" />
              <span className="text-sm font-semibold text-zinc-200">{activeMenuItem?.label ?? "OmniAI"}</span>
            </div>
          </div>
        )}

        {/* Usage bar */}
        {subStatus?.usage && subStatus.usage.aiGenerationsUsed != null && (
          <div className="border-b px-4 py-1.5 text-center text-[11px] text-zinc-600" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {subStatus.usage.aiGenerationsUsed} generations used this period
            {subStatus.purchasedCredits != null && subStatus.purchasedCredits > 0 && ` · ${subStatus.purchasedCredits} credits`}
          </div>
        )}

        <main className="flex-1 p-5 md:p-7 min-h-0">{children}</main>
      </SidebarInset>
    </>
  );
}
