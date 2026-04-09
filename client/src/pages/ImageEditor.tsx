import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Scissors, Maximize, Download, Image as ImageIcon, Sparkles, Palette, ArrowUp } from "lucide-react";

export default function ImageEditor() {
  const [tab, setTab] = useState("removebg");
  const [imageUrl, setImageUrl] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [debouncedUrl, setDebouncedUrl] = useState("");

  // Resize states
  const [resizePlatform, setResizePlatform] = useState<string>("instagram-post");

  // Filter states
  const [filter, setFilter] = useState<"vintage" | "noir" | "vibrant" | "warm" | "cool" | "dramatic" | "soft" | "hdr">("vibrant");

  const removeBgMut = trpc.imageEditor.removeBackground.useMutation({
    onSuccess: (data) => { setResultUrl(data.url || null); toast.success("Background removed"); },
    onError: (e) => toast.error(e.message),
  });
  const resizeMut = trpc.imageEditor.resize.useMutation({
    onSuccess: (data) => { setResultUrl(data.url || null); toast.success("Image resized"); },
    onError: (e) => toast.error(e.message),
  });
  const upscaleMut = trpc.imageEditor.upscale.useMutation({
    onSuccess: (data) => { setResultUrl(data.url || null); toast.success("Image upscaled"); },
    onError: (e) => toast.error(e.message),
  });
  const filterMut = trpc.imageEditor.applyFilter.useMutation({
    onSuccess: (data) => { setResultUrl(data.url || null); toast.success("Filter applied"); },
    onError: (e) => toast.error(e.message),
  });

  const isProcessing = removeBgMut.isPending || resizeMut.isPending || upscaleMut.isPending || filterMut.isPending;

  useEffect(() => {
    if (!imageUrl.trim()) { setPreviewStatus("idle"); setDebouncedUrl(""); return; }
    setPreviewStatus("loading");
    const t = setTimeout(() => setDebouncedUrl(imageUrl.trim()), 600);
    return () => clearTimeout(t);
  }, [imageUrl]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold">Image Editor</h1>
        <p className="text-zinc-500">Remove backgrounds, resize for platforms, upscale, and apply filters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <label className="text-sm font-medium">Image URL *</label>
            <Input value={imageUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImageUrl(e.target.value)} placeholder="Paste image URL to edit..." className="mt-1" />
          </div>

          {previewStatus !== "idle" && (
            <div className="mb-4 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 flex items-center justify-center min-h-[180px] relative">
              {debouncedUrl && (
                <img
                  key={debouncedUrl}
                  src={debouncedUrl}
                  alt="Source preview"
                  className={previewStatus === "ok" ? "max-w-full max-h-64 object-contain" : "hidden"}
                  onLoad={() => setPreviewStatus("ok")}
                  onError={() => setPreviewStatus("error")}
                />
              )}
              {previewStatus === "loading" && <p className="text-sm text-zinc-500">Loading preview...</p>}
              {previewStatus === "error" && <p className="text-sm text-red-400">Could not load image from this URL.</p>}
            </div>
          )}

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="removebg" className="flex-1"><Scissors className="w-4 h-4 mr-1" /> Remove BG</TabsTrigger>
              <TabsTrigger value="resize" className="flex-1"><Maximize className="w-4 h-4 mr-1" /> Resize</TabsTrigger>
              <TabsTrigger value="upscale" className="flex-1"><ArrowUp className="w-4 h-4 mr-1" /> Upscale</TabsTrigger>
              <TabsTrigger value="filter" className="flex-1"><Palette className="w-4 h-4 mr-1" /> Filter</TabsTrigger>
            </TabsList>

            <TabsContent value="removebg" className="space-y-4 mt-4">
              <p className="text-sm text-zinc-500">AI will remove the background and return a clean subject.</p>
              <Button onClick={() => removeBgMut.mutate({ imageUrl })} disabled={!imageUrl || isProcessing} className="w-full">
                {removeBgMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Removing...</> : <><Scissors className="w-4 h-4 mr-2" /> Remove Background</>}
              </Button>
            </TabsContent>

            <TabsContent value="resize" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Target Platform</label>
                <Select value={resizePlatform} onValueChange={setResizePlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram-post">Instagram Post (1080x1080)</SelectItem>
                    <SelectItem value="instagram-story">Instagram Story (1080x1920)</SelectItem>
                    <SelectItem value="facebook-post">Facebook Post (1200x630)</SelectItem>
                    <SelectItem value="facebook-cover">Facebook Cover (820x312)</SelectItem>
                    <SelectItem value="twitter-post">Twitter Post (1200x675)</SelectItem>
                    <SelectItem value="twitter-header">Twitter Header (1500x500)</SelectItem>
                    <SelectItem value="linkedin-post">LinkedIn Post (1200x627)</SelectItem>
                    <SelectItem value="linkedin-cover">LinkedIn Cover (1584x396)</SelectItem>
                    <SelectItem value="youtube-thumbnail">YouTube Thumbnail (1280x720)</SelectItem>
                    <SelectItem value="tiktok-video">TikTok Video (1080x1920)</SelectItem>
                    <SelectItem value="pinterest-pin">Pinterest Pin (1000x1500)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => resizeMut.mutate({ imageUrl, platform: resizePlatform })} disabled={!imageUrl || isProcessing} className="w-full">
                {resizeMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Resizing...</> : <><Maximize className="w-4 h-4 mr-2" /> Resize for {resizePlatform.replace("-", " ")}</>}
              </Button>
            </TabsContent>

            <TabsContent value="upscale" className="space-y-4 mt-4">
              <p className="text-sm text-zinc-500">AI will enhance resolution and sharpen details while maintaining composition.</p>
              <Button onClick={() => upscaleMut.mutate({ imageUrl })} disabled={!imageUrl || isProcessing} className="w-full">
                {upscaleMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Upscaling...</> : <><ArrowUp className="w-4 h-4 mr-2" /> Upscale Image</>}
              </Button>
            </TabsContent>

            <TabsContent value="filter" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Filter Style</label>
                <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vintage">Vintage</SelectItem>
                    <SelectItem value="noir">Film Noir</SelectItem>
                    <SelectItem value="vibrant">Vibrant</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cool">Cool</SelectItem>
                    <SelectItem value="dramatic">Dramatic</SelectItem>
                    <SelectItem value="soft">Soft</SelectItem>
                    <SelectItem value="hdr">HDR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => filterMut.mutate({ imageUrl, filter })} disabled={!imageUrl || isProcessing} className="w-full">
                {filterMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Applying...</> : <><Palette className="w-4 h-4 mr-2" /> Apply {filter} Filter</>}
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Result</h3>
          {isProcessing ? (
            <Card><CardContent className="flex flex-col items-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-zinc-500">Processing your image...</p>
            </CardContent></Card>
          ) : resultUrl ? (
            <div className="space-y-3">
              <Card className="overflow-hidden">
                <img src={resultUrl} alt="Result" className="w-full" />
              </Card>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => window.open(resultUrl, "_blank")}>
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(resultUrl); toast.success("URL copied"); }}>
                  Copy URL
                </Button>
                <Button variant="outline" onClick={() => { setImageUrl(resultUrl); toast.success("Set as input for further editing"); }}>
                  Use as Input
                </Button>
              </div>
            </div>
          ) : (
            <Card className="border-dashed"><CardContent className="flex flex-col items-center py-16">
              <ImageIcon className="w-12 h-12 text-zinc-500 mb-4" />
              <p className="text-zinc-500">Edited images will appear here</p>
            </CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
