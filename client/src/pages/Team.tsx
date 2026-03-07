import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Shield, Loader2, Mail, UserPlus, UserCircle } from "lucide-react";

export default function Team() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: members, isLoading } = trpc.team.members.useQuery(undefined, { enabled: !!user });
  const { data: assignmentSetting } = trpc.lead.getAssignmentSetting.useQuery(undefined, { enabled: !!user });
  const invite = trpc.team.invite.useMutation({ onSuccess: () => { utils.team.members.invalidate(); toast.success("Team member invited"); } });
  const remove = trpc.team.remove.useMutation({ onSuccess: () => { utils.team.members.invalidate(); toast.success("Member removed"); } });
  const saveAssignment = trpc.lead.saveAssignmentSetting.useMutation({
    onSuccess: () => { utils.lead.getAssignmentSetting.invalidate(); toast.success("Lead assignment updated"); },
    onError: (e) => toast.error(e.message),
  });
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [leadAssignMode, setLeadAssignMode] = useState<"manual" | "round_robin">("manual");
  useEffect(() => { if (assignmentSetting?.mode) setLeadAssignMode(assignmentSetting.mode); }, [assignmentSetting?.mode]);

  const handleInvite = () => {
    if (!email.trim()) { toast.error("Email required"); return; }
    invite.mutate({ email, role: role as any, permissions: role === "admin" ? ["all"] : ["view", "create", "edit"] });
    setEmail(""); setRole("member"); setOpen(false);
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") return <Badge className="bg-purple-100 text-purple-800"><Shield className="h-3 w-3 mr-1" /> Admin</Badge>;
    if (role === "manager") return <Badge className="bg-blue-100 text-blue-800">Manager</Badge>;
    if (role === "editor") return <Badge className="bg-green-100 text-green-800">Editor</Badge>;
    return <Badge variant="outline">Member</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> Team Collaboration</h1>
          <p className="text-muted-foreground">Manage your marketing team, roles, and permissions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><UserPlus className="h-4 w-4 mr-2" /> Invite Member</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Email Address</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="team@company.com" type="email" /></div>
              <div><Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin — Full access</SelectItem>
                    <SelectItem value="manager">Manager — Create & manage campaigns</SelectItem>
                    <SelectItem value="editor">Editor — Create & edit content</SelectItem>
                    <SelectItem value="member">Member — View & comment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleInvite} disabled={invite.isPending}>{invite.isPending ? "Inviting..." : "Send Invitation"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lead assignment */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><UserCircle className="h-4 w-4" /> Lead assignment</CardTitle>
          <p className="text-sm text-muted-foreground">When new leads are created (e.g. from forms or imports), assign them manually in Lead Manager or automatically in rotation.</p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Select value={leadAssignMode} onValueChange={(v: "manual" | "round_robin") => setLeadAssignMode(v)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual — assign in Lead Manager</SelectItem>
              <SelectItem value="round_robin">Round-robin — rotate among you and team</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" disabled={saveAssignment.isPending} onClick={() => {
            const memberOrder = leadAssignMode === "round_robin" && user?.id
              ? [user.id, ...(members ?? []).filter((m: { userId?: number }) => m.userId).map((m: { userId: number }) => m.userId)]
              : [];
            saveAssignment.mutate({ mode: leadAssignMode, memberOrder });
          }}>
            {saveAssignment.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}Save
          </Button>
          {assignmentSetting?.mode === "round_robin" && <span className="text-xs text-muted-foreground">New leads will be assigned in rotation.</span>}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold">{members?.length ?? 0}</p>
          <p className="text-sm text-muted-foreground">Total Members</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{members?.filter((m: any) => m.role === "admin").length ?? 0}</p>
          <p className="text-sm text-muted-foreground">Admins</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{members?.filter((m: any) => m.status === "active").length ?? 0}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{members?.filter((m: any) => m.status === "invited").length ?? 0}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </CardContent></Card>
      </div>

      {/* Members List */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : !members?.length ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No team members yet. Invite your first team member to start collaborating.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {members.map((member: any) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{(member.email || "?")[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.email}</p>
                        {getRoleBadge(member.role)}
                        <Badge variant={member.status === "active" ? "default" : "outline"}>{member.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(member.createdAt).toLocaleDateString()}
                        {member.permissions && ` · Permissions: ${(member.permissions as string[]).join(", ")}`}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => { if (confirm("Remove this team member?")) remove.mutate({ id: member.id }); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
