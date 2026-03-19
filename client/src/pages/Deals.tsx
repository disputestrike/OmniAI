import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Handshake, Plus, TrendingUp, Trash2, DollarSign, Loader2 } from "lucide-react";

const STAGES = [
  { value: "prospecting", label: "Prospecting", color: "bg-blue-100 text-blue-800" },
  { value: "qualification", label: "Qualification", color: "bg-purple-100 text-purple-800" },
  { value: "proposal", label: "Proposal", color: "bg-amber-100 text-amber-800" },
  { value: "negotiation", label: "Negotiation", color: "bg-orange-100 text-orange-800" },
  { value: "closed_won", label: "Closed Won", color: "bg-green-100 text-green-800" },
  { value: "closed_lost", label: "Closed Lost", color: "bg-red-100 text-red-800" },
];

export default function Deals() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: deals, isLoading } = trpc.deal.list.useQuery(undefined, { enabled: !!user });
  const { data: pipeline } = trpc.deal.pipeline.useQuery(undefined, { enabled: !!user });
  const createDeal = trpc.deal.create.useMutation({ onSuccess: () => { utils.deal.list.invalidate(); utils.deal.pipeline.invalidate(); toast.success("Deal created"); } });
  const updateDeal = trpc.deal.update.useMutation({ onSuccess: () => { utils.deal.list.invalidate(); utils.deal.pipeline.invalidate(); toast.success("Deal updated"); } });
  const deleteDeal = trpc.deal.delete.useMutation({ onSuccess: () => { utils.deal.list.invalidate(); utils.deal.pipeline.invalidate(); toast.success("Deal deleted"); } });
  const forecast = trpc.deal.aiForecasting.useMutation({ onSuccess: () => toast.success("Forecast generated") });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState("prospecting");
  const [probability, setProbability] = useState("20");
  const [notes, setNotes] = useState("");

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Title required"); return; }
    createDeal.mutate({ title, value: value || undefined, stage: stage as any, probability: parseInt(probability) || 0, notes: notes || undefined });
    setTitle(""); setValue(""); setStage("prospecting"); setProbability("20"); setNotes(""); setOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Handshake className="h-6 w-6 text-primary" /> CRM Deals</h1>
          <p className="text-zinc-500">Track deals through your sales pipeline with AI forecasting</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => forecast.mutate()} disabled={forecast.isPending}>
            {forecast.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
            AI Forecast
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Deal</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Deal</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Deal Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enterprise license deal..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Value ($)</Label><Input value={value} onChange={e => setValue(e.target.value)} placeholder="10000" type="number" /></div>
                  <div><Label>Probability (%)</Label><Input value={probability} onChange={e => setProbability(e.target.value)} type="number" min="0" max="100" /></div>
                </div>
                <div><Label>Stage</Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Key details..." rows={3} /></div>
                <Button className="w-full" onClick={handleCreate} disabled={createDeal.isPending}>{createDeal.isPending ? "Creating..." : "Create Deal"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pipeline Summary */}
      {pipeline && pipeline.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map(s => {
            const p = pipeline.find((pp: any) => pp.stage === s.value);
            return (
              <Card key={s.value} className="glass rounded-2xl">
                <CardContent className="p-4 text-center">
                  <Badge className={`${s.color} mb-2`}>{s.label}</Badge>
                  <p className="text-2xl font-bold">{p?.count ?? 0}</p>
                  <p className="text-xs text-zinc-500">${p?.totalValue ?? "0"}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* AI Forecast Results */}
      {forecast.data && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> AI Sales Forecast</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div><p className="text-xs text-zinc-500">30-Day Forecast</p><p className="text-lg font-bold">{forecast.data.forecast30d}</p></div>
              <div><p className="text-xs text-zinc-500">90-Day Forecast</p><p className="text-lg font-bold">{forecast.data.forecast90d}</p></div>
              <div><p className="text-xs text-zinc-500">Win Rate</p><p className="text-lg font-bold">{forecast.data.winRate}</p></div>
              <div><p className="text-xs text-zinc-500">Avg Deal Size</p><p className="text-lg font-bold">{forecast.data.avgDealSize}</p></div>
            </div>
            {forecast.data.recommendations?.length > 0 && (
              <div><p className="text-sm font-medium mb-1">Recommendations:</p>
                <ul className="text-sm text-zinc-500 space-y-1">{forecast.data.recommendations.map((r: string, i: number) => <li key={i}>• {r}</li>)}</ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deal List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
      ) : !deals?.length ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center">
          <Handshake className="h-12 w-12 mx-auto text-zinc-500/30 mb-4" />
          <p className="text-zinc-500">No deals yet. Create your first deal to start tracking your pipeline.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {deals.map((deal: any) => {
            const stageInfo = STAGES.find(s => s.value === deal.stage);
            return (
              <Card key={deal.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{deal.title}</h3>
                        <Badge className={stageInfo?.color}>{stageInfo?.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500">
                        {deal.value && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{deal.value}</span>}
                        <span>{deal.probability}% probability</span>
                        <span>{new Date(deal.createdAt).toLocaleDateString()}</span>
                      </div>
                      {deal.notes && <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{deal.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={deal.stage} onValueChange={(v) => updateDeal.mutate({ id: deal.id, stage: v as any })}>
                        <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDeal.mutate({ id: deal.id })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
