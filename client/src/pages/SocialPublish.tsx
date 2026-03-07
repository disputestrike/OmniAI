import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Send, Clock, Link2, RefreshCw, Calendar, Share2, Plug, ExternalLink, CheckCircle2, XCircle, AlertCircle, Image as ImageIcon, Video } from "lucide-react";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📸", color: "bg-gradient-to-r from-purple-500 to-pink-500", supports: ["image", "video", "carousel", "story", "reel"] },
  { id: "facebook", name: "Facebook", icon: "📘", color: "bg-blue-600", supports: ["text", "image", "video", "link"] },
  { id: "twitter", name: "Twitter / X", icon: "🐦", color: "bg-black", supports: ["text", "image", "video", "thread"] },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "bg-blue-700", supports: ["text", "image", "video", "article"] },
  { id: "tiktok", name: "TikTok", icon: "🎵", color: "bg-black", supports: ["video"] },
  { id: "youtube", name: "YouTube", icon: "▶️", color: "bg-red-600", supports: ["video"] },
  { id: "pinterest", name: "Pinterest", icon: "📌", color: "bg-red-500", supports: ["image"] },
  { id: "threads", name: "Threads", icon: "🧵", color: "bg-black", supports: ["text", "image"] },
];
const PLATFORM_ICONS: Record<string, string> = Object.fromEntries(PLATFORMS.map(p => [p.id, p.icon]));

export default function SocialPublish() {
  const [tab, setTab] = useState("queue");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [mediaUrl, setMediaUrl] = useState("");
  const [postType, setPostType] = useState("text");

  const { data: queue, refetch: refetchQueue } = trpc.socialPublish.list.useQuery();
  const { data: connections, refetch: refetchConnections } = trpc.adPlatform.connections.useQuery();

  // Real OAuth connection
  const connectMut = trpc.socialConnection.getOAuthUrl.useMutation({
    onSuccess: (data) => {
      toast.success(`Opening authorization page...`);
      window.open(data.url, "_blank");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const publishMut = trpc.socialPublish.publish.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success(data.status === "published" ? "Published successfully!" : "Post queued for publishing");
      } else {
        toast.error(data.error || "Publishing failed");
      }
      setShowSchedule(false);
      setPostContent("");
      setScheduledFor("");
      setSelectedPlatforms([]);
      setMediaUrl("");
      refetchQueue();
    },
    onError: (e: any) => toast.error(e.message),
  });
  const retryMut = trpc.socialPublish.retry.useMutation({
    onSuccess: () => { toast.success("Retrying..."); refetchQueue(); },
  });
  const cancelMut = trpc.socialPublish.cancel.useMutation({
    onSuccess: () => { toast.success("Post cancelled"); refetchQueue(); },
  });

  const connectedPlatforms = useMemo(() =>
    (connections || []).filter((c: any) => c.status === "connected").map((c: any) => c.platform as string),
    [connections]
  );

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const publishToAll = () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }
    // Publish to each selected platform
    selectedPlatforms.forEach(platform => {
      publishMut.mutate({
        platform,
        postContent,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
      });
    });
  };

  const queueStats = useMemo(() => {
    if (!queue) return { total: 0, published: 0, failed: 0, queued: 0 };
    return {
      total: queue.length,
      published: queue.filter((q: any) => q.status === "published").length,
      failed: queue.filter((q: any) => q.status === "failed").length,
      queued: queue.filter((q: any) => q.status === "queued" || q.status === "scheduled").length,
    };
  }, [queue]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Social Publishing Hub</h1>
          <p className="text-muted-foreground text-sm">Connect accounts, create posts, schedule across all platforms, and track performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowConnect(true)}><Plug className="w-4 h-4 mr-2" />Connect Accounts</Button>
          <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Post</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create & Publish Post</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                {/* Platform Selection */}
                <div>
                  <Label className="text-sm font-medium">Publish To</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PLATFORMS.map(p => (
                      <button key={p.id} onClick={() => togglePlatform(p.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all ${
                          selectedPlatforms.includes(p.id)
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : connectedPlatforms.includes(p.id)
                            ? "hover:bg-muted/50"
                            : "opacity-40 cursor-not-allowed"
                        }`}
                        disabled={!connectedPlatforms.includes(p.id) && connectedPlatforms.length > 0}
                      >
                        <span>{p.icon}</span>
                        <span>{p.name}</span>
                        {selectedPlatforms.includes(p.id) && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                  {connectedPlatforms.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">No accounts connected yet. Posts will be queued for manual publishing.</p>
                  )}
                </div>

                {/* Post Type */}
                <div>
                  <Label>Post Type</Label>
                  <div className="flex gap-2 mt-1">
                    {["text", "image", "video", "carousel"].map(t => (
                      <button key={t} onClick={() => setPostType(t)}
                        className={`px-3 py-1.5 rounded-lg border text-xs capitalize transition-all ${postType === t ? "border-primary bg-primary/10" : "hover:bg-muted/50"}`}>
                        {t === "image" && <ImageIcon className="h-3 w-3 inline mr-1" />}
                        {t === "video" && <Video className="h-3 w-3 inline mr-1" />}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <Label>Content *</Label>
                  <Textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Write your post content... Use #hashtags and @mentions" rows={4} />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{postContent.length} characters</p>
                    <p className="text-xs text-muted-foreground">
                      {postContent.length > 280 && selectedPlatforms.includes("twitter") && <span className="text-amber-500">Twitter limit: 280</span>}
                    </p>
                  </div>
                </div>

                {/* Media URL */}
                {(postType === "image" || postType === "video") && (
                  <div>
                    <Label>Media URL</Label>
                    <Input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://example.com/image.jpg or video URL" />
                  </div>
                )}

                {/* Schedule */}
                <div>
                  <Label>Schedule (optional — leave blank to publish now)</Label>
                  <Input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
                </div>

                <Button onClick={publishToAll} disabled={!postContent || selectedPlatforms.length === 0 || publishMut.isPending} className="w-full">
                  {publishMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : scheduledFor ? <Clock className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  {scheduledFor ? `Schedule to ${selectedPlatforms.length} Platform${selectedPlatforms.length > 1 ? "s" : ""}` : `Publish to ${selectedPlatforms.length} Platform${selectedPlatforms.length > 1 ? "s" : ""}`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{connectedPlatforms.length}</p>
          <p className="text-xs text-muted-foreground">Connected</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{queueStats.published}</p>
          <p className="text-xs text-muted-foreground">Published</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{queueStats.queued}</p>
          <p className="text-xs text-muted-foreground">Queued</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{queueStats.failed}</p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="queue"><Calendar className="w-4 h-4 mr-1" />Queue ({queueStats.total})</TabsTrigger>
          <TabsTrigger value="connections"><Link2 className="w-4 h-4 mr-1" />Connections ({connectedPlatforms.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-3">
          {!queue?.length ? (
            <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center py-12">
              <Share2 className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold">Publishing Queue Empty</h3>
              <p className="text-muted-foreground mt-2 text-sm">Create a post to start publishing across your connected platforms.</p>
              <Button className="mt-4" onClick={() => setShowSchedule(true)}><Plus className="w-4 h-4 mr-2" />Create First Post</Button>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {queue.map((item: any) => (
                <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-lg">{PLATFORM_ICONS[item.platform] || "📱"}</span>
                          <span className="font-medium capitalize text-sm">{item.platform}</span>
                          <Badge variant={
                            item.status === "published" ? "default" :
                            item.status === "failed" ? "destructive" :
                            item.status === "publishing" ? "secondary" : "outline"
                          } className="text-xs">
                            {item.status === "published" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {item.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                            {item.status === "queued" && <Clock className="h-3 w-3 mr-1" />}
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.postContent}</p>
                        {item.scheduledFor && <p className="text-xs text-muted-foreground mt-1"><Clock className="w-3 h-3 inline mr-1" />{new Date(item.scheduledFor).toLocaleString()}</p>}
                        {item.errorMessage && <p className="text-xs text-red-500 mt-1"><AlertCircle className="h-3 w-3 inline mr-1" />{item.errorMessage}</p>}
                        {item.externalPostUrl && <a href={item.externalPostUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" />View post</a>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {item.status === "failed" && (
                          <Button variant="outline" size="sm" onClick={() => retryMut.mutate({ id: item.id })}><RefreshCw className="w-3 h-3" /></Button>
                        )}
                        {(item.status === "queued" || item.status === "failed") && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => cancelMut.mutate({ id: item.id })}><Trash2 className="w-3 h-3" /></Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PLATFORMS.map(platform => {
              const connection = (connections as any[] || []).find((c: any) => c.platform === platform.id);
              const isConnected = connection?.status === "connected";
              return (
                <Card key={platform.id} className={`border-0 shadow-sm transition-all ${isConnected ? "ring-1 ring-green-500/20" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white text-lg`}>
                          {platform.icon}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{platform.name}</p>
                          {isConnected ? (
                            <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Connected{connection.accountName ? ` · ${connection.accountName}` : ""}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Not connected</p>
                          )}
                        </div>
                      </div>
                      {isConnected ? (
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => { toast.info('To disconnect, remove the platform credentials from Settings > Secrets'); }}>
                          Disconnect
                        </Button>
                      ) : (
                        <Button size="sm" className="text-xs" disabled={connectMut.isPending} onClick={() => connectMut.mutate({
                          platform: platform.id as any,
                          origin: window.location.origin,
                        })}>
                          {connectMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plug className="h-3 w-3 mr-1" />}
                          Connect
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {platform.supports.map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px] capitalize">{s}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card className="border-0 shadow-sm bg-muted/30">
            <CardContent className="p-4">
              <p className="text-sm font-medium">How to connect accounts</p>
              <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                <li>Click "Connect" on the platform you want to add</li>
                <li>You'll be redirected to authorize OTOBI AI to post on your behalf</li>
                <li>Once authorized, the platform will show as "Connected"</li>
                <li>You can then publish directly from the queue or schedule posts</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">API keys required: Add your platform API credentials in Settings &gt; Secrets for each platform you want to connect.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connect Accounts Dialog */}
      <Dialog open={showConnect} onOpenChange={setShowConnect}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Connect Social Accounts</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Connect your social media accounts to enable direct publishing. Each platform requires OAuth authorization.</p>
          <div className="space-y-2 mt-2">
            {PLATFORMS.map(p => {
              const isConnected = connectedPlatforms.includes(p.id);
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.icon}</span>
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  {isConnected ? (
                    <Badge variant="default" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>
                  ) : (
                    <Button size="sm" variant="outline" disabled={connectMut.isPending} onClick={() => connectMut.mutate({
                      platform: p.id as any,
                      origin: window.location.origin,
                    })}>
                      Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
