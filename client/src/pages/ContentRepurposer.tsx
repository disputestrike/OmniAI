import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Shuffle, Copy, Check, Send, Link2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ContentRepurposer() {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const utils = trpc.useUtils();

  const listProjects = trpc.repurposing.list.useQuery();
  const createProject = trpc.repurposing.create.useMutation({
    onSuccess: () => { utils.repurposing.list.invalidate(); toast.success("Project created"); setTitle(""); setTranscript(""); setSourceUrl(""); },
    onError: (e) => toast.error(e.message),
  });
  const generateAll = trpc.repurposing.generateAllFormats.useMutation({
    onSuccess: (_, variables) => {
      utils.repurposing.list.invalidate();
      utils.repurposing.getContents.invalidate({ projectId: variables.projectId });
      toast.success("All formats generated");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreateAndGenerate = () => {
    if (!title.trim()) { toast.error("Enter a project title"); return; }
    if (!transcript.trim()) { toast.error("Paste a transcript or content to repurpose"); return; }
    createProject.mutate(
      {
        title: title.trim(),
        sourceType: "transcript_paste",
        sourceTranscript: transcript.trim(),
        sourceUrl: sourceUrl.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          generateAll.mutate({ projectId: data.id });
        },
      }
    );
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Repurposer</h1>
        <p className="text-muted-foreground mt-1">
          One input → all formats. Paste a video transcript or any content and generate blog posts, LinkedIn articles, social captions, emails, and 22+ formats in your voice.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shuffle className="h-5 w-5" /> New repurposing project</CardTitle>
          <CardDescription>Paste a transcript (e.g. from a video) or any long-form content. We’ll generate every format in one go.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Project title</Label>
            <Input placeholder="e.g. Q4 product launch" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Video or source URL (optional)</Label>
            <Input placeholder="https://youtube.com/..." value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Transcript or content to repurpose *</Label>
            <Textarea
              placeholder="Paste your video transcript or any content here..."
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              rows={8}
              className="resize-y"
            />
          </div>
          <Button
            onClick={handleCreateAndGenerate}
            disabled={createProject.isPending || generateAll.isPending || !title.trim() || !transcript.trim()}
          >
            {(createProject.isPending || generateAll.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Generate all formats
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">Your repurposing projects</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {listProjects.data?.map((project) => (
            <ProjectCard key={project.id} projectId={project.id} title={project.title} status={project.status} createdAt={project.createdAt} />
          ))}
        </div>
        {listProjects.data?.length === 0 && (
          <p className="text-muted-foreground text-sm">No projects yet. Create one above.</p>
        )}
      </div>

      <PublishSection />
    </div>
  );
}

function ProjectCard({ projectId, title, status, createdAt }: { projectId: number; title: string; status: string; createdAt: Date }) {
  const contents = trpc.repurposing.getContents.useQuery({ projectId });
  const credentials = trpc.publishing.listCredentials.useQuery();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const publish = trpc.publishing.publish.useMutation({
    onSuccess: (data) => { toast.success("Published" + (data.url ? `: ${data.url}` : "")); void contents.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const copyBody = (id: number, body: string) => {
    navigator.clipboard.writeText(body);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const connectedPlatforms = (credentials.data ?? []).filter((c) => c.status === "connected" && c.platform !== "substack");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{status} · {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</CardDescription>
      </CardHeader>
      <CardContent>
        {contents.data?.length ? (
          <ul className="space-y-2 max-h-56 overflow-y-auto">
            {contents.data.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 text-sm border rounded-lg px-3 py-2">
                <span className="font-medium truncate">{c.formatType.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {connectedPlatforms.map((cred) => (
                    <Button
                      key={cred.id}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 capitalize"
                      disabled={publish.isPending || c.status === "published"}
                      onClick={() => publish.mutate({ contentId: c.id, platform: cred.platform, publishStatus: cred.platform === "medium" ? "draft" : undefined })}
                    >
                      {publish.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="h-3 w-3 mr-1" />{cred.platform}</>}
                    </Button>
                  ))}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => copyBody(c.id, c.body || "")}>
                    {copiedId === c.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No generated content yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function PublishSection() {
  const [platform, setPlatform] = useState<"medium" | "substack" | "wordpress">("medium");
  const [token, setToken] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const utils = trpc.useUtils();
  const credentials = trpc.publishing.listCredentials.useQuery();
  const connect = trpc.publishing.connect.useMutation({
    onSuccess: () => { utils.publishing.listCredentials.invalidate(); toast.success("Connected"); setToken(""); setSiteUrl(""); },
    onError: (e) => toast.error(e.message),
  });

  const handleConnect = () => {
    if (!token.trim()) { toast.error("Enter access token"); return; }
    if (platform === "wordpress" && !siteUrl.trim()) { toast.error("WordPress requires site URL"); return; }
    connect.mutate({ platform, accessToken: token.trim(), siteUrl: siteUrl.trim() || undefined });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" /> Native publishing</CardTitle>
        <CardDescription>Connect Medium or WordPress to publish repurposed content in one click. Substack: copy from repurposer and paste into Substack.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 mb-2">
          {credentials.data?.map((c) => (
            <span key={c.id} className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
              {c.platform}{c.siteUrl ? ` · ${c.siteUrl.replace(/^https?:\/\//, "").split("/")[0]}` : ""}
            </span>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v: "medium" | "substack" | "wordpress") => setPlatform(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="wordpress">WordPress</SelectItem>
                <SelectItem value="substack">Substack (store token for later)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {platform === "wordpress" && (
            <div>
              <Label>Site URL</Label>
              <Input placeholder="https://yoursite.com" value={siteUrl} onChange={e => setSiteUrl(e.target.value)} />
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <Label>Access token {platform === "wordpress" && "(base64 of username:application_password)"}</Label>
          <Input type="password" placeholder={platform === "medium" ? "Medium integration token" : platform === "wordpress" ? "Base64 token" : "Token"} value={token} onChange={e => setToken(e.target.value)} />
        </div>
        <Button onClick={handleConnect} disabled={connect.isPending}>Connect</Button>
      </CardContent>
    </Card>
  );
}
