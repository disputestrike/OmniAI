import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Plus, Loader2, Sparkles, Trash2, ExternalLink, Tag, Target, Lightbulb, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Products() {
  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.product.list.useQuery();
  const createMut = trpc.product.create.useMutation({ onSuccess: () => { utils.product.list.invalidate(); setOpen(false); resetForm(); toast.success("Product added"); } });
  const analyzeMut = trpc.product.analyze.useMutation({ onSuccess: () => { utils.product.list.invalidate(); toast.success("Analysis complete"); } });
  const deleteMut = trpc.product.delete.useMutation({ onSuccess: () => { utils.product.list.invalidate(); toast.success("Product deleted"); } });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const resetForm = () => { setName(""); setDescription(""); setUrl(""); setCategory(""); };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Analyzer</h1>
          <p className="text-muted-foreground text-sm mt-1">Add products and let AI extract marketing intelligence — features, audience, positioning, and keywords.</p>
        </div>
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3].map(i => <Card key={i} className="border-0 shadow-sm animate-pulse"><CardContent className="p-6 h-40" /></Card>)}</div>
      ) : !products?.length ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg">No products yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Add your first product and let AI analyze it for marketing insights — features, target audience, positioning, and SEO keywords.</p>
            <Button className="mt-4 rounded-xl" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Your First Product</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(product => {
            const isExpanded = expandedId === product.id;
            const analysis = product.rawAnalysis as any;
            return (
              <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-all">
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
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {product.description && <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>}
                  
                  <div className="flex flex-wrap gap-2">
                    {product.analysisStatus !== "completed" && product.analysisStatus !== "analyzing" && (
                      <Button size="sm" variant="default" className="rounded-lg" onClick={() => analyzeMut.mutate({ id: product.id })} disabled={analyzeMut.isPending}>
                        {analyzeMut.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                        Analyze with AI
                      </Button>
                    )}
                    {product.analysisStatus === "completed" && (
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setExpandedId(isExpanded ? null : product.id)}>
                        {isExpanded ? "Hide" : "View"} Analysis
                      </Button>
                    )}
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
                        <div><div className="flex items-center gap-2 text-sm font-medium mb-1"><Target className="h-4 w-4 text-primary" />Positioning</div><p className="text-sm text-muted-foreground">{analysis.positioning}</p></div>
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
                        <div><div className="flex items-center gap-2 text-sm font-medium mb-1"><MessageSquare className="h-4 w-4 text-blue-500" />Recommended Tone</div><p className="text-sm text-muted-foreground">{analysis.tone}</p></div>
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
