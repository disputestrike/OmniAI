import { useState, useCallback, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Link2, Upload, FileText, Image, Video, Music, Loader2, Sparkles,
  RefreshCw, Copy, Check, Scissors, MessageSquare, Share2, Wand2,
  Globe, Instagram, Youtube, Twitter, Facebook, Linkedin, Hash,
  ArrowRight, Download, Eye, Zap, FileImage, Film, PenTool, Send,
  ChevronDown, ChevronUp, X, AlertCircle, CheckCircle2
} from "lucide-react";

const REMIX_FORMATS = [
  { value: "ad_copy_short", label: "Short Ad Copy", icon: "📢" },
  { value: "ad_copy_long", label: "Long Ad Copy", icon: "📝" },
  { value: "social_caption", label: "Social Caption", icon: "💬" },
  { value: "instagram_caption", label: "Instagram Caption", icon: "📸" },
  { value: "tiktok_script", label: "TikTok Script", icon: "🎵" },
  { value: "twitter_thread", label: "Twitter Thread", icon: "🐦" },
  { value: "linkedin_article", label: "LinkedIn Article", icon: "💼" },
  { value: "blog_post", label: "Blog Post", icon: "📰" },
  { value: "video_script", label: "Video Script", icon: "🎬" },
  { value: "email_copy", label: "Email Copy", icon: "📧" },
  { value: "story_content", label: "Story Content", icon: "📱" },
  { value: "ugc_script", label: "UGC Script", icon: "🎤" },
  { value: "youtube_description", label: "YouTube Description", icon: "▶️" },
];

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "tiktok", label: "TikTok", icon: Music },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "twitter", label: "Twitter/X", icon: Twitter },
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
];

const VISUAL_TYPES = [
  { value: "ad_image", label: "Ad Image (1200x628)" },
  { value: "social_graphic", label: "Social Graphic (1080x1080)" },
  { value: "thumbnail", label: "Thumbnail (1280x720)" },
  { value: "story", label: "Story (1080x1920)" },
  { value: "banner", label: "Banner (1920x480)" },
];

type IngestResult = {
  type: "url" | "file";
  platform?: any;
  analysis?: any;
  scraped?: any;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileType?: string;
  extractedText?: string;
  transcript?: any;
  imageAnalysis?: any;
};

export default function ContentIngest() {
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState("url");
  const [result, setResult] = useState<IngestResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Remix state
  const [remixOpen, setRemixOpen] = useState(false);
  const [remixFormat, setRemixFormat] = useState("social_caption");
  const [remixPlatform, setRemixPlatform] = useState("");
  const [remixTone, setRemixTone] = useState("");
  const [remixInstructions, setRemixInstructions] = useState("");
  const [remixResult, setRemixResult] = useState<any>(null);

  // Batch remix state
  const [batchRemixOpen, setBatchRemixOpen] = useState(false);
  const [batchFormats, setBatchFormats] = useState<string[]>([]);

  // Caption state
  const [captionOpen, setCaptionOpen] = useState(false);
  const [captionResult, setCaptionResult] = useState<any>(null);
  const [captionPlatform, setCaptionPlatform] = useState("");
  const [captionTone, setCaptionTone] = useState("");

  // Clip moments state
  const [clipResult, setClipResult] = useState<any>(null);
  const [clipOpen, setClipOpen] = useState(false);

  // Visual generation state
  const [visualOpen, setVisualOpen] = useState(false);
  const [visualType, setVisualType] = useState("social_graphic");
  const [visualResult, setVisualResult] = useState<any>(null);

  // Quick post state
  const [postOpen, setPostOpen] = useState(false);
  const [postPlatforms, setPostPlatforms] = useState<string[]>([]);
  const [postContent, setPostContent] = useState("");

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    analysis: true, captions: true, viral: true, remixes: true,
  });

  const [copiedId, setCopiedId] = useState("");

  const processUrlMut = trpc.ingest.processUrl.useMutation({
    onSuccess: (data) => {
      setResult({ type: "url", ...data });
      toast.success("Content analyzed successfully!");
    },
    onError: (err) => toast.error(err.message),
  });

  const processFileMut = trpc.ingest.processFile.useMutation({
    onSuccess: (data) => {
      setResult({ type: "file", ...data });
      toast.success(`${data.fileType} processed successfully!`);
    },
    onError: (err) => toast.error(err.message),
  });

  const quickRemixMut = trpc.ingest.quickRemix.useMutation({
    onSuccess: (data) => {
      setRemixResult(data);
      toast.success("Content remixed!");
    },
    onError: (err) => toast.error(err.message),
  });

  const batchRemixMut = trpc.ingest.batchRemix.useMutation({
    onSuccess: (data) => {
      toast.success(`Created ${data.count} remixed versions!`);
      setBatchRemixOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const generateCaptionsMut = trpc.ingest.generateCaptions.useMutation({
    onSuccess: (data) => {
      setCaptionResult(data);
      toast.success("Captions generated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const identifyClipsMut = trpc.ingest.identifyClipMoments.useMutation({
    onSuccess: (data) => {
      setClipResult(data);
      setClipOpen(true);
      toast.success("Clip moments identified!");
    },
    onError: (err) => toast.error(err.message),
  });

  const generateVisualMut = trpc.ingest.generateVisual.useMutation({
    onSuccess: (data) => {
      setVisualResult(data);
      toast.success("Visual generated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const quickPostMut = trpc.ingest.quickPost.useMutation({
    onSuccess: (data) => {
      toast.success(`Scheduled to ${data.count} platforms!`);
      setPostOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCopy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied!");
    setTimeout(() => setCopiedId(""), 2000);
  }, []);

  const handleUrlSubmit = () => {
    if (!url.trim()) return;
    processUrlMut.mutate({ url: url.trim() });
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Maximum 50MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      processFileMut.mutate({
        fileBase64: base64,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const getSourceContent = useMemo(() => {
    if (!result) return "";
    if (result.type === "url") {
      return result.analysis?.originalText || result.scraped?.description || result.scraped?.textPreview || "";
    }
    if (result.type === "file") {
      if (result.imageAnalysis?.description) return result.imageAnalysis.description;
      if (result.transcript?.text) return result.transcript.text;
      if (result.extractedText) return result.extractedText;
    }
    return "";
  }, [result]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleBatchFormat = (format: string) => {
    setBatchFormats(prev => prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]);
  };

  const togglePostPlatform = (platform: string) => {
    setPostPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]);
  };

  const isProcessing = processUrlMut.isPending || processFileMut.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Ingest</h1>
        <p className="text-muted-foreground mt-1">
          Paste any URL, upload any file — AI extracts, analyzes, and lets you remix, caption, clip, and repost instantly.
        </p>
      </div>

      {/* Input Section */}
      <Card className="border-2 border-dashed border-primary/20">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="url" className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" />Paste URL
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" />Upload File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="Paste any URL: YouTube, Instagram, TikTok, Twitter, articles, blogs..."
                  className="flex-1"
                  onKeyDown={e => e.key === "Enter" && handleUrlSubmit()}
                />
                <Button onClick={handleUrlSubmit} disabled={isProcessing || !url.trim()}>
                  {processUrlMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Analyze
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Youtube, label: "YouTube", color: "text-red-500" },
                  { icon: Instagram, label: "Instagram", color: "text-pink-500" },
                  { icon: Music, label: "TikTok", color: "text-foreground" },
                  { icon: Twitter, label: "Twitter/X", color: "text-sky-500" },
                  { icon: Facebook, label: "Facebook", color: "text-blue-600" },
                  { icon: Linkedin, label: "LinkedIn", color: "text-blue-700" },
                  { icon: Globe, label: "Any Website", color: "text-emerald-500" },
                ].map(p => (
                  <Badge key={p.label} variant="outline" className="text-xs gap-1 py-1">
                    <p.icon className={`h-3 w-3 ${p.color}`} />{p.label}
                  </Badge>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="file">
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/40"}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                />
                {processFileMut.isPending ? (
                  <div className="space-y-3">
                    <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                    <p className="text-lg font-medium">Processing your file...</p>
                    <p className="text-sm text-muted-foreground">AI is analyzing the content</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-lg font-medium">Drop any file here or click to browse</p>
                    <p className="text-sm text-muted-foreground">Videos, images, PDFs, documents — up to 50MB</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-3">
                      {[
                        { icon: Video, label: "Videos", desc: "MP4, WebM, MOV" },
                        { icon: Image, label: "Images", desc: "PNG, JPG, WebP" },
                        { icon: Music, label: "Audio", desc: "MP3, WAV, M4A" },
                        { icon: FileText, label: "Documents", desc: "PDF, DOCX, TXT" },
                      ].map(t => (
                        <Badge key={t.label} variant="outline" className="text-xs gap-1 py-1.5 px-3">
                          <t.icon className="h-3 w-3" />{t.label} <span className="text-muted-foreground">({t.desc})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {/* Quick Actions Bar */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Quick Actions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="default" onClick={() => { setRemixOpen(true); setRemixResult(null); }}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />Remix
                  </Button>
                  <Button size="sm" variant="default" onClick={() => { setBatchRemixOpen(true); setBatchFormats([]); }}>
                    <Wand2 className="h-3.5 w-3.5 mr-1" />Batch Remix
                  </Button>
                  {(result.transcript?.text || result.extractedText || result.analysis?.originalText) && (
                    <Button size="sm" variant="secondary" onClick={() => { setCaptionOpen(true); setCaptionResult(null); }}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />Auto-Caption
                    </Button>
                  )}
                  {result.transcript?.text && (
                    <Button size="sm" variant="secondary" disabled={identifyClipsMut.isPending}
                      onClick={() => identifyClipsMut.mutate({
                        transcript: result.transcript.text,
                        segments: result.transcript.segments,
                      })}>
                      {identifyClipsMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Scissors className="h-3.5 w-3.5 mr-1" />}
                      Find Clips
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => { setVisualOpen(true); setVisualResult(null); }}>
                    <FileImage className="h-3.5 w-3.5 mr-1" />Generate Visual
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setPostOpen(true); setPostContent(getSourceContent.substring(0, 500)); setPostPlatforms([]); }}>
                    <Send className="h-3.5 w-3.5 mr-1" />Quick Post
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleCopy("source", getSourceContent)}>
                    {copiedId === "source" ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* URL Result */}
          {result.type === "url" && result.analysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Source Info */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4" />Source Content
                    </CardTitle>
                    {result.platform && (
                      <Badge variant="outline" className="capitalize">{result.platform.platform} {result.platform.type}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.scraped?.ogImage && (
                    <img src={result.scraped.ogImage} alt="" className="w-full rounded-lg max-h-48 object-cover" />
                  )}
                  <h3 className="font-semibold">{result.analysis.title || result.scraped?.title}</h3>
                  <p className="text-sm text-muted-foreground">{result.analysis.summary}</p>
                  {result.scraped?.author && (
                    <p className="text-xs text-muted-foreground">By: {result.scraped.author}</p>
                  )}
                  {result.analysis.tone && (
                    <div className="flex gap-2">
                      <Badge variant="secondary">Tone: {result.analysis.tone}</Badge>
                      <Badge variant="secondary">For: {result.analysis.targetAudience}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Viral Elements */}
              <Card>
                <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection("viral")}>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" />Viral Elements</span>
                    {expandedSections.viral ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
                {expandedSections.viral && (
                  <CardContent className="space-y-3">
                    {result.analysis.viralElements?.map((el: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{el}</span>
                      </div>
                    ))}
                    {result.analysis.keyPoints?.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Key Takeaways:</p>
                        {result.analysis.keyPoints.map((kp: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <span>{kp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Ready-to-Use Captions */}
              {result.analysis.captionSuggestions?.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection("captions")}>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-500" />Ready-to-Use Captions</span>
                      {expandedSections.captions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CardTitle>
                  </CardHeader>
                  {expandedSections.captions && (
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {result.analysis.captionSuggestions.map((cap: string, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/50 border text-sm relative group">
                            <p className="pr-8">{cap}</p>
                            <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleCopy(`cap-${i}`, cap)}>
                              {copiedId === `cap-${i}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Suggested Remixes */}
              {result.analysis.suggestedRemixes?.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection("remixes")}>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-purple-500" />Remix Suggestions</span>
                      {expandedSections.remixes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CardTitle>
                  </CardHeader>
                  {expandedSections.remixes && (
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {result.analysis.suggestedRemixes.map((remix: any, i: number) => (
                          <button key={i} className="p-3 rounded-lg border text-left hover:border-primary/40 hover:bg-primary/5 transition-all"
                            onClick={() => {
                              setRemixFormat(remix.format === "ad_copy" ? "ad_copy_short" : remix.format || "social_caption");
                              setRemixOpen(true);
                              setRemixResult(null);
                            }}>
                            <p className="font-medium text-sm capitalize">{(remix.format || "").replace(/_/g, " ")}</p>
                            <p className="text-xs text-muted-foreground mt-1">{remix.description}</p>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Best Moments (for video content) */}
              {result.analysis.bestMoments?.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-orange-500" />Best Moments for Clips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.analysis.bestMoments.map((moment: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border text-sm">
                          <Badge variant="outline" className="shrink-0">Clip {i + 1}</Badge>
                          <span className="flex-1">{moment}</span>
                          <Button size="sm" variant="ghost" className="h-7 shrink-0" onClick={() => {
                            setRemixFormat("tiktok_script");
                            setRemixInstructions(`Based on this moment: ${moment}`);
                            setRemixOpen(true);
                            setRemixResult(null);
                          }}>
                            <RefreshCw className="h-3 w-3 mr-1" />Remix
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Improvement Suggestions */}
              {result.analysis.improvementSuggestions?.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-indigo-500" />How to Make It Even Better
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.analysis.improvementSuggestions.map((sug: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          <span>{sug}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* File Result */}
          {result.type === "file" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* File Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {result.fileType === "image" ? <Image className="h-4 w-4" /> :
                     result.fileType === "video" ? <Video className="h-4 w-4" /> :
                     result.fileType === "audio" ? <Music className="h-4 w-4" /> :
                     <FileText className="h-4 w-4" />}
                    Uploaded: {result.fileName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="outline" className="capitalize">{result.fileType}</Badge>
                  {result.fileType === "image" && result.fileUrl && (
                    <img src={result.fileUrl} alt="" className="w-full rounded-lg max-h-64 object-contain bg-muted" />
                  )}
                  {result.fileType === "video" && result.fileUrl && (
                    <video src={result.fileUrl} controls className="w-full rounded-lg max-h-64" />
                  )}
                  {result.fileType === "audio" && result.fileUrl && (
                    <audio src={result.fileUrl} controls className="w-full" />
                  )}
                </CardContent>
              </Card>

              {/* Image Analysis */}
              {result.imageAnalysis && result.fileType === "image" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="h-4 w-4" />AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{result.imageAnalysis.description}</p>
                    {result.imageAnalysis.mood && <Badge variant="secondary">Mood: {result.imageAnalysis.mood}</Badge>}
                    {result.imageAnalysis.textInImage && (
                      <div className="p-2 bg-muted/50 rounded text-sm">
                        <span className="text-xs font-medium text-muted-foreground">Text in image:</span>
                        <p>{result.imageAnalysis.textInImage}</p>
                      </div>
                    )}
                    {result.imageAnalysis.marketingPotential && (
                      <p className="text-sm text-muted-foreground">{result.imageAnalysis.marketingPotential}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Image Captions */}
              {result.imageAnalysis?.suggestedCaptions?.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />Ready-to-Use Captions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.imageAnalysis.suggestedCaptions.map((cap: string, i: number) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/50 border text-sm relative group">
                          <p className="pr-8">{cap}</p>
                          <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopy(`imgcap-${i}`, cap)}>
                            {copiedId === `imgcap-${i}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ad Copy Ideas from Image */}
              {result.imageAnalysis?.adCopyIdeas?.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <PenTool className="h-4 w-4 text-purple-500" />Ad Copy Ideas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {result.imageAnalysis.adCopyIdeas.map((idea: string, i: number) => (
                        <div key={i} className="p-3 rounded-lg border text-sm">
                          <p>{idea}</p>
                          <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs" onClick={() => {
                            setRemixFormat("ad_copy_short");
                            setRemixInstructions(idea);
                            setRemixOpen(true);
                            setRemixResult(null);
                          }}>
                            <Sparkles className="h-3 w-3 mr-1" />Create This Ad
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transcript */}
              {result.transcript && (
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2"><FileText className="h-4 w-4" />Transcript</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleCopy("transcript", result.transcript.text)}>
                          {copiedId === "transcript" ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                          Copy
                        </Button>
                        <Button size="sm" variant="default" onClick={() => { setCaptionOpen(true); setCaptionResult(null); }}>
                          <MessageSquare className="h-3.5 w-3.5 mr-1" />Generate Captions
                        </Button>
                        <Button size="sm" variant="secondary" disabled={identifyClipsMut.isPending}
                          onClick={() => identifyClipsMut.mutate({
                            transcript: result.transcript.text,
                            segments: result.transcript.segments,
                          })}>
                          {identifyClipsMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Scissors className="h-3.5 w-3.5 mr-1" />}
                          Find Best Clips
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.transcript.language && <Badge variant="outline" className="mb-2">Language: {result.transcript.language}</Badge>}
                    <div className="p-3 bg-muted/50 rounded-lg text-sm max-h-64 overflow-y-auto whitespace-pre-wrap">
                      {result.transcript.text}
                    </div>
                    {result.transcript.segments?.length > 0 && (
                      <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                        {result.transcript.segments.map((seg: any, i: number) => (
                          <div key={i} className="flex gap-2 text-xs">
                            <span className="text-muted-foreground shrink-0 w-20">
                              {Math.floor(seg.start / 60)}:{String(Math.floor(seg.start % 60)).padStart(2, "0")} - {Math.floor(seg.end / 60)}:{String(Math.floor(seg.end % 60)).padStart(2, "0")}
                            </span>
                            <span>{seg.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Document Analysis */}
              {result.imageAnalysis && (result.fileType === "pdf" || result.fileType === "document") && (
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />Document Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.imageAnalysis.title && <h3 className="font-semibold">{result.imageAnalysis.title}</h3>}
                    {result.imageAnalysis.summary && <p className="text-sm">{result.imageAnalysis.summary}</p>}
                    {result.imageAnalysis.keyPoints?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Key Points:</p>
                        {result.imageAnalysis.keyPoints.map((kp: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm mb-1">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span>{kp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {result.imageAnalysis.quotes?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Notable Quotes:</p>
                        {result.imageAnalysis.quotes.map((q: string, i: number) => (
                          <blockquote key={i} className="border-l-2 border-primary/30 pl-3 text-sm italic mb-2">{q}</blockquote>
                        ))}
                      </div>
                    )}
                    {result.imageAnalysis.suggestedContent?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Content Ideas:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {result.imageAnalysis.suggestedContent.map((sc: any, i: number) => (
                            <button key={i} className="p-2.5 rounded-lg border text-left text-sm hover:border-primary/40 transition-all"
                              onClick={() => {
                                setRemixFormat(sc.type || "blog_post");
                                setRemixInstructions(sc.idea);
                                setRemixOpen(true);
                                setRemixResult(null);
                              }}>
                              <p className="font-medium text-xs capitalize">{(sc.type || "").replace(/_/g, " ")}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{sc.idea}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ DIALOGS ═══ */}

      {/* Quick Remix Dialog */}
      <Dialog open={remixOpen} onOpenChange={setRemixOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" />Remix Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Remix Into:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {REMIX_FORMATS.map(f => (
                  <button key={f.value} onClick={() => setRemixFormat(f.value)}
                    className={`p-2.5 rounded-lg text-left text-sm border transition-all ${remixFormat === f.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30"}`}>
                    <span className="mr-1.5">{f.icon}</span>{f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Platform</label>
                <Select value={remixPlatform} onValueChange={setRemixPlatform}>
                  <SelectTrigger><SelectValue placeholder="Any platform" /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tone</label>
                <Select value={remixTone} onValueChange={setRemixTone}>
                  <SelectTrigger><SelectValue placeholder="Auto-detect" /></SelectTrigger>
                  <SelectContent>
                    {["professional", "casual", "funny", "inspirational", "urgent", "educational", "luxury", "edgy"].map(t => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Custom Instructions (optional)</label>
              <Textarea value={remixInstructions} onChange={e => setRemixInstructions(e.target.value)}
                placeholder="e.g. Make it funnier, target Gen Z, add urgency..." rows={2} />
            </div>
            <Button className="w-full" disabled={quickRemixMut.isPending}
              onClick={() => quickRemixMut.mutate({
                sourceContent: getSourceContent,
                targetFormat: remixFormat as any,
                platform: remixPlatform || undefined,
                tone: remixTone || undefined,
                customInstructions: remixInstructions || undefined,
              })}>
              {quickRemixMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Remixing...</> : <><RefreshCw className="h-4 w-4 mr-2" />Remix Now</>}
            </Button>
            {remixResult && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="default">Remixed!</Badge>
                  <Button size="sm" variant="ghost" onClick={() => handleCopy("remix", remixResult.body)}>
                    {copiedId === "remix" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none text-foreground"><Streamdown>{remixResult.body}</Streamdown></div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Remix Dialog */}
      <Dialog open={batchRemixOpen} onOpenChange={setBatchRemixOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5" />Batch Remix — One to Many</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select all formats you want. AI will create a unique version for each.</p>
            <div className="grid grid-cols-2 gap-2">
              {REMIX_FORMATS.map(f => (
                <button key={f.value} onClick={() => toggleBatchFormat(f.value)}
                  className={`p-2 rounded-lg text-left text-sm border transition-all ${batchFormats.includes(f.value) ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30"}`}>
                  <span className="mr-1">{f.icon}</span>{f.label}
                </button>
              ))}
            </div>
            <Button className="w-full" disabled={!batchFormats.length || batchRemixMut.isPending}
              onClick={() => batchRemixMut.mutate({
                sourceContent: getSourceContent,
                targetFormats: batchFormats,
              })}>
              {batchRemixMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating {batchFormats.length} versions...</> : <><Wand2 className="h-4 w-4 mr-2" />Create {batchFormats.length} Versions</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto-Caption Dialog */}
      <Dialog open={captionOpen} onOpenChange={setCaptionOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Auto-Generate Captions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Primary Platform</label>
                <Select value={captionPlatform} onValueChange={setCaptionPlatform}>
                  <SelectTrigger><SelectValue placeholder="All platforms" /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tone</label>
                <Select value={captionTone} onValueChange={setCaptionTone}>
                  <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
                  <SelectContent>
                    {["engaging", "professional", "funny", "inspirational", "educational", "trendy", "casual"].map(t => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" disabled={generateCaptionsMut.isPending}
              onClick={() => generateCaptionsMut.mutate({
                transcript: getSourceContent,
                platform: captionPlatform || undefined,
                tone: captionTone || undefined,
              })}>
              {generateCaptionsMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating Captions...</> : <><MessageSquare className="h-4 w-4 mr-2" />Generate Captions</>}
            </Button>
            {captionResult && (
              <div className="space-y-4">
                {captionResult.hooks?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Attention-Grabbing Hooks:</p>
                    {captionResult.hooks.map((h: string, i: number) => (
                      <div key={i} className="p-2 bg-amber-500/10 rounded text-sm mb-1 flex items-center justify-between">
                        <span>{h}</span>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleCopy(`hook-${i}`, h)}>
                          {copiedId === `hook-${i}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {captionResult.captions?.map((cap: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="capitalize">{cap.platform}</Badge>
                        <Badge variant="secondary" className="capitalize">{cap.style}</Badge>
                        {cap.charCount > 0 && <Badge variant="outline">{cap.charCount} chars</Badge>}
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleCopy(`caption-${i}`, cap.text)}>
                        {copiedId === `caption-${i}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{cap.text}</p>
                  </div>
                ))}
                {captionResult.ctas?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Call-to-Action Suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {captionResult.ctas.map((cta: string, i: number) => (
                        <Badge key={i} variant="outline" className="cursor-pointer hover:bg-primary/5" onClick={() => handleCopy(`cta-${i}`, cta)}>
                          {cta}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Clip Moments Dialog */}
      <Dialog open={clipOpen} onOpenChange={setClipOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Scissors className="h-5 w-5" />Best Clip Moments</DialogTitle>
          </DialogHeader>
          {clipResult && (
            <div className="space-y-4">
              {clipResult.overallAnalysis && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge>Style: {clipResult.overallAnalysis.contentStyle}</Badge>
                    <Badge variant="secondary">Viral Score: {clipResult.overallAnalysis.viralPotential}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{clipResult.overallAnalysis.bestMoment}</p>
                  <p className="text-xs text-muted-foreground mt-1">Audience: {clipResult.overallAnalysis.audienceAppeal}</p>
                </div>
              )}
              {clipResult.clips?.map((clip: any, i: number) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{clip.title}</h4>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{Math.floor(clip.startTime / 60)}:{String(Math.floor(clip.startTime % 60)).padStart(2, "0")} - {Math.floor(clip.endTime / 60)}:{String(Math.floor(clip.endTime % 60)).padStart(2, "0")}</Badge>
                          <Badge variant="outline">{clip.duration}s</Badge>
                          <Badge variant={clip.viralScore >= 8 ? "default" : "secondary"}>Viral: {clip.viralScore}/10</Badge>
                          {clip.emotion && <Badge variant="outline" className="capitalize">{clip.emotion}</Badge>}
                        </div>
                      </div>
                    </div>
                    {clip.hook && <p className="text-sm font-medium text-primary mt-2">Hook: "{clip.hook}"</p>}
                    <p className="text-sm text-muted-foreground mt-1">{clip.reason}</p>
                    {clip.transcript && <p className="text-xs bg-muted/50 p-2 rounded mt-2 italic">"{clip.transcript}"</p>}
                    <div className="flex gap-2 mt-3">
                      {clip.bestFor?.map((p: string) => <Badge key={p} variant="outline" className="text-xs capitalize">{p}</Badge>)}
                      <div className="flex-1" />
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(`clip-${i}`, clip.suggestedCaption || clip.transcript)}>
                        <Copy className="h-3 w-3 mr-1" />Caption
                      </Button>
                      <Button size="sm" variant="default" onClick={() => {
                        setRemixFormat("tiktok_script");
                        setRemixInstructions(`Based on this clip: ${clip.transcript || clip.title}`);
                        setRemixOpen(true);
                        setRemixResult(null);
                        setClipOpen(false);
                      }}>
                        <RefreshCw className="h-3 w-3 mr-1" />Remix
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Visual Dialog */}
      <Dialog open={visualOpen} onOpenChange={setVisualOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileImage className="h-5 w-5" />Generate Visual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Visual Type:</label>
              <div className="grid grid-cols-2 gap-2">
                {VISUAL_TYPES.map(v => (
                  <button key={v.value} onClick={() => setVisualType(v.value)}
                    className={`p-2.5 rounded-lg text-left text-sm border transition-all ${visualType === v.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30"}`}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" disabled={generateVisualMut.isPending}
              onClick={() => generateVisualMut.mutate({
                content: getSourceContent,
                type: visualType as any,
              })}>
              {generateVisualMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating (10-20s)...</> : <><FileImage className="h-4 w-4 mr-2" />Generate Visual</>}
            </Button>
            {visualResult && (
              <div className="space-y-2">
                <img src={visualResult.imageUrl} alt="" className="w-full rounded-lg" />
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{visualResult.dimensions}</Badge>
                  <Button size="sm" variant="outline" onClick={() => window.open(visualResult.imageUrl, "_blank")}>
                    <Download className="h-3.5 w-3.5 mr-1" />Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Post Dialog */}
      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" />Quick Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Post to:</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button key={p.value} onClick={() => togglePostPlatform(p.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${postPlatforms.includes(p.value) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"}`}>
                    <p.icon className="h-3.5 w-3.5" />{p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Content</label>
              <Textarea value={postContent} onChange={e => setPostContent(e.target.value)} rows={4} />
            </div>
            <Button className="w-full" disabled={!postPlatforms.length || !postContent.trim() || quickPostMut.isPending}
              onClick={() => quickPostMut.mutate({
                contentBody: postContent,
                platforms: postPlatforms,
              })}>
              {quickPostMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Scheduling...</> : <><Send className="h-4 w-4 mr-2" />Schedule to {postPlatforms.length} Platform{postPlatforms.length !== 1 ? "s" : ""}</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
