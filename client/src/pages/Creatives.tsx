import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Image, Loader2, Sparkles, Trash2, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const creativeTypes = [
  { value: "ad_image", label: "Ad Image (1200x628)" },
  { value: "social_graphic", label: "Social Graphic (1080x1080)" },
  { value: "thumbnail", label: "Video Thumbnail (1280x720)" },
  { value: "banner", label: "Web Banner (1920x480)" },
  { value: "story", label: "Story / Reel (1080x1920)" },
];
const platforms = ["Instagram", "TikTok", "YouTube", "Facebook", "LinkedIn", "Twitter/X", "Amazon"];

export default function Creatives() {
  const utils = trpc.useUtils();
  const { data: creatives, isLoading } = trpc.creative.list.useQuery();
  const { data: products } = trpc.product.list.useQuery();
  const generateMut = trpc.creative.generate.useMutation({
    onSuccess: () => { utils.creative.list.invalidate(); setOpen(false); toast.success("Creative generated!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.creative.delete.useMutation({ onSuccess: () => { utils.creative.list.invalidate(); toast.success("Deleted"); } });

  const [open, setOpen] = useState(false);
  const [type, setType] = useState("ad_image");
  const [platform, setPlatform] = useState("");
  const [productId, setProductId] = useState("");
  const [style, setStyle] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  const analyzedProducts = useMemo(() => products?.filter(p => p.analysisStatus === "completed") ?? [], [products]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Creative Engine</h1>
          <p className="text-muted-foreground text-sm mt-1">Generate AI-powered ad images, social graphics, thumbnails, banners, and story visuals.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl"><Sparkles className="h-4 w-4 mr-2" />Generate Creative</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Generate Visual Creative</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Creative Type</Label>
                <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{creativeTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Platform (optional)</Label>
                <Select value={platform} onValueChange={setPlatform}><SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                  <SelectContent>{platforms.map(p => <SelectItem key={p} value={p.toLowerCase()}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {analyzedProducts.length > 0 && (
                <div><Label>Based on Product (optional)</Label>
                  <Select value={productId} onValueChange={setProductId}><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{analyzedProducts.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div><Label>Style (optional)</Label>
                <Textarea value={style} onChange={e => setStyle(e.target.value)} placeholder="e.g. minimalist, bold, neon, vintage, luxury, UGC-style..." rows={2} />
              </div>
              <div><Label>Custom Instructions (optional)</Label>
                <Textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Describe what you want in the image..." rows={3} />
              </div>
              <Button className="w-full rounded-xl" disabled={generateMut.isPending} onClick={() => generateMut.mutate({ type: type as any, platform: platform || undefined, productId: productId ? Number(productId) : undefined, style: style || undefined, customPrompt: customPrompt || undefined })}>
                {generateMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating (10-20s)...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <Card key={i} className="border-0 shadow-sm animate-pulse"><CardContent className="p-0 aspect-square" /></Card>)}</div>
      ) : !creatives?.length ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg">No creatives yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Generate your first AI-powered visual — ad images, social graphics, thumbnails, and more.</p>
            <Button className="mt-4 rounded-xl" onClick={() => setOpen(true)}><Sparkles className="h-4 w-4 mr-2" />Generate Your First Creative</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {creatives.map(creative => (
            <Card key={creative.id} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <CardContent className="p-0">
                {creative.imageUrl ? (
                  <div className="relative aspect-square bg-muted">
                    <img src={creative.imageUrl} alt={creative.type} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" className="rounded-lg" onClick={() => window.open(creative.imageUrl!, "_blank")}>
                          <Download className="h-3.5 w-3.5 mr-1" />Download
                        </Button>
                        <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => deleteMut.mutate({ id: creative.id })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {creative.status === "generating" ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <Image className="h-8 w-8 text-muted-foreground/40" />}
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{creativeTypes.find(t => t.value === creative.type)?.label?.split(" (")[0] || creative.type}</Badge>
                    {creative.platform && <Badge variant="outline" className="text-xs">{creative.platform}</Badge>}
                    {creative.dimensions && <span className="text-xs text-muted-foreground">{creative.dimensions}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
