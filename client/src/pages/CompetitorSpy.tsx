import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Search, Globe, TrendingUp, Eye, Sparkles, ExternalLink } from "lucide-react";
import { Streamdown } from "streamdown";

export default function CompetitorSpy() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);

  const analyzeMut = trpc.competitorSpy.analyzeAds.useMutation({
    onSuccess: (data: any) => { setResult(data); toast.success("Analysis complete"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold">Competitor Intelligence</h1>
        <p className="text-zinc-500">Analyze competitor websites, ads, and marketing strategies</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-3">
            <Input value={url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)} placeholder="Enter competitor website URL (e.g., https://competitor.com)" className="flex-1" />
            <Button onClick={() => analyzeMut.mutate({ competitorUrl: url })} disabled={!url || analyzeMut.isPending}>
              {analyzeMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...</> : <><Search className="w-4 h-4 mr-2" /> Analyze</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analyzeMut.isPending && (
        <Card><CardContent className="flex flex-col items-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="font-medium">Analyzing competitor...</p>
          <p className="text-sm text-zinc-500 mt-1">Scraping website, analyzing strategy, and generating insights</p>
        </CardContent></Card>
      )}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Globe className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Domain</p>
                <p className="text-lg font-bold">{result.domain}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Threat Level</p>
                <p className="text-lg font-bold capitalize">{result.threatLevel || "Medium"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Eye className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Strategies Found</p>
                <p className="text-lg font-bold">{result.strategies?.length || 0}</p>
              </CardContent>
            </Card>
          </div>

          {result.strategies && result.strategies.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Marketing Strategies</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.strategies.map((s: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-zinc-900/40">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">{s.category}</Badge>
                        <span className="font-medium text-sm">{s.name}</span>
                      </div>
                      <p className="text-sm text-zinc-500">{s.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result.analysis && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Analysis</CardTitle></CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <Streamdown>{result.analysis}</Streamdown>
                </div>
              </CardContent>
            </Card>
          )}

          {result.recommendations && result.recommendations.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Actionable Recommendations</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.recommendations.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
                      <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      <p className="text-sm">{r}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!result && !analyzeMut.isPending && (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center py-16">
          <Search className="w-12 h-12 text-zinc-500 mb-4" />
          <h3 className="text-lg font-semibold">Enter a Competitor URL</h3>
          <p className="text-zinc-500 text-center max-w-md mt-2">AI will analyze their website, identify marketing strategies, and provide actionable recommendations to outperform them.</p>
        </CardContent></Card>
      )}
    </div>
  );
}
