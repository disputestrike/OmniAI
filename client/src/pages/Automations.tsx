import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Play, Pause, Zap, GitBranch, Clock, ArrowRight, CheckCircle2, XCircle } from "lucide-react";

export default function Automations() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<string>("manual");
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);

  const { data: workflows, refetch } = trpc.automation.list.useQuery();
  const { data: workflowDetail, refetch: refetchDetail } = trpc.automation.get.useQuery(
    { id: selectedWorkflow! }, { enabled: !!selectedWorkflow }
  );
  const { data: templates } = trpc.automation.getTemplates.useQuery();

  const createWorkflow = trpc.automation.create.useMutation({
    onSuccess: (data) => { toast.success("Workflow created"); setShowCreate(false); setName(""); setDescription(""); refetch(); setSelectedWorkflow(data.id); },
    onError: (e) => toast.error(e.message),
  });
  const updateWorkflow = trpc.automation.update.useMutation({
    onSuccess: () => { toast.success("Workflow updated"); refetchDetail(); refetch(); },
  });
  const deleteWorkflow = trpc.automation.delete.useMutation({
    onSuccess: () => { toast.success("Workflow deleted"); setSelectedWorkflow(null); refetch(); },
  });
  const executeWorkflow = trpc.automation.execute.useMutation({
    onSuccess: (data) => {
      const successes = data.results.filter(r => r.status === "success").length;
      toast.success(`Workflow executed: ${successes}/${data.results.length} actions succeeded`);
      refetchDetail();
    },
    onError: (e) => toast.error(e.message),
  });

  const actions = (workflowDetail?.actions as any[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automation Workflows</h1>
          <p className="text-muted-foreground">Automate repetitive marketing tasks with triggers and actions</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> New Workflow</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Workflow</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Workflow name" />
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" />
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger><SelectValue placeholder="Trigger type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="form_submission">Form Submission</SelectItem>
                  <SelectItem value="lead_status_change">Lead Status Change</SelectItem>
                  <SelectItem value="campaign_event">Campaign Event</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => createWorkflow.mutate({ name, description, triggerType: triggerType as any })} disabled={!name || createWorkflow.isPending} className="w-full">
                {createWorkflow.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Workflow"}
              </Button>
            </div>

            {templates && templates.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <p className="text-sm font-medium mb-3">Or start from a template:</p>
                <div className="space-y-2">
                  {templates.map(t => (
                    <Card key={t.id} className="cursor-pointer hover:shadow-sm transition-all" onClick={() => {
                      createWorkflow.mutate({ name: t.name, description: t.description, triggerType: t.triggerType as any, actions: t.actions });
                    }}>
                      <CardContent className="p-3">
                        <span className="font-medium text-sm">{t.name}</span>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Workflows</h3>
          {!workflows?.length ? (
            <Card className="border-dashed"><CardContent className="py-8 text-center">
              <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No workflows yet</p>
            </CardContent></Card>
          ) : workflows.map(w => (
            <Card key={w.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedWorkflow === w.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedWorkflow(w.id)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{w.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{w.triggerType.replace(/_/g, " ")}</Badge>
                      <Badge variant={w.status === "active" ? "default" : "secondary"} className="text-xs">{w.status}</Badge>
                    </div>
                  </div>
                  {(w.runCount ?? 0) > 0 && <span className="text-xs text-muted-foreground">{w.runCount} runs</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workflow Detail */}
        <div className="lg:col-span-2">
          {!selectedWorkflow || !workflowDetail ? (
            <Card className="border-dashed"><CardContent className="flex flex-col items-center py-16">
              <GitBranch className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a workflow to view or edit</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{workflowDetail.name}</CardTitle>
                      <CardDescription>{workflowDetail.description || "No description"}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => executeWorkflow.mutate({ id: selectedWorkflow })} disabled={executeWorkflow.isPending}>
                        {executeWorkflow.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4 mr-1" /> Run</>}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateWorkflow.mutate({
                        id: selectedWorkflow,
                        status: workflowDetail.status === "active" ? "paused" : "active",
                        isActive: workflowDetail.status !== "active",
                      })}>
                        {workflowDetail.status === "active" ? <><Pause className="w-4 h-4 mr-1" /> Pause</> : <><Play className="w-4 h-4 mr-1" /> Activate</>}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteWorkflow.mutate({ id: selectedWorkflow })}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Trigger */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <Zap className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Trigger: {workflowDetail.triggerType.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">When this event occurs, the workflow runs</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {actions.length > 0 ? (
                      <div className="space-y-2">
                        {actions.map((action: any, idx: number) => (
                          <div key={idx}>
                            <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" /></div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                              <div className="flex-1">
                                <p className="font-medium text-sm capitalize">{action.type.replace(/_/g, " ")}</p>
                                <p className="text-xs text-muted-foreground">{action.config?.subject || action.config?.message || action.config?.title || JSON.stringify(action.config).substring(0, 80)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No actions configured. Use a template or add actions.</p>
                    )}

                    {/* Stats */}
                    {(workflowDetail.runCount ?? 0) > 0 && (
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground">Total Runs</p>
                          <p className="text-lg font-bold">{workflowDetail.runCount ?? 0}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground">Last Run</p>
                          <p className="text-sm font-medium">{workflowDetail.lastRunAt ? new Date(workflowDetail.lastRunAt).toLocaleString() : "Never"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
