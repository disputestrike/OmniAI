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
import { toast } from "sonner";
import {
  Music, Volume2, Play, Pause, Download, Loader2, Sparkles,
  Wand2, RefreshCw, Search, Filter, Repeat, Square, ChevronRight,
  Mic, Headphones, Zap, Heart, Waves, Radio
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
    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
      <audio ref={audioRef} src={url} preload="metadata" />
      <div className="flex items-center gap-3">
        <Button size="icon" variant="default" className="h-9 w-9 shrink-0 rounded-full" onClick={togglePlay}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <div
            className="mt-1 h-1.5 bg-muted rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - rect.left) / rect.width) * 100);
            }}
          >
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
            <span>{audioRef.current ? fmt(audioRef.current.currentTime) : "0:00"}</span>
            <span>{duration ? fmt(duration) : "--:--"}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {loop && <Repeat className="h-3.5 w-3.5 text-primary" aria-label="Looping" />}
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
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

export default function MusicStudio() {
  const [tab, setTab] = useState("generate");
  const [sfxCategory, setSfxCategory] = useState("all");
  const [sfxSearch, setSfxSearch] = useState("");
  const [musicSearch, setMusicSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [generatedTrack, setGeneratedTrack] = useState<{ audioUrl?: string; title?: string; provider?: string } | null>(null);

  // Generate form state
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [tempo, setTempo] = useState<"slow" | "medium" | "fast" | "very-fast">("medium");
  const [duration, setDuration] = useState([60]);
  const [loop, setLoop] = useState(true);
  const [instrumental, setInstrumental] = useState(true);

  const { data: musicLibrary = [] } = trpc.musicStudio.getMusicLibrary.useQuery();
  const { data: sfxLibrary = [] } = trpc.musicStudio.getSFXLibrary.useQuery({ category: sfxCategory === "all" ? undefined : sfxCategory });
  const { data: providers } = trpc.musicStudio.getProviders.useQuery();

  const generateMut = trpc.musicStudio.generateMusic.useMutation({
    onSuccess: (data) => {
      setGeneratedTrack(data);
      if (data.status === "completed") {
        toast.success(`Music generated via ${data.provider}!`);
      } else {
        toast.info("Music generation started — check back in a moment.");
      }
    },
    onError: () => toast.error("Music generation failed"),
  });

  const filteredMusic = musicLibrary.filter((m: { title: string; tags: string[]; genre?: string; mood?: string }) => {
    const matchSearch = !musicSearch || m.title.toLowerCase().includes(musicSearch.toLowerCase()) || m.tags.some((t: string) => t.includes(musicSearch.toLowerCase()));
    const matchGenre = !selectedGenre || m.genre === selectedGenre;
    const matchMood = !selectedMood || m.mood === selectedMood;
    return matchSearch && matchGenre && matchMood;
  });

  const filteredSFX = sfxLibrary.filter((s: { name: string; tags: string[] }) =>
    !sfxSearch || s.name.toLowerCase().includes(sfxSearch.toLowerCase()) || s.tags.some((t: string) => t.includes(sfxSearch.toLowerCase()))
  );

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.click();
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
          <p className="text-muted-foreground mt-1">Generate background music, browse sound effects, and create voiceovers for your videos</p>
        </div>
        {providers && (
          <div className="flex gap-2 flex-wrap justify-end">
            {Object.entries(providers ?? {}).map(([key, p]: [string, { name?: string; available?: boolean }]) => (
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
                          <SelectItem value="">Any genre</SelectItem>
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
                          <SelectItem value="">Any mood</SelectItem>
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
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
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
                    onClick={() => generateMut.mutate({ prompt: prompt || "background music", genre: genre || undefined, mood: mood || undefined, tempo, duration: duration[0], loop, instrumental })}
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
                        onClick={() => {
                          setPrompt(preset.prompt);
                          setGenre(preset.genre);
                          setMood(preset.mood);
                        }}
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
                    {generatedTrack.audioUrl ? (
                      <AudioPlayer
                        url={generatedTrack.audioUrl}
                        title={generatedTrack.title || "Generated Track"}
                        loop={loop}
                        onDownload={() => handleDownload(generatedTrack.audioUrl!, `${generatedTrack.title || "track"}.mp3`)}
                      />
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">
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
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tracks..." value={musicSearch} onChange={e => setMusicSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All genres</SelectItem>
                {GENRES.map(g => <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedMood} onValueChange={setSelectedMood}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All moods</SelectItem>
                {MOODS.map(m => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
            {(selectedGenre || selectedMood || musicSearch) && (
              <Button variant="ghost" size="sm" onClick={() => { setSelectedGenre(""); setSelectedMood(""); setMusicSearch(""); }}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredMusic.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No tracks match your filters</div>
            ) : filteredMusic.map((track: { id: string; title: string; genre?: string; mood?: string; tags: string[]; duration?: number; loop?: boolean; previewUrl?: string; downloadUrl?: string }) => (
              <Card key={track.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Music className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm">{track.title}</h3>
                        <Badge variant="secondary" className="text-xs">{track.genre}</Badge>
                        <Badge variant="outline" className="text-xs">{track.mood}</Badge>
                        {track.loop && <Badge variant="outline" className="text-xs"><Repeat className="h-2.5 w-2.5 mr-1" />Loop</Badge>}
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {track.tags.slice(0, 4).map((tag: string) => (
                          <span key={tag} className="text-xs text-muted-foreground">#{tag}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{track.duration}s</span>
                  </div>
                  <AudioPlayer
                    url={track.previewUrl ?? ""}
                    title={track.title}
                    loop={track.loop}
                    onDownload={() => handleDownload(track.downloadUrl ?? "", `${track.title}.mp3`)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Sound Effects Tab ── */}
        <TabsContent value="sfx" className="space-y-5 mt-5">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search sound effects..." value={sfxSearch} onChange={e => setSfxSearch(e.target.value)} className="pl-9" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredSFX.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-muted-foreground">No sound effects match your search</div>
            ) : filteredSFX.map((sfx: { id: string; name: string; category: string; duration: number; tags: string[]; previewUrl: string; downloadUrl: string }) => (
              <Card key={sfx.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs capitalize">{sfx.category}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{sfx.duration}s</span>
                  </div>
                  <AudioPlayer
                    url={sfx.previewUrl}
                    title={sfx.name}
                    onDownload={() => handleDownload(sfx.downloadUrl, `${sfx.name}.wav`)}
                  />
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {sfx.tags.map((tag: string) => <span key={tag} className="text-xs text-muted-foreground">#{tag}</span>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
