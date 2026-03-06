import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FlaskConical, Plus, Loader2, Sparkles, Trophy, BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function AbTesting() {
  const utils = trpc.useUtils();
  const { data: tests, isLoading } = trpc.abTest.list.useQuery();
  const { data: products } = trpc.product.list.useQuery();
  const createMut = trpc.abTest.create.useMutation({ onSuccess: () => { utils.abTest.list.invalidate(); setOpen(false); setName(""); toast.success("Test created"); } });
  const genVariantsMut = trpc.abTest.generateVariations.useMutation({ onSuccess: () => { utils.abTest.list.invalidate(); toast.success("Variations generated!"); } });
  const updateStatusMut = trpc.abTest.updateStatus.useMutation({ onSuccess: () => { utils.abTest.list.invalidate(); toast.success("Updated"); } });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [genTestId, setGenTestId] = useState<number | null>(null);
  const [genType, setGenType] = useState("ad_copy_short");
  const [genProductId, setGenProductId] = useState("");
  const [genCount, setGenCount] = useState("3");

  const analyzedProducts = useMemo(() => products?.filter(p => p.analysisStatus === "completed") ?? [], [products]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">A/B Testing</h1>
          <p className="text-muted-foreground text-sm mt-1">Generate multiple creative variations, compare performance, and identify winners with AI.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4 mr-2" />New Test</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create A/B Test</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Test Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Homepage CTA Test" /></div>
              <Button className="w-full rounded-xl" disabled={!name || createMut.isPending} onClick={() => createMut.mutate({ name })}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}Create Test
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <Card key={i} className="border-0 shadow-sm animate-pulse"><CardContent className="p-6 h-32" /></Card>)}</div>
      ) : !tests?.length ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg">No A/B tests yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Create a test, then generate AI variations to compare different angles — emotional, logical, urgency, social proof, and more.</p>
            <Button className="mt-4 rounded-xl" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Your First Test</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map(test => {
            const isExpanded = expandedId === test.id;
            const statusColors: Record<string, string> = { draft: "bg-gray-100 text-gray-700", running: "bg-emerald-50 text-emerald-700", completed: "bg-blue-50 text-blue-700", cancelled: "bg-red-50 text-red-700" };
            return (
              <Card key={test.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                        <FlaskConical className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{test.name}</p>
                        <Badge className={`text-xs border-0 mt-1 ${statusColors[test.status] || ""}`}>{test.status}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setExpandedId(isExpanded ? null : test.id)}>
                        {isExpanded ? "Hide" : "Details"}
                      </Button>
                      {test.status === "draft" && (
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => updateStatusMut.mutate({ id: test.id, status: "running" })}>
                          Start Test
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t pt-4 space-y-4">
                      {test.status === "draft" && (
                        <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                          <p className="text-sm font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Generate AI Variations</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Content Type</Label>
                              <Select value={genType} onValueChange={setGenType}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ad_copy_short">Short Ad Copy</SelectItem>
                                  <SelectItem value="ad_copy_long">Long Ad Copy</SelectItem>
                                  <SelectItem value="social_caption">Social Caption</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {analyzedProducts.length > 0 && (
                              <div>
                                <Label className="text-xs">Product</Label>
                                <Select value={genProductId} onValueChange={setGenProductId}>
                                  <SelectTrigger className="h-9"><SelectValue placeholder="Optional" /></SelectTrigger>
                                  <SelectContent>{analyzedProducts.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                            )}
                            <div>
                              <Label className="text-xs">Variations</Label>
                              <Select value={genCount} onValueChange={setGenCount}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="2">2</SelectItem>
                                  <SelectItem value="3">3</SelectItem>
                                  <SelectItem value="4">4</SelectItem>
                                  <SelectItem value="5">5</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button size="sm" className="rounded-lg" disabled={genVariantsMut.isPending} onClick={() => genVariantsMut.mutate({ testId: test.id, type: genType as any, productId: genProductId ? Number(genProductId) : undefined, count: Number(genCount) })}>
                            {genVariantsMut.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Generating...</> : <><Sparkles className="h-3.5 w-3.5 mr-1" />Generate Variations</>}
                          </Button>
                        </div>
                      )}
                      <VariantsList testId={test.id} />
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

function VariantsList({ testId }: { testId: number }) {
  const { data } = trpc.abTest.get.useQuery({ id: testId });
  const variants = (data as any)?.variants ?? [];
  if (!variants.length) return <p className="text-sm text-muted-foreground">No variants yet. Generate some above.</p>;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Variants</p>
      {variants.map((v: any) => (
        <div key={v.id} className="flex items-center gap-3 bg-muted/20 p-3 rounded-lg">
          <Badge variant="outline" className="shrink-0">{v.name}</Badge>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Impressions: {v.impressions ?? 0}</span>
              <span>Clicks: {v.clicks ?? 0}</span>
              <span>CTR: {v.ctr ?? "0"}%</span>
              <span>Conv: {v.conversions ?? 0}</span>
            </div>
          </div>
          {v.isWinner && <Trophy className="h-4 w-4 text-amber-500" />}
        </div>
      ))}
    </div>
  );
}
