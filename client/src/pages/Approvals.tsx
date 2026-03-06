import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState } from "react";
import { CheckCircle, Clock, XCircle, Plus, Loader2 } from "lucide-react";

export default function Approvals() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: allApprovals, isLoading } = trpc.approval.list.useQuery(undefined, { enabled: !!user });
  const { data: pending } = trpc.approval.pending.useQuery(undefined, { enabled: !!user });
  const createApproval = trpc.approval.create.useMutation({ onSuccess: () => { utils.approval.list.invalidate(); utils.approval.pending.invalidate(); toast.success("Approval request created"); } });
  const reviewApproval = trpc.approval.review.useMutation({ onSuccess: () => { utils.approval.list.invalidate(); utils.approval.pending.invalidate(); toast.success("Review submitted"); } });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [entityType, setEntityType] = useState("content");
  const [entityId, setEntityId] = useState("");
  const [reviewComment, setReviewComment] = useState("");

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Title required"); return; }
    createApproval.mutate({ title, type: entityType as any, contentId: entityType === 'content' && entityId ? parseInt(entityId) : undefined, creativeId: entityType === 'creative' && entityId ? parseInt(entityId) : undefined, campaignId: entityType === 'campaign' && entityId ? parseInt(entityId) : undefined });
    setTitle(""); setDescription(""); setEntityType("content"); setEntityId(""); setOpen(false);
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
    if (status === "rejected") return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
    return <Badge className="bg-amber-100 text-amber-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CheckCircle className="h-6 w-6 text-primary" /> Approval Workflows</h1>
          <p className="text-muted-foreground">Submit content for review and manage approval chains</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Request</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit for Approval</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Q2 Campaign Creative Review" /></div>
              <div><Label>Type</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                    <SelectItem value="ad_launch">Ad Launch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Entity ID (optional)</Label><Input value={entityId} onChange={e => setEntityId(e.target.value)} placeholder="Link to specific item" type="number" /></div>
              <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what needs approval..." rows={3} /></div>
              <Button className="w-full" onClick={handleCreate} disabled={createApproval.isPending}>{createApproval.isPending ? "Submitting..." : "Submit for Approval"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{pending?.length ?? 0}</p>
          <p className="text-sm text-muted-foreground">Pending Review</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{allApprovals?.filter((a: any) => a.status === "approved").length ?? 0}</p>
          <p className="text-sm text-muted-foreground">Approved</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{allApprovals?.filter((a: any) => a.status === "rejected").length ?? 0}</p>
          <p className="text-sm text-muted-foreground">Rejected</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {!pending?.length ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No pending approvals. All caught up!</p>
            </CardContent></Card>
          ) : (
            pending.map((item: any) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Badge variant="outline">{item.entityType}</Badge>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => reviewApproval.mutate({ id: item.id, status: "rejected", comment: reviewComment || undefined })}>
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700"
                        onClick={() => reviewApproval.mutate({ id: item.id, status: "approved", comment: reviewComment || undefined })}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : !allApprovals?.length ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No approval requests yet.</p>
            </CardContent></Card>
          ) : (
            allApprovals.map((item: any) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{item.title}</h3>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Badge variant="outline">{item.entityType}</Badge>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.reviewedAt && <span>Reviewed: {new Date(item.reviewedAt).toLocaleDateString()}</span>}
                      </div>
                      {item.comment && <p className="text-sm text-muted-foreground mt-1 italic">"{item.comment}"</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
