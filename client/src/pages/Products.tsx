import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, Loader2, Sparkles, Trash2, ExternalLink, Tag, Target, Lightbulb, MessageSquare, Store, ShoppingCart, Download, RefreshCw, Image as ImageIcon, PenTool, Video } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { WhatsNextCard } from "@/components/WhatsNextCard";
import { NEXT_STEPS_BY_PAGE } from "@/config/pathBlueprint";

export default function Products() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.product.list.useQuery();
  const createMut = trpc.product.create.useMutation({ onSuccess: () => { utils.product.list.invalidate(); setOpen(false); resetForm(); toast.success("Product added"); } });
  const analyzeMut = trpc.product.analyze.useMutation({
    onSuccess: () => { utils.product.list.invalidate(); toast.success("Analysis complete"); },
    onError: (e) => { utils.product.list.invalidate(); toast.error(e.message || "Analysis failed"); },
  });
  const deleteMut = trpc.product.delete.useMutation({ onSuccess: () => { utils.product.list.invalidate(); toast.success("Product deleted"); } });

  // E-commerce sync mutations
  const syncProductsMut = trpc.ecommerce.syncProducts.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Synced ${data.products?.length || 0} products!`);
      utils.product.list.invalidate();
      setSyncOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Real image generation for product photos
  const generatePhotoMut = trpc.creativeEngine.productPhotoshoot.useMutation({
    onSuccess: (data: any) => {
      toast.success("Product photos generated!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [shopifyDomain, setShopifyDomain] = useState("");
  const [wooUrl, setWooUrl] = useState("");
  const [tab, setTab] = useState("products");

  const resetForm = () => { setName(""); setDescription(""); setUrl(""); setCategory(""); };

  const stats = useMemo(() => {
    if (!products) return { total: 0, analyzed: 0, pending: 0 };
    return {
      total: products.length,
      analyzed: products.filter(p => p.analysisStatus === "completed").length,
      pending: products.filter(p => p.analysisStatus !== "completed").length,
    };
  }, [products]);

  return (
    <div className="space-y-6 max-w-6xl animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Product Hub</h1>
          <p className="page-subtitle">Import from Shopify/WooCommerce, analyze with AI, and generate marketing assets.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setSyncOpen(true)}>
            <Store className="h-4 w-4 mr-2" />Import from Store
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl"><Plus className="h-4 w-4 mr-2" />Add Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add a Product</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Product Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Smart Fitness Tracker" /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the product, its features, and what makes it unique..." rows={4} /></div>
                <div><Label>Product URL</Label><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." /></div>
                <div><Label>Category</Label><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Health & Fitness" /></div>
                <Button className="w-full rounded-xl" disabled={!name || createMut.isPending} onClick={() => createMut.mutate({ name, description, url, category })}>
                  {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Product
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass rounded-2xl"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-zinc-500">Total Products</p>
        </CardContent></Card>
        <Card className="glass rounded-2xl"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.analyzed}</p>
          <p className="text-xs text-zinc-500">AI Analyzed</p>
        </CardContent></Card>
        <Card className="glass rounded-2xl"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-xs text-zinc-500">Pending Analysis</p>
        </CardContent></Card>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3].map(i => <Card key={i} className="border-0 shadow-sm animate-pulse"><CardContent className="p-6 h-40" /></Card>)}</div>
      ) : !products?.length ? (
        <Card className="glass rounded-2xl">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-zinc-500/40 mb-4" />
            <h3 className="font-semibold text-lg">No products yet</h3>
            <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto">Add products manually or import from Shopify/WooCommerce. AI will analyze each for marketing insights.</p>
            <div className="flex gap-3 justify-center mt-4">
              <Button className="rounded-xl" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Manually</Button>
              <Button variant="outline" className="rounded-xl" onClick={() => setSyncOpen(true)}><Store className="h-4 w-4 mr-2" />Import from Store</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(product => {
            const isExpanded = expandedId === product.id;
            const analysis = product.rawAnalysis as any;
            return (
              <Card key={product.id} className="glass glass-hover rounded-2xl transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{product.name}</CardTitle>
                        {product.category && <Badge variant="secondary" className="mt-1 text-xs">{product.category}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {product.analysisStatus === "completed" ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-0">Analyzed</Badge>
                      ) : product.analysisStatus === "analyzing" ? (
                        <Badge className="bg-amber-50 text-amber-700 border-0"><Loader2 className="h-3 w-3 animate-spin mr-1" />Analyzing</Badge>
                      ) : product.analysisStatus === "failed" ? (
                        <Badge variant="destructive" className="border-0">Failed</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {product.description && <p className="text-sm text-zinc-500 line-clamp-2">{product.description}</p>}
                  
                  <div className="flex flex-wrap gap-2">
                    {product.analysisStatus !== "completed" && product.analysisStatus !== "analyzing" && (
                      <Button size="sm" variant="default" className="rounded-lg" onClick={() => analyzeMut.mutate({ id: product.id })} disabled={analyzeMut.isPending}>
                        {analyzeMut.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                        {product.analysisStatus === "failed" ? "Retry analysis" : "Analyze with AI"}
                      </Button>
                    )}
                    {product.analysisStatus === "completed" && (
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setExpandedId(isExpanded ? null : product.id)}>
                        {isExpanded ? "Hide" : "View"} Analysis
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setLocation(`/content?productId=${product.id}`)}>
                      <PenTool className="h-3 w-3 mr-1" />Generate content
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setLocation(`/video-ads?productId=${product.id}`)}>
                      <Video className="h-3 w-3 mr-1" />Create video ad
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setLocation(`/creatives?productId=${product.id}`)}>
                      <ImageIcon className="h-3 w-3 mr-1" />Create visuals & thumbnails
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg" disabled={generatePhotoMut.isPending}
                      onClick={() => generatePhotoMut.mutate({ productName: product.name, scenes: ["white background studio", "lifestyle setting"], count: 2 })}>
                      {generatePhotoMut.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ImageIcon className="h-3 w-3 mr-1" />}
                      AI Photo
                    </Button>
                    {product.url && (
                      <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => window.open(product.url!, "_blank")}>
                        <ExternalLink className="h-3 w-3 mr-1" />URL
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="rounded-lg text-destructive hover:text-destructive" onClick={() => deleteMut.mutate({ id: product.id })}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {isExpanded && analysis && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      {analysis.positioning && (
                        <div><div className="flex items-center gap-2 text-sm font-medium mb-1"><Target className="h-4 w-4 text-primary" />Positioning</div><p className="text-sm text-zinc-500">{analysis.positioning}</p></div>
                      )}
                      {analysis.features?.length > 0 && (
                        <div><div className="flex items-center gap-2 text-sm font-medium mb-1"><Lightbulb className="h-4 w-4 text-amber-500" />Key Features</div><div className="flex flex-wrap gap-1">{analysis.features.map((f: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>)}</div></div>
                      )}
                      {analysis.targetAudience?.length > 0 && (
                        <div><div className="flex items-center gap-2 text-sm font-medium mb-1"><Target className="h-4 w-4 text-violet-500" />Target Audience</div><div className="flex flex-wrap gap-1">{analysis.targetAudience.map((a: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{a}</Badge>)}</div></div>
                      )}
                      {analysis.keywords?.length > 0 && (
                        <div><div className="flex items-center gap-2 text-sm font-medium mb-1"><Tag className="h-4 w-4 text-emerald-500" />SEO Keywords</div><div className="flex flex-wrap gap-1">{analysis.keywords.map((k: string, i: number) => <Badge key={i} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">{k}</Badge>)}</div></div>
                      )}
                      {analysis.tone && (
                        <div><div className="flex items-center gap-2 text-sm font-medium mb-1"><MessageSquare className="h-4 w-4 text-blue-500" />Recommended Tone</div><p className="text-sm text-zinc-500">{analysis.tone}</p></div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* E-Commerce Sync Dialog */}
      <Dialog open={syncOpen} onOpenChange={setSyncOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Import Products from Store</DialogTitle></DialogHeader>
          <Tabs defaultValue="shopify" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shopify"><ShoppingCart className="h-4 w-4 mr-2" />Shopify</TabsTrigger>
              <TabsTrigger value="woocommerce"><Store className="h-4 w-4 mr-2" />WooCommerce</TabsTrigger>
            </TabsList>
            <TabsContent value="shopify" className="space-y-4 mt-4">
              <p className="text-sm text-zinc-500">Connect your Shopify store to automatically import all products. Requires Shopify API credentials in Settings &gt; Secrets.</p>
              <div>
                <Label>Store Domain</Label>
                <Input value={shopifyDomain} onChange={e => setShopifyDomain(e.target.value)} placeholder="your-store.myshopify.com" />
              </div>
              <Button className="w-full" disabled={!shopifyDomain || syncProductsMut.isPending}
                onClick={() => syncProductsMut.mutate({ platform: "shopify", storeUrl: `https://${shopifyDomain}`, accessToken: "from-settings" })}>
                {syncProductsMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Syncing...</> : <><Download className="h-4 w-4 mr-2" />Import from Shopify</>}
              </Button>
              <div className="text-xs text-zinc-500 space-y-1">
                <p><strong>Required secrets:</strong></p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>SHOPIFY_ACCESS_TOKEN — Admin API access token</li>
                  <li>SHOPIFY_STORE_DOMAIN — Your .myshopify.com domain</li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="woocommerce" className="space-y-4 mt-4">
              <p className="text-sm text-zinc-500">Connect your WooCommerce store to import products. Requires WooCommerce REST API credentials in Settings &gt; Secrets.</p>
              <div>
                <Label>Store URL</Label>
                <Input value={wooUrl} onChange={e => setWooUrl(e.target.value)} placeholder="https://your-store.com" />
              </div>
              <Button className="w-full" disabled={!wooUrl || syncProductsMut.isPending}
                onClick={() => syncProductsMut.mutate({ platform: "woocommerce", storeUrl: wooUrl, accessToken: "from-settings" })}>
                {syncProductsMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Syncing...</> : <><Download className="h-4 w-4 mr-2" />Import from WooCommerce</>}
              </Button>
              <div className="text-xs text-zinc-500 space-y-1">
                <p><strong>Required secrets:</strong></p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>WOOCOMMERCE_URL — Your store URL</li>
                  <li>WOOCOMMERCE_KEY — Consumer key</li>
                  <li>WOOCOMMERCE_SECRET — Consumer secret</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <WhatsNextCard steps={NEXT_STEPS_BY_PAGE["/products"] ?? []} maxSteps={3} />
    </div>
  );
}
