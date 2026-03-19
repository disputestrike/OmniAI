import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Mic, MicOff, Camera, CameraOff, Play, Square, Share2, Download, Wand2, Copy, Trash2, Eye, Clock, FileText, Sparkles, Monitor, Smartphone, RotateCcw } from "lucide-react";
import { checkMediaSupport, getMediaErrorMessage } from "@/lib/mediaPermissions";

export default function VideoStudio() {
  const [tab, setTab] = useState("studio");
  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  const [scriptTopic, setScriptTopic] = useState("");
  const [scriptTone, setScriptTone] = useState("professional");
  const [scriptDuration, setScriptDuration] = useState(60);
  const [scriptPlatform, setScriptPlatform] = useState("general");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(2);
  const [teleprompterPosition, setTeleprompterPosition] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareData, setShareData] = useState<{ shareUrl: string; embedCode: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const teleprompterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: videos, refetch } = trpc.personalVideo.list.useQuery();
  const generateScriptMut = trpc.personalVideo.generateScript.useMutation({ onSuccess: (d) => { setScript((d.script as string) || ""); toast.success("Script generated!"); }, onError: () => toast.error("Failed to generate script") });
  const createVideoMut = trpc.personalVideo.create.useMutation({ onSuccess: () => { refetch(); toast.success("Video saved!"); }, onError: () => toast.error("Failed to save") });
  const uploadMut = trpc.personalVideo.uploadRecording.useMutation({ onSuccess: () => { refetch(); toast.success("Recording uploaded!"); }, onError: () => toast.error("Upload failed") });
  const thumbnailMut = trpc.personalVideo.generateThumbnail.useMutation({ onSuccess: () => { refetch(); toast.success("Thumbnail generated!"); }, onError: () => toast.error("Thumbnail generation failed") });
  const suggestionsMut = trpc.personalVideo.getAISuggestions.useMutation({ onError: () => toast.error("Failed to get suggestions") });
  const shareMut = trpc.personalVideo.share.useMutation({ onSuccess: (d) => { setShareData(d); setShareDialogOpen(true); refetch(); }, onError: () => toast.error("Failed to share") });
  const deleteMut = trpc.personalVideo.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Deleted"); }, onError: () => toast.error("Delete failed") });

  const startCamera = useCallback(async () => {
    const support = checkMediaSupport();
    if (!support.ok) {
      toast.error(support.message);
      return;
    }
    try {
      const constraints: MediaStreamConstraints = { video: cameraOn ? { width: 1280, height: 720, facingMode: "user" } : false, audio: micOn };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch (err) {
      toast.error(getMediaErrorMessage(err));
    }
  }, [cameraOn, micOn]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) { toast.error("Start camera first"); return; }
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm;codecs=vp9,opus" });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
      setIsPreviewing(true);
    };
    mr.start(1000);
    mediaRecorderRef.current = mr;
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    if (showTeleprompter && script) {
      setTeleprompterPosition(0);
      teleprompterRef.current = setInterval(() => setTeleprompterPosition(p => p + teleprompterSpeed), 100);
    }
  }, [showTeleprompter, script, teleprompterSpeed]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (teleprompterRef.current) clearInterval(teleprompterRef.current);
  }, []);

  const saveRecording = useCallback(async () => {
    if (!recordedBlob || !title.trim()) { toast.error("Enter a title first"); return; }
    const result = await createVideoMut.mutateAsync({ title, script, aspectRatio, platform: scriptPlatform });
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1];
      await uploadMut.mutateAsync({ id: result.id, videoBase64: base64, mimeType: "video/webm", duration: recordingTime });
      setRecordedBlob(null); setRecordedUrl(null); setIsPreviewing(false); setTitle("");
    };
    reader.readAsDataURL(recordedBlob);
  }, [recordedBlob, title, script, aspectRatio, scriptPlatform, recordingTime, createVideoMut, uploadMut]);

  const downloadRecording = useCallback(() => {
    if (!recordedUrl) return;
    const a = document.createElement("a");
    a.href = recordedUrl;
    a.download = `${title || "recording"}.webm`;
    a.click();
  }, [recordedUrl, title]);

  useEffect(() => { return () => { stopCamera(); if (timerRef.current) clearInterval(timerRef.current); if (teleprompterRef.current) clearInterval(teleprompterRef.current); }; }, [stopCamera]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold">Video Studio</h1>
        <p className="text-zinc-500">Record personal videos, use AI teleprompter, and share with shareable links</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="studio"><Camera className="w-4 h-4 mr-1" /> Studio</TabsTrigger>
          <TabsTrigger value="scripts"><FileText className="w-4 h-4 mr-1" /> Script Writer</TabsTrigger>
          <TabsTrigger value="library"><Video className="w-4 h-4 mr-1" /> Library ({videos?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="studio" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recording Area */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardContent className="p-0 relative">
                  <div className={`bg-black rounded-lg overflow-hidden relative ${aspectRatio === "9:16" ? "aspect-[9/16] max-h-[500px] mx-auto" : aspectRatio === "1:1" ? "aspect-square max-h-[500px] mx-auto" : "aspect-video"}`}>
                    {isPreviewing && recordedUrl ? (
                      <video src={recordedUrl} controls className="w-full h-full object-contain" />
                    ) : (
                      <video ref={videoRef} muted playsInline className="w-full h-full object-cover mirror" style={{ transform: "scaleX(-1)" }} />
                    )}
                    {/* Teleprompter overlay */}
                    {showTeleprompter && script && isRecording && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/60 text-white text-xl leading-relaxed p-6 rounded-lg max-w-[80%] max-h-[60%] overflow-hidden">
                          <div style={{ transform: `translateY(-${teleprompterPosition}px)`, transition: "transform 0.1s linear" }}>
                            {script.split("\n").map((line, i) => (
                              <p key={i} className="mb-3">{line}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Recording indicator */}
                    {isRecording && (
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full" /> REC {formatTime(recordingTime)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Button variant={cameraOn ? "default" : "outline"} size="icon" onClick={() => { setCameraOn(!cameraOn); stopCamera(); }} title="Toggle Camera">
                  {cameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                </Button>
                <Button variant={micOn ? "default" : "outline"} size="icon" onClick={() => setMicOn(!micOn)} title="Toggle Mic">
                  {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
                {!streamRef.current && !isPreviewing && (
                  <>
                    <Button onClick={startCamera}><Camera className="w-4 h-4 mr-2" /> Start Camera</Button>
                    {typeof window !== "undefined" && !window.isSecureContext && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 w-full text-center mt-1">Camera requires HTTPS or localhost.</p>
                    )}
                  </>
                )}
                {streamRef.current && !isRecording && !isPreviewing && (
                  <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700"><div className="w-3 h-3 bg-white rounded-full mr-2" /> Record</Button>
                )}
                {isRecording && (
                  <Button onClick={stopRecording} variant="destructive"><Square className="w-4 h-4 mr-2" /> Stop</Button>
                )}
                {isPreviewing && (
                  <>
                    <Button onClick={() => { setIsPreviewing(false); setRecordedBlob(null); setRecordedUrl(null); }} variant="outline"><RotateCcw className="w-4 h-4 mr-2" /> Re-record</Button>
                    <Button onClick={downloadRecording} variant="outline"><Download className="w-4 h-4 mr-2" /> Download</Button>
                    <Button onClick={saveRecording} disabled={!title.trim() || uploadMut.isPending || createVideoMut.isPending}>
                      {uploadMut.isPending ? "Uploading..." : "Save & Upload"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Settings Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Recording Settings</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-500">Video Title</label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="My video title..." />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Aspect Ratio</label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9"><Monitor className="w-3 h-3 inline mr-1" /> 16:9 Landscape</SelectItem>
                        <SelectItem value="9:16"><Smartphone className="w-3 h-3 inline mr-1" /> 9:16 Portrait</SelectItem>
                        <SelectItem value="1:1">1:1 Square</SelectItem>
                        <SelectItem value="4:5">4:5 Instagram</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Platform</label>
                    <Select value={scriptPlatform} onValueChange={setScriptPlatform}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="instagram">Instagram Reels</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Teleprompter</CardTitle>
                    <Button variant={showTeleprompter ? "default" : "outline"} size="sm" onClick={() => setShowTeleprompter(!showTeleprompter)}>
                      {showTeleprompter ? "On" : "Off"}
                    </Button>
                  </div>
                </CardHeader>
                {showTeleprompter && (
                  <CardContent className="space-y-3">
                    <Textarea value={script} onChange={e => setScript(e.target.value)} placeholder="Paste or generate your script..." rows={6} className="text-sm" />
                    <div>
                      <label className="text-xs text-zinc-500">Scroll Speed: {teleprompterSpeed}</label>
                      <input type="range" min={1} max={5} value={teleprompterSpeed} onChange={e => setTeleprompterSpeed(Number(e.target.value))} className="w-full" />
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Script Writer</CardTitle>
              <CardDescription>Generate professional video scripts optimized for any platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Topic / What's the video about?</label>
                  <Textarea value={scriptTopic} onChange={e => setScriptTopic(e.target.value)} placeholder="e.g., How our product saves 10 hours per week for marketing teams..." rows={3} />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Tone</label>
                    <Select value={scriptTone} onValueChange={setScriptTone}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual & Friendly</SelectItem>
                        <SelectItem value="energetic">Energetic & Exciting</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="storytelling">Storytelling</SelectItem>
                        <SelectItem value="persuasive">Persuasive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duration: {scriptDuration}s (~{Math.round(scriptDuration * 2.5)} words)</label>
                    <input type="range" min={15} max={300} step={15} value={scriptDuration} onChange={e => setScriptDuration(Number(e.target.value))} className="w-full" />
                  </div>
                </div>
              </div>
              <Button onClick={() => generateScriptMut.mutate({ topic: scriptTopic, duration: scriptDuration, tone: scriptTone, platform: scriptPlatform })} disabled={!scriptTopic.trim() || generateScriptMut.isPending}>
                <Wand2 className="w-4 h-4 mr-2" /> {generateScriptMut.isPending ? "Generating..." : "Generate Script"}
              </Button>
              {script && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Generated Script</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(script); toast.success("Copied!"); }}><Copy className="w-3 h-3 mr-1" /> Copy</Button>
                      <Button size="sm" onClick={() => { setShowTeleprompter(true); setTab("studio"); toast.success("Script loaded into teleprompter!"); }}><Monitor className="w-3 h-3 mr-1" /> Use in Teleprompter</Button>
                    </div>
                  </div>
                  <Textarea value={script} onChange={e => setScript(e.target.value)} rows={12} className="font-mono text-sm" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          {!videos?.length ? (
            <Card><CardContent className="py-12 text-center text-zinc-500"><Video className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No videos yet. Record your first video in the Studio tab!</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map(v => (
                <Card key={v.id} className="overflow-hidden">
                  <div className="aspect-video bg-zinc-800 relative">
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                    ) : v.videoUrl ? (
                      <video src={v.videoUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Video className="w-8 h-8 text-zinc-500" /></div>
                    )}
                    <Badge className="absolute top-2 right-2" variant={v.status === "shared" ? "default" : v.status === "ready" ? "secondary" : "outline"}>{v.status}</Badge>
                    {v.duration && <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">{formatTime(v.duration)}</span>}
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <h3 className="font-medium truncate">{v.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Eye className="w-3 h-3" /> {v.viewCount || 0} views
                      <Clock className="w-3 h-3 ml-2" /> {new Date(v.createdAt!).toLocaleDateString()}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {v.videoUrl && (
                        <Button variant="outline" size="sm" onClick={() => shareMut.mutate({ id: v.id, origin: window.location.origin })}><Share2 className="w-3 h-3 mr-1" /> Share</Button>
                      )}
                      {!v.thumbnailUrl && v.videoUrl && (
                        <Button variant="outline" size="sm" onClick={() => thumbnailMut.mutate({ id: v.id })} disabled={thumbnailMut.isPending}><Sparkles className="w-3 h-3 mr-1" /> Thumbnail</Button>
                      )}
                      {v.script && (
                        <Button variant="outline" size="sm" onClick={() => { setSelectedVideo(v.id); suggestionsMut.mutate({ id: v.id }); }}><Wand2 className="w-3 h-3 mr-1" /> AI Tips</Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this video?")) deleteMut.mutate({ id: v.id }); }}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    {selectedVideo === v.id && suggestionsMut.data && (
                      <div className="mt-2 p-2 bg-zinc-800 rounded text-xs space-y-1">
                        <p className="font-medium">AI Suggestions:</p>
                        {suggestionsMut.data.improvements?.map((imp: string, i: number) => <p key={i}>- {imp}</p>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Share Video</DialogTitle></DialogHeader>
          {shareData && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Share Link</label>
                <div className="flex gap-2 mt-1">
                  <Input value={shareData.shareUrl} readOnly />
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(shareData.shareUrl); toast.success("Link copied!"); }}><Copy className="w-4 h-4" /></Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Embed Code</label>
                <div className="flex gap-2 mt-1">
                  <Input value={shareData.embedCode} readOnly className="text-xs" />
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(shareData.embedCode); toast.success("Embed code copied!"); }}><Copy className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
