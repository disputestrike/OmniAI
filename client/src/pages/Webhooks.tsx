import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Webhook, Copy, ToggleLeft, ToggleRight, Zap } from "lucide-react";

export default function Webhooks() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [eventType, setEventType] = useState<string>("content.created");

  const { data: webhooks, refetch } = trpc.webhooks.list.useQuery();

  const createMut = trpc.webhooks.create.useMutation({
    onSuccess: () => { toast.success("Webhook created"); setShowCreate(false); setName(""); setUrl(""); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMut = trpc.webhooks.delete.useMutation({
    onSuccess: () => { toast.success("Webhook deleted"); refetch(); },
  });
  const updateMut = trpc.webhooks.update.useMutation({
    onSuccess: () => { toast.success("Webhook updated"); refetch(); },
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks & Integrations</h1>
          <p className="text-zinc-500">Connect to Zapier, Make, and custom workflows via webhooks</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Webhook</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Webhook</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="e.g., Zapier - New Content" />
              </div>
              <div>
                <label className="text-sm font-medium">Endpoint URL *</label>
                <Input value={url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." />
              </div>
              <div>
                <label className="text-sm font-medium">Event Type</label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content.created">Content Created</SelectItem>
                    <SelectItem value="content.published">Content Published</SelectItem>
                    <SelectItem value="campaign.created">Campaign Created</SelectItem>
                    <SelectItem value="campaign.completed">Campaign Completed</SelectItem>
                    <SelectItem value="lead.created">Lead Created</SelectItem>
                    <SelectItem value="payment.completed">Payment Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createMut.mutate({ name, url, events: [eventType] })} disabled={!url || createMut.isPending} className="w-full">
                {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Webhook"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Setup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => { setShowCreate(true); setName("Zapier Integration"); }}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center"><Zap className="w-5 h-5 text-orange-500" /></div>
            <div>
              <p className="font-medium text-sm">Zapier</p>
              <p className="text-xs text-zinc-500">Connect 5,000+ apps</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => { setShowCreate(true); setName("Make (Integromat)"); }}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><Webhook className="w-5 h-5 text-purple-500" /></div>
            <div>
              <p className="font-medium text-sm">Make</p>
              <p className="text-xs text-zinc-500">Visual automation builder</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => { setShowCreate(true); setName("Custom Webhook"); }}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Webhook className="w-5 h-5 text-blue-500" /></div>
            <div>
              <p className="font-medium text-sm">Custom</p>
              <p className="text-xs text-zinc-500">Any HTTP endpoint</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhook List */}
      {!webhooks?.length ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center py-12">
          <Webhook className="w-12 h-12 text-zinc-500 mb-4" />
          <h3 className="text-lg font-semibold">No Webhooks Configured</h3>
          <p className="text-zinc-500 mt-2 text-center max-w-md">Set up webhooks to connect OmniAI with your favorite tools and automate your workflow.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh: any) => (
            <Card key={wh.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Webhook className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{wh.name || "Unnamed Webhook"}</p>
                      <p className="text-xs text-zinc-500 truncate">{wh.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{(wh.events as string[])?.[0] || 'all'}</Badge>
                    <Badge variant={wh.isActive ? "default" : "secondary"}>{wh.isActive ? "Active" : "Paused"}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(wh.url); toast.success("URL copied"); }}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => updateMut.mutate({ id: wh.id, isActive: !wh.isActive })}>
                      {wh.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMut.mutate({ id: wh.id })}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
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
