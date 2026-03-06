import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Streamdown } from "streamdown";
import { Globe, Plus, Trash2, RefreshCw, Shield, ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp, TrendingDown, Target, Eye, BarChart3, Search, Bell, Map, Zap, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

const threatColors: Record<string, string> = { low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800" };
const threatIcons: Record<string, typeof Shield> = { low: ShieldCheck, medium: Shield, high: ShieldAlert, critical: AlertTriangle };

export default function CompetitorIntel() {
  const [tab, setTab] = useState("dashboard");
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [selectedCompetitor, setSelectedCompetitor] = useState<number | null>(null);
  const [analysisType, setAnalysisType] = useState<"full_analysis" | "ad_scan" | "seo_check" | "social_check" | "content_check">("full_analysis");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [positioningData, setPositioningData] = useState<any>(null);

  const { data: competitors, refetch } = trpc.competitorIntel.listProfiles.useQuery();
  const { data: alerts } = trpc.competitorIntel.getAlerts.useQuery();
  const addMut = trpc.competitorIntel.addCompetitor.useMutation({ onSuccess: () => { refetch(); setAddOpen(false); setName(""); setDomain(""); setIndustry(""); toast.success("Competitor added!"); } });
  const deleteMut = trpc.competitorIntel.deleteCompetitor.useMutation({ onSuccess: () => { refetch(); toast.success("Removed"); } });
  const analyzeMut = trpc.competitorIntel.analyzeCompetitor.useMutation({ onSuccess: (d) => { setAnalysisResult(d); refetch(); toast.success("Analysis complete!"); }, onError: () => toast.error("Analysis failed") });
  const positionMut = trpc.competitorIntel.getPositioningMap.useMutation({ onSuccess: (d) => { setPositioningData(d); toast.success("Positioning map generated!"); }, onError: () => toast.error("Failed") });
  const markReadMut = trpc.competitorIntel.markAlertRead.useMutation({ onSuccess: () => refetch() });

  const unreadAlerts = alerts?.filter(a => !a.isRead).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Competitor Intelligence</h1>
          <p className="text-muted-foreground">Track, analyze, and outmaneuver your competitors with AI-powered insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => positionMut.mutate()} disabled={positionMut.isPending || !competitors?.length}>
            <Map className="w-4 h-4 mr-2" /> {positionMut.isPending ? "Analyzing..." : "Positioning Map"}
          </Button>
          <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Competitor</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1" /> Dashboard</TabsTrigger>
          <TabsTrigger value="analysis"><Search className="w-4 h-4 mr-1" /> Deep Analysis</TabsTrigger>
          <TabsTrigger value="alerts"><Bell className="w-4 h-4 mr-1" /> Alerts {unreadAlerts > 0 && <Badge className="ml-1" variant="destructive">{unreadAlerts}</Badge>}</TabsTrigger>
          {positioningData && <TabsTrigger value="positioning"><Target className="w-4 h-4 mr-1" /> Positioning</TabsTrigger>}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold">{competitors?.length || 0}</p><p className="text-xs text-muted-foreground">Tracked Competitors</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-red-600">{competitors?.filter(c => c.threatLevel === "high" || c.threatLevel === "critical").length || 0}</p><p className="text-xs text-muted-foreground">High Threats</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-green-600">{competitors?.filter(c => c.lastAnalyzedAt).length || 0}</p><p className="text-xs text-muted-foreground">Analyzed</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-blue-600">{unreadAlerts}</p><p className="text-xs text-muted-foreground">New Alerts</p></CardContent></Card>
          </div>

          {/* Competitor Grid */}
          {!competitors?.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Globe className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No competitors tracked yet. Add your first competitor to start monitoring.</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitors.map(c => {
                const ThreatIcon = threatIcons[c.threatLevel || "low"] || Shield;
                const metrics = c.metrics as any;
                return (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{c.name}</CardTitle>
                          <a href={`https://${c.domain}`} target="_blank" rel="noopener" className="text-sm text-blue-600 hover:underline flex items-center gap-1">{c.domain} <ArrowUpRight className="w-3 h-3" /></a>
                        </div>
                        <Badge className={threatColors[c.threatLevel || "low"]}><ThreatIcon className="w-3 h-3 mr-1" />{c.threatLevel || "low"}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {c.industry && <Badge variant="outline">{c.industry}</Badge>}
                      {metrics && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-muted p-2 rounded"><p className="text-muted-foreground">Est. Traffic</p><p className="font-medium">{metrics.estimatedTraffic?.toLocaleString() || "N/A"}</p></div>
                          <div className="bg-muted p-2 rounded"><p className="text-muted-foreground">Social</p><p className="font-medium">{metrics.socialFollowers?.toLocaleString() || "N/A"}</p></div>
                          <div className="bg-muted p-2 rounded"><p className="text-muted-foreground">Ads</p><p className="font-medium">{metrics.adCount || "N/A"}</p></div>
                          <div className="bg-muted p-2 rounded"><p className="text-muted-foreground">Engagement</p><p className="font-medium">{metrics.engagementRate ? `${metrics.engagementRate}%` : "N/A"}</p></div>
                        </div>
                      )}
                      {c.lastAnalyzedAt && <p className="text-xs text-muted-foreground">Last analyzed: {new Date(c.lastAnalyzedAt).toLocaleDateString()}</p>}
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => { setSelectedCompetitor(c.id); setTab("analysis"); }}><Search className="w-3 h-3 mr-1" /> Analyze</Button>
                        <Button variant="ghost" size="sm" onClick={() => { if (confirm("Remove competitor?")) deleteMut.mutate({ id: c.id }); }}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deep Competitor Analysis</CardTitle>
              <CardDescription>Run AI-powered analysis on any tracked competitor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Select Competitor</label>
                  <Select value={selectedCompetitor?.toString() || ""} onValueChange={v => setSelectedCompetitor(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Choose a competitor..." /></SelectTrigger>
                    <SelectContent>
                      {competitors?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.domain})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Analysis Type</label>
                  <Select value={analysisType} onValueChange={v => setAnalysisType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_analysis">Full Analysis (All Areas)</SelectItem>
                      <SelectItem value="ad_scan">Ad Strategy Scan</SelectItem>
                      <SelectItem value="seo_check">SEO Analysis</SelectItem>
                      <SelectItem value="social_check">Social Media Analysis</SelectItem>
                      <SelectItem value="content_check">Content Strategy Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => { if (selectedCompetitor) analyzeMut.mutate({ competitorId: selectedCompetitor, analysisType }); }} disabled={!selectedCompetitor || analyzeMut.isPending}>
                <Zap className="w-4 h-4 mr-2" /> {analyzeMut.isPending ? "Analyzing..." : "Run Analysis"}
              </Button>
            </CardContent>
          </Card>

          {analysisResult && (
            <>
              {/* SWOT Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "Strengths", items: analysisResult.swot?.strengths, color: "border-green-500 bg-green-50 dark:bg-green-950/30", icon: TrendingUp },
                  { title: "Weaknesses", items: analysisResult.swot?.weaknesses, color: "border-red-500 bg-red-50 dark:bg-red-950/30", icon: TrendingDown },
                  { title: "Opportunities", items: analysisResult.swot?.opportunities, color: "border-blue-500 bg-blue-50 dark:bg-blue-950/30", icon: ArrowUpRight },
                  { title: "Threats", items: analysisResult.swot?.threats, color: "border-orange-500 bg-orange-50 dark:bg-orange-950/30", icon: ArrowDownRight },
                ].map(({ title, items, color, icon: Icon }) => (
                  <Card key={title} className={`border-l-4 ${color}`}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Icon className="w-4 h-4" />{title}</CardTitle></CardHeader>
                    <CardContent><ul className="space-y-1 text-sm">{items?.map((item: string, i: number) => <li key={i} className="flex items-start gap-2"><Minus className="w-3 h-3 mt-1 shrink-0" />{item}</li>)}</ul></CardContent>
                  </Card>
                ))}
              </div>

              {/* Strategies */}
              {analysisResult.strategies?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Identified Strategies</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysisResult.strategies.map((s: any, i: number) => (
                        <div key={i} className="p-3 bg-muted rounded-lg">
                          <Badge variant="outline" className="mb-1">{s.category}</Badge>
                          <p className="font-medium text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {analysisResult.recommendations?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Actionable Recommendations</CardTitle></CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {analysisResult.recommendations.map((r: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 p-2 bg-muted rounded"><span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span><span className="text-sm">{r}</span></li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {!alerts?.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Bell className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No alerts yet. Alerts will appear when competitor changes are detected.</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {alerts.map(a => (
                <Card key={a.id} className={!a.isRead ? "border-l-4 border-l-blue-500" : ""}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(a.createdAt!).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.severity === "critical" ? "destructive" : a.severity === "warning" ? "default" : "secondary"}>{a.severity}</Badge>
                      {!a.isRead && <Button variant="ghost" size="sm" onClick={() => markReadMut.mutate({ id: a.id })}>Mark Read</Button>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {positioningData && (
          <TabsContent value="positioning" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Competitive Positioning Map</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{positioningData.analysis}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {positioningData.positions?.map((p: any, i: number) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{p.name}</h3>
                          <Badge>{p.position}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">Market Share: {p.marketShare}</p>
                        <div className="flex flex-wrap gap-1">{p.differentiators?.map((d: string, j: number) => <Badge key={j} variant="outline" className="text-xs">{d}</Badge>)}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {positioningData.gaps?.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Market Gaps</h3>
                    <ul className="space-y-1">{positioningData.gaps.map((g: string, i: number) => <li key={i} className="text-sm flex items-start gap-2"><Target className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />{g}</li>)}</ul>
                  </div>
                )}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-1">Recommended Position</h3>
                    <p className="text-sm">{positioningData.ourRecommendedPosition}</p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Add Competitor Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Competitor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Company Name</label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Acme Corp" /></div>
            <div><label className="text-sm font-medium">Website Domain</label><Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g., acme.com" /></div>
            <div><label className="text-sm font-medium">Industry (optional)</label><Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g., SaaS, E-commerce" /></div>
            <Button onClick={() => addMut.mutate({ name, domain, industry: industry || undefined })} disabled={!name.trim() || !domain.trim() || addMut.isPending} className="w-full">
              {addMut.isPending ? "Adding..." : "Add Competitor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
