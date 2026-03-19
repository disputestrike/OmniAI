import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  ArrowLeft, Megaphone, Sparkles, Loader2, Play, Pause, BarChart3,
  PenTool, Palette, Video, Mail, Globe, Users, Calendar, Share2,
  ExternalLink, Download, Copy, Check, TrendingUp, Target, Eye,
  FileText, Image as ImageIcon, Zap, ChevronRight, Plus, RefreshCw,
} from "lucide-react";

/* ─── Tab config ────────────────────────────────────────── */
const TABS = [
  { id: "overview",  label: "Overview",     icon: BarChart3 },
  { id: "content",   label: "Content",      icon: PenTool },
  { id: "creatives", label: "Images",       icon: Palette },
  { id: "videos",    label: "Videos",       icon: Video },
  { id: "emails",    label: "Email",        icon: Mail },
  { id: "pages",     label: "Landing Page", icon: Globe },
  { id: "leads",     label: "Leads",        icon: Users },
  { id: "schedule",  label: "Schedule",     icon: Calendar },
  { id: "analytics", label: "Analytics",    icon: TrendingUp },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ─── Status pill ───────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "idle", active: "done", paused: "warning",
    completed: "done", archived: "idle", published: "done",
    sent: "done", failed: "error", sending: "running",
  };
  return (
    <span className={`agent-pill ${map[status] ?? "idle"}`} style={{ fontSize: 10 }}>
      <span className="dot" />{status}
    </span>
  );
}

/* ─── Copy button ───────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 1500); }}
      className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {copied ? <Check style={{ width: 12, height: 12, color: "#10b981" }} /> : <Copy style={{ width: 12, height: 12 }} />}
    </button>
  );
}

/* ─── Empty state ───────────────────────────────────────── */
function EmptyTab({ label, icon: Icon, action, actionLabel }: { label: string; icon: any; action?: () => void; actionLabel?: string }) {
  return (
    <div className="empty-state py-16">
      <div className="empty-icon"><Icon className="h-5 w-5" /></div>
      <p className="empty-title">No {label} yet</p>
      <p className="empty-desc">Use the AI Agent to generate {label} for this campaign.</p>
      {action && (
        <button onClick={action} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white mt-3 transition-all"
          style={{ background: "rgba(124,58,237,0.7)" }}>
          <Sparkles className="h-3.5 w-3.5" /> {actionLabel ?? "Generate"}
        </button>
      )}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────── */
export default function CampaignWorkspace() {
  const [, params] = useRoute("/campaigns/:id");
  const [, navigate] = useLocation();
  const campaignId = params?.id ? parseInt(params.id, 10) : null;

  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const utils = trpc.useUtils();
  const { data: ws, isLoading, error } = trpc.campaign.workspace.useQuery(
    { campaignId: campaignId! },
    { enabled: !!campaignId, refetchOnWindowFocus: false }
  );
  const updateMut = trpc.campaign.update.useMutation({
    onSuccess: () => { utils.campaign.workspace.invalidate({ campaignId: campaignId! }); toast.success("Updated"); },
    onError: e => toast.error(e.message),
  });
  const strategyMut = trpc.campaign.generateStrategy.useMutation({ onError: e => toast.error(e.message) });

  if (!campaignId) { navigate("/campaigns"); return null; }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-sm text-zinc-500">Loading campaign workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !ws) {
    return (
      <div className="empty-state py-24">
        <div className="empty-icon"><Megaphone className="h-5 w-5" /></div>
        <p className="empty-title">Campaign not found</p>
        <p className="empty-desc">{error?.message ?? "This campaign doesn't exist or you don't have access."}</p>
        <button onClick={() => navigate("/campaigns")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white mt-3"
          style={{ background: "rgba(124,58,237,0.7)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to campaigns
        </button>
      </div>
    );
  }

  const { campaign, contents, creatives, videoAds, emailSequences, landingPages, scheduledPosts, leads, analytics, summary } = ws;

  const goToAgent = () => navigate(`/ai-agents?prompt=${encodeURIComponent(`Add more assets to campaign: ${campaign.name}. Campaign ID: ${campaignId}. Generate content, images, videos and social posts.`)}`);

  return (
    <div className="space-y-0 max-w-7xl animate-fade-up" style={{ minHeight: "calc(100vh - 120px)" }}>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate("/campaigns")}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5 shrink-0"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            <ArrowLeft style={{ width: 15, height: 15 }} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-black text-white">{campaign.name}</h1>
              <StatusPill status={campaign.status} />
            </div>
            {campaign.objective && (
              <p className="text-xs text-zinc-500 mt-1 capitalize">
                {campaign.objective.replace(/_/g, " ")}
                {campaign.budget && ` · Budget: ${campaign.budget}`}
                {(campaign.platforms as string[])?.length > 0 && ` · ${(campaign.platforms as string[]).join(", ")}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={goToAgent}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-violet-300 transition-all"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
            <Sparkles className="h-3.5 w-3.5" /> Add with AI
          </button>
          {campaign.status === "draft" && (
            <button onClick={() => updateMut.mutate({ id: campaignId, status: "active" })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
              style={{ background: "rgba(16,185,129,0.7)" }}>
              {updateMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Launch
            </button>
          )}
          {campaign.status === "active" && (
            <button onClick={() => updateMut.mutate({ id: campaignId, status: "paused" })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 transition-all"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
          )}
          <button onClick={() => { utils.campaign.workspace.invalidate({ campaignId: campaignId! }); }}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Asset summary strip ──────────────────────────── */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
        {[
          { label: "Content", count: summary.contentCount,  icon: PenTool,   tab: "content",   color: "#06b6d4" },
          { label: "Images",  count: summary.creativeCount, icon: Palette,   tab: "creatives", color: "#ec4899" },
          { label: "Videos",  count: summary.videoCount,    icon: Video,     tab: "videos",    color: "#ef4444" },
          { label: "Emails",  count: summary.emailCount,    icon: Mail,      tab: "emails",    color: "#3b82f6" },
          { label: "Pages",   count: summary.pageCount,     icon: Globe,     tab: "pages",     color: "#8b5cf6" },
          { label: "Leads",   count: summary.leadCount,     icon: Users,     tab: "leads",     color: "#10b981" },
          { label: "Posts",   count: summary.postCount,     icon: Calendar,  tab: "schedule",  color: "#f59e0b" },
          { label: "Clicks",  count: analytics.totalClicks, icon: BarChart3, tab: "analytics", color: "#7c3aed" },
        ].map(item => (
          <button key={item.tab} onClick={() => setActiveTab(item.tab as TabId)}
            className="rounded-xl p-3 text-center transition-all"
            style={{
              background: activeTab === item.tab ? `${item.color}15` : "rgba(255,255,255,0.025)",
              border: `1px solid ${activeTab === item.tab ? item.color + "35" : "rgba(255,255,255,0.07)"}`,
            }}>
            <item.icon style={{ width: 14, height: 14, color: item.color, margin: "0 auto 4px" }} />
            <p className="text-lg font-black text-white leading-none">{item.count.toLocaleString()}</p>
            <p className="text-[9px] text-zinc-600 mt-0.5">{item.label}</p>
          </button>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0"
            style={activeTab === tab.id
              ? { background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }
              : { background: "transparent", color: "#52525b", border: "1px solid transparent" }}>
            <tab.icon style={{ width: 13, height: 13 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────── */}

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Impressions", value: analytics.totalImpressions.toLocaleString(), color: "#7c3aed" },
              { label: "Clicks",      value: analytics.totalClicks.toLocaleString(),      color: "#06b6d4" },
              { label: "Conversions", value: analytics.totalConversions.toLocaleString(), color: "#10b981" },
              { label: "Revenue",     value: `$${analytics.totalRevenue.toLocaleString()}`, color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <span className="stat-label">{s.label}</span>
                <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* AI Strategy */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white">Campaign Strategy</h3>
              </div>
              <button onClick={() => strategyMut.mutate({ campaignId })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-400 transition-all"
                style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                {strategyMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                {strategyMut.isPending ? "Generating..." : "Generate strategy"}
              </button>
            </div>
            {strategyMut.data?.strategy ? (
              <div className="prose-dark text-sm"><Streamdown content={strategyMut.data.strategy} /></div>
            ) : (
              <p className="text-sm text-zinc-600">Click "Generate strategy" to get an AI-powered campaign plan tailored to your objective, platforms, and budget.</p>
            )}
          </div>

          {/* Asset quick view */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Recent content */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-zinc-300">Content ({summary.contentCount})</h3>
                <button onClick={() => setActiveTab("content")} className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1">See all <ChevronRight className="h-3 w-3" /></button>
              </div>
              {contents.slice(0, 3).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-300 truncate">{c.title || c.type}</p>
                    <p className="text-[10px] text-zinc-600 capitalize">{c.type?.replace(/_/g, " ")} · {c.platform}</p>
                  </div>
                  <StatusPill status={c.status} />
                </div>
              ))}
              {contents.length === 0 && <p className="text-xs text-zinc-600 py-2">No content yet</p>}
            </div>

            {/* Recent leads */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-zinc-300">Leads ({summary.leadCount})</h3>
                <button onClick={() => setActiveTab("leads")} className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1">See all <ChevronRight className="h-3 w-3" /></button>
              </div>
              {leads.slice(0, 3).map((l: any) => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <div>
                    <p className="text-xs font-semibold text-zinc-300">{l.name || l.email}</p>
                    <p className="text-[10px] text-zinc-600">{l.email} · {l.source}</p>
                  </div>
                  <StatusPill status={l.status} />
                </div>
              ))}
              {leads.length === 0 && <p className="text-xs text-zinc-600 py-2">No leads captured yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      {activeTab === "content" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">{contents.length} content pieces</p>
            <button onClick={goToAgent} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-violet-400 transition-all"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <Sparkles className="h-3 w-3" /> Generate more
            </button>
          </div>
          {contents.length === 0
            ? <EmptyTab label="content" icon={PenTool} action={goToAgent} actionLabel="Generate content" />
            : contents.map((c: any) => (
              <div key={c.id} className="glass rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-zinc-300">{c.title || c.type?.replace(/_/g, " ")}</span>
                      <StatusPill status={c.status} />
                    </div>
                    <p className="text-[10px] text-zinc-600 capitalize mb-2">{c.type?.replace(/_/g, " ")} · {c.platform}</p>
                    <p className="text-xs text-zinc-400 line-clamp-3 font-mono leading-relaxed">{c.body}</p>
                  </div>
                  <CopyBtn text={c.body ?? ""} />
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* CREATIVES */}
      {activeTab === "creatives" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-zinc-500">{creatives.length} images</p>
            <button onClick={goToAgent} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-violet-400 transition-all"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <Sparkles className="h-3 w-3" /> Generate more
            </button>
          </div>
          {creatives.length === 0
            ? <EmptyTab label="images" icon={Palette} action={goToAgent} actionLabel="Generate images" />
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {creatives.map((c: any) => (
                  <div key={c.id} className="creative-card group">
                    {c.imageUrl
                      ? <img src={c.imageUrl} alt={c.type} loading="lazy" />
                      : <div style={{ aspectRatio: "1", background: "#111113", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ImageIcon style={{ width: 24, height: 24, color: "#3f3f46" }} />
                        </div>
                    }
                    <div className="creative-overlay">
                      <div className="flex items-center gap-1.5">
                        {c.imageUrl && (
                          <a href={c.imageUrl} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white"
                            style={{ background: "rgba(0,0,0,0.6)" }}>
                            <Download style={{ width: 10, height: 10 }} /> Download
                          </a>
                        )}
                        <span className="text-[9px] text-zinc-400 capitalize">{c.type?.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* VIDEOS */}
      {activeTab === "videos" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">{videoAds.length} video scripts</p>
            <button onClick={goToAgent} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-violet-400 transition-all"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <Sparkles className="h-3 w-3" /> Generate more
            </button>
          </div>
          {videoAds.length === 0
            ? <EmptyTab label="video scripts" icon={Video} action={goToAgent} actionLabel="Generate video scripts" />
            : videoAds.map((v: any) => (
              <div key={v.id} className="glass rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Video style={{ width: 14, height: 14, color: "#ef4444" }} />
                      <span className="text-xs font-bold text-zinc-300 capitalize">{v.platform?.replace(/_/g, " ") ?? "Video Ad"}</span>
                      <StatusPill status={v.status} />
                    </div>
                    {(v.metadata as any)?.hook && (
                      <div className="mb-2 px-2 py-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
                        <p className="text-[10px] text-zinc-500 mb-0.5">Hook</p>
                        <p className="text-xs text-zinc-300 font-medium">"{(v.metadata as any).hook}"</p>
                      </div>
                    )}
                    <p className="text-xs text-zinc-400 line-clamp-4 font-mono leading-relaxed">{v.script}</p>
                    {(v.metadata as any)?.cta && (
                      <p className="text-[10px] text-zinc-500 mt-2">CTA: <span className="text-violet-400">{(v.metadata as any).cta}</span></p>
                    )}
                  </div>
                  <CopyBtn text={v.script ?? ""} />
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* EMAILS */}
      {activeTab === "emails" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">{emailSequences.length} email campaigns</p>
            <button onClick={goToAgent} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-violet-400 transition-all"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <Sparkles className="h-3 w-3" /> Generate sequence
            </button>
          </div>
          {emailSequences.length === 0
            ? <EmptyTab label="email campaigns" icon={Mail} action={goToAgent} actionLabel="Generate email sequence" />
            : emailSequences.map((e: any) => (
              <div key={e.id} className="glass rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-zinc-200">{e.name}</span>
                      <StatusPill status={e.status} />
                    </div>
                    <p className="text-[10px] text-zinc-500 mb-2">Subject: {e.subject}</p>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { label: "Recipients", value: e.totalRecipients ?? 0 },
                        { label: "Opened",     value: e.opened ?? 0 },
                        { label: "Clicked",    value: e.clicked ?? 0 },
                      ].map(s => (
                        <div key={s.label} className="text-center rounded-lg py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <p className="text-sm font-bold text-white">{s.value}</p>
                          <p className="text-[9px] text-zinc-600">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => navigate("/email-marketing")}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                    <ExternalLink style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* LANDING PAGES */}
      {activeTab === "pages" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">{landingPages.length} landing pages</p>
            <button onClick={goToAgent} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-violet-400 transition-all"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <Sparkles className="h-3 w-3" /> Generate page
            </button>
          </div>
          {landingPages.length === 0
            ? <EmptyTab label="landing pages" icon={Globe} action={goToAgent} actionLabel="Generate landing page" />
            : landingPages.map((p: any) => (
              <div key={p.id} className="glass rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-zinc-200">{p.title}</span>
                      <StatusPill status={p.status} />
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono">/{p.slug}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-zinc-500"><Eye style={{ width: 11, height: 11, display: "inline", marginRight: 3 }} />{p.visits ?? 0} visits</span>
                      <span className="text-xs text-zinc-500"><Target style={{ width: 11, height: 11, display: "inline", marginRight: 3 }} />{p.conversions ?? 0} conversions</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {p.publishedUrl && (
                      <a href={p.publishedUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-violet-400 transition-all"
                        style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                        <ExternalLink style={{ width: 10, height: 10 }} /> Visit
                      </a>
                    )}
                    <button onClick={() => navigate("/landing-pages")}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-zinc-400 transition-all"
                      style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* LEADS */}
      {activeTab === "leads" && (
        <div>
          <p className="text-xs text-zinc-500 mb-4">{leads.length} leads captured</p>
          {leads.length === 0
            ? <EmptyTab label="leads" icon={Users} />
            : (
              <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l: any) => (
                      <tr key={l.id}>
                        <td className="font-semibold text-zinc-200">{l.name || "—"}</td>
                        <td>{l.email}</td>
                        <td className="capitalize">{l.source}</td>
                        <td><StatusPill status={l.status} /></td>
                        <td><span className="font-bold text-violet-400">{l.score ?? 0}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {/* SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">{scheduledPosts.length} scheduled posts</p>
          {scheduledPosts.length === 0
            ? <EmptyTab label="scheduled posts" icon={Calendar} action={() => navigate("/scheduler")} actionLabel="Open scheduler" />
            : scheduledPosts.map((p: any) => (
              <div key={p.id} className="glass rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="platform-tag capitalize">{p.platform}</span>
                    <StatusPill status={p.status} />
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    {p.scheduledAt ? new Date(p.scheduledAt).toLocaleString() : "Not scheduled"}
                  </p>
                </div>
                {p.publishedAt && <span className="text-[10px] text-emerald-400">Published</span>}
              </div>
            ))
          }
        </div>
      )}

      {/* ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Impressions", value: analytics.totalImpressions.toLocaleString(), color: "#7c3aed" },
              { label: "Clicks",      value: analytics.totalClicks.toLocaleString(),      color: "#06b6d4" },
              { label: "Conversions", value: analytics.totalConversions.toLocaleString(), color: "#10b981" },
              { label: "Revenue",     value: `$${analytics.totalRevenue.toLocaleString()}`, color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <span className="stat-label">{s.label}</span>
                <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {analytics.events.length === 0
            ? <EmptyTab label="analytics events" icon={BarChart3} />
            : (
              <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full data-table">
                  <thead><tr><th>Platform</th><th>Impressions</th><th>Clicks</th><th>Conversions</th><th>Revenue</th><th>Date</th></tr></thead>
                  <tbody>
                    {analytics.events.slice(0, 20).map((e: any) => (
                      <tr key={e.id}>
                        <td className="capitalize font-semibold text-zinc-200">{e.platform}</td>
                        <td>{Number(e.impressions).toLocaleString()}</td>
                        <td>{Number(e.clicks).toLocaleString()}</td>
                        <td>{Number(e.conversions).toLocaleString()}</td>
                        <td className="text-emerald-400">${Number(e.revenue).toLocaleString()}</td>
                        <td className="text-zinc-600">{new Date(e.recordedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

    </div>
  );
}
