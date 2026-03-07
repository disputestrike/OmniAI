import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Package,
  PenTool,
  Image,
  Video,
  Megaphone,
  FlaskConical,
  Calendar,
  Users,
  BarChart3,
  ArrowUpDown,
  Zap,
  Bot,
  UsersRound,
  CreditCard,
  Globe,
  Handshake,
  Search,
  Share2,
  CheckCircle,
  TrendingUp,
  Layers,
  Flame,
  Shield,
  Send,
  Film,
  Scissors,
  Eye,
  Webhook,
  Languages,
  Mic,
  Mail,
  FileCode,
  Workflow,
  Shuffle,
  Smile,
  UserCircle,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuSections = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    ],
  },
  {
    label: "Create",
    items: [
      { icon: Package, label: "Product Analyzer", path: "/products" },
      { icon: PenTool, label: "Content Studio", path: "/content" },
      { icon: Shuffle, label: "Content Repurposer", path: "/content-repurposer" },
      { icon: Image, label: "Creative Engine", path: "/creatives" },
      { icon: Video, label: "Video Ads", path: "/video-ads" },
      { icon: Film, label: "Video Render", path: "/video-render" },
      { icon: Video, label: "Video Studio", path: "/video-studio" },
      { icon: Scissors, label: "Image Editor", path: "/image-editor" },
      { icon: Mic, label: "Brand Voice", path: "/brand-voice" },
      { icon: Languages, label: "Translate", path: "/translate" },
      { icon: UserCircle, label: "AI Avatars", path: "/ai-avatars" },
      { icon: Smile, label: "Meme Generator", path: "/meme-generator" },
    ],
  },
  {
    label: "Manage",
    items: [
      { icon: Megaphone, label: "Campaigns", path: "/campaigns" },
      { icon: FlaskConical, label: "A/B Testing", path: "/ab-testing" },
      { icon: Calendar, label: "Scheduler", path: "/scheduler" },
      { icon: Users, label: "Lead Manager", path: "/leads" },
      { icon: Handshake, label: "CRM Deals", path: "/deals" },
      { icon: Share2, label: "Ad Platforms", path: "/ad-platforms" },
      { icon: Flame, label: "Momentum", path: "/momentum" },
      { icon: Send, label: "Social Publish", path: "/social-publish" },
      { icon: Mail, label: "Email Marketing", path: "/email-marketing" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { icon: Globe, label: "Website Intel", path: "/intelligence" },
      { icon: Layers, label: "Platform Intel", path: "/platform-intel" },
      { icon: Search, label: "SEO Audits", path: "/seo-audits" },
      { icon: BarChart3, label: "Analytics", path: "/analytics" },
      { icon: TrendingUp, label: "Predictive AI", path: "/predictive" },
      { icon: Bot, label: "AI Agents", path: "/ai-agents" },
      { icon: Eye, label: "Competitor Spy", path: "/competitor-spy" },
      { icon: Users, label: "Customer Intel", path: "/customer-intel" },
      { icon: Search, label: "Competitor Intel", path: "/competitor-intel" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { icon: UsersRound, label: "Collaboration", path: "/collaboration" },
      { icon: CheckCircle, label: "Approvals", path: "/approvals" },
      { icon: ArrowUpDown, label: "Export / Import", path: "/export-import" },
      { icon: Webhook, label: "Webhooks", path: "/webhooks" },
      { icon: FileCode, label: "Landing Pages", path: "/landing-pages" },
      { icon: Workflow, label: "Automations", path: "/automations" },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: CreditCard, label: "Pricing & Plans", path: "/pricing" },
    ],
  },
  {
    label: "Admin",
    items: [
      { icon: Shield, label: "Admin Panel", path: "/admin" },
    ],
  },
];

const allMenuItems = menuSections.flatMap(s => s.items);

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 250;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <span className="text-2xl font-bold tracking-tight">OTOBI AI</span>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              The ultimate AI marketing suite. Create campaigns, generate content, manage leads, and grow your business — all in one place.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all rounded-xl"
          >
            Sign in to get started
          </Button>
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

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (w: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = allMenuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
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

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-14 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <Zap className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-bold tracking-tight truncate text-sm">OTOBI AI</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 px-2">
            {menuSections.filter(section => section.label !== "Admin" || user?.role === "admin").map((section, sIdx) => (
              <div key={section.label} className={sIdx > 0 ? "mt-4" : ""}>
                {!isCollapsed && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 mb-1">
                    {section.label}
                  </p>
                )}
                <SidebarMenu className="gap-0.5">
                  {section.items.map(item => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className="h-9 transition-all font-normal text-[13px]"
                        >
                          <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            ))}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">{user?.name || "-"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email || "-"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (isCollapsed) return; setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-3 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <span className="tracking-tight text-foreground font-medium text-sm">
                {activeMenuItem?.label ?? "Menu"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
