import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Search, Globe, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Streamdown } from "streamdown";

export default function SeoAudits() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: audits, isLoading } = trpc.seo.audits.useQuery(undefined, { enabled: !!user });
  const runAudit = trpc.seo.runAudit.useMutation({ onSuccess: () => { utils.seo.audits.invalidate(); toast.success("SEO audit complete"); } });
  const keywordResearch = trpc.seo.keywordResearch.useMutation({ onSuccess: () => toast.success("Keywords analyzed") });
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [industry, setIndustry] = useState("");

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Search className="h-6 w-6 text-primary" /> SEO Audits</h1>
        <p className="text-zinc-500">Audit websites, research keywords, and track rankings with AI-powered insights</p>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Site Audit</TabsTrigger>
          <TabsTrigger value="keywords">Keyword Research</TabsTrigger>
          <TabsTrigger value="history">Audit History</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Run SEO Audit</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Website URL</Label><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" /></div>
              <Button onClick={() => { if (!url.trim()) { toast.error("Enter a URL"); return; } runAudit.mutate({ url }); }} disabled={runAudit.isPending}>
                {runAudit.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Auditing...</> : <><Globe className="h-4 w-4 mr-2" /> Run Full Audit</>}
              </Button>
            </CardContent>
          </Card>

          {runAudit.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="glass rounded-2xl"><CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{runAudit.data.overallScore}</p>
                  <p className="text-xs text-zinc-500">Overall Score</p>
                </CardContent></Card>
                <Card className="glass rounded-2xl"><CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{runAudit.data.technicalScore}</p>
                  <p className="text-xs text-zinc-500">Technical</p>
                </CardContent></Card>
                <Card className="glass rounded-2xl"><CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{runAudit.data.contentScore}</p>
                  <p className="text-xs text-zinc-500">Content</p>
                </CardContent></Card>
                <Card className="glass rounded-2xl"><CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{runAudit.data.authorityScore}</p>
                  <p className="text-xs text-zinc-500">Authority</p>
                </CardContent></Card>
              </div>

              {runAudit.data.issues?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Issues Found</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {runAudit.data.issues.map((issue: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/40">
                          <Badge className={issue.severity === "critical" ? "bg-red-100 text-red-800" : issue.severity === "warning" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}>
                            {issue.severity}
                          </Badge>
                          <div>
                            <p className="font-medium text-sm">{issue.title}</p>
                            <p className="text-xs text-zinc-500">{issue.description}</p>
                            {issue.fix && <p className="text-xs text-primary mt-1">Fix: {issue.fix}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {runAudit.data.keywords?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Top Keywords Detected</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {runAudit.data.keywords.map((kw: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-sm">{kw.keyword} <span className="ml-1 text-zinc-500">vol: {kw.volume}</span></Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {runAudit.data.recommendations && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> AI Recommendations</CardTitle></CardHeader>
                  <CardContent><Streamdown>{runAudit.data.recommendations}</Streamdown></CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>AI Keyword Research</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Seed Keyword or Topic</Label><Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g., AI marketing tools" /></div>
                <div><Label>Industry (optional)</Label><Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g., SaaS, E-commerce" /></div>
              </div>
              <Button onClick={() => { if (!keyword.trim()) { toast.error("Enter a keyword"); return; } keywordResearch.mutate({ seed: keyword, industry: industry || undefined }); }} disabled={keywordResearch.isPending}>
                {keywordResearch.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Researching...</> : <><TrendingUp className="h-4 w-4 mr-2" /> Research Keywords</>}
              </Button>
            </CardContent>
          </Card>

          {keywordResearch.data && (
            <Card>
              <CardHeader><CardTitle>Keyword Results</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="text-left p-2">Keyword</th>
                      <th className="text-left p-2">Volume</th>
                      <th className="text-left p-2">Difficulty</th>
                      <th className="text-left p-2">CPC</th>
                      <th className="text-left p-2">Intent</th>
                    </tr></thead>
                    <tbody>
                      {keywordResearch.data.keywords?.map((kw: any, i: number) => (
                        <tr key={i} className="border-b hover:bg-zinc-900/40">
                          <td className="p-2 font-medium">{kw.keyword}</td>
                          <td className="p-2">{kw.volume}</td>
                          <td className="p-2"><Badge className={kw.difficulty === "easy" ? "bg-green-100 text-green-800" : kw.difficulty === "medium" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}>{kw.difficulty}</Badge></td>
                          <td className="p-2">{kw.cpc}</td>
                          <td className="p-2">{kw.intent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {keywordResearch.data.contentIdeas && (
                  <div className="mt-4"><p className="font-medium mb-2">Content Ideas:</p><Streamdown>{keywordResearch.data.contentIdeas}</Streamdown></div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
          ) : !audits?.length ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto text-zinc-500/30 mb-4" />
              <p className="text-zinc-500">No audits yet. Run your first SEO audit above.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {audits.map((audit: any) => (
                <Card key={audit.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{audit.url}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                          <span>Score: <strong className="text-foreground">{audit.overallScore}/100</strong></span>
                          <span>{new Date(audit.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge className={Number(audit.overallScore) >= 80 ? "bg-green-100 text-green-800" : Number(audit.overallScore) >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}>
                        {Number(audit.overallScore) >= 80 ? "Good" : Number(audit.overallScore) >= 50 ? "Needs Work" : "Critical"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
