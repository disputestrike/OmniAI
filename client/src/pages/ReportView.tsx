import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, BarChart3, TrendingUp, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function ReportView() {
  const [, params] = useRoute("/report/:shareToken");
  const shareToken = params?.shareToken ?? "";

  const { data: report, isLoading, error } = trpc.reports.getByToken.useQuery(
    { shareToken },
    { enabled: !!shareToken }
  );

  if (!shareToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full"><CardContent className="p-6 text-center text-muted-foreground">Invalid report link.</CardContent></Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full mt-4" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full"><CardContent className="p-6 text-center text-muted-foreground">Report not found or expired.</CardContent></Card>
      </div>
    );
  }

  const payload = report.payload as Record<string, unknown> | undefined;
  const type = report.reportType;
  const data = payload?.data ?? payload;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <FileText className="h-4 w-4" />
          <span>OTOBI AI — Shared report</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{report.title}</CardTitle>
            <p className="text-sm text-muted-foreground">Generated report (view only)</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {type === "dashboard" && data && typeof data === "object" && "products" in data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["products", "campaigns", "contents", "leads", "creatives"].map(key => (
                  <div key={key} className="p-3 rounded-lg border bg-background">
                    <p className="text-2xl font-bold">{(data as Record<string, number>)[key] ?? 0}</p>
                    <p className="text-xs text-muted-foreground capitalize">{key}</p>
                  </div>
                ))}
              </div>
            )}
            {type === "analytics" && data && typeof data === "object" && (
              <div className="space-y-2">
                {"summary" in data && typeof (data as any).summary === "object" && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg border"><p className="text-lg font-bold">{(data as any).summary.impressions ?? 0}</p><p className="text-xs text-muted-foreground">Impressions</p></div>
                    <div className="p-3 rounded-lg border"><p className="text-lg font-bold">{(data as any).summary.clicks ?? 0}</p><p className="text-xs text-muted-foreground">Clicks</p></div>
                    <div className="p-3 rounded-lg border"><p className="text-lg font-bold">{(data as any).summary.conversions ?? 0}</p><p className="text-xs text-muted-foreground">Conversions</p></div>
                  </div>
                )}
                {"totalEvents" in data && <p className="text-sm text-muted-foreground">Total events: {(data as any).totalEvents ?? 0}</p>}
              </div>
            )}
            {type === "ad_performance" && data && Array.isArray((data as any).reports) && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Ad performance reports ({(data as any).reports.length})</p>
                <div className="text-sm text-muted-foreground">Summary data is available in the full dashboard.</div>
              </div>
            )}
            {(!data || (type !== "dashboard" && type !== "analytics" && type !== "ad_performance")) && (
              <pre className="p-4 rounded-lg bg-muted text-xs overflow-auto max-h-96">{JSON.stringify(payload ?? report.payload, null, 2)}</pre>
            )}
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-medium">Create reports like this with OTOBI AI</p>
              <p className="text-sm text-muted-foreground">One platform for content, campaigns, analytics, and more.</p>
            </div>
            <Button onClick={() => { window.location.href = getLoginUrl(); }}>
              <Zap className="h-4 w-4 mr-2" /> Get started free
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
