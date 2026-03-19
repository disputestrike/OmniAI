import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FolderPlus, Folder, FolderOpen, MessageSquare, Trash2, Edit, Archive, Play, Pause, CheckCircle, Clock, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

export default function Projects() {
  const { user } = useAuth();

  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const projectsQ = trpc.enhanced.projects.list.useQuery(undefined, { enabled: !!user });
  const conversationsQ = trpc.enhanced.conversations.list.useQuery(
    selectedProject ? { projectId: selectedProject } : {},
    { enabled: !!user }
  );

  const createProject = trpc.enhanced.projects.create.useMutation({
    onSuccess: () => { projectsQ.refetch(); setShowCreate(false); setName(""); setDescription(""); toast.success("Project created"); },
  });
  const updateProject = trpc.enhanced.projects.update.useMutation({
    onSuccess: () => { projectsQ.refetch(); toast.success("Project updated"); },
  });
  const deleteProject = trpc.enhanced.projects.delete.useMutation({
    onSuccess: () => { projectsQ.refetch(); setSelectedProject(null); toast.success("Project deleted"); },
  });
  const deleteConversation = trpc.enhanced.conversations.delete.useMutation({
    onSuccess: () => { conversationsQ.refetch(); toast.success("Conversation deleted"); },
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case "active": return <Play className="w-3 h-3 text-green-500" />;
      case "paused": return <Pause className="w-3 h-3 text-yellow-500" />;
      case "completed": return <CheckCircle className="w-3 h-3 text-blue-500" />;
      case "archived": return <Archive className="w-3 h-3 text-gray-500" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "paused": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "completed": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "archived": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default: return "";
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-zinc-500 mt-1">Organize your campaigns, conversations, and content into project folders</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><FolderPlus className="w-4 h-4 mr-2" /> New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <Input placeholder="Project name (e.g., Summer Campaign 2026)" value={name} onChange={e => setName(e.target.value)} />
              <Textarea placeholder="Description — what's this project about?" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              <Button className="w-full" onClick={() => createProject.mutate({ name, description })} disabled={!name.trim() || createProject.isPending}>
                {createProject.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Your Projects</h2>
          {projectsQ.isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-zinc-800 animate-pulse rounded-lg" />)}</div>
          ) : !projectsQ.data?.length ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-zinc-500">
                <Folder className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No projects yet</p>
                <p className="text-sm mt-1">Create your first project to organize your marketing campaigns</p>
              </CardContent>
            </Card>
          ) : (
            projectsQ.data.map((p: any) => (
              <Card
                key={p.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedProject === p.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedProject(p.id)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {selectedProject === p.id ? <FolderOpen className="w-5 h-5 text-primary mt-0.5" /> : <Folder className="w-5 h-5 text-zinc-500 mt-0.5" />}
                      <div>
                        <h3 className="font-medium">{p.name}</h3>
                        {p.description && <p className="text-sm text-zinc-500 mt-0.5 line-clamp-2">{p.description}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={`text-xs ${statusColor(p.status)}`}>
                            {statusIcon(p.status)} <span className="ml-1">{p.status}</span>
                          </Badge>
                          <span className="text-xs text-zinc-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateProject.mutate({ id: p.id, status: "active" })}>
                          <Play className="w-4 h-4 mr-2" /> Set Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateProject.mutate({ id: p.id, status: "paused" })}>
                          <Pause className="w-4 h-4 mr-2" /> Pause
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateProject.mutate({ id: p.id, status: "completed" })}>
                          <CheckCircle className="w-4 h-4 mr-2" /> Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateProject.mutate({ id: p.id, status: "archived" })}>
                          <Archive className="w-4 h-4 mr-2" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm("Delete this project?")) deleteProject.mutate({ id: p.id }); }}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Conversations & Content */}
        <div className="lg:col-span-2 space-y-4">
          {selectedProject ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                  Conversations in {projectsQ.data?.find((p: any) => p.id === selectedProject)?.name}
                </h2>
                <Button size="sm" onClick={() => navigate(`/ai-agents?projectId=${selectedProject}`)}>
                  <MessageSquare className="w-4 h-4 mr-2" /> New Chat in Project
                </Button>
              </div>
              {conversationsQ.isLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-800 animate-pulse rounded-lg" />)}</div>
              ) : !conversationsQ.data?.length ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-zinc-500">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No conversations yet</p>
                    <p className="text-sm mt-1">Start a new AI chat within this project to keep everything organized</p>
                    <Button className="mt-4" onClick={() => navigate(`/ai-agents?projectId=${selectedProject}`)}>
                      Start Conversation
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {conversationsQ.data.map((c: any) => (
                    <Card key={c.id} className="hover:shadow-sm transition-all">
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/ai-agents?conversationId=${c.id}`)}>
                            <MessageSquare className="w-4 h-4 text-zinc-500" />
                            <div>
                              <h3 className="font-medium text-sm">{c.title || "Untitled Conversation"}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                {c.agentMode && <Badge variant="secondary" className="text-xs">{c.agentMode}</Badge>}
                                <span className="text-xs text-zinc-500">{new Date(c.updatedAt).toLocaleString()}</span>
                                <span className="text-xs text-zinc-500">{Array.isArray(c.messages) ? `${c.messages.length} messages` : ""}</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Delete?")) deleteConversation.mutate({ id: c.id }); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center text-zinc-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium">Select a project</h3>
                <p className="text-sm mt-1">Choose a project from the left to see its conversations, content, and history</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
