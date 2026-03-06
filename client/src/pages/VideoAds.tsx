import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Video, Loader2, Sparkles, Trash2, Clock, Film, MessageSquare, Globe, Users, Smile, Zap, Languages, Copy, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const platformOptions = [
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "youtube_shorts", label: "YouTube Shorts", icon: "📱" },
  { value: "instagram_reels", label: "Instagram Reels", icon: "📸" },
  { value: "youtube", label: "YouTube", icon: "▶️" },
  { value: "facebook", label: "Facebook", icon: "📘" },
  { value: "snapchat", label: "Snapchat", icon: "👻" },
  { value: "pinterest", label: "Pinterest", icon: "📌" },
];

const emotionOptions = [
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "excited", label: "Excited", emoji: "🤩" },
  { value: "urgent", label: "Urgent", emoji: "⚡" },
  { value: "calm", label: "Calm", emoji: "😌" },
  { value: "surprised", label: "Surprised", emoji: "😲" },
  { value: "empathetic", label: "Empathetic", emoji: "🤗" },
  { value: "authoritative", label: "Authoritative", emoji: "💪" },
];

const adPresets = [
  { value: "ugc_testimonial", label: "UGC Testimonial", desc: "Authentic user review style" },
  { value: "product_demo", label: "Product Demo", desc: "Show product in action" },
  { value: "before_after", label: "Before & After", desc: "Transformation story" },
  { value: "problem_solution", label: "Problem → Solution", desc: "Pain point to relief" },
  { value: "listicle", label: "Listicle / Top N", desc: "Numbered tips or reasons" },
  { value: "unboxing", label: "Unboxing", desc: "First impressions reveal" },
  { value: "tutorial", label: "Tutorial / How-To", desc: "Step-by-step guide" },
  { value: "comparison", label: "Comparison", desc: "Us vs. them breakdown" },
  { value: "trending_sound", label: "Trending Sound", desc: "Ride a viral trend" },
  { value: "custom", label: "Custom", desc: "Your own direction" },
];

const languages = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Japanese", "Korean",
  "Mandarin", "Cantonese", "Hindi", "Arabic", "Russian", "Dutch", "Swedish", "Turkish",
  "Polish", "Thai", "Vietnamese", "Indonesian", "Malay", "Swahili", "Hebrew", "Greek",
  "Czech", "Romanian", "Hungarian", "Danish", "Norwegian", "Finnish",
];

export default function VideoAds() {
  const utils = trpc.useUtils();
  const { data: videoAds, isLoading } = trpc.videoAd.list.useQuery();
  const { data: products } = trpc.product.list.useQuery();
  const { data: actorsData } = trpc.videoAd.getActors.useQuery();
  const generateMut = trpc.videoAd.generate.useMutation({
    onSuccess: () => { utils.videoAd.list.invalidate(); setCreateOpen(false); toast.success("Video ad script generated!"); },
    onError: (e) => toast.error(e.message),
  });
  const localizeMut = trpc.videoAd.localize.useMutation({
    onSuccess: () => { utils.videoAd.list.invalidate(); toast.success("Video localized!"); },
    onError: (e) => toast.error(e.message),
  });
  const createAvatarMut = trpc.videoAd.createAvatar.useMutation({
    onSuccess: (data) => { toast.success(`Avatar "${data.name}" created!`); setAvatarOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.videoAd.delete.useMutation({ onSuccess: () => { utils.videoAd.list.invalidate(); toast.success("Deleted"); } });

  const [createOpen, setCreateOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [localizeOpen, setLocalizeOpen] = useState<number | null>(null);
  const [platform, setPlatform] = useState("tiktok");
  const [duration, setDuration] = useState("30");
  const [productId, setProductId] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [emotion, setEmotion] = useState("excited");
  const [adPreset, setAdPreset] = useState("ugc_testimonial");
  const [language, setLanguage] = useState("English");
  const [selectedActor, setSelectedActor] = useState("");
  const [includeSubtitles, setIncludeSubtitles] = useState(true);
  const [includeBroll, setIncludeBroll] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [localizeLanguage, setLocalizeLanguage] = useState("Spanish");

  // Avatar creation
  const [avatarName, setAvatarName] = useState("");
  const [avatarDesc, setAvatarDesc] = useState("");
  const [avatarGender, setAvatarGender] = useState("female");
  const [avatarAge, setAvatarAge] = useState("25-35");
  const [avatarStyle, setAvatarStyle] = useState("professional");

  const analyzedProducts = useMemo(() => products?.filter(p => p.analysisStatus === "completed") ?? [], [products]);
  const actors = actorsData?.actors ?? [];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleExportScript = (video: any) => {
    const content = `# Video Ad Script\nPlatform: ${video.platform}\nDuration: ${video.duration}s\n\n## Script\n${video.script}\n\n## Voiceover\n${video.voiceoverText}\n\n## Storyboard\n${(video.storyboard as any[])?.map((s: any, i: number) => `Scene ${i + 1}: ${s.description} (${s.duration})`).join("\n")}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `video-ad-${video.platform}-${video.id}.md`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Video Ad Studio</h1>
          <p className="text-muted-foreground mt-1">AI-powered video ad creation with AI actors, emotion control, multi-language support, and proven ad presets.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Users className="h-4 w-4 mr-2" />Create AI Avatar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Custom AI Avatar</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Avatar Name</Label><Input value={avatarName} onChange={e => setAvatarName(e.target.value)} placeholder="e.g., Jessica" /></div>
                <div><Label>Description</Label><Textarea value={avatarDesc} onChange={e => setAvatarDesc(e.target.value)} placeholder="Describe appearance: young woman with curly brown hair, warm smile, casual outfit..." rows={3} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Gender</Label>
                    <Select value={avatarGender} onValueChange={setAvatarGender}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="female">Female</SelectItem><SelectItem value="male">Male</SelectItem><SelectItem value="non_binary">Non-Binary</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Age Range</Label>
                    <Select value={avatarAge} onValueChange={setAvatarAge}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="18-25">18-25</SelectItem><SelectItem value="25-35">25-35</SelectItem><SelectItem value="35-50">35-50</SelectItem><SelectItem value="50+">50+</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Style</Label>
                    <Select value={avatarStyle} onValueChange={setAvatarStyle}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="professional">Professional</SelectItem><SelectItem value="casual">Casual</SelectItem><SelectItem value="influencer">Influencer</SelectItem><SelectItem value="corporate">Corporate</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" disabled={createAvatarMut.isPending || !avatarName || !avatarDesc} onClick={() => createAvatarMut.mutate({ name: avatarName, description: avatarDesc, gender: avatarGender, ageRange: avatarAge, style: avatarStyle, languages: ["English"] })}>
                  {createAvatarMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Avatar</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Sparkles className="h-4 w-4 mr-2" />Create Video Ad</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Generate AI Video Ad</DialogTitle></DialogHeader>
              <Tabs defaultValue="basics" className="space-y-4">
                <TabsList className="w-full">
                  <TabsTrigger value="basics" className="flex-1">Basics</TabsTrigger>
                  <TabsTrigger value="actor" className="flex-1">AI Actor</TabsTrigger>
                  <TabsTrigger value="style" className="flex-1">Style & Emotion</TabsTrigger>
                  <TabsTrigger value="options" className="flex-1">Options</TabsTrigger>
                </TabsList>

                <TabsContent value="basics" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Platform</Label>
                      <Select value={platform} onValueChange={setPlatform}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{platformOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Duration (seconds)</Label>
                      <Input type="number" min={5} max={180} value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>
                  </div>
                  <div><Label>Ad Preset</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {adPresets.map(p => (
                        <button key={p.value} onClick={() => setAdPreset(p.value)}
                          className={`text-left p-3 rounded-lg border transition-all ${adPreset === p.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
                          <div className="text-sm font-medium">{p.label}</div>
                          <div className="text-xs text-muted-foreground">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {analyzedProducts.length > 0 && (
                    <div><Label>Based on Product (optional)</Label>
                      <Select value={productId} onValueChange={setProductId}><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>{analyzedProducts.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="actor" className="space-y-4">
                  <Label>Select AI Actor</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setSelectedActor("")}
                      className={`text-left p-3 rounded-lg border transition-all ${!selectedActor ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
                      <div className="text-sm font-medium">No Actor (Voiceover Only)</div>
                      <div className="text-xs text-muted-foreground">Clean narration without avatar</div>
                    </button>
                    {actors.map(actor => (
                      <button key={actor.id} onClick={() => setSelectedActor(actor.id)}
                        className={`text-left p-3 rounded-lg border transition-all ${selectedActor === actor.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10">{actor.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{actor.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">{actor.style.replace("_", " ")} · {actor.gender}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {actor.languages.slice(0, 3).map(l => <Badge key={l} variant="secondary" className="text-[10px] px-1">{l}</Badge>)}
                          {actor.languages.length > 3 && <Badge variant="secondary" className="text-[10px] px-1">+{actor.languages.length - 3}</Badge>}
                        </div>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="style" className="space-y-4">
                  <div><Label>Emotion / Tone</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {emotionOptions.map(e => (
                        <button key={e.value} onClick={() => setEmotion(e.value)}
                          className={`p-3 rounded-lg border text-center transition-all ${emotion === e.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
                          <div className="text-2xl mb-1">{e.emoji}</div>
                          <div className="text-xs font-medium">{e.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><Label>Language</Label>
                    <Select value={language} onValueChange={setLanguage}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{languages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Custom Direction (optional)</Label>
                    <Textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Describe specific style, mood, target audience, key messages, or references..." rows={3} />
                  </div>
                </TabsContent>

                <TabsContent value="options" className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div><div className="text-sm font-medium">Auto Subtitles / Captions</div><div className="text-xs text-muted-foreground">Add captions for accessibility and engagement</div></div>
                    <Switch checked={includeSubtitles} onCheckedChange={setIncludeSubtitles} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div><div className="text-sm font-medium">B-Roll Suggestions</div><div className="text-xs text-muted-foreground">Include B-roll visual suggestions in storyboard</div></div>
                    <Switch checked={includeBroll} onCheckedChange={setIncludeBroll} />
                  </div>
                </TabsContent>
              </Tabs>

              <Button className="w-full mt-4" disabled={generateMut.isPending} onClick={() => generateMut.mutate({
                platform: platform as any,
                duration: Number(duration),
                productId: productId ? Number(productId) : undefined,
                customPrompt: customPrompt || undefined,
                emotion: emotion as any,
                adPreset: adPreset as any,
                language,
                avatarName: selectedActor || undefined,
                includeSubtitles,
                includeBroll,
              })}>
                {generateMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating AI Video Ad...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Video Ad</>}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Actor Showcase */}
      {actors.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> AI Actor Library</CardTitle>
            <CardDescription>Select from diverse AI actors for your video ads — or create your own custom avatar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {actors.map(actor => (
                <div key={actor.id} className="flex flex-col items-center gap-1 min-w-[80px]">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-lg">{actor.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{actor.name}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{actor.style.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Ads List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-6 h-48" /></Card>)}</div>
      ) : !videoAds?.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg">No video ads yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Generate AI video ad scripts with AI actors, emotion control, storyboards, and multi-language support for any platform.</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}><Sparkles className="h-4 w-4 mr-2" />Create Your First Video Ad</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videoAds.map(video => {
            const isExpanded = expandedId === video.id;
            const storyboard = video.storyboard as any[];
            const metadata = video.metadata as any;
            return (
              <Card key={video.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt="Thumbnail" className="h-20 w-28 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-20 w-28 rounded-lg bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center shrink-0">
                        <Film className="h-8 w-8 text-violet-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {platformOptions.find(p => p.value === video.platform)?.icon} {platformOptions.find(p => p.value === video.platform)?.label || video.platform}
                        </Badge>
                        <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{video.duration}s</Badge>
                        {metadata?.language && metadata.language !== "English" && (
                          <Badge variant="outline" className="text-xs"><Globe className="h-3 w-3 mr-1" />{metadata.language}</Badge>
                        )}
                      </div>
                      {metadata?.hook && <p className="text-sm font-medium mt-1 line-clamp-2">"{metadata.hook}"</p>}
                      {metadata?.cta && <p className="text-xs text-muted-foreground mt-1">CTA: {metadata.cta}</p>}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setExpandedId(isExpanded ? null : video.id)}>
                      {isExpanded ? "Hide Details" : "View Script"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setLocalizeOpen(localizeOpen === video.id ? null : video.id)}>
                      <Languages className="h-3.5 w-3.5 mr-1" />Localize
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExportScript(video)}>
                      <Download className="h-3.5 w-3.5 mr-1" />Export
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMut.mutate({ id: video.id })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Localize Panel */}
                  {localizeOpen === video.id && (
                    <div className="border-t pt-3 flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs">Target Language</Label>
                        <Select value={localizeLanguage} onValueChange={setLocalizeLanguage}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>{languages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" disabled={localizeMut.isPending} onClick={() => localizeMut.mutate({ videoAdId: video.id, targetLanguage: localizeLanguage })}>
                        {localizeMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Globe className="h-3.5 w-3.5 mr-1" />Translate</>}
                      </Button>
                    </div>
                  )}

                  {/* Expanded Script & Storyboard */}
                  {isExpanded && (
                    <div className="border-t pt-4 space-y-4">
                      {video.voiceoverText && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />Voiceover</h4>
                            <Button size="sm" variant="ghost" onClick={() => handleCopy(video.voiceoverText || "")}><Copy className="h-3.5 w-3.5" /></Button>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{video.voiceoverText}</p>
                        </div>
                      )}
                      {video.script && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium flex items-center gap-2"><Film className="h-4 w-4 text-violet-500" />Full Script</h4>
                            <Button size="sm" variant="ghost" onClick={() => handleCopy(video.script || "")}><Copy className="h-3.5 w-3.5" /></Button>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{video.script}</p>
                        </div>
                      )}
                      {storyboard?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium flex items-center gap-2 mb-2"><Zap className="h-4 w-4 text-orange-500" />Storyboard ({storyboard.length} scenes)</h4>
                          <div className="space-y-2">
                            {storyboard.map((scene: any, i: number) => (
                              <div key={i} className="flex gap-3 bg-muted/30 p-3 rounded-lg">
                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{i + 1}</div>
                                <div className="min-w-0">
                                  <p className="text-sm">{scene.description}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{scene.duration}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
