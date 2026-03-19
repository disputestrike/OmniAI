import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Plus, Copy, Trash2, Wand2, Star, Clock, MoreVertical, Sparkles } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const CATEGORIES = [
  { value: "ad_copy", label: "Ad Copy" },
  { value: "social_post", label: "Social Post" },
  { value: "email", label: "Email" },
  { value: "blog", label: "Blog" },
  { value: "video_script", label: "Video Script" },
  { value: "landing_page", label: "Landing Page" },
  { value: "saved", label: "Saved from Content" },
  { value: "custom", label: "Custom" },
];

const PLATFORMS = ["instagram", "tiktok", "youtube", "twitter", "facebook", "linkedin", "pinterest", "threads", "email", "blog", "general"];

export default function ContentTemplates() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showGenerate, setShowGenerate] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [newTemplate, setNewTemplate] = useState({ name: "", description: "", category: "ad_copy", contentType: "ad_copy_short", platform: "general", body: "" });
  const [genVars, setGenVars] = useState<Record<string, string>>({});
  const [genPlatform, setGenPlatform] = useState("general");
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  const templatesQ = trpc.enhanced.templates.list.useQuery(
    filterCategory !== "all" ? { category: filterCategory } : {},
    { enabled: !!user }
  );

  const createTemplate = trpc.enhanced.templates.create.useMutation({
    onSuccess: () => { templatesQ.refetch(); setShowCreate(false); setNewTemplate({ name: "", description: "", category: "ad_copy", contentType: "ad_copy_short", platform: "general", body: "" }); toast.success("Template created"); },
  });
  const deleteTemplate = trpc.enhanced.templates.delete.useMutation({
    onSuccess: () => { templatesQ.refetch(); toast.success("Template deleted"); },
  });
  const generateFromTemplate = trpc.enhanced.templates.generateFromTemplate.useMutation({
    onSuccess: (data) => { setGeneratedContent(data.body); toast.success("Content generated from template"); },
  });

  // Extract {{variables}} from template body
  const extractVars = (body: string) => {
    const matches = body.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, ""))));
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Templates</h1>
          <p className="text-zinc-500 mt-1">Save your best content as reusable templates for quick generation</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Template</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Template name" value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} />
              <Input placeholder="Description (optional)" value={newTemplate.description} onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={newTemplate.category} onValueChange={v => setNewTemplate({ ...newTemplate, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={newTemplate.platform} onValueChange={v => setNewTemplate({ ...newTemplate, platform: v })}>
                  <SelectTrigger><SelectValue placeholder="Platform" /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Template body — use {"{{variable}}"} for dynamic parts</label>
                <Textarea
                  placeholder={"Introducing {{product_name}} — the ultimate solution for {{target_audience}}. Get yours today at {{price}}!"}
                  value={newTemplate.body}
                  onChange={e => setNewTemplate({ ...newTemplate, body: e.target.value })}
                  rows={6}
                />
                {newTemplate.body && extractVars(newTemplate.body).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs text-zinc-500">Variables:</span>
                    {extractVars(newTemplate.body).map(v => (
                      <Badge key={v} variant="secondary" className="text-xs">{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={() => createTemplate.mutate(newTemplate)} disabled={!newTemplate.name.trim() || createTemplate.isPending}>
                {createTemplate.isPending ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-zinc-500">{templatesQ.data?.length || 0} templates</span>
      </div>

      {/* Templates Grid */}
      {templatesQ.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-zinc-800 animate-pulse rounded-lg" />)}
        </div>
      ) : !templatesQ.data?.length ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-zinc-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium">No templates yet</h3>
            <p className="text-sm mt-1 max-w-md mx-auto">Create templates from scratch or save your best-performing content as reusable templates. Use {"{{variables}}"} for dynamic parts that change each time.</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templatesQ.data.map((t: any) => {
            const vars = extractVars(t.body || "");
            return (
              <Card key={t.id} className="hover:shadow-md transition-all group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{t.name}</CardTitle>
                      {t.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{t.description}</p>}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(t.body || ""); toast.success("Template copied"); }}>
                          <Copy className="w-4 h-4 mr-2" /> Copy Body
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm("Delete this template?")) deleteTemplate.mutate({ id: t.id }); }}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline" className="text-xs capitalize">{t.category || "custom"}</Badge>
                    {t.platform && t.platform !== "general" && <Badge variant="secondary" className="text-xs capitalize">{t.platform}</Badge>}
                    {t.usageCount > 0 && <Badge variant="secondary" className="text-xs"><Star className="w-3 h-3 mr-1" />{t.usageCount} uses</Badge>}
                  </div>
                  {t.body && (
                    <div className="text-xs text-zinc-500 bg-zinc-900/40 rounded p-2 mb-3 line-clamp-3 font-mono">{t.body}</div>
                  )}
                  {vars.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {vars.map(v => <Badge key={v} variant="secondary" className="text-[10px]">{`{{${v}}}`}</Badge>)}
                    </div>
                  )}
                  <Button size="sm" className="w-full" onClick={() => { setShowGenerate(t.id); setGenVars({}); setGeneratedContent(null); }}>
                    <Sparkles className="w-3 h-3 mr-1" /> Generate Content
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Generate from Template Dialog */}
      <Dialog open={showGenerate !== null} onOpenChange={() => { setShowGenerate(null); setGeneratedContent(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Generate from Template</DialogTitle></DialogHeader>
          {showGenerate && (() => {
            const template = templatesQ.data?.find((t: any) => t.id === showGenerate);
            if (!template) return null;
            const vars = extractVars(template.body || "");
            return (
              <div className="space-y-3 pt-2">
                <div className="text-sm text-zinc-500 bg-zinc-900/40 rounded p-3 font-mono">{template.body}</div>
                {vars.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fill in variables:</label>
                    {vars.map(v => (
                      <div key={v} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">{`{{${v}}}`}</Badge>
                        <Input placeholder={`Enter ${v.replace(/_/g, " ")}`} value={genVars[v] || ""} onChange={e => setGenVars({ ...genVars, [v]: e.target.value })} />
                      </div>
                    ))}
                  </div>
                )}
                <Select value={genPlatform} onValueChange={setGenPlatform}>
                  <SelectTrigger><SelectValue placeholder="Target platform" /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  onClick={() => generateFromTemplate.mutate({ templateId: showGenerate, variables: genVars, platform: genPlatform })}
                  disabled={generateFromTemplate.isPending}
                >
                  {generateFromTemplate.isPending ? <><Wand2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Wand2 className="w-4 h-4 mr-2" /> Generate Content</>}
                </Button>
                {generatedContent && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-500">Generated Content:</label>
                    <div className="text-sm bg-green-500/10 border border-green-500/20 rounded p-3 whitespace-pre-wrap">{generatedContent}</div>
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(generatedContent); toast.success("Copied to clipboard"); }}>
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
