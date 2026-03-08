import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Image, Loader2, Sparkles, Trash2, Download, Camera, Palette, Megaphone, ShoppingBag } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { WhatsNextCard } from "@/components/WhatsNextCard";
import { NEXT_STEPS_BY_PAGE } from "@/config/pathBlueprint";

const creativeTypes = [
  { value: "ad_image", label: "Ad Image (1200x628)" },
  { value: "social_graphic", label: "Social Graphic (1080x1080)" },
  { value: "thumbnail", label: "Video Thumbnail (1280x720)" },
  { value: "banner", label: "Web Banner (1920x480)" },
  { value: "story", label: "Story / Reel (1080x1920)" },
];
const platforms = ["Instagram", "TikTok", "YouTube", "Facebook", "LinkedIn", "Twitter/X", "Amazon", "Google"];
const adStyles = [
  { value: "minimal", label: "Minimal", desc: "Clean, white space, elegant" },
  { value: "bold", label: "Bold", desc: "High contrast, eye-catching" },
  { value: "luxury", label: "Luxury", desc: "Premium, gold accents, dark" },
  { value: "playful", label: "Playful", desc: "Bright, fun, youthful" },
  { value: "professional", label: "Professional", desc: "Corporate, trustworthy" },
  { value: "dark", label: "Dark Mode", desc: "Neon accents, sleek" },
  { value: "vibrant", label: "Vibrant", desc: "Colorful gradient, modern" },
];
const adTypes = [
  { value: "product-showcase", label: "Product Showcase" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "before-after", label: "Before & After" },
  { value: "testimonial", label: "Testimonial" },
  { value: "sale", label: "Sale / Discount" },
  { value: "announcement", label: "Announcement" },
];

export default function Creatives() {
  const utils = trpc.useUtils();
  const { data: creatives, isLoading } = trpc.creative.list.useQuery();
  const { data: products } = trpc.product.list.useQuery();
  const generateMut = trpc.creative.generate.useMutation({
    onSuccess: () => { utils.creative.list.invalidate(); setOpen(false); toast.success("Creative generated!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.creative.delete.useMutation({ onSuccess: () => { utils.creative.list.invalidate(); toast.success("Deleted"); } });

  // Real API creative engine
  const generateAdMut = trpc.creativeEngine.generateAd.useMutation({
    onSuccess: (data) => {
      toast.success("Ad creative generated!");
      setGeneratedAd(data);
    },
    onError: (e) => toast.error(e.message),
  });
  const photoshootMut = trpc.creativeEngine.productPhotoshoot.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.length} product photos generated!`);
      setPhotoshootResults(data);
    },
    onError: (e) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [type, setType] = useState("ad_image");
  const [platform, setPlatform] = useState("");
  const [productId, setProductId] = useState("");
  const [style, setStyle] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  // Ad Engine state
  const [adProductName, setAdProductName] = useState("");
  const [adProductDesc, setAdProductDesc] = useState("");
  const [adProductImage, setAdProductImage] = useState("");
  const [adPlatform, setAdPlatform] = useState("instagram");
  const [adStyle, setAdStyle] = useState("bold");
  const [adType, setAdType] = useState("product-showcase");
  const [adHeadline, setAdHeadline] = useState("");
  const [adCta, setAdCta] = useState("");
  const [generatedAd, setGeneratedAd] = useState<{ imageUrl?: string; headline?: string; cta?: string } | null>(null);

  // Photoshoot state
  const [shootProductName, setShootProductName] = useState("");
  const [shootProductImage, setShootProductImage] = useState("");
  const [shootCount, setShootCount] = useState(4);
  const [photoshootResults, setPhotoshootResults] = useState<Array<{ scene: string; imageUrl?: string | null }>>([]);

  const analyzedProducts = useMemo(() => products?.filter(p => p.analysisStatus === "completed") ?? [], [products]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Creative Engine</h1>
          <p className="text-muted-foreground text-sm mt-1">Generate AI-powered ad images, product photoshoots, social graphics, and more.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="generate" className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" />Quick Generate</TabsTrigger>
          <TabsTrigger value="ad-engine" className="flex items-center gap-1.5"><Megaphone className="h-3.5 w-3.5" />Ad Engine</TabsTrigger>
          <TabsTrigger value="photoshoot" className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" />Photoshoot</TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" />Gallery</TabsTrigger>
        </TabsList>

        {/* Quick Generate Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Quick Generate Creative</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Creative Type</Label>
                  <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{creativeTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}><SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                    <SelectContent>{platforms.map(p => <SelectItem key={p} value={p.toLowerCase()}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {analyzedProducts.length > 0 && (
                <div><Label>Based on Product</Label>
                  <Select value={productId} onValueChange={setProductId}><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{analyzedProducts.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div><Label>Style</Label>
                <Textarea value={style} onChange={e => setStyle(e.target.value)} placeholder="e.g. minimalist, bold, neon, vintage, luxury, UGC-style..." rows={2} />
              </div>
              <div><Label>Custom Instructions</Label>
                <Textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Describe what you want in the image..." rows={3} />
              </div>
              <Button className="w-full rounded-xl" disabled={generateMut.isPending} onClick={() => generateMut.mutate({ type: type as any, platform: platform || undefined, productId: productId ? Number(productId) : undefined, style: style || undefined, customPrompt: customPrompt || undefined })}>
                {generateMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating (10-20s)...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Creative</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ad Engine Tab - Real API */}
        <TabsContent value="ad-engine" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">AI Ad Creative Engine</h3>
                <Badge variant="secondary" className="text-xs">Real Image Generation</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Generate professional ad creatives with real AI image generation. Provide your product details and we'll create stunning visuals with copy.</p>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Product Name *</Label>
                  <Input value={adProductName} onChange={e => setAdProductName(e.target.value)} placeholder="e.g. AirPods Pro 2" />
                </div>
                <div><Label>Platform</Label>
                  <Select value={adPlatform} onValueChange={setAdPlatform}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{platforms.map(p => <SelectItem key={p} value={p.toLowerCase()}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Product Description</Label>
                <Textarea value={adProductDesc} onChange={e => setAdProductDesc(e.target.value)} placeholder="Describe your product features, benefits, target audience..." rows={2} />
              </div>
              <div><Label>Product Image URL (optional — for image editing)</Label>
                <Input value={adProductImage} onChange={e => setAdProductImage(e.target.value)} placeholder="https://example.com/product.jpg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Visual Style</Label>
                  <Select value={adStyle} onValueChange={setAdStyle}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{adStyles.map(s => <SelectItem key={s.value} value={s.value}><span className="font-medium">{s.label}</span> — <span className="text-muted-foreground">{s.desc}</span></SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Ad Type</Label>
                  <Select value={adType} onValueChange={setAdType}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{adTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Headline (optional — AI generates if blank)</Label>
                  <Input value={adHeadline} onChange={e => setAdHeadline(e.target.value)} placeholder="Leave blank for AI-generated headline" />
                </div>
                <div><Label>CTA (optional — AI generates if blank)</Label>
                  <Input value={adCta} onChange={e => setAdCta(e.target.value)} placeholder="e.g. Shop Now, Learn More" />
                </div>
              </div>
              <Button className="w-full rounded-xl" disabled={generateAdMut.isPending || !adProductName} onClick={() => generateAdMut.mutate({
                productName: adProductName,
                productDescription: adProductDesc || undefined,
                productImageUrl: adProductImage || undefined,
                platform: adPlatform as any,
                style: adStyle as any,
                adType: adType as any,
                headline: adHeadline || undefined,
                cta: adCta || undefined,
              })}>
                {generateAdMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating Ad Creative...</> : <><Megaphone className="h-4 w-4 mr-2" />Generate Ad Creative</>}
              </Button>

              {generatedAd && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-semibold">Generated Ad Creative</h4>
                  <div className="relative rounded-xl overflow-hidden border">
                    <img src={generatedAd.imageUrl} alt="Generated ad" className="w-full" />
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div><span className="text-muted-foreground">Headline:</span> <strong>{generatedAd.headline}</strong></div>
                    <div><span className="text-muted-foreground">CTA:</span> <strong>{generatedAd.cta}</strong></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(generatedAd.imageUrl, "_blank")}><Download className="h-3.5 w-3.5 mr-1" />Download</Button>
                    <Button size="sm" variant="outline" onClick={() => { setGeneratedAd(null); toast.info("Generate another variation!"); }}><Sparkles className="h-3.5 w-3.5 mr-1" />New Variation</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Photoshoot Tab */}
        <TabsContent value="photoshoot" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">AI Product Photoshoot</h3>
                <Badge variant="secondary" className="text-xs">Virtual Studio</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Generate professional product photography in multiple scenes — studio, lifestyle, outdoor, flat lay. No photographer needed.</p>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Product Name *</Label>
                  <Input value={shootProductName} onChange={e => setShootProductName(e.target.value)} placeholder="e.g. Wireless Earbuds Pro" />
                </div>
                <div><Label>Number of Photos</Label>
                  <Select value={String(shootCount)} onValueChange={v => setShootCount(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Photos</SelectItem>
                      <SelectItem value="3">3 Photos</SelectItem>
                      <SelectItem value="4">4 Photos</SelectItem>
                      <SelectItem value="6">6 Photos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Reference Image URL (optional)</Label>
                <Input value={shootProductImage} onChange={e => setShootProductImage(e.target.value)} placeholder="https://example.com/product.jpg" />
              </div>
              <Button className="w-full rounded-xl" disabled={photoshootMut.isPending || !shootProductName} onClick={() => photoshootMut.mutate({
                productName: shootProductName,
                productImageUrl: shootProductImage || undefined,
                count: shootCount,
              })}>
                {photoshootMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating {shootCount} Photos...</> : <><Camera className="h-4 w-4 mr-2" />Start Photoshoot</>}
              </Button>

              {photoshootResults.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-semibold">Photoshoot Results</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {photoshootResults.map((photo, i) => (
                      <div key={i} className="space-y-2">
                        {photo.imageUrl ? (
                          <div className="relative rounded-xl overflow-hidden border group">
                            <img src={photo.imageUrl} alt={photo.scene} className="w-full aspect-square object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Button size="sm" variant="secondary" onClick={() => window.open(photo.imageUrl!, "_blank")}><Download className="h-3.5 w-3.5 mr-1" />Download</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border bg-muted aspect-square flex items-center justify-center">
                            <p className="text-xs text-muted-foreground">Failed</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">{photo.scene}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <Card key={i} className="border-0 shadow-sm animate-pulse"><CardContent className="p-0 aspect-square" /></Card>)}</div>
          ) : !creatives?.length ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Image className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="font-semibold text-lg">No creatives yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Generate your first AI-powered visual — ad images, product photoshoots, social graphics, and more.</p>
                <Button className="mt-4 rounded-xl" onClick={() => setActiveTab("generate")}><Sparkles className="h-4 w-4 mr-2" />Generate Your First Creative</Button>
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
        </TabsContent>
      </Tabs>

      <WhatsNextCard steps={NEXT_STEPS_BY_PAGE["/creatives"] ?? []} maxSteps={2} />
    </div>
  );
}
