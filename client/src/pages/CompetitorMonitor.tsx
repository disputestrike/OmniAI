import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Eye, Globe, Zap, Copy, RefreshCw, Target, TrendingUp,
  AlertCircle, ChevronRight, Sparkles, Shield, Crosshair
} from "lucide-react";

const ANGLES = [
  { value: "better_value", label: "Better Value" },
  { value: "more_authentic", label: "More Authentic" },
  { value: "funnier", label: "Funnier" },
  { value: "more_educational", label: "More Educational" },
  { value: "direct_comparison", label: "Direct Comparison" },
  { value: "emotional", label: "Emotional" },
];

const PLATFORMS = ["instagram", "tiktok", "facebook", "twitter", "linkedin", "youtube"];

export default function CompetitorMonitor() {
  const [activeTab, setActiveTab] = useState<"analyze" | "counter">("analyze");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitorName, setCompetitorName] = useState("");
  const [yourNiche, setYourNiche] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const [competitorContent, setCompetitorContent] = useState("");
  const [counterCompetitorName, setCounterCompetitorName] = useState("");
  const [yourBrand, setYourBrand] = useState("");
  const [yourProduct, setYourProduct] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [angle, setAngle] = useState<"better_value" | "more_authentic" | "funnier" | "more_educational" | "direct_comparison" | "emotional">("better_value");
  const [counterResult, setCounterResult] = useState<any>(null);

  const analyzeMutation = trpc.advanced.analyzeCompetitorContent.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast.success(`Analyzed ${data.analysis.competitorName} — ${data.analysis.remixIdeas?.length || 0} remix ideas generated`);
    },
    onError: (err) => toast.error(err.message),
  });

  const counterMutation = trpc.advanced.generateCounterContent.useMutation({
    onSuccess: (data) => {
      setCounterResult(data);
      toast.success("Counter-content generated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            Competitor Monitor
          </h1>
          <p className="text-zinc-500 mt-1">Analyze competitor content strategies and generate counter-content that outperforms them</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === "analyze" ? "default" : "outline"}
            onClick={() => setActiveTab("analyze")}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            Analyze Competitor
          </Button>
          <Button
            variant={activeTab === "counter" ? "default" : "outline"}
            onClick={() => setActiveTab("counter")}
            className="gap-2"
          >
            <Crosshair className="h-4 w-4" />
            Generate Counter-Content
          </Button>
        </div>

        {activeTab === "analyze" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Competitor Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Competitor URL *</label>
                  <input
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    placeholder="https://competitor.com"
                    value={competitorUrl}
                    onChange={e => setCompetitorUrl(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Competitor Name</label>
                    <input
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      placeholder="e.g. Nike"
                      value={competitorName}
                      onChange={e => setCompetitorName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Your Niche</label>
                    <input
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      placeholder="e.g. fitness apparel"
                      value={yourNiche}
                      onChange={e => setYourNiche(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (!competitorUrl.trim()) { toast.error("Enter a competitor URL"); return; }
                    try { new URL(competitorUrl); } catch { toast.error("Enter a valid URL"); return; }
                    analyzeMutation.mutate({ competitorUrl, competitorName: competitorName || undefined, yourNiche: yourNiche || undefined });
                  }}
                  disabled={analyzeMutation.isPending}
                  className="w-full gap-2"
                >
                  {analyzeMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  {analyzeMutation.isPending ? "Analyzing..." : "Analyze Competitor"}
                </Button>

                {/* What you get */}
                <div className="bg-zinc-900/50 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs font-medium">What you'll get:</p>
                  {["Content themes & posting frequency", "Top performing formats", "Their weaknesses & your opportunities", "Ready-to-use remix ideas", "Keywords to monitor"].map(item => (
                    <div key={item} className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {analysisResult ? (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{analysisResult.analysis.competitorName}</h3>
                      <Badge variant="outline">Competitive Score: {analysisResult.analysis.competitiveScore}/10</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-1">Content Themes</p>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.analysis.contentThemes?.map((t: string) => (
                            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-1">Top Formats</p>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.analysis.topPerformingFormats?.map((f: string) => (
                            <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-red-500 mb-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Their Weaknesses
                        </p>
                        <ul className="space-y-1">
                          {analysisResult.analysis.weaknesses?.map((w: string, i: number) => (
                            <li key={i} className="text-xs text-zinc-500 flex items-start gap-1">
                              <span className="text-red-400 mt-0.5">•</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-green-500 mb-1 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> Your Opportunities
                        </p>
                        <ul className="space-y-1">
                          {analysisResult.analysis.opportunities?.map((o: string, i: number) => (
                            <li key={i} className="text-xs text-zinc-500 flex items-start gap-1">
                              <span className="text-green-400 mt-0.5">•</span> {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Remix Ideas */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Remix Ideas ({analysisResult.analysis.remixIdeas?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analysisResult.analysis.remixIdeas?.map((idea: any, i: number) => (
                      <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{idea.title}</p>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">{idea.platform}</Badge>
                            <Badge variant="secondary" className="text-xs">{idea.format?.replace(/_/g, " ")}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-500">{idea.description}</p>
                        <p className="text-xs text-primary font-medium">Angle: {idea.angle}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs mt-1"
                          onClick={() => {
                            setActiveTab("counter");
                            setCounterCompetitorName(analysisResult.analysis.competitorName);
                            setPlatform(idea.platform || "instagram");
                          }}
                        >
                          <Crosshair className="h-3 w-3 mr-1" />
                          Use This Angle
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3 p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Eye className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">Competitor Intelligence</h3>
                  <p className="text-sm text-zinc-500 max-w-xs">
                    Enter any competitor URL to get their content strategy, weaknesses, and ready-to-use remix ideas.
                  </p>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Counter Content Input */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Generate Counter-Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Competitor's Post *</label>
                  <Textarea
                    placeholder="Paste the competitor's post, ad, or content here..."
                    value={competitorContent}
                    onChange={e => setCompetitorContent(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Competitor Name</label>
                    <input
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      placeholder="e.g. Nike"
                      value={counterCompetitorName}
                      onChange={e => setCounterCompetitorName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Your Brand</label>
                    <input
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      placeholder="e.g. My Brand"
                      value={yourBrand}
                      onChange={e => setYourBrand(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Your Product/Service</label>
                  <input
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    placeholder="e.g. Air Max 2025"
                    value={yourProduct}
                    onChange={e => setYourProduct(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Platform</label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Counter Angle</label>
                    <Select value={angle} onValueChange={(v) => setAngle(v as typeof angle)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ANGLES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (!competitorContent.trim()) { toast.error("Paste the competitor's content first"); return; }
                    counterMutation.mutate({ competitorContent, competitorName: counterCompetitorName || undefined, yourBrand: yourBrand || undefined, yourProduct: yourProduct || undefined, platform, angle });
                  }}
                  disabled={counterMutation.isPending}
                  className="w-full gap-2"
                >
                  {counterMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                  {counterMutation.isPending ? "Generating..." : "Generate Counter-Content"}
                </Button>
              </CardContent>
            </Card>

            {/* Counter Content Result */}
            {counterResult ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-primary" />
                        Your Counter-Content
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => copyText(counterResult.counterContent)} className="h-7 text-xs gap-1">
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/40 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                      {counterResult.counterContent}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-1">Strategy</p>
                        <p className="text-xs">{counterResult.strategy}</p>
                      </div>
                      {counterResult.hook && (
                        <div>
                          <p className="text-xs font-medium text-zinc-500 mb-1">Hook</p>
                          <p className="text-xs font-medium text-primary">"{counterResult.hook}"</p>
                        </div>
                      )}
                      {counterResult.callToAction && (
                        <div>
                          <p className="text-xs font-medium text-zinc-500 mb-1">CTA</p>
                          <p className="text-xs">{counterResult.callToAction}</p>
                        </div>
                      )}
                      {counterResult.hashtags?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-zinc-500 mb-1">Hashtags</p>
                          <div className="flex flex-wrap gap-1">
                            {counterResult.hashtags.map((h: string) => (
                              <Badge key={h} variant="secondary" className="text-xs">{h}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {counterResult.whyItWorks && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                          <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                            <Target className="h-3 w-3" /> Why This Works
                          </p>
                          <p className="text-xs text-zinc-500">{counterResult.whyItWorks}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3 p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">Counter Their Content</h3>
                  <p className="text-sm text-zinc-500 max-w-xs">
                    Paste any competitor post and get counter-content that positions your brand favorably without being negative.
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
