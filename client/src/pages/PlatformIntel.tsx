import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  Twitter,
  ShoppingBag,
  Mail,
  MessageSquare,
  Camera,
  Globe,
  Search,
  Pin,
  Ghost,
  Megaphone,
  Clock,
  Hash,
  Image,
  Video,
  Type,
  ArrowRight,
  Zap,
  Copy,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Monitor,
  BarChart3,
  Sparkles,
} from "lucide-react";

// Platform icon mapping
const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-5 w-5" />,
  tiktok: <Smartphone className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />,
  facebook: <Facebook className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  twitter: <Twitter className="h-5 w-5" />,
  google_ads: <Search className="h-5 w-5" />,
  amazon: <ShoppingBag className="h-5 w-5" />,
  pinterest: <Pin className="h-5 w-5" />,
  whatsapp: <MessageSquare className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  sms: <Smartphone className="h-5 w-5" />,
  reddit: <Globe className="h-5 w-5" />,
  snapchat: <Ghost className="h-5 w-5" />,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "from-pink-500 to-purple-600",
  tiktok: "from-gray-900 to-gray-700",
  youtube: "from-red-500 to-red-700",
  facebook: "from-blue-500 to-blue-700",
  linkedin: "from-blue-600 to-blue-800",
  twitter: "from-sky-400 to-sky-600",
  google_ads: "from-green-500 to-blue-500",
  amazon: "from-orange-400 to-orange-600",
  pinterest: "from-red-400 to-red-600",
  whatsapp: "from-green-400 to-green-600",
  email: "from-violet-500 to-violet-700",
  sms: "from-emerald-500 to-emerald-700",
  reddit: "from-orange-500 to-orange-700",
  snapchat: "from-yellow-400 to-yellow-500",
};

const CATEGORY_LABELS: Record<string, string> = {
  social: "Social Media",
  ads: "Advertising",
  messaging: "Messaging",
  content: "Content",
  commerce: "Commerce",
  media: "Media",
};

function PlatformCard({ spec, onClick, isSelected }: { spec: any; onClick: () => void; isSelected: boolean }) {
  const gradient = PLATFORM_COLORS[spec.id] || "from-gray-500 to-gray-700";
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        isSelected ? "ring-2 ring-primary shadow-lg" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
            {PLATFORM_ICONS[spec.id] || <Globe className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{spec.name}</h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {CATEGORY_LABELS[spec.category] || spec.category}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Type className="h-3 w-3" />
            <span>{spec.characterLimits.post.toLocaleString()} chars</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Hash className="h-3 w-3" />
            <span>{spec.hashtagStrategy.maxHashtags} tags</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Image className="h-3 w-3" />
            <span>{spec.imageSpecs.feedAspectRatio}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Video className="h-3 w-3" />
            <span>{spec.videoSpecs.maxLength}s max</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformDetailPanel({ spec }: { spec: any }) {
  const gradient = PLATFORM_COLORS[spec.id] || "from-gray-500 to-gray-700";
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className={`rounded-xl bg-gradient-to-br ${gradient} p-6 text-white`}>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            {PLATFORM_ICONS[spec.id] || <Globe className="h-7 w-7" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{spec.name}</h2>
            <p className="text-white/80 text-sm">
              {CATEGORY_LABELS[spec.category]} Platform
            </p>
          </div>
        </div>
      </div>

      {/* Character Limits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="h-4 w-4 text-primary" />
            Character Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(spec.characterLimits).map(([key, val]) => (
              <div key={key} className="bg-zinc-900/40 rounded-lg p-3">
                <p className="text-xs text-zinc-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                <p className="text-lg font-bold">{(val as number).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image & Video Specs */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="h-4 w-4 text-primary" />
              Image Specs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Feed Ratio</span>
              <span className="font-medium">{spec.imageSpecs.feedAspectRatio}</span>
            </div>
            {spec.imageSpecs.storyAspectRatio && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Story Ratio</span>
                <span className="font-medium">{spec.imageSpecs.storyAspectRatio}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Min Width</span>
              <span className="font-medium">{spec.imageSpecs.minWidth}px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Max Size</span>
              <span className="font-medium">{spec.imageSpecs.maxFileSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Formats</span>
              <span className="font-medium">{spec.imageSpecs.formats.join(", ")}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              Video Specs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Max Length</span>
              <span className="font-medium">{spec.videoSpecs.maxLength}s</span>
            </div>
            {spec.videoSpecs.minLength && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Min Length</span>
                <span className="font-medium">{spec.videoSpecs.minLength}s</span>
              </div>
            )}
            {spec.videoSpecs.recommendedLength && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Recommended</span>
                <span className="font-medium">{spec.videoSpecs.recommendedLength}s</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Aspect Ratios</span>
              <span className="font-medium">{spec.videoSpecs.aspectRatios.join(", ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Max Size</span>
              <span className="font-medium">{spec.videoSpecs.maxFileSize}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hashtag Strategy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" />
            Hashtag Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-zinc-900/40 rounded-lg p-3 text-center">
              <p className="text-xs text-zinc-500">Max</p>
              <p className="text-xl font-bold">{spec.hashtagStrategy.maxHashtags}</p>
            </div>
            <div className="bg-zinc-900/40 rounded-lg p-3 text-center">
              <p className="text-xs text-zinc-500">Recommended</p>
              <p className="text-xl font-bold text-primary">{spec.hashtagStrategy.recommendedHashtags}</p>
            </div>
            <div className="bg-zinc-900/40 rounded-lg p-3 text-center">
              <p className="text-xs text-zinc-500">Placement</p>
              <p className="text-sm font-bold capitalize">{spec.hashtagStrategy.placement}</p>
            </div>
          </div>
          <p className="text-sm text-zinc-500">{spec.hashtagStrategy.tips}</p>
        </CardContent>
      </Card>

      {/* Best Posting Times */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Best Posting Times
          </CardTitle>
          <CardDescription>Peak engagement windows by day (UTC)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {days.map(day => {
              const dayData = spec.bestPostingTimes[day];
              if (!dayData) return null;
              const isPeakDay = spec.peakEngagement.days.includes(day);
              return (
                <div key={day} className={`flex items-center gap-3 p-2 rounded-lg ${isPeakDay ? "bg-primary/5 border border-primary/20" : "bg-zinc-900/50"}`}>
                  <span className={`text-sm font-medium w-24 ${isPeakDay ? "text-primary" : ""}`}>
                    {day.slice(0, 3)}
                    {isPeakDay && <Zap className="h-3 w-3 inline ml-1 text-primary" />}
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {dayData.hours.map((h: number) => (
                      <Badge
                        key={h}
                        variant={h === dayData.peak ? "default" : "outline"}
                        className={`text-xs ${h === dayData.peak ? "" : "bg-transparent"}`}
                      >
                        {h.toString().padStart(2, "0")}:00
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <Zap className="h-3 w-3 inline mr-1" />
              {spec.peakEngagement.notes}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Content Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Content Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {spec.contentTips.map((tip: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Format Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Format Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {spec.formatRecommendations.map((rec: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{rec.type}</p>
                  <p className="text-xs text-zinc-500">{rec.description}</p>
                </div>
                <Badge
                  variant={rec.performanceRating === "high" ? "default" : "outline"}
                  className={
                    rec.performanceRating === "high"
                      ? "bg-green-500"
                      : rec.performanceRating === "medium"
                      ? "border-amber-500 text-amber-600"
                      : "border-gray-400 text-gray-500"
                  }
                >
                  {rec.performanceRating}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContentFormatter() {
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, any> | null>(null);

  const { data: allSpecs } = trpc.platformIntel.allSpecs.useQuery();
  const multiFormat = trpc.platformIntel.multiFormat.useMutation({
    onSuccess: (data) => {
      setResults(data);
      toast.success("Content formatted for all selected platforms!");
    },
    onError: () => toast.error("Formatting failed"),
  });

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleFormat = () => {
    if (!content.trim()) return toast.error("Enter some content first");
    if (selectedPlatforms.length === 0) return toast.error("Select at least one platform");
    multiFormat.mutate({ content, platformIds: selectedPlatforms });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Multi-Platform Content Formatter
          </CardTitle>
          <CardDescription>
            Write your content once, and we'll auto-format it for every platform — respecting character limits, hashtag rules, and best practices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste or write your content here... We'll adapt it for each platform automatically."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <div>
            <p className="text-sm font-medium mb-2">Select target platforms:</p>
            <div className="flex flex-wrap gap-2">
              {(allSpecs || []).map((spec: any) => {
                const isSelected = selectedPlatforms.includes(spec.id);
                const gradient = PLATFORM_COLORS[spec.id] || "from-gray-500 to-gray-700";
                return (
                  <button
                    key={spec.id}
                    onClick={() => togglePlatform(spec.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? `bg-gradient-to-r ${gradient} text-white shadow-md`
                        : "bg-zinc-800 hover:bg-zinc-800/80 text-foreground"
                    }`}
                  >
                    {PLATFORM_ICONS[spec.id]}
                    {spec.name}
                  </button>
                );
              })}
            </div>
          </div>
          <Button onClick={handleFormat} disabled={multiFormat.isPending} className="w-full">
            {multiFormat.isPending ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Formatting...</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" /> Format for {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? "s" : ""}</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Formatted Results
          </h3>
          {Object.entries(results).map(([platformId, result]: [string, any]) => {
            const spec = (allSpecs || []).find((s: any) => s.id === platformId);
            const gradient = PLATFORM_COLORS[platformId] || "from-gray-500 to-gray-700";
            return (
              <Card key={platformId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
                        {PLATFORM_ICONS[platformId]}
                      </div>
                      <CardTitle className="text-base">{spec?.name || platformId}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.withinLimit ? (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Within limit
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Over limit ({result.characterCount}/{result.characterLimit})
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(result.formatted);
                          toast.success(`Copied ${spec?.name || platformId} version!`);
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-zinc-900/50 rounded-lg p-4 text-sm whitespace-pre-wrap font-mono">
                    {result.formatted}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                    <span>{result.characterCount} / {result.characterLimit} characters</span>
                    <span>Hashtags: {result.hashtagPlacement}</span>
                  </div>
                  {result.warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {result.warnings.map((w: string, i: number) => (
                        <p key={i} className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {w}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CrossPlatformAdapter() {
  const [content, setContent] = useState("");
  const [sourcePlatform, setSourcePlatform] = useState("");
  const [targetPlatform, setTargetPlatform] = useState("");
  const [adaptedContent, setAdaptedContent] = useState<any>(null);

  const { data: allSpecs } = trpc.platformIntel.allSpecs.useQuery();
  const adaptMutation = trpc.platformIntel.adaptContent.useMutation({
    onSuccess: (data) => {
      setAdaptedContent(data);
      toast.success("Content adapted successfully!");
    },
    onError: () => toast.error("Adaptation failed"),
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            AI Cross-Platform Adapter
          </CardTitle>
          <CardDescription>
            Take content from one platform and AI-adapt it for another — not just trimming, but rewriting for native engagement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Source Platform</label>
              <div className="flex flex-wrap gap-2">
                {(allSpecs || []).map((spec: any) => (
                  <button
                    key={spec.id}
                    onClick={() => setSourcePlatform(spec.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      sourcePlatform === spec.id
                        ? `bg-gradient-to-r ${PLATFORM_COLORS[spec.id] || "from-gray-500 to-gray-700"} text-white`
                        : "bg-zinc-800 hover:bg-zinc-800/80"
                    }`}
                  >
                    {PLATFORM_ICONS[spec.id]}
                    {spec.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Target Platform</label>
              <div className="flex flex-wrap gap-2">
                {(allSpecs || []).map((spec: any) => (
                  <button
                    key={spec.id}
                    onClick={() => setTargetPlatform(spec.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      targetPlatform === spec.id
                        ? `bg-gradient-to-r ${PLATFORM_COLORS[spec.id] || "from-gray-500 to-gray-700"} text-white`
                        : "bg-zinc-800 hover:bg-zinc-800/80"
                    }`}
                  >
                    {PLATFORM_ICONS[spec.id]}
                    {spec.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Textarea
            placeholder="Paste the content from the source platform..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={5}
          />
          <Button
            onClick={() => {
              if (!content.trim() || !sourcePlatform || !targetPlatform)
                return toast.error("Fill in all fields");
              adaptMutation.mutate({ content, sourcePlatform, targetPlatform });
            }}
            disabled={adaptMutation.isPending}
            className="w-full"
          >
            {adaptMutation.isPending ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Adapting with AI...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Adapt Content</>
            )}
          </Button>
        </CardContent>
      </Card>

      {adaptedContent && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Adapted for {adaptedContent.targetPlatform}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(adaptedContent.adapted);
                  toast.success("Copied!");
                }}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-zinc-900/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
              {adaptedContent.adapted}
            </div>
            <div className="mt-3 text-xs text-zinc-500">
              Character limit: {adaptedContent.characterLimit} | Hashtag placement: {adaptedContent.hashtagStrategy?.placement}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PlatformIntel() {
  const { data: allSpecs, isLoading } = trpc.platformIntel.allSpecs.useQuery();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const selectedSpec = useMemo(() => {
    if (!selectedPlatform || !allSpecs) return null;
    return (allSpecs as any[]).find(s => s.id === selectedPlatform);
  }, [selectedPlatform, allSpecs]);

  const filteredSpecs = useMemo(() => {
    if (!allSpecs) return [];
    if (filterCategory === "all") return allSpecs;
    return (allSpecs as any[]).filter(s => s.category === filterCategory);
  }, [allSpecs, filterCategory]);

  const categories = useMemo(() => {
    if (!allSpecs) return [];
    const cats = new Set((allSpecs as any[]).map(s => s.category));
    return Array.from(cats);
  }, [allSpecs]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="h-8 w-64 bg-zinc-800 animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-zinc-800 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="page-title">Platform Intelligence</h1>
        <p className="text-zinc-500 mt-1">
          Master every platform. Character limits, aspect ratios, posting times, hashtag strategies — all in one place.
        </p>
      </div>

      <Tabs defaultValue="explorer" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="explorer">Platform Explorer</TabsTrigger>
          <TabsTrigger value="formatter">Content Formatter</TabsTrigger>
          <TabsTrigger value="adapter">Cross-Platform AI</TabsTrigger>
        </TabsList>

        <TabsContent value="explorer" className="mt-6">
          {/* Category filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant={filterCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory("all")}
            >
              All ({(allSpecs as any[])?.length || 0})
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={filterCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(cat)}
              >
                {CATEGORY_LABELS[cat] || cat}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Platform grid */}
            <div className="lg:col-span-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {(filteredSpecs as any[]).map(spec => (
                  <PlatformCard
                    key={spec.id}
                    spec={spec}
                    onClick={() => setSelectedPlatform(spec.id)}
                    isSelected={selectedPlatform === spec.id}
                  />
                ))}
              </div>
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-2">
              {selectedSpec ? (
                <PlatformDetailPanel spec={selectedSpec} />
              ) : (
                <Card className="h-full flex items-center justify-center min-h-[400px]">
                  <div className="text-center text-zinc-500">
                    <Monitor className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Select a platform</p>
                    <p className="text-sm">Click any platform card to see detailed specs</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="formatter" className="mt-6">
          <ContentFormatter />
        </TabsContent>

        <TabsContent value="adapter" className="mt-6">
          <CrossPlatformAdapter />
        </TabsContent>
      </Tabs>
    </div>
  );
}
