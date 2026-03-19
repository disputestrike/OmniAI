import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Globe, Eye, Sparkles, Layout, FileText, ExternalLink, GripVertical, Video, MapPin, Calendar, PenLine } from "lucide-react";

export default function LandingPageBuilder() {
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<"choice" | "ai" | "template">("choice");
  const [showAiGen, setShowAiGen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [aiOneSentence, setAiOneSentence] = useState("");
  const [aiPurpose, setAiPurpose] = useState("");
  const [aiIndustry, setAiIndustry] = useState("");
  const [aiStyle, setAiStyle] = useState("");
  const [editingComponent, setEditingComponent] = useState<number | null>(null);
  const [leadDest, setLeadDest] = useState<{ leadManager?: boolean; crm?: boolean; emailListId?: string }>({});
  const [redirectAfterSubmit, setRedirectAfterSubmit] = useState<string>("");

  const { data: pages, refetch } = trpc.landingPageBuilder.list.useQuery();
  const { data: templates } = trpc.landingPageBuilder.templates.useQuery();
  const { data: pageDetail, refetch: refetchDetail } = trpc.landingPageBuilder.get.useQuery(
    { id: selectedPage! }, { enabled: !!selectedPage }
  );
  const { data: submissions } = trpc.landingPageBuilder.getSubmissions.useQuery(
    { landingPageId: selectedPage! }, { enabled: !!selectedPage }
  );

  const createPage = trpc.landingPageBuilder.create.useMutation({
    onSuccess: (data) => { toast.success("Landing page created"); setShowCreate(false); setTitle(""); setSlug(""); refetch(); setSelectedPage(data.id); },
    onError: (e) => toast.error(e.message),
  });
  const updatePage = trpc.landingPageBuilder.update.useMutation({
    onSuccess: () => { toast.success("Page updated"); refetchDetail(); refetch(); },
  });
  const deletePage = trpc.landingPageBuilder.delete.useMutation({
    onSuccess: () => { toast.success("Page deleted"); setSelectedPage(null); refetch(); },
  });
  const aiGenerate = trpc.landingPageBuilder.generateWithAi.useMutation({
    onSuccess: (data) => {
      if (selectedPage && data.components) {
        updatePage.mutate({ id: selectedPage, components: data.components });
      }
      toast.success("AI generated landing page components");
      setShowAiGen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const buildWithAi = () => {
    if (!aiOneSentence.trim()) { toast.error("Describe your page in one sentence"); return; }
    aiGenerate.mutate(
      { purpose: aiOneSentence.trim(), industry: aiIndustry || undefined, style: aiStyle || undefined },
      {
        onSuccess: (data) => {
          if (!data.components?.length) { toast.error("No components generated"); return; }
          const t = aiOneSentence.slice(0, 50).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "page";
          const slugGen = t + "-" + Date.now().toString(36);
          createPage.mutate(
            { title: aiOneSentence.slice(0, 80) || "New Page", slug: slugGen, templateId: "default" },
            {
              onSuccess: (created) => {
                if (created?.id)
                  updatePage.mutate(
                    { id: created.id, components: data.components },
                    { onSuccess: () => { refetch(); setSelectedPage(created.id); setShowCreate(false); setCreateMode("choice"); setAiOneSentence(""); toast.success("Page created with AI"); } }
                  );
                else { setShowCreate(false); setCreateMode("choice"); refetch(); toast.success("Page created"); }
              },
            }
          );
        },
      }
    );
  };

  const components = (pageDetail?.components as any[]) || [];
  const hasForm = components.some((c: any) => c.type === "form");
  const { data: emailLists } = trpc.emailMarketing.listLists.useQuery(undefined, { enabled: hasForm && !!selectedPage });

  useEffect(() => {
    if (!pageDetail?.metadata) return;
    const meta = pageDetail.metadata as { leadDestination?: { leadManager?: boolean; crm?: boolean; emailListId?: number }; redirectAfterSubmit?: string };
    if (meta.leadDestination) setLeadDest({ leadManager: meta.leadDestination.leadManager, crm: meta.leadDestination.crm, emailListId: meta.leadDestination.emailListId != null ? String(meta.leadDestination.emailListId) : "" });
    if (meta.redirectAfterSubmit != null) setRedirectAfterSubmit(String(meta.redirectAfterSubmit));
  }, [pageDetail?.metadata]);

  const blockLibrary = [
    { type: "video_embed", label: "Video embed", icon: Video, defaultProps: { url: "https://www.youtube.com/embed/dQw4w9WgXcQ", title: "Video" } },
    { type: "map", label: "Map / Address", icon: MapPin, defaultProps: { address: "123 Main St, City, Country", embedUrl: "" } },
    { type: "calendly", label: "Calendly", icon: Calendar, defaultProps: { calendlyUrl: "https://calendly.com/your-link", title: "Book a call" } },
    { type: "signature", label: "Signature", icon: PenLine, defaultProps: { label: "Sign here" } },
  ];

  const addBlock = (block: typeof blockLibrary[0]) => {
    if (!selectedPage || !pageDetail) return;
    const updated = [...components, { type: block.type, props: block.defaultProps, order: components.length }];
    updatePage.mutate({ id: selectedPage, components: updated });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Landing Page Builder</h1>
          <p className="text-zinc-500">Create high-converting landing pages with AI</p>
        </div>
        <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) setCreateMode("choice"); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> New Page</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Landing Page</DialogTitle></DialogHeader>
            {createMode === "choice" && (
              <div className="space-y-3 mt-4">
                <p className="text-sm text-zinc-500">Choose how to start:</p>
                <Button variant="outline" className="w-full justify-start" onClick={() => setCreateMode("ai")}>
                  <Sparkles className="w-4 h-4 mr-2" /> Build with AI — describe your page in one sentence
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setCreateMode("template")}>
                  <Layout className="w-4 h-4 mr-2" /> Start from template
                </Button>
              </div>
            )}
            {createMode === "ai" && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Describe your page *</label>
                  <Input value={aiOneSentence} onChange={e => setAiOneSentence(e.target.value)} placeholder="e.g. Webinar registration page for my coaching business" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCreateMode("choice")}>Back</Button>
                  <Button onClick={buildWithAi} disabled={!aiOneSentence.trim() || aiGenerate.isPending} className="flex-1">
                    {aiGenerate.isPending || createPage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate & create page"}
                  </Button>
                </div>
              </div>
            )}
            {createMode === "template" && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Page Title *</label>
                  <Input value={title} onChange={e => { setTitle(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} placeholder="e.g. Spring Sale 2026" />
                </div>
                <div>
                  <label className="text-sm font-medium">URL Slug *</label>
                  <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. spring-sale" />
                </div>
                <div>
                  <label className="text-sm font-medium">Template</label>
                  <Select value={templateId} onValueChange={setTemplateId}>
                    <SelectTrigger><SelectValue placeholder="Choose a template" /></SelectTrigger>
                    <SelectContent>
                      {templates?.map(t => <SelectItem key={t.id} value={t.id}>{t.name} — {t.description}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCreateMode("choice")}>Back</Button>
                  <Button onClick={() => createPage.mutate({ title, slug, templateId: templateId || undefined })} disabled={!title || !slug || createPage.isPending} className="flex-1">
                    {createPage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Page"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Page List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Your Pages</h3>
          {!pages?.length ? (
            <Card className="border-dashed"><CardContent className="py-8 text-center">
              <Globe className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No pages yet</p>
            </CardContent></Card>
          ) : pages.map(p => (
            <Card key={p.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedPage === p.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedPage(p.id)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{p.title}</span>
                    <p className="text-xs text-zinc-500">/{p.slug}</p>
                  </div>
                  <Badge variant={p.status === "published" ? "default" : "outline"} className="text-xs">{p.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Page Editor */}
        <div className="lg:col-span-3">
          {!selectedPage || !pageDetail ? (
            <Card className="border-dashed"><CardContent className="flex flex-col items-center py-16">
              <Layout className="w-12 h-12 text-zinc-500 mb-4" />
              <p className="text-zinc-500">Select a page to edit or create a new one</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{pageDetail.title}</h2>
                <div className="flex gap-2">
                  <Dialog open={showAiGen} onOpenChange={setShowAiGen}>
                    <DialogTrigger asChild><Button variant="outline" size="sm"><Sparkles className="w-4 h-4 mr-1" /> AI Redesign</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>AI Page Generator</DialogTitle></DialogHeader>
                      <div className="space-y-4 mt-4">
                        <Input value={aiPurpose} onChange={e => setAiPurpose(e.target.value)} placeholder="Page purpose (e.g. sell online course)" />
                        <Input value={aiIndustry} onChange={e => setAiIndustry(e.target.value)} placeholder="Industry (optional)" />
                        <Input value={aiStyle} onChange={e => setAiStyle(e.target.value)} placeholder="Style (optional, e.g. bold and modern)" />
                        <Button onClick={() => aiGenerate.mutate({ purpose: aiPurpose, industry: aiIndustry, style: aiStyle })} disabled={!aiPurpose || aiGenerate.isPending} className="w-full">
                          {aiGenerate.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : "Generate with AI"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant={pageDetail.status === "published" ? "outline" : "default"} onClick={() => updatePage.mutate({ id: selectedPage, status: pageDetail.status === "published" ? "draft" : "published" })}>
                    {pageDetail.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deletePage.mutate({ id: selectedPage })}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>

              {/* Block library: add blocks */}
              <Card className="border-dashed">
                <CardContent className="p-3">
                  <p className="text-xs font-medium text-zinc-500 uppercase mb-2">Add block</p>
                  <div className="flex flex-wrap gap-2">
                    {blockLibrary.map(block => (
                      <Button key={block.type} variant="outline" size="sm" className="gap-1.5" onClick={() => addBlock(block)}>
                        <block.icon className="w-3.5 h-3.5" />{block.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Lead destination — when page has form */}
              {hasForm && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">Where should leads go when they submit this form?</p>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!leadDest.leadManager} onChange={e => {
                          const next = { ...leadDest, leadManager: e.target.checked };
                          setLeadDest(next);
                          updatePage.mutate({ id: selectedPage!, metadata: { ...(pageDetail?.metadata as object || {}), leadDestination: next } });
                        }} />
                        <span className="text-sm">Lead Manager</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!leadDest.crm} onChange={e => {
                          const next = { ...leadDest, crm: e.target.checked };
                          setLeadDest(next);
                          updatePage.mutate({ id: selectedPage!, metadata: { ...(pageDetail?.metadata as object || {}), leadDestination: next } });
                        }} />
                        <span className="text-sm">CRM Deals</span>
                      </label>
                      {emailLists?.length ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Email list:</span>
                          <Select value={leadDest.emailListId || ""} onValueChange={v => {
                            const next = { ...leadDest, emailListId: v };
                            setLeadDest(next);
                            updatePage.mutate({ id: selectedPage!, metadata: { ...(pageDetail?.metadata as object || {}), leadDestination: { ...next, emailListId: v ? Number(v) : undefined } } });
                          }}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="Select list" /></SelectTrigger>
                            <SelectContent>
                              {emailLists.map((l: { id: number; name: string }) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-medium text-zinc-500">Redirect after submit (URL or page slug)</label>
                      <Input value={redirectAfterSubmit} onChange={e => setRedirectAfterSubmit(e.target.value)} placeholder="/thank-you or https://..." className="mt-1" onBlur={() => updatePage.mutate({ id: selectedPage!, metadata: { ...(pageDetail?.metadata as object || {}), redirectAfterSubmit: redirectAfterSubmit || undefined } })} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Component List */}
              <div className="space-y-3">
                {components.map((comp: any, idx: number) => (
                  <Card key={idx} className="group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                          <Badge variant="secondary" className="uppercase text-xs">{comp.type}</Badge>
                          <span className="text-sm font-medium">{comp.props?.headline || comp.props?.title || comp.props?.text || `${comp.type} section`}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditingComponent(editingComponent === idx ? null : idx)}>{editingComponent === idx ? "Close" : "Edit"}</Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { const updated = components.filter((_, i) => i !== idx); updatePage.mutate({ id: selectedPage!, components: updated }); setEditingComponent(null); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                      {editingComponent === idx && (
                        <div className="mt-4 space-y-3 border-t pt-4">
                          {Object.entries(comp.props || {}).map(([key, value]) => (
                            <div key={key}>
                              <label className="text-xs font-medium text-zinc-500 uppercase">{key}</label>
                              {typeof value === "string" ? (
                                value.length > 100 ? (
                                  <Textarea defaultValue={value} className="mt-1 text-sm" rows={3} onBlur={e => {
                                    const updated = [...components];
                                    updated[idx] = { ...updated[idx], props: { ...updated[idx].props, [key]: e.target.value } };
                                    updatePage.mutate({ id: selectedPage, components: updated });
                                  }} />
                                ) : (
                                  <Input defaultValue={value} className="mt-1 text-sm" onBlur={e => {
                                    const updated = [...components];
                                    updated[idx] = { ...updated[idx], props: { ...updated[idx].props, [key]: e.target.value } };
                                    updatePage.mutate({ id: selectedPage, components: updated });
                                  }} />
                                )
                              ) : (
                                <p className="text-xs text-zinc-500 mt-1">{JSON.stringify(value).substring(0, 200)}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Form Submissions */}
              {submissions && submissions.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> Form Submissions ({submissions.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-900/40"><tr>
                          <th className="text-left p-2 font-medium">Date</th>
                          <th className="text-left p-2 font-medium">Data</th>
                        </tr></thead>
                        <tbody>
                          {submissions.slice(0, 10).map(s => (
                            <tr key={s.id} className="border-t">
                              <td className="p-2 text-xs">{new Date(s.createdAt).toLocaleString()}</td>
                              <td className="p-2 text-xs font-mono">{JSON.stringify(s.data).substring(0, 100)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
