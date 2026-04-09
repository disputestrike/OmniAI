import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Star, TrendingUp, AlertCircle, CheckCircle2, Zap, Target,
  Copy, RefreshCw, ArrowUpRight, Sparkles, BarChart3, Flame
} from "lucide-react";

const PLATFORMS = ["instagram", "tiktok", "facebook", "twitter", "linkedin", "youtube", "email", "general"];
const CONTENT_TYPES = ["short_ad", "social_caption", "email_copy", "blog_post", "video_script", "landing_page"];

function ScoreRing({ score, label, size = "lg" }: { score: number; label: string; size?: "sm" | "lg" }) {
  const color = score >= 8 ? "text-green-500" : score >= 6 ? "text-yellow-500" : "text-red-500";
  const bgColor = score >= 8 ? "bg-green-500/10" : score >= 6 ? "bg-yellow-500/10" : "bg-red-500/10";
  const isLg = size === "lg";
  return (
    <div className={`flex flex-col items-center gap-1 ${isLg ? "p-4" : "p-2"} rounded-xl ${bgColor}`}>
      <span className={`font-bold ${isLg ? "text-4xl" : "text-xl"} ${color}`}>{score.toFixed(1)}</span>
      <span className={`text-zinc-500 ${isLg ? "text-sm" : "text-xs"} text-center`}>{label}</span>
    </div>
  );
}

function ImpactBadge({ impact }: { impact: string }) {
  const variants: Record<string, string> = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${variants[impact] || variants.low}`}>
      {impact} impact
    </span>
  );
}

export default function ContentScorer() {
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [contentType, setContentType] = useState("social_caption");
  const [targetAudience, setTargetAudience] = useState("");
  const [productName, setProductName] = useState("");
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"score" | "improved">("score");

  const scoreMutation = trpc.advanced.scoreContent.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Score: ${data.overallScore}/10 — ${data.verdict}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleScore = () => {
    if (!content.trim()) {
      toast.error("Enter content to score");
      return;
    }
    scoreMutation.mutate({ body: content, platform, type: contentType, targetAudience: targetAudience || undefined, productName: productName || undefined });
  };

  const copyImproved = () => {
    if (result?.improvedVersion) {
      navigator.clipboard.writeText(result.improvedVersion);
      toast.success("Copied improved version!");
    }
  };

  const useImproved = () => {
    if (result?.improvedVersion) {
      setContent(result.improvedVersion);
      setResult(null);
      toast.success("Content updated with improved version");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              AI Content Scorer
            </h1>
            <p className="text-zinc-500 mt-1">Rate your content 1-10 with specific improvement suggestions before you publish</p>
          </div>
          {result && (
            <div className="flex items-center gap-2">
              <Badge variant={result.viralPotential === "high" ? "default" : "secondary"} className="gap-1">
                <Flame className="h-3 w-3" />
                {result.viralPotential} viral potential
              </Badge>
              <Badge variant="outline">{result.estimatedEngagementRate} engagement</Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Content Type</label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Target Audience (optional)</label>
                    <input
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      placeholder="e.g. fitness enthusiasts"
                      value={targetAudience}
                      onChange={e => setTargetAudience(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Product/Brand (optional)</label>
                    <input
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      placeholder="e.g. Nike Air Max"
                      value={productName}
                      onChange={e => setProductName(e.target.value)}
                    />
                  </div>
                </div>
                <Textarea
                  placeholder="Paste your content here — ad copy, social caption, email, blog post, video script..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{content.length} characters</span>
                  <Button onClick={handleScore} disabled={scoreMutation.isPending || !content.trim()} className="gap-2">
                    {scoreMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                    {scoreMutation.isPending ? "Scoring..." : "Score My Content"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            {!result && (
              <Card className="bg-zinc-900/50">
                <CardContent className="pt-4">
                  <p className="text-xs font-medium text-zinc-500 mb-2">What gets scored:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["Hook strength", "Clarity", "Emotional resonance", "CTA strength", "Platform fit", "Engagement potential", "Authenticity", "Viral potential"].map(item => (
                      <div key={item} className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {result ? (
              <>
                {/* Overall Score */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <ScoreRing score={result.overallScore} label="Overall Score" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{result.verdict}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={result.viralPotential === "high" ? "default" : "secondary"} className="text-xs">
                            <Flame className="h-3 w-3 mr-1" />
                            {result.viralPotential} viral
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            {result.estimatedEngagementRate}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2">
                      {Object.entries(result.breakdown).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500 w-24 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <Progress value={(val as number) * 10} className="flex-1 h-1.5" />
                          <span className="text-xs font-medium w-6 text-right">{val as number}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs: Score Details / Improved Version */}
                <div className="flex gap-2">
                  <Button variant={activeTab === "score" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("score")} className="flex-1">
                    <Target className="h-3.5 w-3.5 mr-1.5" />
                    Improvements
                  </Button>
                  <Button variant={activeTab === "improved" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("improved")} className="flex-1">
                    <Zap className="h-3.5 w-3.5 mr-1.5" />
                    Improved Version
                  </Button>
                </div>

                {activeTab === "score" ? (
                  <Card>
                    <CardContent className="pt-4 space-y-4">
                      {/* Strengths */}
                      {result.strengths?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                          </p>
                          <ul className="space-y-1">
                            {result.strengths.map((s: string, i: number) => (
                              <li key={i} className="text-xs text-zinc-500 flex items-start gap-1.5">
                                <span className="text-green-500 mt-0.5">✓</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <Separator />
                      {/* Improvements */}
                      {result.improvements?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" /> Improvements
                          </p>
                          <div className="space-y-3">
                            {result.improvements.map((imp: any, i: number) => (
                              <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-medium">{imp.issue}</p>
                                  <ImpactBadge impact={imp.impact} />
                                </div>
                                <p className="text-xs text-zinc-500">{imp.suggestion}</p>
                                {imp.example && (
                                  <p className="text-xs bg-background rounded p-2 border border-border italic">
                                    "{imp.example}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-1.5">
                          <Zap className="h-4 w-4 text-primary" />
                          AI-Improved Version
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={copyImproved} className="h-7 text-xs gap-1">
                            <Copy className="h-3 w-3" /> Copy
                          </Button>
                          <Button size="sm" onClick={useImproved} className="h-7 text-xs gap-1">
                            <ArrowUpRight className="h-3 w-3" /> Use This
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/40 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                        {result.improvedVersion}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3 p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">Score Your Content</h3>
                  <p className="text-sm text-zinc-500 max-w-xs">
                    Paste any content on the left and get an instant AI score with specific improvements before you publish.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {["Hook", "Clarity", "Emotion", "CTA", "Platform Fit"].map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
    </div>
  );
}
