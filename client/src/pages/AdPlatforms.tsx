import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Share2, Plus, Unplug, Trash2, Rocket, RefreshCw, Loader2 } from "lucide-react";

const PLATFORMS = [
  { value: "meta_ads", label: "Meta Ads (Facebook/Instagram)", icon: "📘" },
  { value: "google_ads", label: "Google Ads", icon: "🔍" },
  { value: "tiktok_ads", label: "TikTok Ads", icon: "🎵" },
  { value: "linkedin_ads", label: "LinkedIn Ads", icon: "💼" },
  { value: "twitter_ads", label: "X (Twitter) Ads", icon: "🐦" },
  { value: "pinterest_ads", label: "Pinterest Ads", icon: "📌" },
  { value: "snapchat_ads", label: "Snapchat Ads", icon: "👻" },
  { value: "amazon_ads", label: "Amazon Ads", icon: "📦" },
  { value: "youtube_ads", label: "YouTube Ads", icon: "▶️" },
  { value: "reddit_ads", label: "Reddit Ads", icon: "🤖" },
];

export default function AdPlatforms() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: connections, isLoading } = trpc.adPlatform.connections.useQuery(undefined, { enabled: !!user });
  const connect = trpc.adPlatform.connect.useMutation({ onSuccess: () => { utils.adPlatform.connections.invalidate(); toast.success("Platform connected"); } });
  const disconnect = trpc.adPlatform.disconnect.useMutation({ onSuccess: () => { utils.adPlatform.connections.invalidate(); toast.success("Platform disconnected"); } });
  const deletePlatform = trpc.adPlatform.delete.useMutation({ onSuccess: () => { utils.adPlatform.connections.invalidate(); toast.success("Platform removed"); } });
  const launchAd = trpc.adPlatform.launchAd.useMutation({ onSuccess: (data) => toast.success(data.message) });
  const syncMetrics = trpc.adPlatform.syncMetrics.useMutation({ onSuccess: (data) => toast.success(data.message) });
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [launchOpen, setLaunchOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [adName, setAdName] = useState("");
  const [adBudget, setAdBudget] = useState("");

  const handleConnect = () => {
    if (!platform) { toast.error("Select a platform"); return; }
    connect.mutate({ platform, accountId: accountId || undefined, accountName: accountName || undefined, accessToken: accessToken || undefined });
    setPlatform(""); setAccountId(""); setAccountName(""); setAccessToken(""); setOpen(false);
  };

  const handleLaunchAd = () => {
    if (!selectedConnection || !adName.trim()) { toast.error("Fill in required fields"); return; }
    launchAd.mutate({ connectionId: selectedConnection, name: adName, budget: adBudget || undefined });
    setAdName(""); setAdBudget(""); setLaunchOpen(false); setSelectedConnection(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Share2 className="h-6 w-6 text-primary" /> Ad Platforms</h1>
          <p className="text-muted-foreground">Connect your ad accounts to launch and manage campaigns directly</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Connect Platform</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Connect Ad Platform</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue placeholder="Select platform..." /></SelectTrigger>
                  <SelectContent>{PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Account Name</Label><Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="My Business Account" /></div>
              <div><Label>Account ID (optional)</Label><Input value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="act_123456789" /></div>
              <div><Label>API Access Token</Label><Input value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="Your platform API token..." type="password" /></div>
              <p className="text-xs text-muted-foreground">Your tokens are encrypted and stored securely. You can find your API tokens in each platform's developer settings.</p>
              <Button className="w-full" onClick={handleConnect} disabled={connect.isPending}>{connect.isPending ? "Connecting..." : "Connect Platform"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Available Platforms Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Available Platforms</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {PLATFORMS.map(p => {
            const isConnected = connections?.some((c: any) => c.platform === p.value && c.status === "connected");
            return (
              <Card key={p.value} className={`cursor-pointer hover:shadow-md transition-all ${isConnected ? "border-green-300 bg-green-50" : ""}`}
                onClick={() => { if (!isConnected) { setPlatform(p.value); setOpen(true); } }}>
                <CardContent className="p-4 text-center">
                  <span className="text-2xl">{p.icon}</span>
                  <p className="text-sm font-medium mt-1">{p.label}</p>
                  {isConnected && <Badge className="mt-1 bg-green-100 text-green-800">Connected</Badge>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Connected Platforms */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : connections && connections.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-3">Connected Accounts</h2>
          <div className="space-y-3">
            {connections.map((conn: any) => {
              const platformInfo = PLATFORMS.find(p => p.value === conn.platform);
              return (
                <Card key={conn.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{platformInfo?.icon || "📡"}</span>
                        <div>
                          <h3 className="font-semibold">{conn.accountName || platformInfo?.label || conn.platform}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge className={conn.status === "connected" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{conn.status}</Badge>
                            {conn.accountId && <span>ID: {conn.accountId}</span>}
                            <span>Added {new Date(conn.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => syncMetrics.mutate({ connectionId: conn.id })} disabled={syncMetrics.isPending}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Sync
                        </Button>
                        <Button size="sm" onClick={() => { setSelectedConnection(conn.id); setLaunchOpen(true); }}>
                          <Rocket className="h-3 w-3 mr-1" /> Launch Ad
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => conn.status === "connected" ? disconnect.mutate({ id: conn.id }) : deletePlatform.mutate({ id: conn.id })}>
                          {conn.status === "connected" ? <Unplug className="h-4 w-4" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="border-dashed"><CardContent className="py-12 text-center">
          <Share2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No platforms connected yet. Connect your first ad platform to start launching campaigns directly.</p>
        </CardContent></Card>
      )}

      {/* Launch Ad Dialog */}
      <Dialog open={launchOpen} onOpenChange={setLaunchOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Launch Ad Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Campaign Name</Label><Input value={adName} onChange={e => setAdName(e.target.value)} placeholder="Spring Sale Campaign..." /></div>
            <div><Label>Daily Budget ($)</Label><Input value={adBudget} onChange={e => setAdBudget(e.target.value)} placeholder="50" type="number" /></div>
            <Button className="w-full" onClick={handleLaunchAd} disabled={launchAd.isPending}>{launchAd.isPending ? "Launching..." : "Launch Campaign"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
