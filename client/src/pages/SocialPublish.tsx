import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Send, Clock, Link2, RefreshCw, Calendar, Share2 } from "lucide-react";

const PLATFORM_ICONS: Record<string, string> = {
  facebook: "📘", instagram: "📸", twitter: "🐦", linkedin: "💼", tiktok: "🎵",
  youtube: "▶️", pinterest: "📌", reddit: "🔴", threads: "🧵",
};

export default function SocialPublish() {
  const [tab, setTab] = useState("queue");
  const [showSchedule, setShowSchedule] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");

  // Uses the actual router procedures: list, publish, retry, cancel
  const { data: queue, refetch: refetchQueue } = trpc.socialPublish.list.useQuery();
  // Ad platform connections are used for social accounts
  const { data: connections, refetch: refetchConnections } = trpc.adPlatform.connections.useQuery();

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
      setSelectedPlatform("");
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

  const connectedPlatforms = (connections || [])
    .filter((c: any) => c.status === "connected")
    .map((c: any) => c.platform as string);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Publishing</h1>
          <p className="text-muted-foreground">Publish content across all connected platforms</p>
        </div>
        <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> New Post</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Post</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Content *</label>
                <Textarea value={postContent} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPostContent(e.target.value)} placeholder="Write your post content..." rows={4} />
                <p className="text-xs text-muted-foreground mt-1">{postContent.length} characters</p>
              </div>
              <div>
                <label className="text-sm font-medium">Platform *</label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                  <SelectContent>
                    {connectedPlatforms.length > 0 ? connectedPlatforms.map((p: string) => (
                      <SelectItem key={p} value={p}>{PLATFORM_ICONS[p] || "📱"} {p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                    )) : Object.entries(PLATFORM_ICONS).map(([p, icon]) => (
                      <SelectItem key={p} value={p}>{icon} {p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {connectedPlatforms.length === 0 && <p className="text-xs text-muted-foreground mt-1">Connect accounts in Ad Platforms to enable direct publishing</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Schedule (optional)</label>
                <Input type="datetime-local" value={scheduledFor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScheduledFor(e.target.value)} />
              </div>
              <Button onClick={() => {
                publishMut.mutate({
                  platform: selectedPlatform,
                  postContent,
                  scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
                });
              }} disabled={!postContent || !selectedPlatform || publishMut.isPending} className="w-full">
                {publishMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : scheduledFor ? <><Clock className="w-4 h-4 mr-1" /> Schedule</> : <><Send className="w-4 h-4 mr-1" /> Publish Now</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="queue"><Calendar className="w-4 h-4 mr-1" /> Queue</TabsTrigger>
          <TabsTrigger value="connections"><Link2 className="w-4 h-4 mr-1" /> Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {!queue?.length ? (
            <Card className="border-dashed"><CardContent className="flex flex-col items-center py-12">
              <Share2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Publishing Queue Empty</h3>
              <p className="text-muted-foreground mt-2">Create a post to see it here</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {queue.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{PLATFORM_ICONS[item.platform] || "📱"}</span>
                          <span className="font-medium capitalize">{item.platform}</span>
                          <Badge variant={
                            item.status === "published" ? "default" :
                            item.status === "failed" ? "destructive" :
                            item.status === "publishing" ? "secondary" : "outline"
                          }>{item.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.postContent}</p>
                        {item.scheduledFor && <p className="text-xs text-muted-foreground mt-1"><Clock className="w-3 h-3 inline mr-1" />{new Date(item.scheduledFor).toLocaleString()}</p>}
                        {item.errorMessage && <p className="text-xs text-red-500 mt-1">{item.errorMessage}</p>}
                        {item.externalPostUrl && <a href={item.externalPostUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">View post →</a>}
                      </div>
                      <div className="flex gap-1">
                        {item.status === "failed" && (
                          <Button variant="outline" size="sm" onClick={() => retryMut.mutate({ id: item.id })}>
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                        {(item.status === "queued" || item.status === "failed") && (
                          <Button variant="ghost" size="sm" onClick={() => cancelMut.mutate({ id: item.id })}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
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
          {!connections?.length ? (
            <Card className="border-dashed"><CardContent className="flex flex-col items-center py-12">
              <Link2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Connected Accounts</h3>
              <p className="text-muted-foreground mt-2 text-center max-w-md">Connect your social media accounts in the Ad Platforms page to enable direct publishing.</p>
              <Button className="mt-4" variant="outline" onClick={() => window.location.href = "/ad-platforms"}>
                <Link2 className="w-4 h-4 mr-2" /> Go to Ad Platforms
              </Button>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(connections as any[]).map((c: any) => (
                <Card key={c.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{PLATFORM_ICONS[c.platform] || "📱"}</span>
                      <div>
                        <span className="font-medium capitalize">{c.platform}</span>
                        <p className="text-xs text-muted-foreground">{c.accountName || c.accountId}</p>
                      </div>
                    </div>
                    <Badge variant={c.status === "connected" ? "default" : "destructive"}>{c.status}</Badge>
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
