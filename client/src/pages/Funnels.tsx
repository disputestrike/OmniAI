import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, GitBranch, ExternalLink, GripVertical, ListOrdered } from "lucide-react";

const stepTypes = [
  { value: "landing", label: "Landing page" },
  { value: "form", label: "Form" },
  { value: "payment", label: "Payment" },
  { value: "thank_you", label: "Thank you" },
] as const;

export default function Funnels() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [showAddStep, setShowAddStep] = useState(false);
  const [stepTitle, setStepTitle] = useState("");
  const [stepType, setStepType] = useState<"landing" | "form" | "payment" | "thank_you">("landing");

  const utils = trpc.useUtils();
  const { data: funnels, isLoading } = trpc.funnel.list.useQuery();
  const { data: funnelDetail } = trpc.funnel.get.useQuery({ id: selectedId! }, { enabled: !!selectedId });
  const createMut = trpc.funnel.create.useMutation({
    onSuccess: (data) => {
      toast.success("Funnel created");
      setShowCreate(false);
      setName("");
      setSlug("");
      utils.funnel.list.invalidate();
      setSelectedId(data.id);
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.funnel.update.useMutation({
    onSuccess: () => {
      toast.success("Funnel updated");
      utils.funnel.list.invalidate();
      if (selectedId) utils.funnel.get.invalidate({ id: selectedId });
    },
  });
  const deleteMut = trpc.funnel.delete.useMutation({
    onSuccess: () => {
      toast.success("Funnel deleted");
      setSelectedId(null);
      utils.funnel.list.invalidate();
    },
  });
  const addStepMut = trpc.funnel.addStep.useMutation({
    onSuccess: () => {
      toast.success("Step added");
      setShowAddStep(false);
      setStepTitle("");
      setStepType("landing");
      if (selectedId) utils.funnel.get.invalidate({ id: selectedId });
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteStepMut = trpc.funnel.deleteStep.useMutation({
    onSuccess: () => {
      toast.success("Step removed");
      if (selectedId) utils.funnel.get.invalidate({ id: selectedId });
    },
  });

  const handleCreate = () => {
    if (!name.trim() || !slug.trim()) return toast.error("Name and slug required");
    const s = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "funnel";
    createMut.mutate({ name: name.trim(), slug: s });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funnels</h1>
          <p className="text-muted-foreground text-sm mt-1">Build multi-step lead and sales funnels. Add landing pages, forms, payment, and thank-you steps.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="rounded-xl"><Plus className="h-4 w-4 mr-2" />New Funnel</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Funnel</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lead Magnet Funnel" /></div>
              <div><Label>URL slug *</Label><Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. lead-magnet" /></div>
              <Button className="w-full" disabled={!name.trim() || !slug.trim() || createMut.isPending} onClick={handleCreate}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Your Funnels</h3>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Card key={i} className="border-0 shadow-sm animate-pulse"><CardContent className="p-3 h-14" /></Card>)}</div>
          ) : !funnels?.length ? (
            <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground text-sm">No funnels yet. Create one to get started.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {funnels.map((f: { id: number; name: string; slug: string; status: string }) => (
                <Card
                  key={f.id}
                  className={`cursor-pointer border transition-all ${selectedId === f.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedId(f.id)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium truncate">{f.name}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">{f.status}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={e => { e.stopPropagation(); if (confirm("Delete this funnel?")) deleteMut.mutate({ id: f.id }); }}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          {selectedId && funnelDetail ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Steps</CardTitle>
                  <Dialog open={showAddStep} onOpenChange={setShowAddStep}>
                    <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Add step</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add step</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div><Label>Step type</Label>
                          <Select value={stepType} onValueChange={(v: "landing" | "form" | "payment" | "thank_you") => setStepType(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{stepTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div><Label>Title *</Label><Input value={stepTitle} onChange={e => setStepTitle(e.target.value)} placeholder="e.g. Enter your email" /></div>
                        <Button className="w-full" disabled={!stepTitle.trim() || addStepMut.isPending} onClick={() => addStepMut.mutate({ funnelId: selectedId, stepType, title: stepTitle.trim() })}>
                          {addStepMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Add
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {(funnelDetail.steps as { id: number; title: string; stepType: string; orderIndex: number }[]).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No steps yet. Add a step to define your funnel flow.</p>
                ) : (
                  <div className="space-y-2">
                    {(funnelDetail.steps as { id: number; title: string; stepType: string; orderIndex: number }[]).sort((a, b) => a.orderIndex - b.orderIndex).map((step, idx) => (
                      <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium">{idx + 1}. {step.title}</span>
                        <Badge variant="outline" className="text-xs">{step.stepType}</Badge>
                        <Button variant="ghost" size="icon" className="ml-auto shrink-0" onClick={() => { if (confirm("Remove this step?")) deleteStepMut.mutate({ id: step.id }); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={funnelDetail.status} onValueChange={(v: "draft" | "active" | "archived") => updateMut.mutate({ id: selectedId, status: v })}>
                    <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center text-muted-foreground">Select a funnel or create one to edit steps.</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
