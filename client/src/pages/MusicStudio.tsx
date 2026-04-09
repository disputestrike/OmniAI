import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Music, Volume2, Play, Pause, Download, Loader2, Sparkles,
  Wand2, RefreshCw, Search, Repeat, Square, ChevronRight,
  Mic, Headphones, Zap, Waves, Radio, Upload, Trash2
} from "lucide-react";

const GENRES = ["corporate", "motivational", "lofi", "cinematic", "pop", "electronic", "acoustic", "hiphop", "classical", "sport", "romantic", "comedy"];
const MOODS = ["energetic", "inspiring", "relaxed", "dramatic", "happy", "futuristic", "warm", "confident", "elegant", "playful", "romantic", "suspenseful"];
const TEMPOS = [
  { value: "slow", label: "Slow (60-80 BPM)" },
  { value: "medium", label: "Medium (80-120 BPM)" },
  { value: "fast", label: "Fast (120-160 BPM)" },
  { value: "very-fast", label: "Very Fast (160+ BPM)" },
];

const SFX_CATEGORIES = [
  { id: "all", label: "All", icon: "🎵" },
  { id: "whoosh", label: "Whoosh", icon: "💨" },
  { id: "transitions", label: "Transitions", icon: "✨" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "cinematic", label: "Cinematic", icon: "🎬" },
  { id: "impact", label: "Impact", icon: "💥" },
  { id: "success", label: "Success", icon: "🏆" },
  { id: "comedy", label: "Comedy", icon: "😄" },
  { id: "nature", label: "Nature", icon: "🌿" },
  { id: "tech", label: "Tech", icon: "⚡" },
  { id: "crowd", label: "Crowd", icon: "👥" },
  { id: "ambient", label: "Ambient", icon: "🌊" },
  { id: "error", label: "Error", icon: "❌" },
];

interface AudioPlayerProps {
  url: string;
  title: string;
  loop?: boolean;
  onDownload?: () => void;
}

function AudioPlayer({ url, title, loop = false, onDownload }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([80]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress((audio.currentTime / (audio.duration || 1)) * 100);
    const onLoad = () => setDuration(audio.duration);
    const onEnd = () => { if (!loop) setPlaying(false); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoad);
    audio.addEventListener("ended", onEnd);
    audio.loop = loop;
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoad);
      audio.removeEventListener("ended", onEnd);
    };
  }, [loop]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume[0] / 100;
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play().catch(() => toast.error("Could not play audio")); setPlaying(true); }
  };

  const seek = (pct: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = (pct / 100) * audio.duration;
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="bg-zinc-900/50 rounded-lg p-3 space-y-2">
      <audio ref={audioRef} src={url} preload="metadata" />
      <div className="flex items-center gap-3">
        <Button size="icon" variant="default" className="h-9 w-9 shrink-0 rounded-full" onClick={togglePlay}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <div
            className="mt-1 h-1.5 bg-zinc-800 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - rect.left) / rect.width) * 100);
            }}
          >
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-0.5">
            <span>{audioRef.current ? fmt(audioRef.current.currentTime) : "0:00"}</span>
            <span>{duration ? fmt(duration) : "--:--"}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {loop && <Repeat className="h-3.5 w-3.5 text-primary" aria-label="Looping" />}
          <Volume2 className="h-3.5 w-3.5 text-zinc-500" />
          <div className="w-16">
            <Slider value={volume} onValueChange={setVolume} min={0} max={100} step={1} className="h-1" />
          </div>
          {onDownload && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDownload}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function MusicStudio() {
  const [tab, setTab] = useState("generate");
  const [sfxCategory, setSfxCategory] = useState("all");
  const [sfxSearch, setSfxSearch] = useState("");
  const [musicSearch, setMusicSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedMood, setSelectedMood] = useState("all");
  const [generatedTrack, setGeneratedTrack] = useState<{ audioUrl?: string; title?: string; provider?: string; status?: string; error?: string } | null>(null);

  // Generate form state
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("all");
  const [mood, setMood] = useState("all");
  const [tempo, setTempo] = useState<"slow" | "medium" | "fast" | "very-fast">("medium");
  const [duration, setDuration] = useState([60]);
  const [loop, setLoop] = useState(true);
  const [instrumental, setInstrumental] = useState(true);

  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"music" | "sfx">("music");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadGenre, setUploadGenre] = useState("none");
  const [uploadMood, setUploadMood] = useState("none");
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadTags, setUploadTags] = useState("");

  // Queries stored in named vars for refetch
  const musicLibraryQuery = trpc.musicStudio.getMusicLibrary.useQuery();
  const { data: musicLibrary = [] } = musicLibraryQuery;

  const sfxLibraryQuery = trpc.musicStudio.getSFXLibrary.useQuery({
    category: sfxCategory === "all" ? undefined : sfxCategory,
  });
  const { data: sfxLibrary = [] } = sfxLibraryQuery;

  const { data: providers } = trpc.musicStudio.getProviders.useQuery();

  const generateMut = trpc.musicStudio.generateMusic.useMutation({
    onSuccess: (data) => {
      setGeneratedTrack(data);
      if (data.status === "completed") {
        toast.success(`Music generated via ${data.provider}!`);
      } else if (data.status === "failed") {
        toast.error(data.error || "Music generation failed");
      } else {
        toast.info("Music generation started — check back in a moment.");
      }
    },
    onError: () => toast.error("Music generation failed"),
  });

  const uploadMusicMut = trpc.musicStudio.uploadMusicTrack.useMutation({
    onSuccess: () => {
      toast.success("Track uploaded");
      setUploadOpen(false);
      resetUploadForm();
      musicLibraryQuery.refetch();
    },
    onError: (e) => toast.error(e.message || "Upload failed"),
  });

  const deleteMusicMut = trpc.musicStudio.deleteMusicTrack.useMutation({
    onSuccess: () => { toast.success("Track deleted"); musicLibraryQuery.refetch(); },
    onError: () => toast.error("Delete failed"),
  });

  const uploadSFXMut = trpc.musicStudio.uploadSFXTrack.useMutation({
    onSuccess: () => {
      toast.success("SFX uploaded");
      setUploadOpen(false);
      resetUploadForm();
      sfxLibraryQuery.refetch();
    },
    onError: (e) => toast.error(e.message || "Upload failed"),
  });

  const deleteSFXMut = trpc.musicStudio.deleteSFXTrack.useMutation({
    onSuccess: () => { toast.success("SFX deleted"); sfxLibraryQuery.refetch(); },
    onError: () => toast.error("Delete failed"),
  });

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle("");
    setUploadGenre("none");
    setUploadMood("none");
    setUploadName("");
    setUploadCategory("");
    setUploadTags("");
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    if (uploadFile.size > 16 * 1024 * 1024) { toast.error("File too large (max 16MB)"); return; }
    setUploadBusy(true);
    try {
      const fileBase64 = await readFileAsBase64(uploadFile);
      const mimeType = (uploadFile.type || "audio/mpeg") as "audio/mpeg" | "audio/wav" | "audio/ogg" | "audio/mp3";
      const tags = uploadTags ? uploadTags.split(",").map(t => t.trim()).filter(Boolean) : [];
      if (uploadType === "music") {
        await uploadMusicMut.mutateAsync({
          title: uploadTitle.trim() || uploadFile.name.replace(/\.[^.]+$/, ""),
          genre: uploadGenre !== "none" ? uploadGenre : undefined,
          mood: uploadMood !== "none" ? uploadMood : undefined,
          tags, fileBase64, mimeType, fileName: uploadFile.name,
        });
      } else {
        await uploadSFXMut.mutateAsync({
          name: uploadName.trim() || uploadFile.name.replace(/\.[^.]+$/, ""),
          category: uploadCategory as any,
          tags, fileBase64, mimeType, fileName: uploadFile.name,
        });
      }
    } finally {
      setUploadBusy(false);
    }
  };

  const filteredMusic = musicLibrary.filter((m: any) => {
    const matchSearch = !musicSearch || m.title.toLowerCase().includes(musicSearch.toLowerCase()) || (m.tags as string[])?.some((t: string) => t.includes(musicSearch.toLowerCase()));
    const matchGenre = selectedGenre === "all" || m.genre === selectedGenre;
    const matchMood = selectedMood === "all" || m.mood === selectedMood;
    return matchSearch && matchGenre && matchMood;
  });

  const filteredSFX = sfxLibrary.filter((s: any) =>
    !sfxSearch || s.name.toLowerCase().includes(sfxSearch.toLowerCase()) || (s.tags as string[])?.some((t: string) => t.includes(sfxSearch.toLowerCase()))
  );

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.target = "_blank"; a.click();
    toast.success("Download started");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" /> AI Music & Sound Studio
          </h1>
          <p className="text-zinc-500 mt-1">Generate background music, browse sound effects, and create voiceovers for your videos</p>
        </div>
        {providers && (
          <div className="flex gap-2 flex-wrap justify-end">
            {Object.entries(providers ?? {}).map(([key, p]: [string, any]) => (
              <Badge key={key} variant={p.available ? "default" : "secondary"} className="text-xs">
                {p.available ? "✓" : "○"} {p.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="generate"><Sparkles className="h-4 w-4 mr-1.5" /> AI Generate</TabsTrigger>
          <TabsTrigger value="library"><Headphones className="h-4 w-4 mr-1.5" /> Music Library</TabsTrigger>
          <TabsTrigger value="sfx"><Zap className="h-4 w-4 mr-1.5" /> Sound Effects</TabsTrigger>
        </TabsList>

        {/* ── AI Generate Tab ── */}
        <TabsContent value="generate" className="space-y-5 mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-primary" /> Describe Your Music
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm">Music Description</Label>
                    <Textarea
                      placeholder="e.g. Upbeat corporate background music for a product launch video, modern and professional..."
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      rows={3}
                      className="mt-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Genre</Label>
                      <Select value={genre} onValueChange={setGenre}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Any genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any genre</SelectItem>
                          {GENRES.map(g => <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Mood</Label>
                      <Select value={mood} onValueChange={setMood}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Any mood" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any mood</SelectItem>
                          {MOODS.map(m => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Tempo</Label>
                    <Select value={tempo} onValueChange={v => setTempo(v as typeof tempo)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Duration: {duration[0]}s</Label>
                    <Slider value={duration} onValueChange={setDuration} min={15} max={120} step={5} className="mt-2" />
                    <div className="flex justify-between text-xs text-zinc-500 mt-1">
                      <span>15s (Short clip)</span>
                      <span>120s (Full track)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={loop} onCheckedChange={setLoop} id="loop" />
                      <Label htmlFor="loop" className="text-sm cursor-pointer">Loop track</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={instrumental} onCheckedChange={setInstrumental} id="instrumental" />
                      <Label htmlFor="instrumental" className="text-sm cursor-pointer">Instrumental only</Label>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => generateMut.mutate({
                      prompt: prompt || "background music",
                      genre: genre === "all" ? undefined : genre,
                      mood: mood === "all" ? undefined : mood,
                      tempo, duration: duration[0], loop, instrumental,
                    })}
                    disabled={generateMut.isPending}
                  >
                    {generateMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Music</>}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {/* Quick presets */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Presets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Product Launch", prompt: "Exciting upbeat music for a product launch, energetic and modern", genre: "corporate", mood: "energetic" },
                      { label: "Brand Story", prompt: "Warm inspiring background music for a brand story video", genre: "motivational", mood: "inspiring" },
                      { label: "TikTok Viral", prompt: "Trendy catchy beat for TikTok video, fun and energetic", genre: "pop", mood: "happy" },
                      { label: "Luxury Ad", prompt: "Sophisticated elegant background music for a luxury product ad", genre: "classical", mood: "elegant" },
                      { label: "Tech Demo", prompt: "Modern futuristic electronic music for a tech product demo", genre: "electronic", mood: "futuristic" },
                      { label: "Testimonial", prompt: "Soft warm acoustic background for a customer testimonial video", genre: "acoustic", mood: "warm" },
                      { label: "Sale/Promo", prompt: "Exciting fast-paced music for a sale promotion video", genre: "pop", mood: "energetic" },
                      { label: "Chill Content", prompt: "Relaxed lofi beats for background content, study vibes", genre: "lofi", mood: "relaxed" },
                    ].map(preset => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        className="justify-start text-xs h-auto py-2 px-3"
                        onClick={() => { setPrompt(preset.prompt); setGenre(preset.genre); setMood(preset.mood); }}
                      >
                        <ChevronRight className="h-3 w-3 mr-1 shrink-0" />
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Generated result */}
              {generatedTrack && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Music className="h-4 w-4 text-primary" /> Generated Track
                      <Badge variant="outline" className="text-xs ml-auto">{generatedTrack.provider}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {generatedTrack.status === "failed" ? (
                      <p className="text-sm text-zinc-400 text-center py-3">{generatedTrack.error}</p>
                    ) : generatedTrack.audioUrl ? (
                      <AudioPlayer
                        url={generatedTrack.audioUrl}
                        title={generatedTrack.title || "Generated Track"}
                        loop={loop}
                        onDownload={() => handleDownload(generatedTrack.audioUrl!, `${generatedTrack.title || "track"}.mp3`)}
                      />
                    ) : (
                      <div className="text-center py-4 text-zinc-500 text-sm">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                        Generation in progress — refresh in a moment
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Music Library Tab ── */}
        <TabsContent value="library" className="space-y-5 mt-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Your Music Library</span>
            <Button size="sm" onClick={() => { setUploadType("music"); setUploadOpen(true); }}>
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Track
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input placeholder="Search tracks..." value={musicSearch} onChange={e => setMusicSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All genres</SelectItem>
                {GENRES.map(g => <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedMood} onValueChange={setSelectedMood}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All moods</SelectItem>
                {MOODS.map(m => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
            {(selectedGenre !== "all" || selectedMood !== "all" || musicSearch) && (
              <Button variant="ghost" size="sm" onClick={() => { setSelectedGenre("all"); setSelectedMood("all"); setMusicSearch(""); }}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredMusic.length === 0 ? (
              musicLibrary.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Music className="h-10 w-10 text-zinc-600 mx-auto" />
                  <p className="text-zinc-400 font-medium">Your music library is empty</p>
                  <p className="text-zinc-600 text-sm">Upload MP3, WAV, or OGG files to get started</p>
                  <Button size="sm" onClick={() => { setUploadType("music"); setUploadOpen(true); }}>
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload your first track
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500">No tracks match your filters</div>
              )
            ) : filteredMusic.map((track: any) => (
              <Card key={track.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Music className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm">{track.title}</h3>
                        {track.genre && <Badge variant="secondary" className="text-xs">{track.genre}</Badge>}
                        {track.mood && <Badge variant="outline" className="text-xs">{track.mood}</Badge>}
                        {track.loop && <Badge variant="outline" className="text-xs"><Repeat className="h-2.5 w-2.5 mr-1" />Loop</Badge>}
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(track.tags as string[] | null)?.slice(0, 4).map((tag: string) => (
                          <span key={tag} className="text-xs text-zinc-500">#{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {track.duration && <span className="text-xs text-zinc-500">{track.duration}s</span>}
                      <Button
                        size="icon" variant="ghost"
                        className="h-7 w-7 text-zinc-500 hover:text-destructive"
                        onClick={() => { if (confirm(`Delete "${track.title}"?`)) deleteMusicMut.mutate({ id: track.id }); }}
                        disabled={deleteMusicMut.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <AudioPlayer
                    url={track.fileUrl}
                    title={track.title}
                    loop={track.loop ?? false}
                    onDownload={() => handleDownload(track.fileUrl, `${track.title}.mp3`)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Sound Effects Tab ── */}
        <TabsContent value="sfx" className="space-y-5 mt-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Sound Effects</span>
            <Button size="sm" onClick={() => { setUploadType("sfx"); setUploadOpen(true); }}>
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload SFX
            </Button>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {SFX_CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                variant={sfxCategory === cat.id ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setSfxCategory(cat.id)}
              >
                <span className="mr-1">{cat.icon}</span> {cat.label}
              </Button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input placeholder="Search sound effects..." value={sfxSearch} onChange={e => setSfxSearch(e.target.value)} className="pl-9" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredSFX.length === 0 ? (
              sfxLibrary.length === 0 ? (
                <div className="col-span-2 text-center py-16 space-y-3">
                  <Zap className="h-10 w-10 text-zinc-600 mx-auto" />
                  <p className="text-zinc-400 font-medium">Your SFX library is empty</p>
                  <p className="text-zinc-600 text-sm">Upload WAV, MP3, or OGG sound effect files</p>
                  <Button size="sm" onClick={() => { setUploadType("sfx"); setUploadOpen(true); }}>
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload your first SFX
                  </Button>
                </div>
              ) : (
                <div className="col-span-2 text-center py-12 text-zinc-500">No sound effects match your search</div>
              )
            ) : filteredSFX.map((sfx: any) => (
              <Card key={sfx.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs capitalize">{sfx.category}</Badge>
                    {sfx.duration && <span className="text-xs text-zinc-500 ml-auto">{sfx.duration}s</span>}
                    <Button
                      size="icon" variant="ghost"
                      className="h-6 w-6 text-zinc-500 hover:text-destructive ml-auto"
                      onClick={() => { if (confirm(`Delete "${sfx.name}"?`)) deleteSFXMut.mutate({ id: sfx.id }); }}
                      disabled={deleteSFXMut.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <AudioPlayer
                    url={sfx.fileUrl}
                    title={sfx.name}
                    onDownload={() => handleDownload(sfx.fileUrl, `${sfx.name}.wav`)}
                  />
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {(sfx.tags as string[] | null)?.map((tag: string) => <span key={tag} className="text-xs text-zinc-500">#{tag}</span>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Upload Dialog ── */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { setUploadOpen(open); if (!open) resetUploadForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{uploadType === "music" ? "Upload Music Track" : "Upload Sound Effect"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm">Audio File (MP3, WAV, OGG — max 16MB)</Label>
              <input
                type="file"
                accept="audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg"
                className="mt-1.5 block w-full text-sm text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-zinc-800 file:text-zinc-200 file:text-sm cursor-pointer"
                onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
              />
              {uploadFile && (
                <p className="text-xs text-zinc-500 mt-1">
                  {uploadFile.name} — {(uploadFile.size / 1024 / 1024).toFixed(2)}MB
                </p>
              )}
            </div>

            {uploadType === "music" && (
              <>
                <div>
                  <Label className="text-sm">Title</Label>
                  <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
                    placeholder="e.g. Upbeat Corporate" className="mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Genre (optional)</Label>
                    <Select value={uploadGenre} onValueChange={setUploadGenre}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {GENRES.map(g => <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Mood (optional)</Label>
                    <Select value={uploadMood} onValueChange={setUploadMood}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {MOODS.map(m => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {uploadType === "sfx" && (
              <>
                <div>
                  <Label className="text-sm">Name</Label>
                  <Input value={uploadName} onChange={e => setUploadName(e.target.value)}
                    placeholder="e.g. Whoosh Fast" className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm">Category</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {SFX_CATEGORIES.filter(c => c.id !== "all").map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.icon} {c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <Label className="text-sm">Tags (comma-separated, optional)</Label>
              <Input value={uploadTags} onChange={e => setUploadTags(e.target.value)}
                placeholder="e.g. upbeat, corporate, loop" className="mt-1.5" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setUploadOpen(false); resetUploadForm(); }}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!uploadFile || uploadBusy || (uploadType === "sfx" && !uploadCategory)}
                onClick={handleUploadSubmit}
              >
                {uploadBusy ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading...</> : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
