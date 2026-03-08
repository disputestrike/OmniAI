import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Megaphone, Plus, Loader2, Sparkles, Trash2, Play, Pause, CheckCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { WhatsNextCard } from "@/components/WhatsNextCard";
import { NEXT_STEPS_BY_PAGE } from "@/config/pathBlueprint";

const objectives = [
  { value: "awareness", label: "Brand Awareness" },
  { value: "traffic", label: "Website Traffic" },
  { value: "engagement", label: "Engagement" },
  { value: "leads", label: "Lead Generation" },
  { value: "sales", label: "Sales / Conversions" },
  { value: "app_installs", label: "App Installs" },
];

const allPlatforms = [
  "Instagram", "TikTok", "YouTube", "Facebook", "LinkedIn", "Twitter/X",
  "Google Ads", "Amazon", "eBay", "WhatsApp", "Email", "SMS",
  "Pinterest", "Snapchat", "Reddit", "Threads",
  "Podcast", "TV", "Radio", "Print", "Blog/SEO",
];

export default function Campaigns() {
  const utils = trpc.useUtils();
  const { data: campaigns, isLoading } = trpc.campaign.list.useQuery();
  const { data: products } = trpc.product.list.useQuery();
  const createMut = trpc.campaign.create.useMutation({ onSuccess: () => { utils.campaign.list.invalidate(); setOpen(false); toast.success("Campaign created"); } });
  const updateMut = trpc.campaign.update.useMutation({ onSuccess: () => { utils.campaign.list.invalidate(); toast.success("Updated"); } });
  const deleteMut = trpc.campaign.delete.useMutation({ onSuccess: () => { utils.campaign.list.invalidate(); toast.success("Deleted"); } });
  const strategyMut = trpc.campaign.generateStrategy.useMutation({ onError: (e) => toast.error(e.message) });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("awareness");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [productId, setProductId] = useState("");
  const [budget, setBudget] = useState("");
  const [strategyId, setStrategyId] = useState<number | null>(null);

  const analyzedProducts = useMemo(() => products?.filter(p => p.analysisStatus === "completed") ?? [], [products]);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    active: "bg-emerald-50 text-emerald-700",
    paused: "bg-amber-50 text-amber-700",
    completed: "bg-blue-50 text-blue-700",
    archived: "bg-gray-50 text-gray-500",
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">Build and manage multi-platform marketing campaigns across all channels — social, search, email, SMS, and more.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl"><Plus className="h-4 w-4 mr-2" />New Campaign</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Campaign Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Launch 2026" /></div>
              <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Campaign goals and notes..." rows={2} /></div>
              <div><Label>Objective</Label>
                <Select value={objective} onValueChange={setObjective}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{objectives.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Platforms</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {allPlatforms.map(p => (
                    <Badge key={p} variant={selectedPlatforms.includes(p) ? "default" : "outline"} className="cursor-pointer transition-all" onClick={() => togglePlatform(p)}>
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
              {analyzedProducts.length > 0 && (
                <div><Label>Product (optional)</Label>
                  <Select value={productId} onValueChange={setProductId}><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{analyzedProducts.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div><Label>Budget (optional)</Label><Input value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. $5,000" /></div>
              <Button className="w-full rounded-xl" disabled={!name || selectedPlatforms.length === 0 || createMut.isPending} onClick={() => createMut.mutate({ name, description, objective: objective as any, platforms: selectedPlatforms, productId: productId ? Number(productId) : undefined, budget: budget || undefined })}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="border-0 shadow-sm animate-pulse"><CardContent className="p-6 h-28" /></Card>)}</div>
      ) : !campaigns?.length ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg">No campaigns yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Create your first multi-platform campaign and let AI help you with strategy, content, and scheduling.</p>
            <Button className="mt-4 rounded-xl" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Your First Campaign</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map(campaign => {
            const platforms = campaign.platforms as string[];
            return (
              <Card key={campaign.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                        <Megaphone className="h-5 w-5 text-violet-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{campaign.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={`text-xs border-0 ${statusColors[campaign.status] || ""}`}>{campaign.status}</Badge>
                          <Badge variant="outline" className="text-xs">{objectives.find(o => o.value === campaign.objective)?.label}</Badge>
                          {campaign.budget && <span className="text-xs text-muted-foreground">{campaign.budget}</span>}
                        </div>
                        {platforms?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {platforms.map(p => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {campaign.status === "draft" && (
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => updateMut.mutate({ id: campaign.id, status: "active" })}>
                          <Play className="h-3.5 w-3.5 mr-1" />Launch
                        </Button>
                      )}
                      {campaign.status === "active" && (
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => updateMut.mutate({ id: campaign.id, status: "paused" })}>
                          <Pause className="h-3.5 w-3.5 mr-1" />Pause
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => { setStrategyId(strategyId === campaign.id ? null : campaign.id); if (strategyId !== campaign.id) strategyMut.mutate({ campaignId: campaign.id }); }}>
                        <Sparkles className="h-3.5 w-3.5 mr-1" />Strategy
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-lg text-destructive hover:text-destructive" onClick={() => deleteMut.mutate({ id: campaign.id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {strategyId === campaign.id && (
                    <div className="mt-4 border-t pt-4">
                      {strategyMut.isPending ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Generating AI strategy...</div>
                      ) : strategyMut.data?.strategy ? (
                        <div className="prose prose-sm max-w-none text-foreground"><Streamdown>{strategyMut.data.strategy}</Streamdown></div>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <WhatsNextCard steps={NEXT_STEPS_BY_PAGE["/campaigns"] ?? []} maxSteps={3} />
    </div>
  );
}
