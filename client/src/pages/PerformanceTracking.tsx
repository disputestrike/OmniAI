import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BarChart3, TrendingUp, Heart, Share2, MessageCircle, Eye, MousePointer, Users, Plus, ArrowUp, ArrowDown } from "lucide-react";

const PLATFORMS = ["instagram", "tiktok", "youtube", "twitter", "facebook", "linkedin", "pinterest", "threads"];

export default function PerformanceTracking() {
  const { user } = useAuth();
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [showRecord, setShowRecord] = useState(false);
  const [newMetric, setNewMetric] = useState({ platform: "instagram", postUrl: "", likes: 0, shares: 0, comments: 0, reach: 0, impressions: 0, clicks: 0 });

  const summaryQ = trpc.enhanced.performance.summary.useQuery(undefined, { enabled: !!user });
  const metricsQ = trpc.enhanced.performance.list.useQuery(
    filterPlatform !== "all" ? { platform: filterPlatform } : {},
    { enabled: !!user }
  );

  const recordMetric = trpc.enhanced.performance.record.useMutation({
    onSuccess: () => { metricsQ.refetch(); summaryQ.refetch(); setShowRecord(false); toast.success("Metrics recorded"); },
  });

  const summary = summaryQ.data;

  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Tracking</h1>
          <p className="text-zinc-500 mt-1">Monitor engagement metrics across all your platforms</p>
        </div>
        <Dialog open={showRecord} onOpenChange={setShowRecord}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Record Metrics</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Post Metrics</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Select value={newMetric.platform} onValueChange={v => setNewMetric({ ...newMetric, platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Post URL (optional)" value={newMetric.postUrl} onChange={e => setNewMetric({ ...newMetric, postUrl: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-500">Likes</label>
                  <Input type="number" value={newMetric.likes} onChange={e => setNewMetric({ ...newMetric, likes: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Shares</label>
                  <Input type="number" value={newMetric.shares} onChange={e => setNewMetric({ ...newMetric, shares: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Comments</label>
                  <Input type="number" value={newMetric.comments} onChange={e => setNewMetric({ ...newMetric, comments: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Reach</label>
                  <Input type="number" value={newMetric.reach} onChange={e => setNewMetric({ ...newMetric, reach: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Impressions</label>
                  <Input type="number" value={newMetric.impressions} onChange={e => setNewMetric({ ...newMetric, impressions: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Clicks</label>
                  <Input type="number" value={newMetric.clicks} onChange={e => setNewMetric({ ...newMetric, clicks: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <Button className="w-full" onClick={() => recordMetric.mutate(newMetric)} disabled={recordMetric.isPending}>
                {recordMetric.isPending ? "Recording..." : "Record Metrics"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <BarChart3 className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{summary?.totalPosts || 0}</div>
            <div className="text-[10px] text-zinc-500">Total Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Heart className="w-5 h-5 mx-auto mb-1 text-red-500" />
            <div className="text-xl font-bold">{formatNum(summary?.totalLikes || 0)}</div>
            <div className="text-[10px] text-zinc-500">Total Likes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Share2 className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <div className="text-xl font-bold">{formatNum(summary?.totalShares || 0)}</div>
            <div className="text-[10px] text-zinc-500">Total Shares</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <MessageCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <div className="text-xl font-bold">{formatNum(summary?.totalComments || 0)}</div>
            <div className="text-[10px] text-zinc-500">Comments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-purple-500" />
            <div className="text-xl font-bold">{formatNum(summary?.totalReach || 0)}</div>
            <div className="text-[10px] text-zinc-500">Reach</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Eye className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <div className="text-xl font-bold">{formatNum(summary?.totalImpressions || 0)}</div>
            <div className="text-[10px] text-zinc-500">Impressions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <MousePointer className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
            <div className="text-xl font-bold">{formatNum(summary?.totalClicks || 0)}</div>
            <div className="text-[10px] text-zinc-500">Clicks</div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      {summary?.byPlatform && Object.keys(summary.byPlatform).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Platform Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-zinc-500">
                    <th className="text-left py-2 pr-4">Platform</th>
                    <th className="text-right py-2 px-2">Posts</th>
                    <th className="text-right py-2 px-2">Likes</th>
                    <th className="text-right py-2 px-2">Shares</th>
                    <th className="text-right py-2 px-2">Comments</th>
                    <th className="text-right py-2 px-2">Reach</th>
                    <th className="text-right py-2 px-2">Impressions</th>
                    <th className="text-right py-2 px-2">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.byPlatform).map(([platform, data]: [string, any]) => (
                    <tr key={platform} className="border-b last:border-0 hover:bg-zinc-900/40">
                      <td className="py-2 pr-4 font-medium capitalize">{platform}</td>
                      <td className="text-right py-2 px-2">{data.count}</td>
                      <td className="text-right py-2 px-2">{formatNum(data.likes)}</td>
                      <td className="text-right py-2 px-2">{formatNum(data.shares)}</td>
                      <td className="text-right py-2 px-2">{formatNum(data.comments)}</td>
                      <td className="text-right py-2 px-2">{formatNum(data.reach)}</td>
                      <td className="text-right py-2 px-2">{formatNum(data.impressions)}</td>
                      <td className="text-right py-2 px-2">{formatNum(data.clicks)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Post Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Post Metrics</h2>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {metricsQ.isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-800 animate-pulse rounded-lg" />)}</div>
        ) : !metricsQ.data?.length ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-zinc-500">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No metrics recorded yet</p>
              <p className="text-sm mt-1">Record your first post metrics to start tracking performance</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {metricsQ.data.map((m: any) => (
              <Card key={m.id} className="hover:shadow-sm transition-all">
                <CardContent className="py-3">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="capitalize">{m.platform}</Badge>
                    <div className="flex-1 min-w-0">
                      {m.postUrl ? (
                        <a href={m.postUrl} target="_blank" rel="noopener" className="text-sm text-primary hover:underline truncate block">{m.postUrl}</a>
                      ) : (
                        <span className="text-sm text-zinc-500">No URL</span>
                      )}
                      <span className="text-xs text-zinc-500">{new Date(m.recordedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500" />{formatNum(m.likes || 0)}</span>
                      <span className="flex items-center gap-1"><Share2 className="w-3 h-3 text-blue-500" />{formatNum(m.shares || 0)}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3 text-green-500" />{formatNum(m.comments || 0)}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-orange-500" />{formatNum(m.impressions || 0)}</span>
                      <span className="flex items-center gap-1"><MousePointer className="w-3 h-3 text-cyan-500" />{formatNum(m.clicks || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
