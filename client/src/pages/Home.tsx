import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, Megaphone, PenTool, Users, BarChart3, Image, TrendingUp, Zap, ArrowRight,
  Sparkles, Rocket, Target, Brain, Globe, Video, Bot, Calendar, FlaskConical,
  ShoppingCart, UserPlus, Lightbulb, Crown, Flame, Eye, Heart, MessageCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { ReportExport } from "@/components/ReportExport";

const goalPipelines = [
  {
    id: "product",
    icon: ShoppingCart,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    title: "Make a Product #1",
    desc: "Take any product and make it the highest-purchased in its category. AI analyzes, creates campaigns, targets buyers, and drives conversions.",
    steps: [
      { label: "Add Your Product", path: "/products", detail: "Upload product info, URL, or images. AI extracts features, benefits, audience, and positioning." },
      { label: "Generate All Content", path: "/content", detail: "AI creates ad copy, blog posts, SEO, social captions, video scripts, email campaigns, and more — 22 content types." },
      { label: "Create Visuals & Video", path: "/creatives", detail: "Generate ad images, thumbnails, banners, and video ad scripts with storyboards for every platform." },
      { label: "Launch Campaigns", path: "/campaigns", detail: "Deploy across 21+ platforms: Google, YouTube, TikTok, Instagram, Facebook, Amazon, LinkedIn, and more." },
      { label: "A/B Test & Optimize", path: "/ab-testing", detail: "Test multiple variations, identify winners, and let AI optimize for maximum conversions." },
      { label: "Capture & Convert Leads", path: "/leads", detail: "Collect leads, score them, nurture with automated sequences, and close sales." },
    ],
  },
  {
    id: "person",
    icon: Crown,
    color: "text-violet-600",
    bg: "bg-violet-50",
    title: "Make Someone Viral",
    desc: "Take any person on any social media and push them to viral fame. Build their brand, grow their audience, and dominate every platform.",
    steps: [
      { label: "Build the Brand Profile", path: "/products", detail: "Create a personal brand profile — story, values, unique angle, target audience, and voice." },
      { label: "Create Viral Content", path: "/content", detail: "Generate Twitter threads, TikTok scripts, YouTube SEO, LinkedIn articles, UGC scripts, and story content." },
      { label: "Design Visual Identity", path: "/creatives", detail: "Create social graphics, thumbnails, story templates, and branded visuals across all platforms." },
      { label: "Launch Multi-Platform Push", path: "/campaigns", detail: "Coordinate campaigns across TikTok, YouTube, Instagram, Twitter, LinkedIn, podcasts, and more." },
      { label: "Schedule & Auto-Post", path: "/scheduler", detail: "Schedule content at optimal times across all platforms with AI-recommended timing." },
      { label: "Track & Amplify", path: "/analytics", detail: "Monitor growth, engagement, and virality metrics. AI suggests amplification strategies." },
    ],
  },
  {
    id: "concept",
    icon: Brain,
    color: "text-amber-600",
    bg: "bg-amber-50",
    title: "Spread a Concept",
    desc: "Take any idea, cause, or movement and plant it in people's consciousness. Make it inescapable across every channel and demographic.",
    steps: [
      { label: "Define the Concept", path: "/products", detail: "Articulate the core idea, messaging framework, emotional triggers, and target demographics." },
      { label: "Create Persuasion Content", path: "/content", detail: "Generate PR releases, blog posts, social campaigns, video scripts, podcast scripts, and thought leadership." },
      { label: "Build Visual Campaign", path: "/creatives", detail: "Create compelling visuals, infographics, memes, and shareable graphics that spread organically." },
      { label: "Multi-Channel Saturation", path: "/campaigns", detail: "Deploy across all channels — social, search, email, SMS, WhatsApp, TV, radio, print, and podcasts." },
      { label: "Micro-Target Segments", path: "/ai-agents", detail: "Use AI to identify and target specific demographic and psychographic segments with tailored messaging." },
      { label: "Measure Consciousness", path: "/analytics", detail: "Track reach, sentiment, share-of-voice, and mind-share metrics across all platforms." },
    ],
  },
];

const statCards = [
  { label: "Products", key: "products" as const, icon: Package, color: "text-indigo-600", bg: "bg-indigo-50", path: "/products" },
  { label: "Campaigns", key: "campaigns" as const, icon: Megaphone, color: "text-violet-600", bg: "bg-violet-50", path: "/campaigns" },
  { label: "Content", key: "contents" as const, icon: PenTool, color: "text-emerald-600", bg: "bg-emerald-50", path: "/content" },
  { label: "Creatives", key: "creatives" as const, icon: Image, color: "text-amber-600", bg: "bg-amber-50", path: "/creatives" },
  { label: "Leads", key: "leads" as const, icon: Users, color: "text-rose-600", bg: "bg-rose-50", path: "/leads" },
];

const quickActions = [
  { label: "Analyze a Product", desc: "Upload any product and get full AI marketing intelligence", icon: Package, path: "/products" },
  { label: "Generate Content", desc: "22 content types: ads, blogs, SEO, social, video, PR, podcasts", icon: PenTool, path: "/content" },
  { label: "Create Visuals", desc: "AI-generated ad images, social graphics, banners, thumbnails", icon: Image, path: "/creatives" },
  { label: "Create Video Ads", desc: "Scripts + storyboards for TikTok, YouTube, Reels, Shorts", icon: Video, path: "/video-ads" },
  { label: "Build Campaign", desc: "Multi-platform campaigns across 21+ channels worldwide", icon: Megaphone, path: "/campaigns" },
  { label: "A/B Test", desc: "Generate variations, compare performance, find winners", icon: FlaskConical, path: "/ab-testing" },
  { label: "Schedule Posts", desc: "Auto-post across all platforms at optimal times", icon: Calendar, path: "/scheduler" },
  { label: "Manage Leads", desc: "Capture, score, nurture, and convert leads from campaigns", icon: UserPlus, path: "/leads" },
  { label: "AI Marketing Agent", desc: "Chat with AI for strategy, ideas, targeting, and optimization", icon: Bot, path: "/ai-agents" },
  { label: "View Analytics", desc: "Cross-platform performance, AI insights, and recommendations", icon: BarChart3, path: "/analytics" },
  { label: "Export Data", desc: "Export campaigns, content, leads as JSON or CSV", icon: Globe, path: "/export-import" },
  { label: "Idea Generator", desc: "AI brainstorms campaign ideas, angles, and viral hooks", icon: Lightbulb, path: "/ai-agents" },
];

const capabilities = [
  { icon: Target, label: "Micro-Targeting", desc: "Demographic, psychographic, behavioral targeting" },
  { icon: Brain, label: "Persuasion AI", desc: "Cialdini, AIDA, PAS, emotional triggers" },
  { icon: Globe, label: "Global Reach", desc: "Every platform, every country, every language" },
  { icon: Flame, label: "Viral Engine", desc: "Algorithms to maximize shareability and virality" },
  { icon: Eye, label: "Consciousness Planting", desc: "Multi-channel saturation for mind-share" },
  { icon: Heart, label: "Emotional Mapping", desc: "Map and trigger audience emotions precisely" },
  { icon: MessageCircle, label: "Omni-Channel", desc: "Social, search, email, SMS, WhatsApp, TV, radio" },
  { icon: Rocket, label: "Instant Results", desc: "Generate campaigns in seconds, not weeks" },
];

export default function Home() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const [, setLocation] = useLocation();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);

  const activePipeline = goalPipelines.find(p => p.id === selectedPipeline);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Hero */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to OTOBI AI</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            The ultimate AI marketing engine. Market anything to anybody, anywhere. Make products #1, people viral, and ideas unstoppable.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <ReportExport reportType="dashboard" defaultTitle="Dashboard overview" />
          <Button onClick={() => setWizardOpen(true)} className="rounded-xl shadow-md">
            <Rocket className="h-4 w-4 mr-2" />Not sure where to start?
          </Button>
        </div>
      </div>

      {/* Goal Pipeline Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">What do you want to achieve?</DialogTitle>
          </DialogHeader>
          {!selectedPipeline ? (
            <div className="space-y-3 mt-2">
              <p className="text-sm text-muted-foreground">Choose your goal and we'll guide you through every step with AI-powered automation.</p>
              {goalPipelines.map(p => (
                <button key={p.id} onClick={() => setSelectedPipeline(p.id)}
                  className="w-full p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/3 transition-all text-left flex items-start gap-4 group">
                  <div className={`h-12 w-12 rounded-xl ${p.bg} flex items-center justify-center shrink-0`}>
                    <p.icon className={`h-6 w-6 ${p.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">{p.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{p.desc}</p>
                  </div>
                </button>
              ))}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground text-center">Or just explore — every tool is available from the sidebar. AI Agents can help you strategize anything.</p>
              </div>
            </div>
          ) : activePipeline ? (
            <div className="space-y-4 mt-2">
              <button onClick={() => setSelectedPipeline(null)} className="text-sm text-primary hover:underline">&larr; Back to goals</button>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${activePipeline.bg} flex items-center justify-center`}>
                  <activePipeline.icon className={`h-5 w-5 ${activePipeline.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{activePipeline.title}</h3>
                  <p className="text-sm text-muted-foreground">{activePipeline.desc}</p>
                </div>
              </div>
              <div className="space-y-2">
                {activePipeline.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-all">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{step.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 rounded-lg" onClick={() => { setWizardOpen(false); setLocation(step.path); }}>
                      Go <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Hero Visual Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative rounded-2xl overflow-hidden shadow-md group cursor-pointer" onClick={() => setLocation('/content')}>
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/hero-marketing-dashboard-Gj5mJgrtS26XPcJCaRrABK.webp" alt="AI Marketing Dashboard" className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <Badge className="bg-white/90 text-foreground text-[10px] mb-1">All-in-One Dashboard</Badge>
            <p className="text-white text-xs font-medium">22 content types, 21 platforms, one command center</p>
          </div>
        </div>
        <div className="relative rounded-2xl overflow-hidden shadow-md group cursor-pointer" onClick={() => setLocation('/creatives')}>
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/hero-ai-content-creation-72bpDX2cFotaCeHHbSCMBe.webp" alt="AI Content Creation" className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <Badge className="bg-white/90 text-foreground text-[10px] mb-1">AI Creative Engine</Badge>
            <p className="text-white text-xs font-medium">Generate ads, visuals, videos, and copy with AI</p>
          </div>
        </div>
        <div className="relative rounded-2xl overflow-hidden shadow-md group cursor-pointer" onClick={() => setLocation('/campaigns')}>
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663280407830/QkdAGQf5b7goEiSECHMXdZ/hero-viral-growth-fWB9JVZPqVMXssFX3Pmr8z.webp" alt="Viral Growth Engine" className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <Badge className="bg-white/90 text-foreground text-[10px] mb-1">Viral Growth Engine</Badge>
            <p className="text-white text-xs font-medium">Make anything go viral across every platform globally</p>
          </div>
        </div>
      </div>

      {/* Goal Pipelines - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {goalPipelines.map(p => (
          <Card key={p.id} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => { setSelectedPipeline(p.id); setWizardOpen(true); }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-10 w-10 rounded-xl ${p.bg} flex items-center justify-center`}>
                  <p.icon className={`h-5 w-5 ${p.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.steps.length} steps</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="cursor-pointer hover:shadow-md transition-all group border-0 shadow-sm" onClick={() => setLocation(stat.path)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats?.[stat.key] ?? 0}</p>}
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Impressions", value: Number(stats?.analytics?.totalImpressions ?? 0).toLocaleString() },
                  { label: "Clicks", value: Number(stats?.analytics?.totalClicks ?? 0).toLocaleString() },
                  { label: "Conversions", value: Number(stats?.analytics?.totalConversions ?? 0).toLocaleString() },
                  { label: "Revenue", value: `$${Number(stats?.analytics?.totalRevenue ?? 0).toLocaleString()}` },
                ].map(m => (
                  <div key={m.label} className="space-y-1">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-xl font-semibold">{m.value}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add a product and launch your first campaign. AI will analyze performance, suggest optimizations, and identify growth opportunities.
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setLocation("/analytics")}>View Analytics</Button>
          </CardContent>
        </Card>
      </div>

      {/* Capabilities */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />Platform Capabilities
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {capabilities.map(cap => (
            <div key={cap.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/30">
              <cap.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium">{cap.label}</p>
                <p className="text-[11px] text-muted-foreground">{cap.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Card key={action.label} className="cursor-pointer hover:shadow-md transition-all group border-0 shadow-sm" onClick={() => setLocation(action.path)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                    <action.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{action.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
