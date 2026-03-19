import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smile, Loader2, Sparkles, Download, Share2, Wand2, Image as ImageIcon, RefreshCw, Copy, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MEME_STYLES = [
  { id: "classic", label: "Classic Meme", desc: "Impact font, top/bottom text" },
  { id: "modern", label: "Modern", desc: "Clean design, subtle humor" },
  { id: "corporate", label: "Corporate", desc: "Professional humor for LinkedIn" },
  { id: "gen-z", label: "Gen-Z", desc: "Surreal, absurdist humor" },
  { id: "wholesome", label: "Wholesome", desc: "Feel-good, positive vibes" },
  { id: "reaction", label: "Reaction", desc: "Relatable reaction images" },
];

const MEME_TOPICS = [
  "Marketing fails", "Client requests", "Social media managers", "SEO struggles",
  "Content creation", "Analytics confusion", "Monday meetings", "Deadline panic",
  "Brand voice", "Competitor watching", "Budget cuts", "Viral dreams",
];

export default function MemeGenerator() {
  const [topic, setTopic] = useState("");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [style, setStyle] = useState<"classic" | "modern" | "corporate" | "gen-z" | "surreal">("modern");
  const [generatedMeme, setGeneratedMeme] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Generate meme with AI
  const generateMut = trpc.meme.generate.useMutation({
    onSuccess: (data: any) => {
      setGeneratedMeme(data);
      setHistory(prev => [data, ...prev].slice(0, 12));
      toast.success("Meme generated!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // AI caption generation via aiChat
  const captionMut = trpc.aiChat.send.useMutation({
    onSuccess: (data: any) => {
      const text = data.reply || data.content || "";
      const lines = text.split("\n").filter((l: string) => l.trim());
      setTopText(lines[0] || "");
      setBottomText(lines[1] || "");
      toast.success("Captions generated!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-6xl animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Smile className="h-6 w-6 text-amber-500" />Meme Generator
        </h1>
        <p className="page-subtitle">Create viral-worthy memes with AI. Generate images, captions, and share across platforms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <Card className="glass rounded-2xl">
            <CardHeader><CardTitle className="text-base">Create Your Meme</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Topic / Concept</Label>
                <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. When the client says 'make it pop'..." className="mt-1" />
              </div>

              <div className="flex flex-wrap gap-2">
                <p className="text-xs text-zinc-500 w-full">Quick topics:</p>
                {MEME_TOPICS.map(t => (
                  <Badge key={t} variant="outline" className="cursor-pointer hover:bg-accent text-xs" onClick={() => setTopic(t)}>{t}</Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Top Text</Label>
                  <Input value={topText} onChange={e => setTopText(e.target.value)} placeholder="Top caption..." className="mt-1" />
                </div>
                <div>
                  <Label>Bottom Text</Label>
                  <Input value={bottomText} onChange={e => setBottomText(e.target.value)} placeholder="Bottom caption..." className="mt-1" />
                </div>
              </div>

              <div>
                <Label>Style</Label>
                <Select value={style} onValueChange={(v: any) => setStyle(v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEME_STYLES.map(s => <SelectItem key={s.id} value={s.id}>{s.label} — {s.desc}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" disabled={!topic || captionMut.isPending}
                  onClick={() => captionMut.mutate({ message: `Generate meme captions for: ${topic}. Style: ${style}. Return exactly 2 lines: line 1 is top text, line 2 is bottom text. Keep each under 10 words. Make it funny and viral.` })}>
                  {captionMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  AI Captions
                </Button>
                <Button className="flex-1" disabled={!topic || generateMut.isPending}
                  onClick={() => generateMut.mutate({ topic, style })}>
                  {generateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  Generate Meme
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <Card className="glass rounded-2xl">
            <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
            <CardContent>
              {generatedMeme?.imageUrl ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img src={generatedMeme.imageUrl} alt="Generated meme" className="w-full rounded-lg" />
                    {(generatedMeme.topText || topText) && (
                      <div className="absolute top-4 left-0 right-0 text-center">
                        <span className="text-white text-2xl font-black uppercase" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8), -2px -2px 4px rgba(0,0,0,0.8)" }}>
                          {generatedMeme.topText || topText}
                        </span>
                      </div>
                    )}
                    {(generatedMeme.bottomText || bottomText) && (
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span className="text-white text-2xl font-black uppercase" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8), -2px -2px 4px rgba(0,0,0,0.8)" }}>
                          {generatedMeme.bottomText || bottomText}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => window.open(generatedMeme.imageUrl, "_blank")}>
                      <Download className="h-4 w-4 mr-2" />Download
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(generatedMeme.imageUrl); toast.success("URL copied!"); }}>
                      <Copy className="h-4 w-4 mr-2" />Copy URL
                    </Button>
                    <Button variant="outline" onClick={() => generateMut.mutate({ topic, style })}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-zinc-900/40 rounded-lg flex items-center justify-center">
                  <div className="text-center p-6">
                    <Smile className="h-12 w-12 mx-auto text-zinc-500/30 mb-3" />
                    <p className="text-sm text-zinc-500">Your meme will appear here</p>
                    <p className="text-xs text-zinc-500 mt-1">AI-generated image + text overlay</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <Card className="glass rounded-2xl">
          <CardHeader><CardTitle className="text-base">Recent Memes</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {history.map((meme, i) => (
                <div key={i} className="relative group cursor-pointer" onClick={() => setGeneratedMeme(meme)}>
                  {meme.imageUrl ? (
                    <img src={meme.imageUrl} alt={`Meme ${i}`} className="w-full aspect-square object-cover rounded-lg" />
                  ) : (
                    <div className="w-full aspect-square bg-zinc-800 rounded-lg flex items-center justify-center">
                      <Smile className="h-6 w-6 text-zinc-500/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
