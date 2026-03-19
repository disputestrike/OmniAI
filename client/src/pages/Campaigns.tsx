import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Megaphone, Plus, Loader2, Trash2, Play, Pause, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { WhatsNextCard } from "@/components/WhatsNextCard";
import { NEXT_STEPS_BY_PAGE } from "@/config/pathBlueprint";

const OBJECTIVES = [
  { value: "awareness", label: "Brand Awareness" }, { value: "traffic", label: "Website Traffic" },
  { value: "engagement", label: "Engagement" }, { value: "leads", label: "Lead Generation" },
  { value: "sales", label: "Sales / Conversions" }, { value: "app_installs", label: "App Installs" },
];
const PLATFORMS = ["Instagram","TikTok","YouTube","Facebook","LinkedIn","Twitter/X","Google Ads","Amazon","eBay","WhatsApp","Email","SMS","Pinterest","Snapchat","Reddit","Threads","Podcast","TV","Radio","Print","Blog/SEO"];

const STATUS_STYLES: Record<string, { pill: string; badge: string }> = {
  draft:     { pill: "idle",    badge: "badge-neutral" },
  active:    { pill: "done",    badge: "badge-success" },
  paused:    { pill: "warning", badge: "badge-warning" },
  completed: { pill: "done",    badge: "badge-cyan" },
  archived:  { pill: "idle",    badge: "badge-neutral" },
};

export default function Campaigns() {
  const utils = trpc.useUtils();
  const [location, setLocation] = useLocation();
  const { data: campaigns, isLoading } = trpc.campaign.list.useQuery();
  const { data: products } = trpc.product.list.useQuery();
  const createMut = trpc.campaign.create.useMutation({ onSuccess: () => { utils.campaign.list.invalidate(); setOpen(false); resetForm(); toast.success("Campaign created"); } });
  const updateMut = trpc.campaign.update.useMutation({ onSuccess: () => { utils.campaign.list.invalidate(); toast.success("Updated"); } });
  const deleteMut = trpc.campaign.delete.useMutation({ onSuccess: () => { utils.campaign.list.invalidate(); toast.success("Deleted"); } });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("awareness");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [productId, setProductId] = useState("");
  const [budget, setBudget] = useState("");

  const resetForm = () => { setName(""); setDescription(""); setObjective("awareness"); setSelectedPlatforms([]); setProductId(""); setBudget(""); };
  const analyzedProducts = useMemo(() => products?.filter(p => p.analysisStatus === "completed") ?? [], [products]);
  const togglePlatform = (p: string) => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  return (
    <div className="space-y-6 max-w-6xl animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Multi-platform campaigns across social, search, email, SMS, and more.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all" style={{ background: "rgba(124,58,237,0.8)" }}>
              <Plus className="h-4 w-4" /> New Campaign
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="text-white">Create Campaign</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Campaign Name *</Label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Launch 2026" className="w-full h-9 px-3 rounded-lg text-sm input-dark" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Description</Label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Campaign goals and notes..." rows={2} className="w-full px-3 py-2 rounded-lg text-sm input-dark resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Objective</Label>
                <Select value={objective} onValueChange={setObjective}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{OBJECTIVES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Platforms</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => togglePlatform(p)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all"
                      style={selectedPlatforms.includes(p)
                        ? { background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "#a78bfa" }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#71717a" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {analyzedProducts.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Product (optional)</Label>
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{analyzedProducts.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Budget (optional)</Label>
                <input value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. $5,000" className="w-full h-9 px-3 rounded-lg text-sm input-dark" />
              </div>
              <button
                className="w-full h-10 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: "rgba(124,58,237,0.8)" }}
                disabled={!name || selectedPlatforms.length === 0 || createMut.isPending}
                onClick={() => createMut.mutate({ name, description, objective: objective as any, platforms: selectedPlatforms, productId: productId ? Number(productId) : undefined, budget: budget || undefined })}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Campaign
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : !campaigns?.length ? (
        <div className="glass rounded-2xl">
          <div className="empty-state">
            <div className="empty-icon"><Megaphone className="h-5 w-5" /></div>
            <p className="empty-title">No campaigns yet</p>
            <p className="empty-desc">Create your first multi-platform campaign and let AI build the strategy, content, and schedule.</p>
            <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white mt-2" style={{ background: "rgba(124,58,237,0.8)" }}>
              <Plus className="h-4 w-4" /> Create first campaign
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {(campaigns as any[]).map(campaign => {
            const platforms = campaign.platforms as string[];
            const style = STATUS_STYLES[campaign.status] ?? STATUS_STYLES.draft;
            return (
              <div key={campaign.id} className="glass glass-hover rounded-2xl p-4 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <button onClick={() => setLocation(`/campaigns/${campaign.id}`)} className="flex items-start gap-3 min-w-0 flex-1 text-left">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(124,58,237,0.12)" }}>
                      <Megaphone className="h-5 w-5 text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-zinc-200">{campaign.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`agent-pill ${style.pill}`}><span className="dot" />{campaign.status}</span>
                        <span className="text-[10px] text-zinc-600">{OBJECTIVES.find(o => o.value === campaign.objective)?.label}</span>
                        {campaign.budget && <span className="text-[10px] text-zinc-600">{campaign.budget}</span>}
                      </div>
                      {platforms?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {platforms.slice(0, 5).map((p: string) => <span key={p} className="platform-tag">{p}</span>)}
                          {platforms.length > 5 && <span className="platform-tag">+{platforms.length - 5}</span>}
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setLocation(`/campaigns/${campaign.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-violet-400 transition-colors"
                      style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)" }}>
                      Open <ChevronRight className="h-3 w-3" />
                    </button>
                    {campaign.status === "draft" && (
                      <button onClick={(e) => { e.stopPropagation(); updateMut.mutate({ id: campaign.id, status: "active" }); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 transition-colors"
                        style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                        <Play className="h-3 w-3" /> Launch
                      </button>
                    )}
                    {campaign.status === "active" && (
                      <button onClick={(e) => { e.stopPropagation(); updateMut.mutate({ id: campaign.id, status: "paused" }); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-400 transition-colors"
                        style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <Pause className="h-3 w-3" /> Pause
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); deleteMut.mutate({ id: campaign.id }); }}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <WhatsNextCard steps={NEXT_STEPS_BY_PAGE["/campaigns"] ?? []} maxSteps={3} />
    </div>
  );
}
