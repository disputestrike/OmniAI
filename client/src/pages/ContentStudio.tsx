import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PenTool, Loader2, Sparkles, Trash2, Copy, Check, FileText, Search, RefreshCw, Shuffle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import { useSearch } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { WhatsNextCard } from "@/components/WhatsNextCard";
import { NEXT_STEPS_BY_PAGE } from "@/config/pathBlueprint";

const contentCategories = [
  {
    id: "ads", label: "Ads & Copy", types: [
      { value: "ad_copy_short", label: "Short Ad Copy", desc: "Under 90 chars, punchy CTA" },
      { value: "ad_copy_long", label: "Long Ad Copy", desc: "200-400 word persuasive copy" },
      { value: "google_ads", label: "Google Ads", desc: "Headlines, descriptions, extensions" },
      { value: "amazon_listing", label: "Amazon/eBay Listing", desc: "Product title, bullets, description" },
      { value: "copywriting", label: "Sales Copywriting", desc: "Landing page / sales page copy" },
      { value: "landing_page", label: "Landing Page", desc: "Full page copy with sections" },
    ]
  },
  {
    id: "social", label: "Social Media", types: [
      { value: "social_caption", label: "Social Caption", desc: "Platform-optimized captions" },
      { value: "twitter_thread", label: "Twitter/X Thread", desc: "8-12 tweet viral thread" },
      { value: "linkedin_article", label: "LinkedIn Article", desc: "Professional thought leadership" },
      { value: "story_content", label: "Stories Content", desc: "IG/TikTok story slides" },
      { value: "ugc_script", label: "UGC Script", desc: "Creator-style authentic script" },
      { value: "youtube_seo", label: "YouTube SEO Pack", desc: "Title, desc, tags, thumbnails" },
    ]
  },
  {
    id: "content", label: "Long-Form", types: [
      { value: "blog_post", label: "Blog Post", desc: "SEO-optimized 800-1200 words" },
      { value: "seo_meta", label: "SEO Meta Tags", desc: "Title, description, keywords" },
      { value: "pr_release", label: "Press Release", desc: "AP-style professional PR" },
      { value: "podcast_script", label: "Podcast Script", desc: "Episode script with talking points" },
    ]
  },
  {
    id: "broadcast", label: "Broadcast & Direct", types: [
      { value: "email_copy", label: "Email Newsletter", desc: "Subject, body, CTA" },
      { value: "sms_copy", label: "SMS Marketing", desc: "160-char promotional texts" },
      { value: "whatsapp_broadcast", label: "WhatsApp Broadcast", desc: "Broadcast message with CTA" },
      { value: "video_script", label: "Video Script", desc: "YouTube/TikTok/Reels script" },
      { value: "tv_script", label: "TV Commercial", desc: "30-60 sec TV ad script" },
      { value: "radio_script", label: "Radio Ad", desc: "30-60 sec radio spot" },
    ]
  },
];

const allTypes = contentCategories.flatMap(c => c.types);

const platforms = [
  { value: "instagram", label: "Instagram" }, { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" }, { value: "twitter", label: "Twitter/X" },
  { value: "facebook", label: "Facebook" }, { value: "linkedin", label: "LinkedIn" },
  { value: "whatsapp", label: "WhatsApp" }, { value: "google", label: "Google Ads" },
  { value: "amazon", label: "Amazon" }, { value: "ebay", label: "eBay" },
  { value: "email", label: "Email" }, { value: "sms", label: "SMS" },
];

export default function ContentStudio() {
  const utils = trpc.useUtils();
  const { data: contents, isLoading } = trpc.content.list.useQuery();
  const { data: products } = trpc.product.list.useQuery();
  const generateMut = trpc.content.generate.useMutation({
    onSuccess: () => { utils.content.list.invalidate(); setOpen(false); toast.success("Content generated!"); },
    onError: (e) => toast.error(e.message),
  });
  const remixMut = trpc.content.remix.useMutation({
    onSuccess: () => { utils.content.list.invalidate(); setRemixOpen(false); toast.success("Content remixed!"); },
    onError: (e) => toast.error(e.message),
  });
  const repurposeMut = trpc.content.repurpose.useMutation({
    onSuccess: (data) => { utils.content.list.invalidate(); setRepurposeOpen(false); toast.success(`Created ${data.created.length} pieces!`); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.content.delete.useMutation({ onSuccess: () => { utils.content.list.invalidate(); toast.success("Deleted"); } });

  const [open, setOpen] = useState(false);
  const [remixOpen, setRemixOpen] = useState(false);
  const [repurposeOpen, setRepurposeOpen] = useState(false);
  const [type, setType] = useState("ad_copy_short");
  const [platform, setPlatform] = useState("");
  const [productId, setProductId] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Remix state
  const [remixContent, setRemixContent] = useState("");
  const [remixInstruction, setRemixInstruction] = useState("");
  const [remixTargetType, setRemixTargetType] = useState("");
  const [remixPlatform, setRemixPlatform] = useState("");

  // Repurpose state
  const [repurposeContentId, setRepurposeContentId] = useState<number | null>(null);
  const [repurposeTargets, setRepurposeTargets] = useState<string[]>([]);

  const search = useSearch();
  const analyzedProducts = useMemo(() => products?.filter(p => p.analysisStatus === "completed") ?? [], [products]);

  // Pre-select product when opened from Products page (e.g. /content?productId=5)
  useEffect(() => {
    const params = new URLSearchParams(typeof search === "string" ? search : "");
    const id = params.get("productId");
    if (id) setProductId(id);
  }, [search]);

  const filtered = useMemo(() => {
    if (!contents) return [];
    return contents.filter(c => {
      const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.body?.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || c.type === filterType;
      return matchSearch && matchType;
    });
  }, [contents, search, filterType]);

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openRemixFromContent = (body: string) => {
    setRemixContent(body);
    setRemixOpen(true);
  };

  const openRepurposeFromContent = (id: number) => {
    setRepurposeContentId(id);
    setRepurposeTargets([]);
    setRepurposeOpen(true);
  };

  const toggleRepurposeTarget = (t: string) => {
    setRepurposeTargets(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Studio</h1>
          <p className="text-muted-foreground text-sm mt-1">Generate, remix, and repurpose marketing content across 22 formats and all platforms.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => { setRemixContent(""); setRemixOpen(true); }}>
            <RefreshCw className="h-4 w-4 mr-2" />Remix Content
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl"><Sparkles className="h-4 w-4 mr-2" />Generate Content</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Generate Content with AI</DialogTitle></DialogHeader>
              <Tabs defaultValue="ads" className="mt-2">
                <TabsList className="w-full grid grid-cols-4">
                  {contentCategories.map(cat => <TabsTrigger key={cat.id} value={cat.id} className="text-xs">{cat.label}</TabsTrigger>)}
                </TabsList>
                {contentCategories.map(cat => (
                  <TabsContent key={cat.id} value={cat.id} className="mt-3">
                    <div className="grid grid-cols-2 gap-2">
                      {cat.types.map(t => (
                        <button key={t.value} onClick={() => setType(t.value)}
                          className={`p-3 rounded-xl text-left transition-all border ${type === t.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30 hover:bg-muted/50"}`}>
                          <p className="text-sm font-medium">{t.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
              <div className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Platform (optional)</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                      <SelectContent>{platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {analyzedProducts.length > 0 && (
                    <div>
                      <Label>Based on Product</Label>
                      <Select value={productId} onValueChange={setProductId}>
                        <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>{analyzedProducts.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Custom Instructions (optional)</Label>
                  <Textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Tone, audience, key messages, brand voice, language, persuasion angle..." rows={3} />
                </div>
                <Button className="w-full rounded-xl" disabled={generateMut.isPending} onClick={() => generateMut.mutate({ type: type as any, platform: platform || undefined, productId: productId ? Number(productId) : undefined, customPrompt: customPrompt || undefined })}>
                  {generateMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate {allTypes.find(t => t.value === type)?.label}</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Remix Dialog */}
      <Dialog open={remixOpen} onOpenChange={setRemixOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-primary" />Remix Content</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Paste any content — a competitor's ad, a viral post, an article — and AI will recreate it better, more engaging, and more effective.</p>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Original Content *</Label>
              <Textarea value={remixContent} onChange={e => setRemixContent(e.target.value)} placeholder="Paste any content here: a competitor's ad, a social post, an email, an article, a script..." rows={6} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Remix Into (optional)</Label>
                <Select value={remixTargetType} onValueChange={setRemixTargetType}>
                  <SelectTrigger><SelectValue placeholder="Same format" /></SelectTrigger>
                  <SelectContent>{allTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Platform (optional)</Label>
                <Select value={remixPlatform} onValueChange={setRemixPlatform}>
                  <SelectTrigger><SelectValue placeholder="Any platform" /></SelectTrigger>
                  <SelectContent>{platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Instructions (optional)</Label>
              <Textarea value={remixInstruction} onChange={e => setRemixInstruction(e.target.value)} placeholder="Make it more aggressive, change the tone to casual, target Gen Z, add urgency..." rows={2} />
            </div>
            <Button className="w-full rounded-xl" disabled={!remixContent.trim() || remixMut.isPending}
              onClick={() => remixMut.mutate({ originalContent: remixContent, instruction: remixInstruction || undefined, targetType: (remixTargetType || undefined) as any, platform: remixPlatform || undefined })}>
              {remixMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Remixing...</> : <><RefreshCw className="h-4 w-4 mr-2" />Remix &amp; Make It Better</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Repurpose Dialog */}
      <Dialog open={repurposeOpen} onOpenChange={setRepurposeOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Shuffle className="h-5 w-5 text-primary" />Repurpose Content</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Turn one piece of content into multiple formats. Select the formats you want to create.</p>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-2">
              {allTypes.map(t => (
                <button key={t.value} onClick={() => toggleRepurposeTarget(t.value)}
                  className={`p-2.5 rounded-xl text-left transition-all border text-sm ${repurposeTargets.includes(t.value) ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30"}`}>
                  <p className="font-medium text-xs">{t.label}</p>
                </button>
              ))}
            </div>
            <Button className="w-full rounded-xl" disabled={!repurposeTargets.length || !repurposeContentId || repurposeMut.isPending}
              onClick={() => repurposeContentId && repurposeMut.mutate({ contentId: repurposeContentId, targetTypes: repurposeTargets })}>
              {repurposeMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Repurposing into {repurposeTargets.length} formats...</> : <><Shuffle className="h-4 w-4 mr-2" />Repurpose into {repurposeTargets.length} Formats</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search content..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {allTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="shrink-0">{filtered.length} items</Badge>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3">{[1,2,3].map(i => <Card key={i} className="border-0 shadow-sm animate-pulse"><CardContent className="p-6 h-24" /></Card>)}</div>
      ) : !filtered.length ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <PenTool className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg">{contents?.length ? "No matching content" : "No content yet"}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Generate any type of marketing content, remix competitor content, or repurpose existing pieces across 22 formats.</p>
            {!contents?.length && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <Button className="rounded-xl" onClick={() => setOpen(true)}><Sparkles className="h-4 w-4 mr-2" />Generate Content</Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setRemixOpen(true)}><RefreshCw className="h-4 w-4 mr-2" />Remix Content</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(content => (
            <Card key={content.id} className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => setExpandedId(expandedId === content.id ? null : content.id)}>
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{content.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{allTypes.find(t => t.value === content.type)?.label || content.type}</Badge>
                        {content.platform && <Badge variant="outline" className="text-xs">{content.platform}</Badge>}
                        <Badge className={`text-xs border-0 ${content.status === "published" ? "bg-emerald-50 text-emerald-700" : content.status === "approved" ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-600"}`}>{content.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Remix" onClick={() => openRemixFromContent(content.body || "")}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Repurpose" onClick={() => openRepurposeFromContent(content.id)}>
                      <Shuffle className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleCopy(content.id, content.body || "")}>
                      {copiedId === content.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => deleteMut.mutate({ id: content.id })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {expandedId === content.id && content.body && (
                  <div className="mt-4 border-t pt-4">
                    <div className="prose prose-sm max-w-none text-foreground"><Streamdown>{content.body}</Streamdown></div>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                      <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => openRemixFromContent(content.body || "")}>
                        <RefreshCw className="h-3 w-3 mr-1" />Remix This
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => openRepurposeFromContent(content.id)}>
                        <Shuffle className="h-3 w-3 mr-1" />Repurpose
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => handleCopy(content.id, content.body || "")}>
                        <Copy className="h-3 w-3 mr-1" />Copy All
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <WhatsNextCard steps={NEXT_STEPS_BY_PAGE["/content"] ?? []} maxSteps={3} />
    </div>
  );
}
