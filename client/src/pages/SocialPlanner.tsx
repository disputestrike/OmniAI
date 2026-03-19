import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Calendar, Loader2, Sparkles, TrendingUp, Search, Target, BarChart2,
  Upload, Globe, ArrowRight, Star, Users, Eye, Heart, MessageCircle,
  Lightbulb, CheckCircle2, Copy, RefreshCw, Zap
} from "lucide-react";
import { Streamdown } from "streamdown";

const PLATFORMS = [
  { value: "instagram", label: "Instagram", color: "bg-pink-500" },
  { value: "tiktok", label: "TikTok", color: "bg-black" },
  { value: "twitter", label: "Twitter/X", color: "bg-sky-500" },
  { value: "linkedin", label: "LinkedIn", color: "bg-blue-700" },
  { value: "youtube", label: "YouTube", color: "bg-red-600" },
  { value: "facebook", label: "Facebook", color: "bg-blue-600" },
  { value: "pinterest", label: "Pinterest", color: "bg-red-500" },
];

const CONTENT_PILLARS = [
  { value: "educational", label: "Educational", emoji: "📚", desc: "Teach your audience something valuable" },
  { value: "entertaining", label: "Entertaining", emoji: "🎭", desc: "Make them laugh, feel, or be amazed" },
  { value: "inspirational", label: "Inspirational", emoji: "✨", desc: "Motivate and uplift your audience" },
  { value: "promotional", label: "Promotional", emoji: "🎯", desc: "Showcase products/services with value" },
  { value: "community", label: "Community", emoji: "🤝", desc: "Build connection and belonging" },
  { value: "behind_scenes", label: "Behind the Scenes", emoji: "🎬", desc: "Show the human side of your brand" },
  { value: "ugc", label: "User Generated", emoji: "👥", desc: "Leverage customer content and stories" },
  { value: "trending", label: "Trending / News", emoji: "🔥", desc: "Ride cultural moments and trends" },
];

const POSTING_GOALS = [
  { value: "grow_followers", label: "Grow Followers" },
  { value: "increase_engagement", label: "Increase Engagement" },
  { value: "drive_traffic", label: "Drive Website Traffic" },
  { value: "generate_leads", label: "Generate Leads" },
  { value: "boost_sales", label: "Boost Sales" },
  { value: "build_authority", label: "Build Authority" },
];

export default function SocialPlanner() {
  const [activeTab, setActiveTab] = useState("competitor");

  // Competitor Analysis
  const [competitorHandle, setCompetitorHandle] = useState("");
  const [competitorPlatform, setCompetitorPlatform] = useState("instagram");
  const [competitorAnalysis, setCompetitorAnalysis] = useState<any>(null);
  const [analyzingCompetitor, setAnalyzingCompetitor] = useState(false);

  // Success Pattern Learning
  const [successContent, setSuccessContent] = useState("");
  const [successInputMode, setSuccessInputMode] = useState<"paste" | "url" | "upload">("paste");
  const [successUrl, setSuccessUrl] = useState("");
  const [successPlatform, setSuccessPlatform] = useState("instagram");
  const [successAnalysis, setSuccessAnalysis] = useState<any>(null);
  const [analyzingSuccess, setAnalyzingSuccess] = useState(false);
  const successFileRef = useRef<HTMLInputElement>(null);

  // Content Calendar
  const [calNiche, setCalNiche] = useState("");
  const [calPlatforms, setCalPlatforms] = useState<string[]>(["instagram", "twitter"]);
  const [calGoal, setCalGoal] = useState("grow_followers");
  const [calPillars, setCalPillars] = useState<string[]>(["educational", "entertaining", "promotional"]);
  const [calWeeks, setCalWeeks] = useState("2");
  const [calAudience, setCalAudience] = useState("");
  const [calBrand, setCalBrand] = useState("");
  const [calendar, setCalendar] = useState<any>(null);
  const [generatingCalendar, setGeneratingCalendar] = useState(false);

  // Viral Post Generator
  const [viralTopic, setViralTopic] = useState("");
  const [viralPlatform, setViralPlatform] = useState("instagram");
  const [viralNiche, setViralNiche] = useState("");
  const [viralPost, setViralPost] = useState<any>(null);
  const [generatingViral, setGeneratingViral] = useState(false);

  const chatMut = trpc.aiChat.send.useMutation();

  const analyzeCompetitor = async () => {
    if (!competitorHandle.trim()) return;
    setAnalyzingCompetitor(true);
    setCompetitorAnalysis(null);
    try {
      const result = await chatMut.mutateAsync({
        message: `You are a social media strategist. Analyze the content strategy for @${competitorHandle} on ${competitorPlatform}.

Provide a comprehensive competitive analysis including:
1. Estimated posting frequency and best times
2. Top content types they use (video, carousel, stories, reels, etc.)
3. Their apparent content pillars (educational, entertainment, promotional, etc.)
4. Engagement tactics they use (hooks, CTAs, questions, etc.)
5. Their brand voice and tone
6. What makes their top-performing content successful
7. Gaps and opportunities you can exploit
8. 5 specific content ideas to compete with them

Return as structured JSON with keys: postingFrequency, bestTimes, contentTypes (array), contentPillars (array), engagementTactics (array), brandVoice, successFactors (array), gaps (array), contentIdeas (array of {title, type, hook, why}).`,
      });
      try {
        const jsonMatch = result.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setCompetitorAnalysis(JSON.parse(jsonMatch[0]));
        } else {
          setCompetitorAnalysis({ raw: result.reply });
        }
      } catch {
        setCompetitorAnalysis({ raw: result.reply });
      }
      toast.success("Competitor analysis complete!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAnalyzingCompetitor(false);
    }
  };

  const analyzeSuccessPattern = async () => {
    const content = successContent.trim() || successUrl.trim();
    if (!content) return;
    setAnalyzingSuccess(true);
    setSuccessAnalysis(null);
    try {
      const result = await chatMut.mutateAsync({
        message: `You are a viral content strategist. Analyze this successful ${successPlatform} content and extract the winning formula:

${successUrl && !successContent ? `Content URL: ${successUrl}` : `Content:\n${successContent}`}

Provide a deep analysis including:
1. Why this content went viral / performed well
2. The psychological triggers used (curiosity, FOMO, emotion, social proof, etc.)
3. The hook formula (first 3 seconds/lines)
4. Content structure breakdown
5. Engagement mechanics (what makes people comment, share, save)
6. The underlying content archetype (story, list, how-to, debate, etc.)
7. How to replicate this formula for different niches
8. 5 post templates based on this formula

Return as JSON with keys: whyItWorked (array), psychologicalTriggers (array), hookFormula, contentStructure, engagementMechanics (array), archetype, replicationGuide, templates (array of {title, hook, body, cta}).`,
      });
      try {
        const jsonMatch = result.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setSuccessAnalysis(JSON.parse(jsonMatch[0]));
        } else {
          setSuccessAnalysis({ raw: result.reply });
        }
      } catch {
        setSuccessAnalysis({ raw: result.reply });
      }
      toast.success("Success pattern analyzed!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAnalyzingSuccess(false);
    }
  };

  const generateCalendar = async () => {
    if (!calNiche.trim()) return;
    setGeneratingCalendar(true);
    setCalendar(null);
    try {
      const result = await chatMut.mutateAsync({
        message: `You are a social media content strategist. Create a detailed ${calWeeks}-week content calendar.

Niche/Industry: ${calNiche}
Target Audience: ${calAudience || "general audience"}
Brand/Business: ${calBrand || "not specified"}
Platforms: ${calPlatforms.join(", ")}
Primary Goal: ${calGoal.replace(/_/g, " ")}
Content Pillars: ${calPillars.join(", ")}

Create a strategic content calendar with:
- Specific post ideas for each day (Mon-Fri minimum)
- Platform-specific format recommendations
- Optimal posting times for each platform
- Hashtag strategies
- Engagement prompts (questions to ask audience)
- Key hooks for each post
- Content type (video, carousel, single image, text, story, reel)

Return as JSON: { weeks: [ { week: 1, theme: "...", posts: [ { day: "Monday", platform: "...", type: "...", title: "...", hook: "...", caption: "...", hashtags: [...], postingTime: "...", pillar: "..." } ] } ], strategy: { keyThemes: [...], hashtagGroups: { platform: [...] }, bestTimes: { platform: "..." }, engagementTips: [...] } }`,
      });
      try {
        const jsonMatch = result.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setCalendar(JSON.parse(jsonMatch[0]));
        } else {
          setCalendar({ raw: result.reply });
        }
      } catch {
        setCalendar({ raw: result.reply });
      }
      toast.success("Content calendar generated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGeneratingCalendar(false);
    }
  };

  const generateViralPost = async () => {
    if (!viralTopic.trim()) return;
    setGeneratingViral(true);
    setViralPost(null);
    try {
      const result = await chatMut.mutateAsync({
        message: `You are a viral content creator. Generate a high-performing ${viralPlatform} post.

Topic: ${viralTopic}
Niche: ${viralNiche || "general"}

Create a post optimized for maximum reach and engagement:
1. A scroll-stopping hook (first line)
2. The full post body with proper formatting
3. A strong CTA
4. 15-20 strategic hashtags
5. Best time to post
6. Why this will perform well
7. 3 alternative hooks to A/B test

Return as JSON: { hook: "...", body: "...", cta: "...", hashtags: [...], bestTime: "...", whyItWorks: "...", alternativeHooks: [...], postingTips: [...] }`,
      });
      try {
        const jsonMatch = result.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setViralPost(JSON.parse(jsonMatch[0]));
        } else {
          setViralPost({ raw: result.reply });
        }
      } catch {
        setViralPost({ raw: result.reply });
      }
      toast.success("Viral post generated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGeneratingViral(false);
    }
  };

  const togglePlatform = (p: string) => {
    setCalPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };
  const togglePillar = (p: string) => {
    setCalPillars(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSuccessFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setSuccessContent(e.target?.result as string || "");
      setSuccessInputMode("paste");
      toast.success(`"${file.name}" loaded!`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" /> Social Media Planner
        </h1>
        <p className="page-subtitle">
          Analyze competitors, decode viral content, build content calendars, and generate posts that actually perform.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="competitor" className="text-xs flex items-center gap-1"><Search className="h-3.5 w-3.5" />Competitor Intel</TabsTrigger>
          <TabsTrigger value="success" className="text-xs flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />Success Patterns</TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Content Calendar</TabsTrigger>
          <TabsTrigger value="viral" className="text-xs flex items-center gap-1"><Zap className="h-3.5 w-3.5" />Viral Post</TabsTrigger>
        </TabsList>

        {/* Competitor Analysis Tab */}
        <TabsContent value="competitor" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4" />Competitor Analysis</CardTitle>
                <CardDescription>Enter a competitor's handle and platform to decode their content strategy, find gaps, and get actionable ideas to outperform them.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Platform</label>
                    <Select value={competitorPlatform} onValueChange={setCompetitorPlatform}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Handle / Username</label>
                    <Input className="mt-1" value={competitorHandle} onChange={e => setCompetitorHandle(e.target.value)} placeholder="@username or channel name" onKeyDown={e => e.key === "Enter" && analyzeCompetitor()} />
                  </div>
                </div>
                <Button className="w-full" onClick={analyzeCompetitor} disabled={!competitorHandle.trim() || analyzingCompetitor}>
                  {analyzingCompetitor ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyzing Strategy...</> : <><Search className="h-4 w-4 mr-2" />Analyze Competitor</>}
                </Button>
                <div className="p-3 rounded-lg bg-zinc-900/40 text-xs text-zinc-500">
                  <p className="font-medium mb-1">What you'll get:</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>Posting frequency & best times</li>
                    <li>Content types & pillars breakdown</li>
                    <li>Engagement tactics they use</li>
                    <li>Gaps & opportunities to exploit</li>
                    <li>5 content ideas to outperform them</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div>
              {analyzingCompetitor ? (
                <Card><CardContent className="flex flex-col items-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="font-medium">Analyzing @{competitorHandle}...</p>
                  <p className="text-sm text-zinc-500 mt-1">Decoding their content strategy</p>
                </CardContent></Card>
              ) : competitorAnalysis ? (
                <div className="space-y-3">
                  {competitorAnalysis.raw ? (
                    <Card><CardContent className="p-4 prose prose-sm max-w-none"><Streamdown>{competitorAnalysis.raw}</Streamdown></CardContent></Card>
                  ) : (
                    <>
                      <Card className="glass rounded-2xl">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <BarChart2 className="h-4 w-4 text-primary" />
                            <span className="font-semibold">@{competitorHandle} Strategy</span>
                          </div>
                          {competitorAnalysis.postingFrequency && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-zinc-500">Posting:</span>
                              <Badge variant="secondary">{competitorAnalysis.postingFrequency}</Badge>
                            </div>
                          )}
                          {competitorAnalysis.brandVoice && (
                            <div className="text-sm"><span className="text-zinc-500">Voice: </span>{competitorAnalysis.brandVoice}</div>
                          )}
                          {competitorAnalysis.contentTypes?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-zinc-500 mb-1">Content Types</p>
                              <div className="flex flex-wrap gap-1">{competitorAnalysis.contentTypes.map((t: string) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}</div>
                            </div>
                          )}
                          {competitorAnalysis.successFactors?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-zinc-500 mb-1">Why They Win</p>
                              <ul className="space-y-1">{competitorAnalysis.successFactors.map((f: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs"><CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />{f}</li>
                              ))}</ul>
                            </div>
                          )}
                          {competitorAnalysis.gaps?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-zinc-500 mb-1">Gaps You Can Exploit</p>
                              <ul className="space-y-1">{competitorAnalysis.gaps.map((g: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs"><Target className="h-3 w-3 text-orange-500 mt-0.5 shrink-0" />{g}</li>
                              ))}</ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      {competitorAnalysis.contentIdeas?.length > 0 && (
                        <Card className="glass rounded-2xl">
                          <CardHeader className="pb-2"><CardTitle className="text-sm">5 Ideas to Beat Them</CardTitle></CardHeader>
                          <CardContent className="space-y-2">
                            {competitorAnalysis.contentIdeas.map((idea: any, i: number) => (
                              <div key={i} className="p-3 rounded-lg border bg-card hover:bg-zinc-900/50 transition-all">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" className="text-[10px]">{idea.type || "Post"}</Badge>
                                  <span className="text-sm font-medium">{idea.title}</span>
                                </div>
                                {idea.hook && <p className="text-xs text-zinc-500 italic">Hook: "{idea.hook}"</p>}
                                {idea.why && <p className="text-xs text-zinc-500 mt-1">{idea.why}</p>}
                                <Button size="sm" variant="ghost" className="h-6 text-xs mt-1 px-2" onClick={() => { navigator.clipboard.writeText(`${idea.title}\n\nHook: ${idea.hook}\n\n${idea.why}`); toast.success("Idea copied!"); }}>
                                  <Copy className="h-3 w-3 mr-1" />Copy
                                </Button>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <Card className="border-dashed h-full">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Users className="h-12 w-12 text-zinc-500/30 mb-4" />
                    <p className="text-zinc-500 text-center">Enter a competitor's handle to decode their strategy</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Success Pattern Analysis Tab */}
        <TabsContent value="success" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Decode Viral Content</CardTitle>
                <CardDescription>Paste a viral post, upload a screenshot, or provide a URL. AI will break down exactly why it worked and give you reusable templates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Platform</label>
                  <Select value={successPlatform} onValueChange={setSuccessPlatform}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Successful Content</label>
                    <div className="flex gap-1">
                      <button onClick={() => setSuccessInputMode("paste")} className={`text-xs px-2 py-1 rounded-md transition-all ${successInputMode === "paste" ? "bg-primary text-primary-foreground" : "hover:bg-zinc-800 border"}`}>Paste</button>
                      <button onClick={() => setSuccessInputMode("url")} className={`text-xs px-2 py-1 rounded-md transition-all flex items-center gap-1 ${successInputMode === "url" ? "bg-primary text-primary-foreground" : "hover:bg-zinc-800 border"}`}><Globe className="h-3 w-3" />URL</button>
                      <button onClick={() => setSuccessInputMode("upload")} className={`text-xs px-2 py-1 rounded-md transition-all flex items-center gap-1 ${successInputMode === "upload" ? "bg-primary text-primary-foreground" : "hover:bg-zinc-800 border"}`}><Upload className="h-3 w-3" />File</button>
                    </div>
                  </div>

                  {successInputMode === "url" && (
                    <div className="flex gap-2 mb-2">
                      <Input value={successUrl} onChange={e => setSuccessUrl(e.target.value)} placeholder="https://twitter.com/..., TikTok URL, YouTube link..." />
                      <Button variant="outline" size="sm" className="shrink-0" onClick={() => { if (successUrl) { setSuccessContent(`Content from: ${successUrl}`); setSuccessInputMode("paste"); } }}><ArrowRight className="h-4 w-4" /></Button>
                    </div>
                  )}

                  {successInputMode === "upload" && (
                    <div
                      className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-zinc-900/50 transition-all mb-2"
                      onClick={() => successFileRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleSuccessFile(f); }}
                    >
                      <Upload className="h-5 w-5 mx-auto text-zinc-500 mb-1" />
                      <p className="text-xs text-zinc-500">Drop screenshot or text file</p>
                      <input ref={successFileRef} type="file" accept=".txt,.md,image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleSuccessFile(f); }} />
                    </div>
                  )}

                  <Textarea
                    value={successContent}
                    onChange={e => setSuccessContent(e.target.value)}
                    placeholder="Paste the viral post, caption, thread, or script here. Include the caption, hashtags, and any context about its performance (e.g. '1M views', '50K likes')..."
                    rows={6}
                  />
                </div>

                <Button className="w-full" onClick={analyzeSuccessPattern} disabled={(!successContent.trim() && !successUrl.trim()) || analyzingSuccess}>
                  {analyzingSuccess ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Decoding Pattern...</> : <><Lightbulb className="h-4 w-4 mr-2" />Decode Success Formula</>}
                </Button>
              </CardContent>
            </Card>

            <div>
              {analyzingSuccess ? (
                <Card><CardContent className="flex flex-col items-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="font-medium">Decoding viral formula...</p>
                  <p className="text-sm text-zinc-500 mt-1">Extracting reusable patterns</p>
                </CardContent></Card>
              ) : successAnalysis ? (
                <div className="space-y-3">
                  {successAnalysis.raw ? (
                    <Card><CardContent className="p-4"><Streamdown>{successAnalysis.raw}</Streamdown></CardContent></Card>
                  ) : (
                    <>
                      <Card className="glass rounded-2xl">
                        <CardContent className="p-4 space-y-3">
                          {successAnalysis.hookFormula && (
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                              <p className="text-xs font-semibold text-primary mb-1">Hook Formula</p>
                              <p className="text-sm">{successAnalysis.hookFormula}</p>
                            </div>
                          )}
                          {successAnalysis.archetype && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-zinc-500">Archetype:</span>
                              <Badge>{successAnalysis.archetype}</Badge>
                            </div>
                          )}
                          {successAnalysis.psychologicalTriggers?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-zinc-500 mb-1">Psychological Triggers</p>
                              <div className="flex flex-wrap gap-1">{successAnalysis.psychologicalTriggers.map((t: string) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}</div>
                            </div>
                          )}
                          {successAnalysis.whyItWorked?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-zinc-500 mb-1">Why It Worked</p>
                              <ul className="space-y-1">{successAnalysis.whyItWorked.map((w: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs"><Star className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />{w}</li>
                              ))}</ul>
                            </div>
                          )}
                          {successAnalysis.engagementMechanics?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-zinc-500 mb-1">Engagement Mechanics</p>
                              <ul className="space-y-1">{successAnalysis.engagementMechanics.map((m: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs"><Heart className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />{m}</li>
                              ))}</ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      {successAnalysis.templates?.length > 0 && (
                        <Card className="glass rounded-2xl">
                          <CardHeader className="pb-2"><CardTitle className="text-sm">Reusable Templates</CardTitle></CardHeader>
                          <CardContent className="space-y-2">
                            {successAnalysis.templates.map((tmpl: any, i: number) => (
                              <div key={i} className="p-3 rounded-lg border bg-card">
                                <p className="text-sm font-medium mb-1">{tmpl.title}</p>
                                <p className="text-xs text-primary italic mb-1">"{tmpl.hook}"</p>
                                <p className="text-xs text-zinc-500 line-clamp-2">{tmpl.body}</p>
                                <Button size="sm" variant="ghost" className="h-6 text-xs mt-1 px-2" onClick={() => { navigator.clipboard.writeText(`${tmpl.hook}\n\n${tmpl.body}\n\n${tmpl.cta}`); toast.success("Template copied!"); }}>
                                  <Copy className="h-3 w-3 mr-1" />Copy Template
                                </Button>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <Card className="border-dashed h-full">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <TrendingUp className="h-12 w-12 text-zinc-500/30 mb-4" />
                    <p className="text-zinc-500 text-center">Paste viral content to decode its winning formula</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Content Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />Build Content Calendar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Niche / Industry *</label>
                  <Input className="mt-1" value={calNiche} onChange={e => setCalNiche(e.target.value)} placeholder="e.g. fitness coaching, SaaS, e-commerce fashion..." />
                </div>
                <div>
                  <label className="text-sm font-medium">Target Audience</label>
                  <Input className="mt-1" value={calAudience} onChange={e => setCalAudience(e.target.value)} placeholder="e.g. women 25-40 interested in wellness" />
                </div>
                <div>
                  <label className="text-sm font-medium">Brand / Business</label>
                  <Input className="mt-1" value={calBrand} onChange={e => setCalBrand(e.target.value)} placeholder="e.g. online yoga studio" />
                </div>
                <div>
                  <label className="text-sm font-medium">Primary Goal</label>
                  <Select value={calGoal} onValueChange={setCalGoal}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{POSTING_GOALS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(p => (
                      <button key={p.value} onClick={() => togglePlatform(p.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${calPlatforms.includes(p.value) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-zinc-800"}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Content Pillars</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CONTENT_PILLARS.map(p => (
                      <button key={p.value} onClick={() => togglePillar(p.value)}
                        className={`text-left p-2 rounded-lg border text-xs transition-all ${calPillars.includes(p.value) ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-zinc-900/40"}`}>
                        <span>{p.emoji} {p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <Select value={calWeeks} onValueChange={setCalWeeks}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Week</SelectItem>
                      <SelectItem value="2">2 Weeks</SelectItem>
                      <SelectItem value="4">4 Weeks (1 Month)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={generateCalendar} disabled={!calNiche.trim() || !calPlatforms.length || generatingCalendar}>
                  {generatingCalendar ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Building Calendar...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Calendar</>}
                </Button>
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              {generatingCalendar ? (
                <Card><CardContent className="flex flex-col items-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="font-medium">Building your content calendar...</p>
                  <p className="text-sm text-zinc-500 mt-1">Creating {calWeeks} week(s) of strategic content</p>
                </CardContent></Card>
              ) : calendar ? (
                <div className="space-y-4">
                  {calendar.raw ? (
                    <Card><CardContent className="p-4"><Streamdown>{calendar.raw}</Streamdown></CardContent></Card>
                  ) : (
                    <>
                      {calendar.strategy && (
                        <Card className="glass rounded-2xl">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-4">
                              {calendar.strategy.keyThemes?.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-zinc-500 mb-1">Key Themes</p>
                                  <div className="flex flex-wrap gap-1">{calendar.strategy.keyThemes.map((t: string) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}</div>
                                </div>
                              )}
                              {calendar.strategy.engagementTips?.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-zinc-500 mb-1">Engagement Tips</p>
                                  <ul className="space-y-0.5">{calendar.strategy.engagementTips.slice(0, 3).map((t: string, i: number) => (
                                    <li key={i} className="text-xs flex items-start gap-1"><CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />{t}</li>
                                  ))}</ul>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {calendar.weeks?.map((week: any, wi: number) => (
                        <Card key={wi} className="glass rounded-2xl">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Week {week.week}: {week.theme}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {week.posts?.map((post: any, pi: number) => (
                                <div key={pi} className="p-3 rounded-lg border bg-card hover:bg-zinc-900/20 transition-all">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <Badge variant="outline" className="text-[10px]">{post.day}</Badge>
                                    <Badge variant="secondary" className="text-[10px] capitalize">{post.platform}</Badge>
                                    <Badge variant="outline" className="text-[10px]">{post.type}</Badge>
                                    {post.postingTime && <span className="text-[10px] text-zinc-500">{post.postingTime}</span>}
                                  </div>
                                  <p className="text-sm font-medium">{post.title}</p>
                                  {post.hook && <p className="text-xs text-primary italic mt-0.5">"{post.hook}"</p>}
                                  {post.caption && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{post.caption}</p>}
                                  <div className="flex items-center gap-2 mt-2">
                                    {post.hashtags?.slice(0, 3).map((h: string) => <span key={h} className="text-[10px] text-zinc-500">#{h}</span>)}
                                    <Button size="sm" variant="ghost" className="h-5 text-[10px] px-1.5 ml-auto" onClick={() => { navigator.clipboard.writeText(`${post.hook}\n\n${post.caption}\n\n${post.hashtags?.map((h: string) => `#${h}`).join(" ")}`); toast.success("Post copied!"); }}>
                                      <Copy className="h-3 w-3 mr-1" />Copy
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <Card className="border-dashed h-full">
                  <CardContent className="flex flex-col items-center justify-center py-20">
                    <Calendar className="h-12 w-12 text-zinc-500/30 mb-4" />
                    <p className="font-semibold">No calendar yet</p>
                    <p className="text-sm text-zinc-500 mt-1 text-center max-w-xs">Fill in your details and generate a strategic content calendar with platform-specific posts, hooks, and hashtags.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Viral Post Generator Tab */}
        <TabsContent value="viral" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" />Viral Post Generator</CardTitle>
                <CardDescription>Generate a single high-performing post optimized for maximum reach and engagement on your chosen platform.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Platform</label>
                  <Select value={viralPlatform} onValueChange={setViralPlatform}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Topic / Idea *</label>
                  <Textarea className="mt-1" value={viralTopic} onChange={e => setViralTopic(e.target.value)} placeholder="e.g. 'Why most people fail at building habits', 'The truth about passive income', 'How I grew from 0 to 10K followers'..." rows={3} />
                </div>
                <div>
                  <label className="text-sm font-medium">Your Niche</label>
                  <Input className="mt-1" value={viralNiche} onChange={e => setViralNiche(e.target.value)} placeholder="e.g. personal finance, fitness, marketing, tech..." />
                </div>
                <Button className="w-full" onClick={generateViralPost} disabled={!viralTopic.trim() || generatingViral}>
                  {generatingViral ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating...</> : <><Zap className="h-4 w-4 mr-2" />Generate Viral Post</>}
                </Button>
              </CardContent>
            </Card>

            <div>
              {generatingViral ? (
                <Card><CardContent className="flex flex-col items-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="font-medium">Crafting your viral post...</p>
                </CardContent></Card>
              ) : viralPost ? (
                <div className="space-y-3">
                  {viralPost.raw ? (
                    <Card><CardContent className="p-4"><Streamdown>{viralPost.raw}</Streamdown></CardContent></Card>
                  ) : (
                    <>
                      <Card className="glass rounded-2xl">
                        <CardContent className="p-4 space-y-3">
                          {viralPost.hook && (
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                              <p className="text-xs font-semibold text-primary mb-1">Hook</p>
                              <p className="text-sm font-medium">{viralPost.hook}</p>
                            </div>
                          )}
                          {viralPost.body && (
                            <div>
                              <p className="text-xs font-semibold text-zinc-500 mb-1">Post Body</p>
                              <p className="text-sm whitespace-pre-wrap">{viralPost.body}</p>
                            </div>
                          )}
                          {viralPost.cta && (
                            <div className="p-2 rounded-lg bg-zinc-900/40">
                              <p className="text-xs font-semibold text-zinc-500 mb-0.5">CTA</p>
                              <p className="text-sm">{viralPost.cta}</p>
                            </div>
                          )}
                          {viralPost.hashtags?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-zinc-500 mb-1">Hashtags</p>
                              <p className="text-xs text-zinc-500">{viralPost.hashtags.map((h: string) => `#${h}`).join(" ")}</p>
                            </div>
                          )}
                          {viralPost.bestTime && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-zinc-500">Best time to post:</span>
                              <Badge variant="secondary">{viralPost.bestTime}</Badge>
                            </div>
                          )}
                          <Button className="w-full" onClick={() => { navigator.clipboard.writeText(`${viralPost.hook}\n\n${viralPost.body}\n\n${viralPost.cta}\n\n${viralPost.hashtags?.map((h: string) => `#${h}`).join(" ")}`); toast.success("Full post copied!"); }}>
                            <Copy className="h-4 w-4 mr-2" />Copy Full Post
                          </Button>
                        </CardContent>
                      </Card>
                      {viralPost.alternativeHooks?.length > 0 && (
                        <Card className="glass rounded-2xl">
                          <CardHeader className="pb-2"><CardTitle className="text-sm">A/B Test These Hooks</CardTitle></CardHeader>
                          <CardContent className="space-y-2">
                            {viralPost.alternativeHooks.map((hook: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
                                <span className="text-xs text-zinc-500 shrink-0">#{i + 1}</span>
                                <p className="text-sm flex-1">{hook}</p>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={() => { navigator.clipboard.writeText(hook); toast.success("Hook copied!"); }}><Copy className="h-3 w-3" /></Button>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <Card className="border-dashed h-full">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Zap className="h-12 w-12 text-zinc-500/30 mb-4" />
                    <p className="text-zinc-500 text-center">Enter a topic to generate a viral post with hooks, body, CTA, and hashtags</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
