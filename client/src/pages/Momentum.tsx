import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  TrendingUp,
  Zap,
  Calendar,
  Target,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Clock,
  Rocket,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

function HealthScoreRing({ score }: { score: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
        <circle
          cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 60 60)"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <p className="text-[10px] text-muted-foreground">Health</p>
      </div>
    </div>
  );
}

function MomentumAnalysis({ campaignId }: { campaignId: number }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const analyzeMutation = trpc.momentum.analyze.useMutation({
    onSuccess: (data) => {
      setAnalysis(data);
      toast.success("Momentum analysis complete!");
    },
    onError: () => toast.error("Analysis failed"),
  });

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary/30" />
          <h3 className="text-lg font-semibold mb-2">Campaign Momentum Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            AI analyzes your campaign performance and recommends the next wave of content, optimizations, and scaling strategies to maintain momentum.
          </p>
          <Button
            onClick={() => analyzeMutation.mutate({ campaignId })}
            disabled={analyzeMutation.isPending}
            size="lg"
          >
            {analyzeMutation.isPending ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Analyzing Campaign...</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" /> Analyze Momentum</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Score + Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <HealthScoreRing score={analysis.healthScore} />
            <p className="text-sm font-medium mt-2">Campaign Health</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setAnalysis(null);
                analyzeMutation.mutate({ campaignId });
              }}
              disabled={analyzeMutation.isPending}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${analyzeMutation.isPending ? "animate-spin" : ""}`} />
              Re-analyze
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              What's Working
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {analysis.whatsWorking.map((item: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Needs Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {analysis.needsImprovement.map((item: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <Target className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Next Content Pieces */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Recommended Next Content
          </CardTitle>
          <CardDescription>AI-recommended content pieces to maintain campaign momentum</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.nextContentPieces.map((piece: any, i: number) => (
              <div key={i} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                  piece.priority === "high" ? "bg-red-500" : piece.priority === "medium" ? "bg-amber-500" : "bg-blue-500"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{piece.type}</Badge>
                    <Badge variant="outline" className="text-xs">{piece.platform}</Badge>
                    <Badge className={`text-xs ${
                      piece.priority === "high" ? "bg-red-500" : piece.priority === "medium" ? "bg-amber-500" : "bg-blue-500"
                    }`}>
                      {piece.priority}
                    </Badge>
                  </div>
                  <p className="text-sm">{piece.brief}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scaling + A/B Test Suggestions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Scaling Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.scalingRecommendations.map((rec: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <Sparkles className="h-3 w-3 text-primary mt-1 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              A/B Test Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.abTestSuggestions.map((sug: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 text-primary mt-1 shrink-0" />
                  {sug}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Budget Advice */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Budget Advice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{analysis.budgetAdvice}</p>
        </CardContent>
      </Card>

      {/* 2-Week Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              2-Week Action Timeline
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowTimeline(!showTimeline)}>
              {showTimeline ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showTimeline && (
          <CardContent>
            <div className="space-y-4">
              {analysis.twoWeekTimeline.map((week: any, i: number) => (
                <div key={i}>
                  <h4 className="font-semibold text-sm mb-2">{week.week}</h4>
                  <ul className="space-y-1.5 ml-4">
                    {week.actions.map((action: string, j: number) => (
                      <li key={j} className="text-sm flex items-start gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function ContentCalendar({ campaignId }: { campaignId: number }) {
  const [calendar, setCalendar] = useState<any>(null);
  const [weeks, setWeeks] = useState(4);

  const calendarMutation = trpc.momentum.contentCalendar.useMutation({
    onSuccess: (data) => {
      setCalendar(data);
      toast.success("Content calendar generated!");
    },
    onError: () => toast.error("Calendar generation failed"),
  });

  if (!calendar) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-primary/30" />
          <h3 className="text-lg font-semibold mb-2">AI Content Calendar</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Generate a detailed content calendar with optimal posting times, content types, and hashtag suggestions for every day.
          </p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <label className="text-sm font-medium">Weeks:</label>
            <Select value={weeks.toString()} onValueChange={v => setWeeks(parseInt(v))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 6, 8, 12].map(w => (
                  <SelectItem key={w} value={w.toString()}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => calendarMutation.mutate({ campaignId, weeks })}
            disabled={calendarMutation.isPending}
            size="lg"
          >
            {calendarMutation.isPending ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generating Calendar...</>
            ) : (
              <><Calendar className="h-4 w-4 mr-2" /> Generate {weeks}-Week Calendar</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Content Calendar</h3>
          <p className="text-sm text-muted-foreground">{calendar.strategy}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const text = calendar.weeks.map((w: any) =>
              `Week ${w.weekNumber}: ${w.theme}\n` +
              w.posts.map((p: any) => `  ${p.day} ${p.postingTime} - ${p.platform}: ${p.contentType} - ${p.topic} ${p.hashtags.map((h: string) => `#${h}`).join(" ")}`).join("\n")
            ).join("\n\n");
            navigator.clipboard.writeText(text);
            toast.success("Calendar copied to clipboard!");
          }}
        >
          <Copy className="h-3 w-3 mr-1" />
          Copy All
        </Button>
      </div>

      {calendar.weeks.map((week: any) => (
        <Card key={week.weekNumber}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Week {week.weekNumber}</CardTitle>
              <Badge variant="outline">{week.theme}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {week.posts.map((post: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg text-sm">
                  <div className="w-16 text-xs font-medium text-muted-foreground">{post.day.slice(0, 3)}</div>
                  <Badge variant="outline" className="text-xs shrink-0">{post.platform}</Badge>
                  <Badge className="text-xs shrink-0 bg-primary/10 text-primary border-0">{post.contentType}</Badge>
                  <span className="flex-1 truncate">{post.topic}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{post.postingTime}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Momentum() {
  const { data: campaigns, isLoading } = trpc.campaign.list.useQuery();
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"momentum" | "calendar">("momentum");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campaign Momentum</h1>
        <p className="text-muted-foreground mt-1">
          Keep your campaigns growing. AI analyzes performance and recommends the next wave of content and optimizations.
        </p>
      </div>

      {/* Campaign Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Select
                value={selectedCampaignId?.toString() || ""}
                onValueChange={v => setSelectedCampaignId(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign to analyze..." />
                </SelectTrigger>
                <SelectContent>
                  {(campaigns || []).map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name} — {c.objective}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "momentum" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("momentum")}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Momentum
              </Button>
              <Button
                variant={activeTab === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("calendar")}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Calendar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedCampaignId ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Rocket className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
            <h3 className="text-lg font-semibold mb-2">Select a Campaign</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Choose a campaign above to analyze its momentum, get AI recommendations, and generate content calendars.
            </p>
            {(!campaigns || campaigns.length === 0) && (
              <p className="text-sm text-amber-600 mt-3">
                No campaigns yet. Create a campaign first in the Campaigns section.
              </p>
            )}
          </CardContent>
        </Card>
      ) : activeTab === "momentum" ? (
        <MomentumAnalysis campaignId={selectedCampaignId} />
      ) : (
        <ContentCalendar campaignId={selectedCampaignId} />
      )}
    </div>
  );
}
