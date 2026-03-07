import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useState } from "react";
import {
  Rocket, Plus, Play, Pause, Trash2, Loader2, Zap, Brain, Edit,
  CheckCircle2, Clock, AlertCircle, XCircle, DollarSign, Target,
  Image, Video, LayoutGrid, Type, RefreshCw, Send, Eye, Copy
} from "lucide-react";

const STATUS_CONFIG = {
  draft: { label: "Draft", icon: <Edit className="w-3 h-3" />, color: "bg-gray-100 text-gray-600" },
  queued: { label: "Queued", icon: <Clock className="w-3 h-3" />, color: "bg-blue-100 text-blue-600" },
  publishing: { label: "Publishing", icon: <Loader2 className="w-3 h-3 animate-spin" />, color: "bg-amber-100 text-amber-600" },
  live: { label: "Live", icon: <CheckCircle2 className="w-3 h-3" />, color: "bg-green-100 text-green-600" },
  paused: { label: "Paused", icon: <Pause className="w-3 h-3" />, color: "bg-amber-100 text-amber-600" },
  completed: { label: "Completed", icon: <CheckCircle2 className="w-3 h-3" />, color: "bg-gray-100 text-gray-600" },
  failed: { label: "Failed", icon: <XCircle className="w-3 h-3" />, color: "bg-red-100 text-red-600" },
};

const AD_TYPES = [
  { value: "image", label: "Image Ad", icon: <Image className="w-4 h-4" /> },
  { value: "video", label: "Video Ad", icon: <Video className="w-4 h-4" /> },
  { value: "carousel", label: "Carousel", icon: <LayoutGrid className="w-4 h-4" /> },
  { value: "text", label: "Text Ad", icon: <Type className="w-4 h-4" /> },
];

const CTA_OPTIONS = [
  "Shop Now", "Learn More", "Sign Up", "Get Started", "Download",
  "Book Now", "Contact Us", "Watch More", "Apply Now", "Get Offer"
];

export default function OnePushPublisher() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: connections } = trpc.adPlatform.connections.useQuery(undefined, { enabled: !!user });
  const { data: queue, isLoading } = trpc.publisher.list.useQuery(undefined, { enabled: !!user });

  const createAd = trpc.publisher.create.useMutation({
    onSuccess: () => { utils.publisher.list.invalidate(); setCreateOpen(false); resetForm(); toast.success("Ad created in draft"); },
    onError: (e) => toast.error(e.message),
  });
  const publishAd = trpc.publisher.publish.useMutation({
    onSuccess: (data) => { utils.publisher.list.invalidate(); toast.success(data.message); },
    onError: (e) => toast.error(e.message),
  });
  const pauseAd = trpc.publisher.pause.useMutation({
    onSuccess: () => { utils.publisher.list.invalidate(); toast.success("Ad paused"); },
  });
  const resumeAd = trpc.publisher.resume.useMutation({
    onSuccess: () => { utils.publisher.list.invalidate(); toast.success("Ad resumed"); },
  });
  const deleteAd = trpc.publisher.delete.useMutation({
    onSuccess: () => { utils.publisher.list.invalidate(); toast.success("Ad deleted"); },
  });
  const optimizeCopy = trpc.publisher.optimizeCopy.useMutation({
    onSuccess: (data) => { setOptimizeResult(data); toast.success("AI generated 3 optimized versions"); },
    onError: (e) => toast.error(e.message),
  });
  const applyCopy = trpc.publisher.applyCopy.useMutation({
    onSuccess: () => { utils.publisher.list.invalidate(); setOptimizeResult(null); setOptimizeId(null); toast.success("Optimized copy applied"); },
  });
  const bulkPublish = trpc.publisher.bulkPublish.useMutation({
    onSuccess: (data) => { utils.publisher.list.invalidate(); toast.success(`${data.published} ads published`); setSelectedIds([]); },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [optimizeId, setOptimizeId] = useState<number | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Form state
  const [connectionId, setConnectionId] = useState("");
  const [adName, setAdName] = useState("");
  const [adType, setAdType] = useState("image");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [cta, setCta] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetType, setBudgetType] = useState("daily");

  const resetForm = () => {
    setConnectionId(""); setAdName(""); setAdType("image"); setHeadline("");
    setBody(""); setImageUrl(""); setDestinationUrl(""); setCta(""); setBudget(""); setBudgetType("daily");
  };

  const connectedPlatforms = connections?.filter((c: any) => c.status === "connected") || [];

  const handleCreate = () => {
    if (!connectionId || !adName.trim()) { toast.error("Fill in required fields"); return; }
    createAd.mutate({
      connectionId: Number(connectionId),
      adName,
      adType: adType as any,
      headline: headline || undefined,
      body: body || undefined,
      imageUrl: imageUrl || undefined,
      destinationUrl: destinationUrl || undefined,
      callToAction: cta || undefined,
      budget: budget || undefined,
      budgetType: budgetType as any,
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const draftAds = queue?.filter((a: any) => a.status === "draft") || [];
  const liveAds = queue?.filter((a: any) => ["live", "queued", "publishing"].includes(a.status)) || [];
  const completedAds = queue?.filter((a: any) => ["completed", "paused", "failed"].includes(a.status)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="w-6 h-6 text-orange-500" />
            One-Push Publisher
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create, optimize with AI, and launch ads to Meta, Google, TikTok, and more — all from one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button onClick={() => bulkPublish.mutate({ ids: selectedIds })} disabled={bulkPublish.isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
              {bulkPublish.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Publish {selectedIds.length} Ads
            </Button>
          )}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" /> Create Ad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Ad</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {connectedPlatforms.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No connected ad accounts. Go to <strong>Ad Platforms</strong> to connect first.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Ad Account <span className="text-red-500">*</span></Label>
                        <Select value={connectionId} onValueChange={setConnectionId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account..." />
                          </SelectTrigger>
                          <SelectContent>
                            {connectedPlatforms.map((c: any) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.platform.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())} — {c.accountName || "Account"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Ad Name <span className="text-red-500">*</span></Label>
                        <Input value={adName} onChange={e => setAdName(e.target.value)} placeholder="Summer Sale Campaign..." />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Ad Type</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {AD_TYPES.map(t => (
                          <button
                            key={t.value}
                            onClick={() => setAdType(t.value)}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-colors ${adType === t.value ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 hover:border-gray-300"}`}
                          >
                            {t.icon}
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Headline</Label>
                      <Input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Stop Scrolling. This Changes Everything." />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Ad Body / Description</Label>
                      <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your ad copy here..." rows={3} />
                    </div>

                    {(adType === "image" || adType === "carousel") && (
                      <div className="space-y-1.5">
                        <Label>Image URL</Label>
                        <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Destination URL</Label>
                        <Input value={destinationUrl} onChange={e => setDestinationUrl(e.target.value)} placeholder="https://yoursite.com/offer" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Call to Action</Label>
                        <Select value={cta} onValueChange={setCta}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select CTA..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CTA_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Budget</Label>
                        <Input value={budget} onChange={e => setBudget(e.target.value)} placeholder="50.00" type="number" min="0" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Budget Type</Label>
                        <Select value={budgetType} onValueChange={setBudgetType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily Budget</SelectItem>
                            <SelectItem value="lifetime">Lifetime Budget</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleCreate} disabled={createAd.isPending} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                        {createAd.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        Create Ad Draft
                      </Button>
                      <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI Optimize Modal */}
      {optimizeResult && optimizeId && (
        <Card className="border-violet-200 bg-violet-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-600" /> AI Copy Optimization Results
            </CardTitle>
            <CardDescription>Choose the best version to apply</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {optimizeResult.versions.map((v: any, i: number) => (
              <div key={i} className={`p-4 rounded-lg border bg-white ${i + 1 === optimizeResult.bestVersion ? "border-violet-400 ring-1 ring-violet-300" : "border-gray-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Version {i + 1} {i + 1 === optimizeResult.bestVersion && <Badge className="ml-2 text-xs bg-violet-100 text-violet-700">AI Recommended</Badge>}</p>
                  <Button size="sm" onClick={() => applyCopy.mutate({ id: optimizeId, headline: v.headline, body: v.body, callToAction: v.callToAction })} disabled={applyCopy.isPending} className="bg-violet-600 hover:bg-violet-700 text-white text-xs">
                    Apply This
                  </Button>
                </div>
                <p className="text-sm font-medium">{v.headline}</p>
                <p className="text-xs text-muted-foreground mt-1">{v.body}</p>
                <p className="text-xs text-violet-600 mt-1">CTA: {v.callToAction}</p>
                <p className="text-xs text-gray-500 mt-1 italic">{v.rationale}</p>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-xs font-medium text-violet-700 mb-1">Key Improvements:</p>
              <ul className="space-y-0.5">
                {optimizeResult.keyImprovements.map((imp: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />{imp}</li>
                ))}
              </ul>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setOptimizeResult(null); setOptimizeId(null); }}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      {/* Queue Tabs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (!queue || queue.length === 0) ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">No ads yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Create your first ad draft, optimize the copy with AI, then push it live to your connected platforms.
            </p>
            <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create First Ad
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="drafts">
          <TabsList>
            <TabsTrigger value="drafts">Drafts <Badge variant="secondary" className="ml-1 text-xs">{draftAds.length}</Badge></TabsTrigger>
            <TabsTrigger value="live">Live <Badge variant="secondary" className="ml-1 text-xs">{liveAds.length}</Badge></TabsTrigger>
            <TabsTrigger value="completed">History <Badge variant="secondary" className="ml-1 text-xs">{completedAds.length}</Badge></TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="mt-4 space-y-3">
            {draftAds.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No drafts. Create an ad to get started.</p>
            ) : draftAds.map((ad: any) => (
              <AdCard
                key={ad.id}
                ad={ad}
                selected={selectedIds.includes(ad.id)}
                onToggleSelect={() => toggleSelect(ad.id)}
                onPublish={() => publishAd.mutate({ id: ad.id })}
                onDelete={() => deleteAd.mutate({ id: ad.id })}
                onOptimize={() => { setOptimizeId(ad.id); optimizeCopy.mutate({ id: ad.id, goal: "conversions" }); }}
                isPublishing={publishAd.isPending}
                isOptimizing={optimizeCopy.isPending && optimizeId === ad.id}
              />
            ))}
          </TabsContent>

          <TabsContent value="live" className="mt-4 space-y-3">
            {liveAds.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No live ads. Publish a draft to see it here.</p>
            ) : liveAds.map((ad: any) => (
              <AdCard
                key={ad.id}
                ad={ad}
                onPause={() => pauseAd.mutate({ id: ad.id })}
                onDelete={() => deleteAd.mutate({ id: ad.id })}
                isPausing={pauseAd.isPending}
              />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-3">
            {completedAds.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No completed or paused ads.</p>
            ) : completedAds.map((ad: any) => (
              <AdCard
                key={ad.id}
                ad={ad}
                onResume={ad.status === "paused" ? () => resumeAd.mutate({ id: ad.id }) : undefined}
                onDelete={() => deleteAd.mutate({ id: ad.id })}
              />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function AdCard({ ad, selected, onToggleSelect, onPublish, onPause, onResume, onDelete, onOptimize, isPublishing, isPausing, isOptimizing }: {
  ad: any;
  selected?: boolean;
  onToggleSelect?: () => void;
  onPublish?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onDelete?: () => void;
  onOptimize?: () => void;
  isPublishing?: boolean;
  isPausing?: boolean;
  isOptimizing?: boolean;
}) {
  const statusConfig = STATUS_CONFIG[ad.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;

  return (
    <Card className={`transition-all ${selected ? "ring-2 ring-orange-400" : ""}`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          {onToggleSelect && (
            <Checkbox checked={selected} onCheckedChange={onToggleSelect} className="mt-1" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-semibold text-sm">{ad.adName}</p>
              <Badge className={`text-xs flex items-center gap-1 ${statusConfig.color}`}>
                {statusConfig.icon} {statusConfig.label}
              </Badge>
              <Badge variant="outline" className="text-xs">{ad.platform.replace(/_/g, " ")}</Badge>
              <Badge variant="outline" className="text-xs">{ad.adType}</Badge>
            </div>
            {ad.headline && <p className="text-sm font-medium text-gray-700 truncate">{ad.headline}</p>}
            {ad.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ad.body}</p>}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {ad.budget && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{ad.budget}/{ad.budgetType}</span>}
              {ad.callToAction && <span className="flex items-center gap-1"><Target className="w-3 h-3" />{ad.callToAction}</span>}
              {ad.publishedAt && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />Published {new Date(ad.publishedAt).toLocaleDateString()}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onOptimize && (
              <Button variant="outline" size="sm" onClick={onOptimize} disabled={isOptimizing} className="text-violet-600 border-violet-200 hover:bg-violet-50 text-xs">
                {isOptimizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                <span className="ml-1 hidden sm:inline">AI Optimize</span>
              </Button>
            )}
            {onPublish && (
              <Button size="sm" onClick={onPublish} disabled={isPublishing} className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                {isPublishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
                <span className="ml-1 hidden sm:inline">Publish</span>
              </Button>
            )}
            {onPause && (
              <Button variant="outline" size="sm" onClick={onPause} disabled={isPausing} className="text-xs">
                {isPausing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3" />}
              </Button>
            )}
            {onResume && (
              <Button variant="outline" size="sm" onClick={onResume} className="text-xs text-green-600 border-green-200">
                <Play className="w-3 h-3" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
