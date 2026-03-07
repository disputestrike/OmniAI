import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Mic, Play, Pause, Download, Loader2, Sparkles, Volume2,
  Wand2, ChevronRight, Globe, User, Zap, Clock, Languages
} from "lucide-react";

// Curated voice catalog (activates with ElevenLabs or OpenAI key)
const VOICES = [
  // Male voices
  { id: "adam", name: "Adam", gender: "male", accent: "American", style: "Narration", description: "Deep, authoritative narrator voice", provider: "elevenlabs", tags: ["documentary", "narration", "professional"] },
  { id: "josh", name: "Josh", gender: "male", accent: "American", style: "Conversational", description: "Young, energetic, casual tone", provider: "elevenlabs", tags: ["podcast", "social", "casual"] },
  { id: "arnold", name: "Arnold", gender: "male", accent: "American", style: "Confident", description: "Strong, confident sales voice", provider: "elevenlabs", tags: ["sales", "ads", "confident"] },
  { id: "sam", name: "Sam", gender: "male", accent: "American", style: "Friendly", description: "Warm, approachable, trustworthy", provider: "elevenlabs", tags: ["explainer", "tutorial", "friendly"] },
  { id: "clyde", name: "Clyde", gender: "male", accent: "American", style: "War veteran", description: "Gruff, experienced, character voice", provider: "elevenlabs", tags: ["character", "storytelling", "dramatic"] },
  { id: "fin", name: "Fin", gender: "male", accent: "Irish", style: "Sailor", description: "Warm Irish accent, storytelling tone", provider: "elevenlabs", tags: ["storytelling", "character", "accent"] },
  { id: "callum", name: "Callum", gender: "male", accent: "Transatlantic", style: "Intense", description: "Intense, dramatic, cinematic", provider: "elevenlabs", tags: ["cinematic", "dramatic", "trailer"] },
  { id: "daniel", name: "Daniel", gender: "male", accent: "British", style: "News presenter", description: "Professional British news anchor", provider: "elevenlabs", tags: ["news", "professional", "british"] },
  // Female voices
  { id: "rachel", name: "Rachel", gender: "female", accent: "American", style: "Calm", description: "Calm, clear, professional narrator", provider: "elevenlabs", tags: ["narration", "professional", "calm"] },
  { id: "domi", name: "Domi", gender: "female", accent: "American", style: "Strong", description: "Strong, confident, assertive", provider: "elevenlabs", tags: ["confident", "ads", "strong"] },
  { id: "bella", name: "Bella", gender: "female", accent: "American", style: "Soft", description: "Soft, warm, intimate tone", provider: "elevenlabs", tags: ["intimate", "wellness", "soft"] },
  { id: "elli", name: "Elli", gender: "female", accent: "American", style: "Emotional", description: "Expressive, emotional, engaging", provider: "elevenlabs", tags: ["emotional", "storytelling", "expressive"] },
  { id: "grace", name: "Grace", gender: "female", accent: "Southern US", style: "Gentle", description: "Warm Southern accent, gentle tone", provider: "elevenlabs", tags: ["gentle", "warm", "accent"] },
  { id: "charlotte", name: "Charlotte", gender: "female", accent: "Swedish", style: "Seductive", description: "Sophisticated, elegant European voice", provider: "elevenlabs", tags: ["luxury", "elegant", "european"] },
  { id: "dorothy", name: "Dorothy", gender: "female", accent: "British", style: "Pleasant", description: "Pleasant British accent, professional", provider: "elevenlabs", tags: ["british", "professional", "pleasant"] },
  { id: "serena", name: "Serena", gender: "female", accent: "American", style: "Pleasant", description: "Pleasant, balanced, versatile", provider: "elevenlabs", tags: ["versatile", "balanced", "pleasant"] },
];

const EMOTIONS = [
  { value: "neutral", label: "Neutral", icon: "😐" },
  { value: "happy", label: "Happy", icon: "😊" },
  { value: "excited", label: "Excited", icon: "🤩" },
  { value: "sad", label: "Sad", icon: "😢" },
  { value: "angry", label: "Angry", icon: "😠" },
  { value: "fearful", label: "Fearful", icon: "😨" },
  { value: "disgusted", label: "Disgusted", icon: "🤢" },
  { value: "surprised", label: "Surprised", icon: "😲" },
  { value: "calm", label: "Calm", icon: "😌" },
  { value: "serious", label: "Serious", icon: "🧐" },
  { value: "confident", label: "Confident", icon: "💪" },
  { value: "whispering", label: "Whispering", icon: "🤫" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "pl", label: "Polish" },
  { code: "hi", label: "Hindi" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "ru", label: "Russian" },
  { code: "tr", label: "Turkish" },
  { code: "nl", label: "Dutch" },
  { code: "sv", label: "Swedish" },
];

const SCRIPT_TEMPLATES = [
  { label: "Product Ad (30s)", text: "Introducing [Product Name] — the [adjective] way to [benefit]. Whether you're [use case 1] or [use case 2], [Product Name] gives you [key feature]. Try it today and [CTA]. [Brand Name]." },
  { label: "YouTube Intro", text: "Hey everyone, welcome back to [Channel Name]! Today we're talking about [topic], and trust me — you don't want to miss this. By the end of this video, you'll know exactly how to [outcome]. Let's get into it." },
  { label: "Testimonial", text: "Before [Product Name], I was struggling with [problem]. I tried everything, but nothing worked. Then I discovered [Product Name], and within [timeframe], I [result]. It completely changed [aspect of life/work]. I can't imagine going back." },
  { label: "Explainer Video", text: "[Problem] is one of the biggest challenges facing [audience] today. That's why we built [Product Name]. [Product Name] helps you [benefit 1], [benefit 2], and [benefit 3] — all in one place. Here's how it works: [step 1], [step 2], [step 3]. Simple, powerful, and built for [audience]." },
  { label: "Podcast Intro", text: "Welcome to [Podcast Name], the show where [value proposition]. I'm your host [Name], and each week I bring you [content type] from [guest type] to help you [outcome]. Today's episode is [episode topic]. Let's dive in." },
  { label: "Sales Pitch", text: "What if you could [desired outcome] without [common obstacle]? [Product Name] makes that possible. Our [key differentiator] means you get [benefit 1] and [benefit 2] — guaranteed. Join [number] [audience type] who've already [result]. Click below to get started." },
  { label: "Social Media Ad", text: "Stop [pain point]. [Product Name] helps [audience] [achieve goal] in [timeframe]. No [obstacle 1]. No [obstacle 2]. Just [result]. Tap to learn more." },
  { label: "Documentary Narration", text: "In [year/era/place], something remarkable happened. [Scene setting]. What followed would change [subject] forever. This is the story of [topic] — told through the voices of those who lived it." },
];

export default function VoiceoverStudio() {
  const [tab, setTab] = useState("studio");
  const [script, setScript] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("rachel");
  const [emotion, setEmotion] = useState("neutral");
  const [speed, setSpeed] = useState([1.0]);
  const [stability, setStability] = useState([75]);
  const [clarity, setClarity] = useState([75]);
  const [language, setLanguage] = useState("en");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [generatedAudio, setGeneratedAudio] = useState<{ url: string; text: string; voice: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const voiceoverMut = trpc.voiceoverApi.generate.useMutation({
    onSuccess: (data: { audioUrl?: string; status?: string }) => {
      if (data.audioUrl) {
        setGeneratedAudio({ url: data.audioUrl, text: script, voice: selectedVoice });
        toast.success("Voiceover generated!");
      } else {
        toast.info("Voiceover generation started — check back in a moment");
      }
    },
    onError: () => toast.error("Voiceover generation failed. Check your ElevenLabs API key in Settings → Secrets."),
  });

  const filteredVoices = VOICES.filter(v => genderFilter === "all" || v.gender === genderFilter);
  const selectedVoiceData = VOICES.find(v => v.id === selectedVoice);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  const handleDownload = () => {
    if (!generatedAudio) return;
    const a = document.createElement("a");
    a.href = generatedAudio.url;
    a.download = `voiceover-${generatedAudio.voice}.mp3`;
    a.target = "_blank";
    a.click();
    toast.success("Download started");
  };

  const charCount = script.length;
  const estimatedDuration = Math.round(charCount / 15 / speed[0]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mic className="h-6 w-6 text-primary" /> Voiceover Studio
          </h1>
          <p className="text-muted-foreground mt-1">Convert any text to professional AI voiceovers in 16 languages with 16+ voice styles</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">ElevenLabs</Badge>
          <Badge variant="outline" className="text-xs">OpenAI TTS</Badge>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-xs">
          <TabsTrigger value="studio"><Mic className="h-4 w-4 mr-1.5" /> Studio</TabsTrigger>
          <TabsTrigger value="voices"><User className="h-4 w-4 mr-1.5" /> Voice Library</TabsTrigger>
        </TabsList>

        {/* ── Studio Tab ── */}
        <TabsContent value="studio" className="space-y-5 mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Script Input */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> Script</span>
                    <span className="text-xs font-normal text-muted-foreground">{charCount} chars · ~{estimatedDuration}s</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Type or paste your script here... Use [brackets] for pauses or emphasis."
                    value={script}
                    onChange={e => setScript(e.target.value)}
                    rows={8}
                    className="resize-none font-mono text-sm"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground self-center">Templates:</span>
                    {SCRIPT_TEMPLATES.map(t => (
                      <Button key={t.label} variant="outline" size="sm" className="h-7 text-xs" onClick={() => setScript(t.text)}>
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Generated Audio Player */}
              {generatedAudio && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-primary" /> Generated Voiceover
                      <Badge variant="outline" className="text-xs ml-auto">{selectedVoiceData?.name} · {selectedVoiceData?.accent}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <audio ref={audioRef} src={generatedAudio.url} onEnded={() => setPlaying(false)} />
                    <div className="flex items-center gap-3">
                      <Button size="icon" variant="default" className="h-10 w-10 rounded-full shrink-0" onClick={togglePlay}>
                        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <div className="flex-1 h-2 bg-muted rounded-full">
                        <div className="h-full bg-primary rounded-full w-0 transition-all" />
                      </div>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-1.5" /> Download MP3
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2 italic">"{generatedAudio.text.slice(0, 120)}{generatedAudio.text.length > 120 ? "..." : ""}"</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Voice Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Voice selector */}
                  <div>
                    <Label className="text-sm">Voice</Label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1">
                          <div className="flex gap-1 mb-1">
                            {(["all", "male", "female"] as const).map(g => (
                              <button key={g} className={`text-xs px-2 py-0.5 rounded ${genderFilter === g ? "bg-primary text-primary-foreground" : "bg-muted"}`} onClick={() => setGenderFilter(g)}>
                                {g.charAt(0).toUpperCase() + g.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                        {VOICES.filter(v => genderFilter === "all" || v.gender === genderFilter).map(v => (
                          <SelectItem key={v.id} value={v.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{v.name}</span>
                              <span className="text-xs text-muted-foreground">{v.accent} · {v.style}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedVoiceData && (
                      <p className="text-xs text-muted-foreground mt-1">{selectedVoiceData.description}</p>
                    )}
                  </div>

                  {/* Emotion */}
                  <div>
                    <Label className="text-sm">Emotion / Tone</Label>
                    <div className="grid grid-cols-3 gap-1 mt-1.5">
                      {EMOTIONS.map(e => (
                        <button
                          key={e.value}
                          className={`text-xs py-1.5 px-1 rounded border transition-colors ${emotion === e.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                          onClick={() => setEmotion(e.value)}
                        >
                          <span className="block text-base">{e.icon}</span>
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <Label className="text-sm flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Speed */}
                  <div>
                    <Label className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Speed</span>
                      <span className="font-normal text-muted-foreground">{speed[0].toFixed(1)}x</span>
                    </Label>
                    <Slider value={speed} onValueChange={setSpeed} min={0.5} max={2.0} step={0.1} className="mt-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0.5x Slow</span>
                      <span>2.0x Fast</span>
                    </div>
                  </div>

                  {/* Stability */}
                  <div>
                    <Label className="text-sm flex items-center justify-between">
                      Stability
                      <span className="font-normal text-muted-foreground">{stability[0]}%</span>
                    </Label>
                    <Slider value={stability} onValueChange={setStability} min={0} max={100} step={5} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">Higher = more consistent, lower = more expressive</p>
                  </div>

                  {/* Clarity */}
                  <div>
                    <Label className="text-sm flex items-center justify-between">
                      Clarity + Similarity
                      <span className="font-normal text-muted-foreground">{clarity[0]}%</span>
                    </Label>
                    <Slider value={clarity} onValueChange={setClarity} min={0} max={100} step={5} className="mt-2" />
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      if (!script.trim()) { toast.error("Please enter a script"); return; }
                        voiceoverMut.mutate({
                          text: script,
                          voice: selectedVoice,
                          language,
                        });
                    }}
                    disabled={voiceoverMut.isPending || !script.trim()}
                  >
                    {voiceoverMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Voiceover</>}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Voice Library Tab ── */}
        <TabsContent value="voices" className="space-y-5 mt-5">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Filter:</span>
            {(["all", "male", "female"] as const).map(g => (
              <Button key={g} variant={genderFilter === g ? "default" : "outline"} size="sm" onClick={() => setGenderFilter(g)}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Button>
            ))}
            <span className="text-xs text-muted-foreground ml-auto">{filteredVoices.length} voices</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVoices.map(voice => (
              <Card
                key={voice.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${selectedVoice === voice.id ? "border-primary bg-primary/5" : ""}`}
                onClick={() => { setSelectedVoice(voice.id); setTab("studio"); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{voice.name}</h3>
                      <p className="text-xs text-muted-foreground">{voice.accent} · {voice.style}</p>
                    </div>
                    <Badge variant={voice.gender === "male" ? "secondary" : "outline"} className="text-xs capitalize">
                      {voice.gender}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{voice.description}</p>
                  <div className="flex gap-1 flex-wrap">
                    {voice.tags.map(tag => (
                      <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3" onClick={(e) => { e.stopPropagation(); setSelectedVoice(voice.id); setTab("studio"); }}>
                    <ChevronRight className="h-3.5 w-3.5 mr-1" /> Use This Voice
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
