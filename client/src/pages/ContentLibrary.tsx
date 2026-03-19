import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search, Filter, Clock, Calendar, Trash2, Archive, CheckCircle, Copy,
  RefreshCw, Send, Image as ImageIcon, Languages, Sparkles, ChevronDown,
  ChevronUp, BarChart3, FileText, Loader2, Zap, ArrowRight,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const CONTENT_TYPES = [
  { value: "ad_copy_short", label: "Short Ad" },
  { value: "ad_copy_long", label: "Long Ad" },
  { value: "blog_post", label: "Blog Post" },
  { value: "seo_meta", label: "SEO Meta" },
  { value: "social_caption", label: "Social Caption" },
  { value: "video_script", label: "Video Script" },
  { value: "email_copy", label: "Email" },
  { value: "pr_release", label: "Press Release" },
  { value: "podcast_script", label: "Podcast" },
  { value: "tv_script", label: "TV Script" },
  { value: "radio_script", label: "Radio" },
  { value: "copywriting", label: "Sales Copy" },
  { value: "amazon_listing", label: "Amazon" },
  { value: "google_ads", label: "Google Ads" },
  { value: "youtube_seo", label: "YouTube SEO" },
  { value: "twitter_thread", label: "Twitter Thread" },
  { value: "linkedin_article", label: "LinkedIn" },
  { value: "whatsapp_broadcast", label: "WhatsApp" },
  { value: "sms_copy", label: "SMS" },
  { value: "story_content", label: "Story" },
  { value: "ugc_script", label: "UGC Script" },
  { value: "landing_page", label: "Landing Page" },
];

const PLATFORMS = ["instagram", "tiktok", "youtube", "twitter", "facebook", "linkedin", "pinterest", "threads"];
const STATUSES = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-700" },
  { value: "approved", label: "Approved", color: "bg-blue-100 text-blue-700" },
  { value: "published", label: "Published", color: "bg-green-100 text-green-700" },
  { value: "archived", label: "Archived", color: "bg-amber-100 text-amber-700" },
];

export default function ContentLibrary() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [platformFilter, setPlatformFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleContentId, setScheduleContentId] = useState<number | null>(null);
  const [schedulePlatforms, setSchedulePlatforms] = useState<string[]>([]);

  const searchInput = useMemo(() => ({
    query: searchQuery || undefined,
    type: typeFilter || undefined,
    platform: platformFilter || undefined,
    status: statusFilter || undefined,
    limit: 50,
    offset: page * 50,
  }), [searchQuery, typeFilter, platformFilter, statusFilter, page]);

  const { data: results, isLoading, refetch } = trpc.library.search.useQuery(searchInput);
  const { data: stats } = trpc.library.stats.useQuery();
  const bulkDelete = trpc.library.bulkDelete.useMutation({ onSuccess: () => { refetch(); setSelectedIds(new Set()); toast.success("Deleted successfully"); } });
  const bulkUpdateStatus = trpc.library.bulkUpdateStatus.useMutation({ onSuccess: () => { refetch(); setSelectedIds(new Set()); toast.success("Status updated"); } });
  const autoSchedule = trpc.library.autoSchedule.useMutation({ onSuccess: (data) => { toast.success(`Scheduled to ${data.count} platform(s) at optimal times`); setScheduleDialogOpen(false); } });
  const { data: optimalTimes } = trpc.library.getOptimalTimes.useQuery(
    { platform: schedulePlatforms[0] || "instagram", count: 5 },
    { enabled: schedulePlatforms.length > 0 }
  );

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!results?.items) return;
    if (selectedIds.size === results.items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.items.map(i => i.id)));
    }
  }, [results, selectedIds]);

  const getTypeLabel = (type: string) => CONTENT_TYPES.find(t => t.value === type)?.label || type;
  const getStatusBadge = (status: string) => STATUSES.find(s => s.value === status) || STATUSES[0];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Library</h1>
          <p className="text-zinc-500 mt-1">Search, browse, and manage all your content in one place</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/content-ingest")}>
            <Sparkles className="w-4 h-4 mr-2" /> Ingest New
          </Button>
          <Button onClick={() => navigate("/content")}>
            <FileText className="w-4 h-4 mr-2" /> Create Content
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-zinc-500">Total Content</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{Object.keys(stats.byType).length}</div>
              <div className="text-sm text-zinc-500">Content Types</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.byStatus?.published || 0}</div>
              <div className="text-sm text-zinc-500">Published</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.byStatus?.draft || 0}</div>
              <div className="text-sm text-zinc-500">Drafts</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search by title, content..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v === "all" ? "" : v); setPage(0); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {CONTENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={v => { setPlatformFilter(v === "all" ? "" : v); setPage(0); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {PLATFORMS.map(p => (
                  <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === "all" ? "" : v); setPage(0); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus.mutate({ ids: Array.from(selectedIds), status: "approved" })}>
            <CheckCircle className="w-3 h-3 mr-1" /> Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus.mutate({ ids: Array.from(selectedIds), status: "archived" })}>
            <Archive className="w-3 h-3 mr-1" /> Archive
          </Button>
          <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete selected content?")) bulkDelete.mutate({ ids: Array.from(selectedIds) }); }}>
            <Trash2 className="w-3 h-3 mr-1" /> Delete
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      {/* Content List */}
      <div className="space-y-2">
        {/* Select All Header */}
        {results && results.items.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-500">
            <Checkbox checked={selectedIds.size === results.items.length && results.items.length > 0} onCheckedChange={selectAll} />
            <span className="flex-1">Content ({results.total} total)</span>
            <span className="w-24 text-center">Type</span>
            <span className="w-24 text-center">Platform</span>
            <span className="w-20 text-center">Status</span>
            <span className="w-32 text-center">Actions</span>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading content...</span>
          </div>
        )}

        {results?.items.map(item => {
          const statusBadge = getStatusBadge(item.status);
          const isExpanded = expandedId === item.id;
          return (
            <Card key={item.id} className={`transition-all ${selectedIds.has(item.id) ? "ring-2 ring-primary/30" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                    <div className="font-medium truncate">{item.title || "Untitled"}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <Badge variant="outline" className="w-24 justify-center text-xs">{getTypeLabel(item.type)}</Badge>
                  <Badge variant="secondary" className="w-24 justify-center text-xs">{item.platform || "—"}</Badge>
                  <Badge className={`w-20 justify-center text-xs ${statusBadge.color}`}>{statusBadge.label}</Badge>
                  <div className="flex gap-1 w-32 justify-center">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(item.body || ""); toast.success("Copied!"); }}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate(`/content?remix=${encodeURIComponent((item.body || "").substring(0, 2000))}`)}>
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setScheduleContentId(item.id); setScheduleDialogOpen(true); }}>
                      <Calendar className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="bg-zinc-900/40 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{item.body || "No content"}</pre>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/content?remix=${encodeURIComponent((item.body || "").substring(0, 2000))}`)}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Remix
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/content-ingest?text=${encodeURIComponent((item.body || "").substring(0, 2000))}`)}>
                        <Sparkles className="w-3 h-3 mr-1" /> Re-Ingest
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/translate?text=${encodeURIComponent((item.body || "").substring(0, 2000))}`)}>
                        <Languages className="w-3 h-3 mr-1" /> Translate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/creatives?prompt=${encodeURIComponent((item.title || "marketing visual") + " - " + (item.body || "").substring(0, 200))}`)}>
                        <ImageIcon className="w-3 h-3 mr-1" /> Generate Image
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setScheduleContentId(item.id); setScheduleDialogOpen(true); }}>
                        <Zap className="w-3 h-3 mr-1" /> Auto-Schedule
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/social-publish`)}>
                        <Send className="w-3 h-3 mr-1" /> Publish Now
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {results && results.items.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-zinc-500/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">No content found</h3>
              <p className="text-zinc-500 mb-4">
                {searchQuery || typeFilter || platformFilter || statusFilter
                  ? "Try adjusting your filters"
                  : "Start creating content to build your library"}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate("/content")}>Create Content</Button>
                <Button variant="outline" onClick={() => navigate("/content-ingest")}>Ingest Content</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {results && results.total > 50 && (
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-zinc-500">
              Showing {page * 50 + 1}-{Math.min((page + 1) * 50, results.total)} of {results.total}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={(page + 1) * 50 >= results.total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Auto-Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Auto-Schedule at Optimal Times
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              Select platforms and we'll automatically schedule this content at the best times for maximum engagement.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map(p => (
                <label key={p} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${schedulePlatforms.includes(p) ? "border-primary bg-primary/5" : "hover:bg-zinc-900/40"}`}>
                  <Checkbox
                    checked={schedulePlatforms.includes(p)}
                    onCheckedChange={(checked) => {
                      setSchedulePlatforms(prev => checked ? [...prev, p] : prev.filter(x => x !== p));
                    }}
                  />
                  <span className="text-sm capitalize">{p}</span>
                </label>
              ))}
            </div>

            {optimalTimes && schedulePlatforms.length > 0 && (
              <div className="bg-zinc-900/40 rounded-lg p-3 space-y-1">
                <div className="text-xs font-medium text-zinc-500">Next optimal slots for {schedulePlatforms[0]}:</div>
                {optimalTimes.nextSlots.slice(0, 3).map((slot, i) => (
                  <div key={i} className="text-sm flex items-center gap-2">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {new Date(slot).toLocaleDateString()} at {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                ))}
              </div>
            )}

            <Button
              className="w-full"
              disabled={schedulePlatforms.length === 0 || autoSchedule.isPending || !scheduleContentId}
              onClick={() => {
                if (scheduleContentId) {
                  autoSchedule.mutate({ contentId: scheduleContentId, platforms: schedulePlatforms });
                }
              }}
            >
              {autoSchedule.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scheduling...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" /> Schedule to {schedulePlatforms.length} Platform(s)</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
