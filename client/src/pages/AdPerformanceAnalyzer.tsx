import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useState } from "react";
import {
  BarChart3, Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Loader2, Zap, Target, DollarSign, Eye, MousePointerClick, RefreshCw,
  ChevronRight, Star, ArrowUpRight, ArrowDownRight, Lightbulb, Bell, X
} from "lucide-react";
import { ReportExport } from "@/components/ReportExport";

const DATE_RANGES = [
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "last_90_days", label: "Last 90 Days" },
  { value: "all_time", label: "All Time" },
];

const SEVERITY_COLORS = {
  info: "bg-blue-100 text-blue-700 border-blue-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  critical: "bg-red-100 text-red-700 border-red-200",
};

const SEVERITY_ICONS = {
  info: <Eye className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  critical: <AlertTriangle className="w-4 h-4 text-red-600" />,
};

export default function AdPerformanceAnalyzer() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: connections, isLoading: connectionsLoading } = trpc.adPlatform.connections.useQuery(undefined, { enabled: !!user });
  const { data: reports, isLoading: reportsLoading } = trpc.adPerformance.list.useQuery(undefined, { enabled: !!user });
  const { data: alerts } = trpc.adPerformance.alerts.useQuery(undefined, { enabled: !!user });

  const analyze = trpc.adPerformance.analyze.useMutation({
    onSuccess: () => {
      utils.adPerformance.list.invalidate();
      toast.success("Analysis complete! AI insights are ready.");
    },
    onError: (e) => toast.error(e.message),
  });

  const generateAlerts = trpc.adPerformance.generateAlerts.useMutation({
    onSuccess: (data) => {
      utils.adPerformance.alerts.invalidate();
      toast.success(`${data.alertsCreated} performance alerts generated`);
    },
  });

  const dismissAlert = trpc.adPerformance.dismissAlert.useMutation({
    onSuccess: () => utils.adPerformance.alerts.invalidate(),
  });

  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [dateRange, setDateRange] = useState("last_30_days");
  const [activeReport, setActiveReport] = useState<any>(null);

  const connectedPlatforms = connections?.filter(c => c.status === "connected") || [];

  const handleAnalyze = () => {
    if (!selectedConnection) { toast.error("Select a connected ad account"); return; }
    analyze.mutate({
      connectionId: Number(selectedConnection),
      dateRange: dateRange as any,
      reportType: "campaign",
    });
  };

  const latestReport = reports?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-violet-600" />
            Ad Performance Analyzer
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-powered analysis of your ad campaigns — identify winners, fix underperformers, and maximize ROAS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReportExport reportType="ad_performance" defaultTitle="Ad performance report" />
          <Badge variant="outline" className="text-violet-600 border-violet-200 bg-violet-50">
            <Brain className="w-3 h-3 mr-1" /> AI-Powered
          </Badge>
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert: any) => (
            <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${SEVERITY_COLORS[alert.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.warning}`}>
              {SEVERITY_ICONS[alert.severity as keyof typeof SEVERITY_ICONS] || SEVERITY_ICONS.warning}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{alert.campaignName} — {alert.alertType.replace(/_/g, " ").toUpperCase()}</p>
                <p className="text-xs mt-0.5 opacity-80">{alert.aiSuggestion}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => dismissAlert.mutate({ id: alert.id })}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run New Analysis</CardTitle>
          <CardDescription>Select a connected ad account and date range to get AI insights</CardDescription>
        </CardHeader>
        <CardContent>
          {connectedPlatforms.length === 0 ? (
            <div className="text-center py-6">
              <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No connected ad accounts found.</p>
              <p className="text-xs text-muted-foreground mt-1">Go to <strong>Ad Platforms</strong> to connect Meta Ads, Google Ads, or TikTok Ads.</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select ad account..." />
                </SelectTrigger>
                <SelectContent>
                  {connectedPlatforms.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.platform.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())} — {c.accountName || "Account"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAnalyze} disabled={analyze.isPending || !selectedConnection} className="bg-violet-600 hover:bg-violet-700 text-white">
                {analyze.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Brain className="w-4 h-4 mr-2" /> Analyze Now</>}
              </Button>
              {selectedConnection && (
                <Button variant="outline" onClick={() => generateAlerts.mutate({ connectionId: Number(selectedConnection) })} disabled={generateAlerts.isPending}>
                  <Bell className="w-4 h-4 mr-2" /> Check Alerts
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analyze.isPending && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-violet-200 animate-pulse" />
              <Brain className="w-8 h-8 text-violet-600 absolute inset-0 m-auto animate-bounce" />
            </div>
            <p className="font-semibold text-violet-700">AI is analyzing your campaigns...</p>
            <p className="text-sm text-muted-foreground mt-1">Identifying patterns, winners, and optimization opportunities</p>
            <Progress value={65} className="max-w-xs mx-auto mt-4" />
          </CardContent>
        </Card>
      )}

      {analyze.data && (
        <AnalysisResults report={analyze.data} />
      )}

      {/* Past Reports */}
      {!analyze.isPending && reports && reports.length > 0 && !analyze.data && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Past Analyses</h2>
          <div className="grid gap-3">
            {reports.map((report: any) => (
              <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveReport(report)}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{report.platform.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())} Analysis</p>
                        <p className="text-xs text-muted-foreground">{report.dateRange?.replace(/_/g, " ")} · {new Date(report.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={report.status === "complete" ? "default" : "secondary"} className="text-xs">
                        {report.status}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  {report.aiAnalysis && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{report.aiAnalysis}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active Report Modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setActiveReport(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Analysis Report</h2>
              <Button variant="ghost" size="icon" onClick={() => setActiveReport(null)}><X className="w-4 h-4" /></Button>
            </div>
            {activeReport.recommendations && <AnalysisResults report={{ analysis: { ...activeReport.recommendations, summary: activeReport.aiAnalysis, topPerformers: activeReport.topPerformers, winningPatterns: activeReport.winningPatterns } }} />}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!analyze.isPending && !analyze.data && (!reports || reports.length === 0) && (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">No analyses yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Connect an ad account and run your first analysis to get AI-powered insights on your campaign performance.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AnalysisResults({ report }: { report: any }) {
  const analysis = report.analysis;
  if (!analysis) return null;

  return (
    <div className="space-y-4">
      {/* Score Banner */}
      <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200">
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-violet-600 font-medium">Account Health Score</p>
              <p className="text-3xl font-black text-violet-700">{analysis.overallScore}<span className="text-lg font-normal text-violet-500">/100</span></p>
              <p className="text-xs text-violet-500 mt-1">Estimated ROAS improvement: <strong>{analysis.estimatedRoasImprovement}</strong></p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700 mb-1">Summary</p>
              <p className="text-xs text-muted-foreground max-w-xs">{analysis.summary}</p>
            </div>
          </div>
          <Progress value={analysis.overallScore} className="mt-3 h-2" />
        </CardContent>
      </Card>

      <Tabs defaultValue="winners">
        <TabsList className="w-full">
          <TabsTrigger value="winners" className="flex-1">Top Performers</TabsTrigger>
          <TabsTrigger value="patterns" className="flex-1">Winning Patterns</TabsTrigger>
          <TabsTrigger value="fixes" className="flex-1">Fix These</TabsTrigger>
          <TabsTrigger value="actions" className="flex-1">Next Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="winners" className="space-y-3 mt-4">
          {analysis.topPerformers?.map((p: any, i: number) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{p.name}</p>
                      <Badge className="text-xs bg-green-100 text-green-700 border-green-200">{p.metric}: {p.value}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.reason}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-green-600 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-3 mt-4">
          {analysis.winningPatterns?.map((p: any, i: number) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.pattern}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                    <Badge className="mt-1 text-xs bg-blue-50 text-blue-600 border-blue-200">{p.impact}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="fixes" className="space-y-3 mt-4">
          {analysis.underperformers?.map((u: any, i: number) => (
            <Card key={i} className="border-red-100">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{u.name}</p>
                    <p className="text-xs text-red-600 mt-0.5">{u.issue}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Lightbulb className="w-3 h-3 text-amber-500" /> {u.recommendation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {analysis.budgetRecommendations?.map((b: any, i: number) => (
            <Card key={`budget-${i}`} className="border-amber-100">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{b.action}: {b.campaign}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.reason}</p>
                    <Badge className="mt-1 text-xs bg-amber-50 text-amber-700 border-amber-200">{b.expectedImpact}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="actions" className="space-y-3 mt-4">
          {analysis.nextActions?.map((a: any, i: number) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${a.priority === "high" ? "bg-red-100" : a.priority === "medium" ? "bg-amber-100" : "bg-green-100"}`}>
                    <Target className={`w-4 h-4 ${a.priority === "high" ? "text-red-600" : a.priority === "medium" ? "text-amber-600" : "text-green-600"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm">{a.action}</p>
                      <Badge className={`text-xs ${a.priority === "high" ? "bg-red-100 text-red-700" : a.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                        {a.priority} priority
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.expectedResult}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
