import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Film, Play, Download, Sparkles, Image, Clock, Trash2 } from "lucide-react";

export default function VideoRender() {
  const [showCreate, setShowCreate] = useState(false);
  const [script, setScript] = useState("");
  const [style, setStyle] = useState<string>("photorealistic");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [voiceGender, setVoiceGender] = useState<string>("female");
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);

  const { data: videos, refetch } = trpc.videoRender.list.useQuery();
  const { data: videoDetail } = trpc.videoRender.get.useQuery(
    { id: selectedVideo! }, { enabled: !!selectedVideo }
  );

  const createVideo = trpc.videoRender.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Video rendering started — this may take 30-60 seconds");
      setShowCreate(false);
      setScript("");
      refetch();
      setSelectedVideo(data.id);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // No delete procedure available - videos are permanent

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Video Studio</h1>
          <p className="text-zinc-500">Generate professional marketing videos with AI actors and scenes</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Create Video</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create AI Video</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Script / Description *</label>
                <Textarea value={script} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setScript(e.target.value)} placeholder="Describe your video or write a script. AI will generate scenes from this..." rows={6} />
                <p className="text-xs text-zinc-500 mt-1">Tip: Write scene-by-scene for best results. E.g., "Scene 1: A professional woman presenting a product..."</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Visual Style</label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photorealistic">Photorealistic</SelectItem>
                      <SelectItem value="cinematic">Cinematic</SelectItem>
                      <SelectItem value="animated">Animated</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Aspect Ratio</label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait/Reels)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="4:5">4:5 (Instagram)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Voice Gender</label>
                <Select value={voiceGender} onValueChange={setVoiceGender}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createVideo.mutate({ script, avatarStyle: style, duration: 30 })} disabled={!script || createVideo.isPending} className="w-full">
                {createVideo.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Scenes...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Video</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Your Videos</h3>
          {!videos?.length ? (
            <Card className="border-dashed"><CardContent className="py-8 text-center">
              <Film className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No videos yet</p>
            </CardContent></Card>
          ) : videos.map((v: any) => (
            <Card key={v.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedVideo === v.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedVideo(v.id)}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt="" className="w-16 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-16 h-10 rounded bg-zinc-800 flex items-center justify-center"><Film className="w-4 h-4 text-zinc-500" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.script?.substring(0, 40)}...</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={v.status === "completed" ? "default" : v.status === "rendering" ? "secondary" : "destructive"} className="text-xs">{v.status}</Badge>
                      <span className="text-xs text-zinc-500">{v.aspectRatio}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Video Detail */}
        <div className="lg:col-span-2">
          {!selectedVideo || !videoDetail ? (
            <Card className="border-dashed"><CardContent className="flex flex-col items-center py-16">
              <Film className="w-12 h-12 text-zinc-500 mb-4" />
              <p className="text-zinc-500">Select a video to preview</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Video Preview</CardTitle>
                    <div className="flex gap-2">
                      {videoDetail.videoUrl && (
                        <Button size="sm" variant="outline" onClick={() => window.open(videoDetail.videoUrl!, "_blank")}>
                          <Download className="w-4 h-4 mr-1" /> Download
                        </Button>
                      )}

                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {videoDetail.status === "rendering" ? (
                    <div className="flex flex-col items-center py-12">
                      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                      <p className="font-medium">Rendering your video...</p>
                      <p className="text-sm text-zinc-500 mt-1">This typically takes 30-60 seconds</p>
                    </div>
                  ) : videoDetail.status === "failed" ? (
                    <div className="flex flex-col items-center py-12">
                      <p className="text-destructive font-medium">Rendering failed</p>
                      <p className="text-sm text-zinc-500 mt-1">{videoDetail.errorMessage || "Unknown error"}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Scene frames */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {((videoDetail.frames as any[]) || []).map((frame: any, idx: number) => (
                          <div key={idx} className="relative group">
                            <img src={frame.imageUrl} alt={`Scene ${idx + 1}`} className="w-full rounded-lg aspect-video object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-lg">
                              <p className="text-white text-xs">{frame.text || `Scene ${idx + 1}`}</p>
                              <p className="text-white/70 text-xs"><Clock className="w-3 h-3 inline mr-1" />{frame.duration}s</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Video metadata */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-zinc-900/40">
                          <p className="text-xs text-zinc-500">Style</p>
                          <p className="font-medium text-sm capitalize">{(videoDetail.metadata as any)?.avatarStyle || 'photorealistic'}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-900/40">
                          <p className="text-xs text-zinc-500">Aspect Ratio</p>
                          <p className="font-medium text-sm">{(videoDetail.metadata as any)?.aspectRatio || '16:9'}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-900/40">
                          <p className="text-xs text-zinc-500">Duration</p>
                          <p className="font-medium text-sm">{videoDetail.duration || "—"}s</p>
                        </div>
                      </div>

                      {/* Script */}
                      <div>
                        <p className="text-sm font-medium mb-2">Script</p>
                        <p className="text-sm text-zinc-500 bg-zinc-900/50 p-3 rounded-lg">{(videoDetail.metadata as any)?.script || ''}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
