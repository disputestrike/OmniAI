import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, Eye, MousePointer, Target, DollarSign, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { ReportExport } from "@/components/ReportExport";

export default function Analytics() {
  const { data: overview, isLoading } = trpc.analytics.summary.useQuery();
  const { data: platformBreakdown } = trpc.analytics.list.useQuery();
  const insightsMut = trpc.analytics.getInsights.useMutation({ onError: (e: any) => toast.error(e.message) });
  const [showInsights, setShowInsights] = useState(false);

  const metrics = [
    { label: "Impressions", value: Number(overview?.totalImpressions ?? 0).toLocaleString(), icon: Eye,          color: "#7c3aed" },
    { label: "Clicks",      value: Number(overview?.totalClicks ?? 0).toLocaleString(),      icon: MousePointer,  color: "#06b6d4" },
    { label: "Conversions", value: Number(overview?.totalConversions ?? 0).toLocaleString(), icon: Target,        color: "#10b981" },
    { label: "Revenue",     value: `$${Number(overview?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-6 max-w-6xl animate-fade-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Unified performance view across all platforms with AI-driven insights.</p>
        </div>
        <div className="flex gap-2">
          <ReportExport reportType="analytics" defaultTitle="Analytics report" />
          <button
            onClick={() => { setShowInsights(true); insightsMut.mutate(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa" }}
          >
            {insightsMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI Insights
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="stat-label">{m.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${m.color}18` }}>
                <m.icon className="h-4 w-4" style={{ color: m.color }} />
              </div>
            </div>
            {isLoading
              ? <div className="skeleton h-8 w-24 mb-1" />
              : <span className="stat-value">{m.value}</span>
            }
          </div>
        ))}
      </div>

      {/* Platform breakdown + Campaign performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Platform */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">Platform Breakdown</h3>
          </div>
          {!platformBreakdown?.length ? (
            <div className="empty-state py-8">
              <div className="empty-icon"><BarChart3 className="h-5 w-5" /></div>
              <p className="empty-title">No platform data yet</p>
              <p className="empty-desc">Launch campaigns to see performance by platform.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(platformBreakdown as any[]).map(p => {
                const max = Math.max(...(platformBreakdown as any[]).map(x => Number(x.impressions) || 1));
                const pct = Math.round(((Number(p.impressions) || 0) / max) * 100);
                return (
                  <div key={p.platform} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-200">{p.platform}</span>
                      <span className="text-xs text-zinc-500">{Number(p.impressions).toLocaleString()} impr.</span>
                    </div>
                    <div className="progress-bar">
                      <div className="fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex gap-4 text-[11px] text-zinc-600">
                      <span>{Number(p.clicks).toLocaleString()} clicks</span>
                      <span>{Number(p.conversions).toLocaleString()} conv</span>
                      <span>${Number(p.revenue).toLocaleString()} rev</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Campaign performance */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Campaign Performance</h3>
          </div>
          {!platformBreakdown?.length ? (
            <div className="empty-state py-8">
              <div className="empty-icon"><TrendingUp className="h-5 w-5" /></div>
              <p className="empty-title">No campaign data yet</p>
              <p className="empty-desc">Create and launch campaigns to track performance.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(platformBreakdown as any[]).slice(0, 6).map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">{c.platform || c.eventType}</p>
                    <p className="text-[10px] text-zinc-600">{new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{Number(c.impressions).toLocaleString()}</p>
                    <p className="text-[10px] text-zinc-600">impressions</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      {showInsights && (
        <div className="glass rounded-2xl p-5 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">AI-Powered Insights</h3>
          </div>
          {insightsMut.isPending ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin text-violet-400" /> Analyzing your data...
            </div>
          ) : insightsMut.data?.insights ? (
            <div className="prose-dark"><Streamdown content={insightsMut.data.insights} /></div>
          ) : (
            <p className="text-sm text-zinc-500">Click "AI Insights" above to get AI-powered analysis.</p>
          )}
        </div>
      )}
    </div>
  );
}
