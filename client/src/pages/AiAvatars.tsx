import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Video, Loader2, Sparkles, Download, Mic, Film, Camera, Users, Trash2, RefreshCw, Clock } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

// HeyGen's actual avatar_style values
const AVATAR_STYLES = [
  { id: "normal",    label: "Normal",      desc: "Standard framing" },
  { id: "closeUp",   label: "Close-up",    desc: "Face & shoulders" },
  { id: "full",      label: "Full body",   desc: "Full-length shot" },
  { id: "circle",    label: "Circle",      desc: "Circular crop" },
  { id: "voiceOnly", label: "Voice only",  desc: "No video, audio only" },
];

const LANGUAGES = [
  { id: "en", label: "English" }, { id: "es", label: "Spanish" }, { id: "fr", label: "French" },
  { id: "de", label: "German" }, { id: "pt", label: "Portuguese" }, { id: "ja", label: "Japanese" },
  { id: "ko", label: "Korean" }, { id: "zh", label: "Chinese" }, { id: "ar", label: "Arabic" },
  { id: "hi", label: "Hindi" },
];

const LANG_TO_HEYGEN: Record<string, string> = {
  en: "english", es: "spanish", fr: "french", de: "german",
  pt: "portuguese", ja: "japanese", ko: "korean", zh: "chinese",
  ar: "arabic", hi: "hindi",
};

const TTS_VOICES = [
  { id: "nova", label: "Nova (Female)" }, { id: "shimmer", label: "Shimmer (Female)" },
  { id: "coral", label: "Coral (Female)" }, { id: "alloy", label: "Alloy (Neutral)" },
  { id: "echo", label: "Echo (Male)" }, { id: "onyx", label: "Onyx (Male)" },
  { id: "fable", label: "Fable (Male)" },
];

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AiAvatars() {
  const [script, setScript] = useState("");
  const [avatarStyle, setAvatarStyle] = useState("normal");
  const [language, setLanguage] = useState("en");
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("9:16");
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [ttsVoice, setTtsVoice] = useState("nova");
  const [generatedVoiceover, setGeneratedVoiceover] = useState<any>(null);
  const [tab, setTab] = useState("avatar");

  // Pending poll state — set after a generate call returns "processing"
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [pendingGenerationId, setPendingGenerationId] = useState<number | null>(null);

  // Data queries
  const { data: heygenAvatars = [] } = trpc.avatar.listAvatars.useQuery();
  const { data: heygenVoices = [] } = trpc.avatar.listVoices.useQuery();
  const { data: generations = [], refetch: refetchGenerations } = trpc.avatar.listGenerations.useQuery();

  // Filter voices by language; fall back to all if none match
  const filteredVoices = useMemo(() => {
    const keyword = LANG_TO_HEYGEN[language] ?? "english";
    const filtered = heygenVoices.filter(v => v.language?.toLowerCase().includes(keyword));
    return filtered.length > 0 ? filtered : heygenVoices;
  }, [heygenVoices, language]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setSelectedVoiceId("");
  };

  // ── Polling query ────────────────────────────────────────────────
  // Runs every 5s while pendingTaskId is set; stops automatically
  // when status is terminal.
  const { data: pollResult } = trpc.avatar.checkStatus.useQuery(
    { taskId: pendingTaskId!, generationId: pendingGenerationId! },
    {
      enabled: !!pendingTaskId && !!pendingGenerationId,
      refetchInterval: (query) => {
        const data = query.state.data as any;
        if (data?.status === "processing" || !data) return 5000;
        return false;
      },
      staleTime: 0,
    }
  );

  useEffect(() => {
    if (!pollResult) return;
    if (pollResult.status === "completed") {
      setGeneratedVideo(pollResult);
      setPendingTaskId(null);
      setPendingGenerationId(null);
      refetchGenerations();
      toast.success("Avatar video is ready!");
    } else if (pollResult.status === "failed") {
      setGeneratedVideo(pollResult);
      setPendingTaskId(null);
      setPendingGenerationId(null);
      refetchGenerations();
      toast.error("Video generation failed: " + ((pollResult as any).error || "Unknown error"));
    }
  }, [pollResult]);

  // On page load: auto-resume polling for the most recent "processing" generation
  useEffect(() => {
    if (pendingTaskId) return; // already polling
    const inProgress = generations.find(g => g.status === "processing");
    if (inProgress) {
      setPendingTaskId(inProgress.taskId);
      setPendingGenerationId(inProgress.id);
    }
  }, [generations]);

  // ── Mutations ────────────────────────────────────────────────────
  const avatarMut = trpc.avatar.generate.useMutation({
    onSuccess: (data: any) => {
      setGeneratedVideo(data);
      refetchGenerations();
      if (data.status === "processing") {
        setPendingTaskId(data.taskId);
        setPendingGenerationId(data.generationId);
        toast.info("Submitted to HeyGen — polling for completion every 5 s…");
      } else if (data.status === "completed") {
        toast.success("Avatar video ready!");
      } else {
        toast.error("Generation failed: " + (data.error || "Unknown error"));
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = trpc.avatar.deleteGeneration.useMutation({
    onSuccess: () => { refetchGenerations(); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const voiceoverMut = trpc.voiceoverApi.generate.useMutation({
    onSuccess: (data: any) => { setGeneratedVoiceover(data); toast.success("Voiceover generated!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const isPolling = !!pendingTaskId;

  return (
    <div className="space-y-6 max-w-6xl animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-violet-500" />AI Avatars & UGC Videos
        </h1>
        <p className="page-subtitle">Create AI-generated spokesperson videos, UGC-style content, and professional voiceovers.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="avatar"><User className="h-4 w-4 mr-2" />AI Avatar Video</TabsTrigger>
          <TabsTrigger value="voiceover"><Mic className="h-4 w-4 mr-2" />AI Voiceover</TabsTrigger>
          <TabsTrigger value="ugc"><Camera className="h-4 w-4 mr-2" />UGC Style</TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />My Videos
            {generations.some(g => g.status === "processing") && (
              <span className="ml-1.5 h-2 w-2 rounded-full bg-amber-400 inline-block animate-pulse" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── AI Avatar Video Tab ─────────────────────────────── */}
        <TabsContent value="avatar" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass rounded-2xl">
              <CardHeader><CardTitle className="text-base">Create Avatar Video</CardTitle></CardHeader>
              <CardContent className="space-y-4">

                {/* Avatar picker */}
                {heygenAvatars.length > 0 && (
                  <div>
                    <Label>Avatar</Label>
                    <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
                      {heygenAvatars.map(avatar => (
                        <button
                          key={avatar.id}
                          onClick={() => setSelectedAvatarId(avatar.id)}
                          className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-colors w-20 ${
                            selectedAvatarId === avatar.id
                              ? "border-violet-500 bg-violet-500/10"
                              : "border-zinc-700 hover:border-zinc-500"
                          }`}
                        >
                          {avatar.preview ? (
                            <img src={avatar.preview} alt={avatar.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
                              <User className="h-6 w-6 text-zinc-500" />
                            </div>
                          )}
                          <span className="text-xs text-center leading-tight line-clamp-2">{avatar.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Script</Label>
                  <Textarea value={script} onChange={e => setScript(e.target.value)} placeholder="Write a script for your AI avatar to speak..." rows={5} className="mt-1" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Avatar Style</Label>
                    <Select value={avatarStyle} onValueChange={setAvatarStyle}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AVATAR_STYLES.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.label} <span className="text-zinc-500 text-xs">— {s.desc}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9:16">9:16 (Reels/TikTok)</SelectItem>
                        <SelectItem value="16:9">16:9 (YouTube)</SelectItem>
                        <SelectItem value="1:1">1:1 (Feed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Language</Label>
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Voice</Label>
                    <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId} disabled={filteredVoices.length === 0}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={filteredVoices.length === 0 ? "No voices loaded" : "Auto-select"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredVoices.map(v => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}{v.gender ? ` · ${v.gender}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button className="w-full" disabled={!script || avatarMut.isPending || isPolling}
                  onClick={() => avatarMut.mutate({
                    script,
                    avatarId: selectedAvatarId || undefined,
                    style: avatarStyle as any,
                    language,
                    aspectRatio,
                    voiceId: selectedVoiceId || undefined,
                  })}>
                  {avatarMut.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting to HeyGen…</>
                    : isPolling
                    ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Rendering — please wait…</>
                    : <><Film className="h-4 w-4 mr-2" />Generate AI Avatar Video</>}
                </Button>
              </CardContent>
            </Card>

            {/* Preview card */}
            <Card className="glass rounded-2xl">
              <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
              <CardContent>
                {isPolling && !generatedVideo?.videoUrl ? (
                  <div className="aspect-[9/16] bg-zinc-800 rounded-lg flex items-center justify-center">
                    <div className="text-center p-4 space-y-3">
                      <Loader2 className="h-10 w-10 mx-auto text-violet-500 animate-spin" />
                      <p className="text-sm font-medium">HeyGen is rendering…</p>
                      <p className="text-xs text-zinc-500">Checking every 5 seconds</p>
                      <p className="text-xs text-zinc-400 font-mono">{pendingTaskId}</p>
                    </div>
                  </div>
                ) : generatedVideo ? (
                  <div className="space-y-4">
                    {generatedVideo.status === "failed" ? (
                      <div className="aspect-[9/16] bg-zinc-900/40 rounded-lg flex items-center justify-center">
                        <div className="text-center p-6">
                          <p className="text-sm text-red-400 font-medium mb-2">Generation failed</p>
                          <p className="text-xs text-zinc-500 max-w-xs">{generatedVideo.error || "Unknown error"}</p>
                        </div>
                      </div>
                    ) : generatedVideo.videoUrl ? (
                      <video src={generatedVideo.videoUrl} controls className="w-full rounded-lg" />
                    ) : generatedVideo.thumbnailUrl ? (
                      <img src={generatedVideo.thumbnailUrl} alt="Avatar" className="w-full rounded-lg" />
                    ) : (
                      <div className="aspect-[9/16] bg-zinc-800 rounded-lg flex items-center justify-center">
                        <div className="text-center p-4">
                          <Sparkles className="h-8 w-8 mx-auto text-violet-500 mb-2" />
                          <p className="text-sm font-medium">Submitted</p>
                          <p className="text-xs text-zinc-500 mt-1 font-mono">{generatedVideo.taskId}</p>
                        </div>
                      </div>
                    )}
                    {generatedVideo.videoUrl && (
                      <Button variant="outline" className="w-full" onClick={() => window.open(generatedVideo.videoUrl, "_blank")}>
                        <Download className="h-4 w-4 mr-2" />Download Video
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[9/16] bg-zinc-900/40 rounded-lg flex items-center justify-center">
                    <div className="text-center p-6">
                      <User className="h-12 w-12 mx-auto text-zinc-500/30 mb-3" />
                      <p className="text-sm text-zinc-500">Your AI avatar video will appear here</p>
                      <p className="text-xs text-zinc-500 mt-1">Powered by HeyGen AI</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── AI Voiceover Tab ────────────────────────────────── */}
        <TabsContent value="voiceover" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass rounded-2xl">
              <CardHeader><CardTitle className="text-base">Generate Voiceover</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Text to Speak</Label>
                  <Textarea value={script} onChange={e => setScript(e.target.value)} placeholder="Enter the text you want converted to speech..." rows={6} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Voice</Label>
                    <Select value={ttsVoice} onValueChange={setTtsVoice}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TTS_VOICES.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" disabled={!script || voiceoverMut.isPending}
                  onClick={() => voiceoverMut.mutate({ text: script, voice: ttsVoice, language })}>
                  {voiceoverMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating...</> : <><Mic className="h-4 w-4 mr-2" />Generate Voiceover</>}
                </Button>
              </CardContent>
            </Card>

            <Card className="glass rounded-2xl">
              <CardHeader><CardTitle className="text-base">Audio Preview</CardTitle></CardHeader>
              <CardContent>
                {voiceoverMut.isPending ? (
                  <div className="h-64 bg-zinc-900/40 rounded-lg flex items-center justify-center">
                    <div className="text-center p-6">
                      <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin mb-3" />
                      <p className="text-sm text-zinc-500">Generating voiceover...</p>
                    </div>
                  </div>
                ) : generatedVoiceover?.status === "failed" ? (
                  <div className="h-64 bg-zinc-900/40 rounded-lg flex items-center justify-center">
                    <div className="text-center p-6">
                      <p className="text-sm text-red-400 font-medium mb-2">Generation failed</p>
                      <p className="text-xs text-zinc-500 max-w-xs">{generatedVoiceover.error || "Unknown error"}</p>
                    </div>
                  </div>
                ) : generatedVoiceover?.audioUrl ? (
                  <div className="space-y-4">
                    <audio src={generatedVoiceover.audioUrl} controls className="w-full" />
                    <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
                      <div>Duration: {generatedVoiceover.durationMs ? `${(generatedVoiceover.durationMs / 1000).toFixed(1)}s` : "N/A"}</div>
                      <div>Provider: {generatedVoiceover.provider || "OpenAI"}</div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => window.open(generatedVoiceover.audioUrl, "_blank")}>
                      <Download className="h-4 w-4 mr-2" />Download Audio
                    </Button>
                  </div>
                ) : (
                  <div className="h-64 bg-zinc-900/40 rounded-lg flex items-center justify-center">
                    <div className="text-center p-6">
                      <Mic className="h-12 w-12 mx-auto text-zinc-500/30 mb-3" />
                      <p className="text-sm text-zinc-500">Your voiceover will appear here</p>
                      <p className="text-xs text-zinc-500 mt-1">Powered by ElevenLabs / OpenAI TTS</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── UGC Style Tab ───────────────────────────────────── */}
        <TabsContent value="ugc" className="space-y-4 mt-4">
          <Card className="glass rounded-2xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-xl hover:border-violet-300 transition-colors cursor-pointer"
                  onClick={() => { setTab("avatar"); setAvatarStyle("full"); toast.info("Set to Full Body style"); }}>
                  <Camera className="h-10 w-10 mx-auto text-violet-500 mb-3" />
                  <h3 className="font-semibold">Product Review</h3>
                  <p className="text-xs text-zinc-500 mt-1">AI creator reviews your product naturally</p>
                </div>
                <div className="text-center p-6 border rounded-xl hover:border-violet-300 transition-colors cursor-pointer"
                  onClick={() => { setTab("avatar"); setAvatarStyle("normal"); toast.info("Set to Normal style"); }}>
                  <Users className="h-10 w-10 mx-auto text-pink-500 mb-3" />
                  <h3 className="font-semibold">Testimonial</h3>
                  <p className="text-xs text-zinc-500 mt-1">Authentic-feeling customer testimonial</p>
                </div>
                <div className="text-center p-6 border rounded-xl hover:border-violet-300 transition-colors cursor-pointer"
                  onClick={() => { setTab("avatar"); setAvatarStyle("closeUp"); toast.info("Set to Close-up style"); }}>
                  <Video className="h-10 w-10 mx-auto text-blue-500 mb-3" />
                  <h3 className="font-semibold">How-To / Tutorial</h3>
                  <p className="text-xs text-zinc-500 mt-1">Step-by-step guide with AI presenter</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-violet-50 rounded-lg">
                <h4 className="text-sm font-medium text-violet-900">UGC Video Tips</h4>
                <ul className="text-xs text-violet-700 mt-2 space-y-1">
                  <li>Use 9:16 aspect ratio for TikTok and Instagram Reels</li>
                  <li>Keep scripts under 60 seconds for best engagement</li>
                  <li>Start with a hook in the first 3 seconds</li>
                  <li>Use casual, conversational language for authenticity</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── My Videos Tab ───────────────────────────────────── */}
        <TabsContent value="history" className="mt-4">
          {generations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Film className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-sm">No videos generated yet</p>
              <p className="text-xs mt-1">Your avatar videos will appear here after generation</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {generations.map(gen => (
                <Card key={gen.id} className="glass rounded-2xl overflow-hidden">
                  {/* Thumbnail / video preview */}
                  <div className="aspect-[9/16] bg-zinc-900 relative">
                    {gen.status === "processing" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                        <span className="text-xs text-zinc-400">Rendering…</span>
                      </div>
                    ) : gen.status === "failed" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
                        <span className="text-xs text-red-400 text-center">{gen.error || "Failed"}</span>
                      </div>
                    ) : gen.videoUrl ? (
                      <video
                        src={gen.videoUrl}
                        className="w-full h-full object-cover"
                        poster={gen.thumbnailUrl ?? undefined}
                        controls
                      />
                    ) : gen.thumbnailUrl ? (
                      <img src={gen.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Film className="h-8 w-8 text-zinc-600" />
                      </div>
                    )}

                    {/* Status badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant={gen.status === "completed" ? "default" : gen.status === "failed" ? "destructive" : "secondary"}
                        className="text-xs">
                        {gen.status === "processing" ? (
                          <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Processing</>
                        ) : gen.status}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-3 space-y-2">
                    <p className="text-xs text-zinc-400 line-clamp-2">{gen.script}</p>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{formatDate(gen.createdAt)}</span>
                      {gen.duration && <span>{gen.duration}s</span>}
                    </div>
                    <div className="flex gap-2">
                      {gen.videoUrl && (
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-7"
                          onClick={() => window.open(gen.videoUrl!, "_blank")}>
                          <Download className="h-3 w-3 mr-1" />Download
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:text-red-300"
                        onClick={() => deleteMut.mutate({ id: gen.id })}
                        disabled={deleteMut.isPending}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
