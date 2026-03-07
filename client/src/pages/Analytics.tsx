import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Eye, MousePointer, Target, DollarSign, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { ReportExport } from "@/components/ReportExport";

export default function Analytics() {
  const { data: overview, isLoading } = trpc.analytics.summary.useQuery();
  const { data: platformBreakdown } = trpc.analytics.list.useQuery();
  const insightsMut = trpc.analytics.getInsights.useMutation({ onError: (e: any) => toast.error(e.message) });
  const [showInsights, setShowInsights] = useState(false);

  const metricCards = [
    { label: "Total Impressions", value: Number(overview?.totalImpressions ?? 0).toLocaleString(), icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Clicks", value: Number(overview?.totalClicks ?? 0).toLocaleString(), icon: MousePointer, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Conversions", value: Number(overview?.totalConversions ?? 0).toLocaleString(), icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Revenue", value: `$${Number(overview?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Unified view of campaign performance across all platforms with AI-driven insights.</p>
        </div>
        <div className="flex gap-2">
          <ReportExport reportType="analytics" defaultTitle="Analytics report" />
          <Button variant="outline" className="rounded-xl" onClick={() => { setShowInsights(true); insightsMut.mutate(); }}>
            {insightsMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            AI Insights
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metricCards.map(m => (
          <Card key={m.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`h-9 w-9 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </div>
              {isLoading ? <div className="h-8 w-20 bg-muted animate-pulse rounded" /> : <p className="text-2xl font-bold">{m.value}</p>}
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Platform Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!platformBreakdown?.length ? (
              <p className="text-sm text-muted-foreground">No platform data yet. Launch campaigns to see performance by platform.</p>
            ) : (
              <div className="space-y-3">
                {platformBreakdown.map((p: any) => {
                  const maxImpressions = Math.max(...platformBreakdown.map((x: any) => Number(x.impressions) || 1));
                  const pct = Math.round(((Number(p.impressions) || 0) / maxImpressions) * 100);
                  return (
                    <div key={p.platform} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{p.platform}</span>
                        <span className="text-muted-foreground">{Number(p.impressions).toLocaleString()} impressions</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{Number(p.clicks).toLocaleString()} clicks</span>
                        <span>{Number(p.conversions).toLocaleString()} conv</span>
                        <span>${Number(p.revenue).toLocaleString()} rev</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!platformBreakdown?.length ? (
              <p className="text-sm text-muted-foreground">No campaign data yet. Create and launch campaigns to track performance.</p>
            ) : (
              <div className="space-y-3">
                {(platformBreakdown as any[]).slice(0, 5).map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{c.platform || c.eventType}</p>
                      <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{Number(c.impressions).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">impressions</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showInsights && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insightsMut.isPending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Analyzing your data...</div>
            ) : insightsMut.data?.insights ? (
              <div className="prose prose-sm max-w-none text-foreground"><Streamdown>{insightsMut.data.insights}</Streamdown></div>
            ) : (
              <p className="text-sm text-muted-foreground">Click "AI Insights" to get AI-powered analysis of your marketing performance.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
