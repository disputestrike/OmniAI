import { useState, useRef } from "react";
import JSZip from "jszip";
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
import { Loader2, Shuffle, Copy, Check, Send, Link2, Upload, FileAudio, FileArchive } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { WhatsNextCard } from "@/components/WhatsNextCard";
import { NEXT_STEPS_BY_PAGE } from "@/config/pathBlueprint";

const ZIP_VIDEO_AUDIO_EXT = /\.(mp4|webm|mp3|wav|m4a|ogg|aac|flac)$/i;
const MAX_UPLOAD_BYTES = 16 * 1024 * 1024; // 16MB

type InputMode = "transcript" | "upload" | "zip";

export default function ContentRepurposer() {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("transcript");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipBusy, setZipBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const listProjects = trpc.repurposing.list.useQuery();
  const createProject = trpc.repurposing.create.useMutation({
    onSuccess: () => { utils.repurposing.list.invalidate(); toast.success("Project created"); setTitle(""); setTranscript(""); setSourceUrl(""); setUploadFile(null); },
    onError: (e) => toast.error(e.message),
  });
  const createFromUpload = trpc.repurposing.createFromUpload.useMutation({
    onSuccess: () => { utils.repurposing.list.invalidate(); setTitle(""); setUploadFile(null); },
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
    if (inputMode === "transcript") {
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
      return;
    }
    if (inputMode === "upload") {
      if (!uploadFile) { toast.error("Choose a video or audio file"); return; }
      if (uploadFile.size > MAX_UPLOAD_BYTES) {
        toast.error(`File is too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB). Try a shorter clip or compress the file.`);
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => {
        toast.error("Could not read file. Try a smaller file or use “Paste transcript” for long content.");
      };
      reader.onload = () => {
        const result = reader.result;
        if (result == null || typeof result !== "string") {
          toast.error("Could not read file. Try a smaller file (under 16MB) or paste a transcript instead.");
          return;
        }
        const base64 = result.split(",")[1];
        if (!base64 || base64.length === 0) {
          toast.error("File read failed. Use a file under 16MB or paste a transcript.");
          return;
        }
        createFromUpload.mutate(
          { title: title.trim(), audioBase64: base64, mimeType: uploadFile.type },
          {
            onSuccess: (data) => {
              toast.success("Transcribed. Generating all formats…");
              generateAll.mutate({ projectId: data.id });
            },
          }
        );
      };
      reader.readAsDataURL(uploadFile);
    }
  };

  const processZip = async () => {
    if (!zipFile || zipBusy) return;
    setZipBusy(true);
    try {
      const zip = await JSZip.loadAsync(zipFile);
      const names = Object.keys(zip.files).filter(n => !zip.files[n].dir && ZIP_VIDEO_AUDIO_EXT.test(n));
      const toProcess = names.slice(0, 10);
      if (toProcess.length === 0) {
        toast.error("No video or audio files found in the zip (e.g. .mp4, .mp3, .wav)");
        setZipBusy(false);
        return;
      }
      if (names.length > 10) toast.info(`Processing first 10 of ${names.length} files.`);
      for (const name of toProcess) {
        const entry = zip.files[name];
        const blob = await entry.async("blob");
        const base64 = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => { const s = (r.result as string)?.split(",")[1]; res(s || ""); };
          r.onerror = rej;
          r.readAsDataURL(blob);
        });
        const mime = blob.type || (name.endsWith(".mp4") ? "video/mp4" : name.endsWith(".mp3") ? "audio/mpeg" : "application/octet-stream");
        const title = name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").slice(0, 80) || "From zip";
        const { id } = await createFromUpload.mutateAsync({ title, audioBase64: base64, mimeType: mime });
        await generateAll.mutateAsync({ projectId: id });
      }
      utils.repurposing.list.invalidate();
      toast.success(`Created ${toProcess.length} project(s) from zip.`);
      setZipFile(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Zip processing failed");
    } finally {
      setZipBusy(false);
    }
  };

  const isBusy = createProject.isPending || createFromUpload.isPending || generateAll.isPending || zipBusy;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Repurposer</h1>
        <p className="text-muted-foreground mt-1">
          One input → all formats. Upload a video/audio (we transcribe it), or paste a transcript. Then we generate blog posts, LinkedIn articles, social captions, emails, and 22+ formats in your voice.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shuffle className="h-5 w-5" /> New repurposing project</CardTitle>
          <CardDescription>Upload a video or audio file (we’ll transcribe it) or paste a transcript. We’ll generate every format in one go.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Project title</Label>
            <Input placeholder="e.g. Q4 product launch" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Input method</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={inputMode === "transcript" ? "default" : "outline"} size="sm" onClick={() => setInputMode("transcript")}>
                Paste transcript
              </Button>
              <Button type="button" variant={inputMode === "upload" ? "default" : "outline"} size="sm" onClick={() => setInputMode("upload")}>
                <Upload className="h-4 w-4 mr-1" /> Upload video/audio
              </Button>
              <Button type="button" variant={inputMode === "zip" ? "default" : "outline"} size="sm" onClick={() => setInputMode("zip")}>
                <FileArchive className="h-4 w-4 mr-1" /> Bulk zip
              </Button>
            </div>
          </div>

          {inputMode === "transcript" && (
            <>
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
            </>
          )}

          {inputMode === "upload" && (
            <div className="grid gap-2">
              <Label>Video or audio file *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*,.mp4,.webm,.mp3,.wav,.m4a"
                className="hidden"
                onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <FileAudio className="h-4 w-4" />
                {uploadFile ? uploadFile.name : "Choose file (MP4, WebM, MP3, WAV…)"}
              </Button>
              {uploadFile && uploadFile.size > MAX_UPLOAD_BYTES && (
                <p className="text-xs text-amber-600 dark:text-amber-400">File is {(uploadFile.size / 1024 / 1024).toFixed(1)}MB. Max 16MB — use a shorter clip or paste a transcript.</p>
              )}
              <p className="text-xs text-muted-foreground">We’ll transcribe it with AI, then generate all 22 formats. Max 16MB.</p>
            </div>
          )}

          {inputMode === "zip" && (
            <div className="grid gap-2">
              <Label>Zip file with videos/audio *</Label>
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={e => setZipFile(e.target.files?.[0] ?? null)}
              />
              <Button type="button" variant="outline" onClick={() => zipInputRef.current?.click()} className="gap-2">
                <FileArchive className="h-4 w-4" />
                {zipFile ? zipFile.name : "Choose .zip file"}
              </Button>
              <p className="text-xs text-muted-foreground">We’ll create one repurposing project per video/audio inside (max 10 per zip). Supports .mp4, .webm, .mp3, .wav, .m4a.</p>
              <Button type="button" onClick={processZip} disabled={!zipFile || zipBusy} className="gap-2">
                {zipBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                Process zip & create projects
              </Button>
            </div>
          )}

          {inputMode !== "zip" && (
          <Button
            onClick={handleCreateAndGenerate}
            disabled={isBusy || !title.trim() || (inputMode === "transcript" ? !transcript.trim() : !uploadFile)}
          >
            {isBusy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {inputMode === "upload" ? "Upload, transcribe & generate all formats" : "Generate all formats"}
          </Button>
          )}
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

      <WhatsNextCard steps={NEXT_STEPS_BY_PAGE["/content-repurposer"] ?? []} maxSteps={2} />
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
