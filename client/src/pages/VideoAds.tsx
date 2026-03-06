import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Video, Loader2, Sparkles, Trash2, Clock, Film, MessageSquare } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const platformOptions = [
  { value: "tiktok", label: "TikTok" },
  { value: "youtube_shorts", label: "YouTube Shorts" },
  { value: "instagram_reels", label: "Instagram Reels" },
  { value: "youtube", label: "YouTube" },
];

export default function VideoAds() {
  const utils = trpc.useUtils();
  const { data: videoAds, isLoading } = trpc.videoAd.list.useQuery();
  const { data: products } = trpc.product.list.useQuery();
  const generateMut = trpc.videoAd.generate.useMutation({
    onSuccess: () => { utils.videoAd.list.invalidate(); setOpen(false); toast.success("Video ad script generated!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.videoAd.delete.useMutation({ onSuccess: () => { utils.videoAd.list.invalidate(); toast.success("Deleted"); } });

  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState("tiktok");
  const [duration, setDuration] = useState("30");
  const [productId, setProductId] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const analyzedProducts = useMemo(() => products?.filter(p => p.analysisStatus === "completed") ?? [], [products]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Video Ad Generator</h1>
          <p className="text-muted-foreground text-sm mt-1">Create AI-powered video ad scripts with storyboards, voiceover text, and thumbnails for any platform.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl"><Sparkles className="h-4 w-4 mr-2" />Create Video Ad</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Generate Video Ad Script</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{platformOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Duration (seconds)</Label>
                <Input type="number" min={5} max={180} value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
              {analyzedProducts.length > 0 && (
                <div><Label>Based on Product (optional)</Label>
                  <Select value={productId} onValueChange={setProductId}><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{analyzedProducts.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div><Label>Custom Direction (optional)</Label>
                <Textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Describe the style, mood, target audience, or key messages..." rows={3} />
              </div>
              <Button className="w-full rounded-xl" disabled={generateMut.isPending} onClick={() => generateMut.mutate({ platform: platform as any, duration: Number(duration), productId: productId ? Number(productId) : undefined, customPrompt: customPrompt || undefined })}>
                {generateMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Video Ad</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2].map(i => <Card key={i} className="border-0 shadow-sm animate-pulse"><CardContent className="p-6 h-48" /></Card>)}</div>
      ) : !videoAds?.length ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg">No video ads yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Generate AI video ad scripts with storyboards for TikTok, YouTube Shorts, Instagram Reels, and more.</p>
            <Button className="mt-4 rounded-xl" onClick={() => setOpen(true)}><Sparkles className="h-4 w-4 mr-2" />Create Your First Video Ad</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videoAds.map(video => {
            const isExpanded = expandedId === video.id;
            const storyboard = video.storyboard as any[];
            const metadata = video.metadata as any;
            return (
              <Card key={video.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt="Thumbnail" className="h-16 w-24 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-16 w-24 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                        <Film className="h-6 w-6 text-violet-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{platformOptions.find(p => p.value === video.platform)?.label || video.platform}</Badge>
                        <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{video.duration}s</Badge>
                      </div>
                      {metadata?.hook && <p className="text-sm font-medium mt-1 line-clamp-2">"{metadata.hook}"</p>}
                      {metadata?.cta && <p className="text-xs text-muted-foreground mt-1">CTA: {metadata.cta}</p>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg flex-1" onClick={() => setExpandedId(isExpanded ? null : video.id)}>
                      {isExpanded ? "Hide Details" : "View Script & Storyboard"}
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-lg text-destructive hover:text-destructive" onClick={() => deleteMut.mutate({ id: video.id })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="border-t pt-4 space-y-4">
                      {video.script && (
                        <div>
                          <h4 className="text-sm font-medium flex items-center gap-2 mb-2"><MessageSquare className="h-4 w-4 text-primary" />Full Script</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{video.script}</p>
                        </div>
                      )}
                      {storyboard?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium flex items-center gap-2 mb-2"><Film className="h-4 w-4 text-violet-500" />Storyboard</h4>
                          <div className="space-y-2">
                            {storyboard.map((scene: any, i: number) => (
                              <div key={i} className="flex gap-3 bg-muted/30 p-3 rounded-lg">
                                <Badge variant="outline" className="shrink-0 h-6">{scene.scene || `Scene ${i + 1}`}</Badge>
                                <div className="min-w-0">
                                  <p className="text-sm">{scene.description}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{scene.duration}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
