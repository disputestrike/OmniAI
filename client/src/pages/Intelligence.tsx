import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Globe, Search, BarChart3, Users, Target, Zap, TrendingUp, Shield, ArrowRight, Loader2, Download, Eye, MousePointer, Clock, FileText, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Intelligence() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState<"quick" | "standard" | "deep">("standard");
  const [report, setReport] = useState<any>(null);

  const analyzeMutation = trpc.intelligence.analyzeWebsite.useMutation({
    onSuccess: (data) => {
      setReport(data);
      toast.success("Intelligence report generated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const hooksMutation = trpc.intelligence.generateHookVariations.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const handleAnalyze = () => {
    if (!url.trim()) return toast.error("Enter a website URL");
    analyzeMutation.mutate({ url: url.trim(), depth });
  };

  const handleExportReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `intelligence-report-${report.overview?.domain || "website"}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Website Intelligence</h1>
        <p className="text-muted-foreground mt-1">Analyze any website's marketing strategy, traffic, SEO, and competitive landscape — like SimilarWeb, powered by AI.</p>
      </div>

      {/* Input Section */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="url" className="mb-2 block">Website URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label className="mb-2 block">Analysis Depth</Label>
              <Select value={depth} onValueChange={(v) => setDepth(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick Scan</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="deep">Deep Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAnalyze} disabled={analyzeMutation.isPending} className="w-full sm:w-auto">
                {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Analyze
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {analyzeMutation.isPending && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold">Analyzing {url}...</h3>
            <p className="text-muted-foreground mt-2">Running comprehensive marketing intelligence analysis. This may take 15-30 seconds.</p>
          </CardContent>
        </Card>
      )}

      {/* Report */}
      {report && (
        <div className="space-y-6">
          {/* Overview Header */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{report.overview?.domain}</CardTitle>
                  <CardDescription className="text-base mt-1">{report.overview?.industry}</CardDescription>
                </div>
                <Button variant="outline" onClick={handleExportReport}>
                  <Download className="h-4 w-4 mr-2" /> Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background rounded-lg p-4 text-center">
                  <Eye className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <div className="text-2xl font-bold">{report.overview?.estimatedMonthlyTraffic}</div>
                  <div className="text-xs text-muted-foreground">Monthly Traffic</div>
                </div>
                <div className="bg-background rounded-lg p-4 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <div className="text-2xl font-bold">#{report.overview?.globalRank}</div>
                  <div className="text-xs text-muted-foreground">Global Rank</div>
                </div>
                <div className="bg-background rounded-lg p-4 text-center">
                  <MousePointer className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                  <div className="text-2xl font-bold">{report.overview?.bounceRate}</div>
                  <div className="text-xs text-muted-foreground">Bounce Rate</div>
                </div>
                <div className="bg-background rounded-lg p-4 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                  <div className="text-2xl font-bold">{report.overview?.avgVisitDuration}</div>
                  <div className="text-xs text-muted-foreground">Avg Visit Duration</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="traffic" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="traffic">Traffic</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
              <TabsTrigger value="swot">SWOT</TabsTrigger>
              <TabsTrigger value="recommendations">Actions</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
            </TabsList>

            {/* Traffic Sources */}
            <TabsContent value="traffic">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                  <CardDescription>Where visitors are coming from</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.trafficSources && Object.entries(report.trafficSources).map(([source, pct]) => (
                    <div key={source} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{source}</span>
                        <span>{pct as string}</span>
                      </div>
                      <Progress value={parseFloat(String(pct)) || 0} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audience Demographics */}
            <TabsContent value="audience">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Top Countries</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {report.audienceDemographics?.topCountries?.map((c: any, i: number) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="font-medium">{c.country}</span>
                        <Badge variant="secondary">{c.percentage}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Age Distribution</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {report.audienceDemographics?.ageDistribution?.map((a: any, i: number) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{a.range}</span>
                          <span>{a.percentage}</span>
                        </div>
                        <Progress value={parseFloat(a.percentage) || 0} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Gender Split</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <div className="flex-1 bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{report.audienceDemographics?.genderSplit?.male}</div>
                        <div className="text-sm text-muted-foreground">Male</div>
                      </div>
                      <div className="flex-1 bg-pink-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-pink-600">{report.audienceDemographics?.genderSplit?.female}</div>
                        <div className="text-sm text-muted-foreground">Female</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Interests</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {report.audienceDemographics?.interests?.map((interest: string, i: number) => (
                        <Badge key={i} variant="outline">{interest}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SEO Analysis */}
            <TabsContent value="seo">
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-3xl font-bold text-primary">{report.seoAnalysis?.domainAuthority}</div>
                      <div className="text-sm text-muted-foreground">Domain Authority</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-3xl font-bold text-green-600">{report.seoAnalysis?.backlinks}</div>
                      <div className="text-sm text-muted-foreground">Backlinks</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">{report.seoAnalysis?.organicTraffic}</div>
                      <div className="text-sm text-muted-foreground">Organic Traffic</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-3xl font-bold text-orange-600">{report.seoAnalysis?.topKeywords?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Tracked Keywords</div>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Top Keywords</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">Keyword</th>
                            <th className="text-left py-2 font-medium">Position</th>
                            <th className="text-left py-2 font-medium">Volume</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.seoAnalysis?.topKeywords?.map((kw: any, i: number) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2 font-medium">{kw.keyword}</td>
                              <td className="py-2"><Badge variant="secondary">#{kw.position}</Badge></td>
                              <td className="py-2">{kw.volume}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Content Gaps</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.seoAnalysis?.contentGaps?.map((gap: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <Target className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                          <span className="text-sm">{gap}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Social Presence */}
            <TabsContent value="social">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.socialPresence?.map((sp: any, i: number) => (
                  <Card key={i}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{sp.platform}</h3>
                        <Badge>{sp.engagement} engagement</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold">{sp.followers}</div>
                          <div className="text-xs text-muted-foreground">Followers</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{sp.postFrequency}</div>
                          <div className="text-xs text-muted-foreground">Post Frequency</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Content Strategy */}
            <TabsContent value="content">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Strategy Overview</CardTitle>
                    <CardDescription>Blog frequency: {report.contentStrategy?.blogFrequency} | Tone: {report.contentStrategy?.tone}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {report.contentStrategy?.contentTypes?.map((ct: string, i: number) => (
                        <Badge key={i} variant="outline"><FileText className="h-3 w-3 mr-1" />{ct}</Badge>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <h4 className="font-medium mb-3">Top Content</h4>
                    <div className="space-y-2">
                      {report.contentStrategy?.topContent?.map((tc: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded bg-muted/50">
                          <span className="text-sm font-medium">{tc.title}</span>
                          <Badge variant="secondary">{tc.estimatedViews} views</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Competitors */}
            <TabsContent value="competitors">
              <div className="grid grid-cols-1 gap-4">
                {report.competitors?.map((comp: any, i: number) => (
                  <Card key={i}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{comp.name}</h3>
                          <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                            {comp.url} <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <Badge variant="secondary">Overlap: {comp.overlapScore}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {comp.strengths?.map((s: string, j: number) => (
                          <Badge key={j} variant="outline">{s}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* SWOT Analysis */}
            <TabsContent value="swot">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader><CardTitle className="text-lg text-green-700">Strengths</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.swotAnalysis?.strengths?.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm"><Shield className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />{s}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader><CardTitle className="text-lg text-red-700">Weaknesses</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.swotAnalysis?.weaknesses?.map((w: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm"><Target className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />{w}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader><CardTitle className="text-lg text-blue-700">Opportunities</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.swotAnalysis?.opportunities?.map((o: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm"><Zap className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />{o}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader><CardTitle className="text-lg text-orange-700">Threats</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.swotAnalysis?.threats?.map((t: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm"><Shield className="h-4 w-4 mt-0.5 text-orange-600 shrink-0" />{t}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Actionable Recommendations */}
            <TabsContent value="recommendations">
              <Card>
                <CardHeader>
                  <CardTitle>Actionable Recommendations</CardTitle>
                  <CardDescription>Prioritized actions to improve marketing performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {report.actionableRecommendations?.map((rec: any, i: number) => (
                    <div key={i} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={rec.priority === "High" || rec.priority === "high" ? "destructive" : rec.priority === "Medium" || rec.priority === "medium" ? "default" : "secondary"}>
                          {rec.priority}
                        </Badge>
                        <Badge variant="outline">{rec.category}</Badge>
                      </div>
                      <p className="text-sm font-medium">{rec.recommendation}</p>
                      <p className="text-xs text-muted-foreground mt-1">Expected Impact: {rec.expectedImpact}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Budget Suggestion */}
            <TabsContent value="budget">
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Marketing Budget</CardTitle>
                  <CardDescription>Recommended monthly: {report.marketingBudgetSuggestion?.monthly}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {report.marketingBudgetSuggestion?.breakdown?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded bg-muted/50">
                      <div>
                        <span className="font-medium">{item.channel}</span>
                        <span className="text-muted-foreground ml-2 text-sm">({item.percentage})</span>
                      </div>
                      <span className="font-bold">{item.amount}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* No report yet - show feature cards */}
      {!report && !analyzeMutation.isPending && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Traffic Analysis</h3>
              <p className="text-sm text-muted-foreground">Estimated monthly traffic, sources breakdown, bounce rate, and visit duration.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-10 w-10 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Audience Intelligence</h3>
              <p className="text-sm text-muted-foreground">Demographics, geography, age distribution, gender split, and interests.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-10 w-10 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">SEO & Competitors</h3>
              <p className="text-sm text-muted-foreground">Domain authority, top keywords, backlinks, content gaps, and competitor analysis.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Zap className="h-10 w-10 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">SWOT Analysis</h3>
              <p className="text-sm text-muted-foreground">Strengths, weaknesses, opportunities, and threats for any website.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Action Plan</h3>
              <p className="text-sm text-muted-foreground">Prioritized recommendations with expected impact for immediate execution.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Budget Planning</h3>
              <p className="text-sm text-muted-foreground">Suggested marketing budget with channel-by-channel breakdown.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
