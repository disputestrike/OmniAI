import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, Loader2, Clock, Trash2, CheckCircle, AlertCircle, Send } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const platformOptions = ["Instagram", "TikTok", "YouTube", "Twitter/X", "Facebook", "LinkedIn", "WhatsApp", "Email"];

export default function Scheduler() {
  const utils = trpc.useUtils();
  const { data: schedules, isLoading } = trpc.schedule.list.useQuery();
  const { data: contents } = trpc.content.list.useQuery();
  const createMut = trpc.schedule.create.useMutation({
    onSuccess: () => { utils.schedule.list.invalidate(); setOpen(false); toast.success("Scheduled!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.schedule.delete.useMutation({ onSuccess: () => { utils.schedule.list.invalidate(); toast.success("Deleted"); } });
  const updateMut = trpc.schedule.update.useMutation({ onSuccess: () => { utils.schedule.list.invalidate(); toast.success("Updated"); } });

  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState("Instagram");
  const [contentId, setContentId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [caption, setCaption] = useState("");

  const statusColors: Record<string, { bg: string; icon: any }> = {
    scheduled: { bg: "bg-blue-50 text-blue-700", icon: Clock },
    posted: { bg: "bg-emerald-50 text-emerald-700", icon: CheckCircle },
    failed: { bg: "bg-red-50 text-red-700", icon: AlertCircle },
    cancelled: { bg: "bg-gray-100 text-gray-600", icon: AlertCircle },
  };

  const grouped = useMemo(() => {
    if (!schedules) return {};
    const groups: Record<string, typeof schedules> = {};
    schedules.forEach(s => {
      const date = s.scheduledAt ? new Date(s.scheduledAt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "Unscheduled";
      if (!groups[date]) groups[date] = [];
      groups[date].push(s);
    });
    return groups;
  }, [schedules]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scheduler</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule and auto-post content across all platforms with optimal timing recommendations.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4 mr-2" />Schedule Post</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule a Post</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{platformOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {contents && contents.length > 0 && (
                <div><Label>Link Content (optional)</Label>
                  <Select value={contentId} onValueChange={setContentId}><SelectTrigger><SelectValue placeholder="Select content" /></SelectTrigger>
                    <SelectContent>{contents.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} /></div>
                <div><Label>Time</Label><Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} /></div>
              </div>
              <div><Label>Caption / Note</Label><Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add a note for this post..." /></div>
              <Button className="w-full rounded-xl" disabled={!scheduledDate || !scheduledTime || createMut.isPending} onClick={() => {
                const dt = new Date(`${scheduledDate}T${scheduledTime}`);
                createMut.mutate({ platform, contentId: contentId ? Number(contentId) : undefined, scheduledAt: dt.toISOString() });
              }}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
                Schedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="border-0 shadow-sm animate-pulse"><CardContent className="p-6 h-20" /></Card>)}</div>
      ) : !schedules?.length ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg">No scheduled posts</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Schedule content across all your platforms. AI will recommend optimal posting times for maximum engagement.</p>
            <Button className="mt-4 rounded-xl" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Schedule Your First Post</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{date}</h3>
              <div className="space-y-2">
                {items.map(item => {
                  const statusInfo = statusColors[item.status] || statusColors.scheduled;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="text-center shrink-0 w-14">
                            <p className="text-lg font-bold">{item.scheduledAt ? new Date(item.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</p>
                          </div>
                          <div className="h-10 w-px bg-border" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{item.platform}</Badge>
                              <Badge className={`text-xs border-0 ${statusInfo.bg}`}><StatusIcon className="h-3 w-3 mr-1" />{item.status}</Badge>
                            </div>
                            {(item.metadata as any)?.caption && <p className="text-sm text-muted-foreground mt-1 truncate">{(item.metadata as any).caption}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {item.status === "scheduled" && (
                              <Button size="sm" variant="outline" className="rounded-lg h-8" onClick={() => updateMut.mutate({ id: item.id, status: "published" })}>
                                <Send className="h-3 w-3 mr-1" />Post Now
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="rounded-lg h-8 text-destructive hover:text-destructive" onClick={() => deleteMut.mutate({ id: item.id })}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
