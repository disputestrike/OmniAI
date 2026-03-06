import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Video, Loader2, Sparkles, Play, Download, Mic, Globe, Wand2, Film, Camera, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const AVATAR_STYLES = [
  { id: "professional", label: "Professional", desc: "Business attire, office background" },
  { id: "casual", label: "Casual", desc: "Relaxed, lifestyle setting" },
  { id: "creator", label: "Content Creator", desc: "Ring light, desk setup" },
  { id: "presenter", label: "Presenter", desc: "Stage/studio background" },
  { id: "spokesperson", label: "Spokesperson", desc: "Brand representative look" },
];

const LANGUAGES = [
  { id: "en", label: "English" }, { id: "es", label: "Spanish" }, { id: "fr", label: "French" },
  { id: "de", label: "German" }, { id: "pt", label: "Portuguese" }, { id: "ja", label: "Japanese" },
  { id: "ko", label: "Korean" }, { id: "zh", label: "Chinese" }, { id: "ar", label: "Arabic" },
  { id: "hi", label: "Hindi" },
];

export default function AiAvatars() {
  const [script, setScript] = useState("");
  const [avatarStyle, setAvatarStyle] = useState("professional");
  const [language, setLanguage] = useState("en");
  const [voiceGender, setVoiceGender] = useState<"male" | "female">("female");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("9:16");
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [generatedVoiceover, setGeneratedVoiceover] = useState<any>(null);
  const [tab, setTab] = useState("avatar");

  // AI Avatar generation
  const avatarMut = trpc.avatar.generate.useMutation({
    onSuccess: (data: any) => {
      setGeneratedVideo(data);
      toast.success("AI Avatar video generated!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Voiceover generation
  const voiceoverMut = trpc.voiceoverApi.generate.useMutation({
    onSuccess: (data: any) => {
      setGeneratedVoiceover(data);
      toast.success("Voiceover generated!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Script generation with AI
  const scriptMut = trpc.aiChat.send.useMutation({
    onSuccess: (data: any) => {
      setScript(data.reply || data.content || "");
      toast.success("Script generated!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-violet-500" />AI Avatars & UGC Videos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Create AI-generated spokesperson videos, UGC-style content, and professional voiceovers.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="avatar"><User className="h-4 w-4 mr-2" />AI Avatar Video</TabsTrigger>
          <TabsTrigger value="voiceover"><Mic className="h-4 w-4 mr-2" />AI Voiceover</TabsTrigger>
          <TabsTrigger value="ugc"><Camera className="h-4 w-4 mr-2" />UGC Style</TabsTrigger>
        </TabsList>

        {/* AI Avatar Video Tab */}
        <TabsContent value="avatar" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Create Avatar Video</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Script</Label>
                  <Textarea value={script} onChange={e => setScript(e.target.value)} placeholder="Write or generate a script for your AI avatar to speak..." rows={6} className="mt-1" />
                  <Button variant="outline" size="sm" className="mt-2" disabled={scriptMut.isPending}
                    onClick={() => scriptMut.mutate({ message: "Write a 30-second product promotion script for a social media ad. Make it engaging, conversational, and include a clear call-to-action. Keep it under 100 words." })}>
                    {scriptMut.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
                    Generate Script with AI
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Avatar Style</Label>
                    <Select value={avatarStyle} onValueChange={setAvatarStyle}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AVATAR_STYLES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Voice</Label>
                    <Select value={voiceGender} onValueChange={(v: any) => setVoiceGender(v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
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

                <Button className="w-full" disabled={!script || avatarMut.isPending}
                  onClick={() => avatarMut.mutate({ script, style: avatarStyle as any, language, aspectRatio })}>
                  {avatarMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating Avatar Video...</> : <><Film className="h-4 w-4 mr-2" />Generate AI Avatar Video</>}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
              <CardContent>
                {generatedVideo ? (
                  <div className="space-y-4">
                    {generatedVideo.videoUrl ? (
                      <video src={generatedVideo.videoUrl} controls className="w-full rounded-lg" />
                    ) : generatedVideo.thumbnailUrl ? (
                      <img src={generatedVideo.thumbnailUrl} alt="Avatar" className="w-full rounded-lg" />
                    ) : (
                      <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center p-4">
                          <Sparkles className="h-8 w-8 mx-auto text-violet-500 mb-2" />
                          <p className="text-sm font-medium">Video Processing</p>
                          <p className="text-xs text-muted-foreground mt-1">Task ID: {generatedVideo.taskId}</p>
                          <p className="text-xs text-muted-foreground">Status: {generatedVideo.status}</p>
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
                  <div className="aspect-[9/16] bg-muted/50 rounded-lg flex items-center justify-center">
                    <div className="text-center p-6">
                      <User className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Your AI avatar video will appear here</p>
                      <p className="text-xs text-muted-foreground mt-1">Powered by HeyGen AI</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Voiceover Tab */}
        <TabsContent value="voiceover" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Generate Voiceover</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Text to Speak</Label>
                  <Textarea value={script} onChange={e => setScript(e.target.value)} placeholder="Enter the text you want converted to speech..." rows={6} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Voice</Label>
                    <Select value={voiceGender} onValueChange={(v: any) => setVoiceGender(v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female (Rachel)</SelectItem>
                        <SelectItem value="male">Male (Adam)</SelectItem>
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
                  onClick={() => voiceoverMut.mutate({ text: script, voice: voiceGender === "female" ? "rachel" : "adam" })}>
                  {voiceoverMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating...</> : <><Mic className="h-4 w-4 mr-2" />Generate Voiceover</>}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Audio Preview</CardTitle></CardHeader>
              <CardContent>
                {generatedVoiceover?.audioUrl ? (
                  <div className="space-y-4">
                    <audio src={generatedVoiceover.audioUrl} controls className="w-full" />
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Duration: {generatedVoiceover.durationMs ? `${(generatedVoiceover.durationMs / 1000).toFixed(1)}s` : "N/A"}</div>
                      <div>Provider: {generatedVoiceover.provider || "ElevenLabs"}</div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => window.open(generatedVoiceover.audioUrl, "_blank")}>
                      <Download className="h-4 w-4 mr-2" />Download Audio
                    </Button>
                  </div>
                ) : (
                  <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
                    <div className="text-center p-6">
                      <Mic className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Your voiceover will appear here</p>
                      <p className="text-xs text-muted-foreground mt-1">Powered by ElevenLabs / OpenAI TTS</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* UGC Style Tab */}
        <TabsContent value="ugc" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-xl hover:border-violet-300 transition-colors cursor-pointer"
                  onClick={() => { setTab("avatar"); setAvatarStyle("creator"); toast.info("Set to Content Creator style"); }}>
                  <Camera className="h-10 w-10 mx-auto text-violet-500 mb-3" />
                  <h3 className="font-semibold">Product Review</h3>
                  <p className="text-xs text-muted-foreground mt-1">AI creator reviews your product naturally</p>
                </div>
                <div className="text-center p-6 border rounded-xl hover:border-violet-300 transition-colors cursor-pointer"
                  onClick={() => { setTab("avatar"); setAvatarStyle("casual"); toast.info("Set to Casual style"); }}>
                  <Users className="h-10 w-10 mx-auto text-pink-500 mb-3" />
                  <h3 className="font-semibold">Testimonial</h3>
                  <p className="text-xs text-muted-foreground mt-1">Authentic-feeling customer testimonial</p>
                </div>
                <div className="text-center p-6 border rounded-xl hover:border-violet-300 transition-colors cursor-pointer"
                  onClick={() => { setTab("avatar"); setAvatarStyle("spokesperson"); toast.info("Set to Spokesperson style"); }}>
                  <Video className="h-10 w-10 mx-auto text-blue-500 mb-3" />
                  <h3 className="font-semibold">How-To / Tutorial</h3>
                  <p className="text-xs text-muted-foreground mt-1">Step-by-step guide with AI presenter</p>
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
      </Tabs>
    </div>
  );
}
