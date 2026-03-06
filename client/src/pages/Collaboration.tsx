import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { UsersRound, MessageSquare, ClipboardList, UserPlus, Bell, Share2, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Collaboration() {
  const { user } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Array<{id: number; text: string; sender: string; time: string}>>([]);
  const [tasks, setTasks] = useState<Array<{id: number; title: string; description: string; priority: string; status: string; assignee: string; createdAt: string}>>([]);
  const [notifications] = useState([
    { id: 1, text: "Campaign 'Summer Launch' was approved by admin", time: "2 hours ago", read: false },
    { id: 2, text: "New content generated for 'Product Demo' campaign", time: "5 hours ago", read: true },
    { id: 3, text: "A/B test winner selected for Instagram ad variant", time: "1 day ago", read: true },
  ]);

  const teamQuery = trpc.team.members.useQuery();
  const inviteMut = trpc.team.invite.useMutation({
    onSuccess: () => {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("editor");
      setInviteOpen(false);
      teamQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) return toast.error("Enter an email address");
    inviteMut.mutate({ email: inviteEmail, role: inviteRole as "editor" | "viewer" | "admin" });
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: messageText,
      sender: user?.name || "You",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setMessageText("");
  };

  const handleCreateTask = () => {
    if (!taskTitle.trim()) return toast.error("Enter a task title");
    setTasks(prev => [...prev, {
      id: Date.now(),
      title: taskTitle,
      description: taskDescription,
      priority: taskPriority,
      status: "pending",
      assignee: user?.name || "Unassigned",
      createdAt: new Date().toLocaleDateString(),
    }]);
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("medium");
    setTaskOpen(false);
    toast.success("Task created");
  };

  const toggleTaskStatus = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === "pending" ? "done" : "pending" } : t));
  };

  const teamMembers = teamQuery.data || [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collaboration</h1>
          <p className="text-muted-foreground text-sm mt-1">Work together with your team — messaging, task management, approvals, and notifications.</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl"><UserPlus className="h-4 w-4 mr-2" />Invite Team Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Email Address</Label><Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" type="email" /></div>
              <div><Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor — Can create and edit content</SelectItem>
                    <SelectItem value="viewer">Viewer — Read-only access</SelectItem>
                    <SelectItem value="admin">Admin — Full admin access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInvite} disabled={inviteMut.isPending} className="w-full">
                {inviteMut.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <UsersRound className="h-5 w-5 text-violet-600" />
            <h3 className="font-semibold">Team Members ({teamMembers.length})</h3>
          </div>
          {teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members yet. Invite your first team member to start collaborating.</p>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {(m.user?.name || m.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.user?.name || m.email}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs capitalize">{m.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Chat */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Team Chat</h3>
            </div>
            <div className="h-64 overflow-y-auto space-y-2 mb-3 p-3 rounded-lg bg-muted/20">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center mt-20">Start a conversation with your team</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="p-2 rounded-lg bg-background shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">{msg.sender}</span>
                      <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className="text-sm mt-0.5">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={e => e.key === "Enter" && handleSendMessage()}
              />
              <Button size="icon" onClick={handleSendMessage}><Send className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Task Management */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold">Tasks</h3>
              </div>
              <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="rounded-lg">New Task</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div><Label>Title</Label><Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Review Q2 campaign creatives" /></div>
                    <div><Label>Description</Label><Textarea value={taskDescription} onChange={e => setTaskDescription(e.target.value)} placeholder="Details..." rows={2} /></div>
                    <div><Label>Priority</Label>
                      <Select value={taskPriority} onValueChange={setTaskPriority}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateTask} className="w-full">Create Task</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="h-64 overflow-y-auto space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center mt-20">No tasks yet. Create your first task.</p>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 cursor-pointer hover:bg-muted/40" onClick={() => toggleTaskStatus(task.id)}>
                    {task.status === "done" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                      {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{task.priority}</Badge>
                        <span className="text-[10px] text-muted-foreground">{task.createdAt}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Notifications */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-rose-600" />
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <div className="space-y-2">
              {notifications.map(n => (
                <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg ${n.read ? "bg-muted/20" : "bg-primary/5 border border-primary/10"}`}>
                  {n.read ? (
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm">{n.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Approval Shortcuts */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start rounded-lg" onClick={() => window.location.href = "/approvals"}>
                <Share2 className="h-4 w-4 mr-2" />Go to Approval Workflows
              </Button>
              <Button variant="outline" className="w-full justify-start rounded-lg" onClick={() => window.location.href = "/team"}>
                <UsersRound className="h-4 w-4 mr-2" />Manage Team Settings
              </Button>
              <Button variant="outline" className="w-full justify-start rounded-lg" onClick={() => window.location.href = "/automations"}>
                <ClipboardList className="h-4 w-4 mr-2" />Automation Workflows
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
