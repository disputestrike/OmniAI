import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, FileQuestion, Copy, ExternalLink, ListChecks } from "lucide-react";

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Long text" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "number", label: "Number" },
] as const;

export default function Forms() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [showAddField, setShowAddField] = useState(false);
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<"text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "number">("text");
  const [fieldRequired, setFieldRequired] = useState(true);
  const [showResponses, setShowResponses] = useState(false);

  const utils = trpc.useUtils();
  const { data: forms, isLoading } = trpc.forms.list.useQuery();
  const { data: formDetail } = trpc.forms.get.useQuery({ id: selectedId! }, { enabled: !!selectedId });
  const createMut = trpc.forms.create.useMutation({
    onSuccess: (data) => {
      toast.success("Form created");
      setShowCreate(false);
      setName("");
      setSlug("");
      utils.forms.list.invalidate();
      setSelectedId(data.id);
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.forms.update.useMutation({
    onSuccess: () => { toast.success("Form updated"); utils.forms.list.invalidate(); if (selectedId) utils.forms.get.invalidate({ id: selectedId }); },
  });
  const deleteMut = trpc.forms.delete.useMutation({
    onSuccess: () => { toast.success("Form deleted"); setSelectedId(null); utils.forms.list.invalidate(); },
  });
  const addFieldMut = trpc.forms.addField.useMutation({
    onSuccess: () => {
      toast.success("Field added");
      setShowAddField(false);
      setFieldLabel("");
      setFieldType("text");
      setFieldRequired(true);
      if (selectedId) utils.forms.get.invalidate({ id: selectedId });
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteFieldMut = trpc.forms.deleteField.useMutation({
    onSuccess: () => { if (selectedId) utils.forms.get.invalidate({ id: selectedId }); },
  });

  const handleCreate = () => {
    if (!name.trim() || !slug.trim()) return toast.error("Name and slug required");
    const s = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "form";
    createMut.mutate({ name: name.trim(), slug: s });
  };

  const shareUrl = typeof window !== "undefined" && formDetail?.slug && formDetail?.status === "active" ? `${window.location.origin}/form/${formDetail.slug}` : "";
  const responses: { id: number; data: Record<string, string>; createdAt: string }[] = [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Forms</h1>
          <p className="text-muted-foreground text-sm mt-1">Create standalone forms and surveys. Share a link or embed; responses become leads when you enable it.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4 mr-2" />New form</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create form</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Contact form" /></div>
              <div><Label>URL slug *</Label><Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. contact" /></div>
              <Button className="w-full" disabled={!name.trim() || !slug.trim() || createMut.isPending} onClick={handleCreate}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Your forms</h3>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Card key={i} className="border-0 shadow-sm animate-pulse"><CardContent className="p-3 h-14" /></Card>)}</div>
          ) : !forms?.length ? (
            <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground text-sm">No forms yet. Create one to collect responses.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {forms.map((f) => (
                <Card key={f.id} className={`cursor-pointer border transition-all ${selectedId === f.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedId(f.id)}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileQuestion className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium truncate">{f.name}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">{f.submissionCount ?? 0}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={e => { e.stopPropagation(); if (confirm("Delete this form?")) deleteMut.mutate({ id: f.id }); }}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          {selectedId && formDetail ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg">Fields</CardTitle>
                  <div className="flex gap-2">
                    <Select value={formDetail.status} onValueChange={(v: "draft" | "active" | "archived") => updateMut.mutate({ id: selectedId, status: v })}>
                      <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
                    </Select>
                    <Dialog open={showAddField} onOpenChange={setShowAddField}>
                      <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Field</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add field</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <div><Label>Type</Label><Select value={fieldType} onValueChange={(v: typeof fieldType) => setFieldType(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{fieldTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                          <div><Label>Label *</Label><Input value={fieldLabel} onChange={e => setFieldLabel(e.target.value)} placeholder="e.g. Email address" /></div>
                          <div className="flex items-center gap-2"><input type="checkbox" id="req" checked={fieldRequired} onChange={e => setFieldRequired(e.target.checked)} /><Label htmlFor="req">Required</Label></div>
                          <Button className="w-full" disabled={!fieldLabel.trim() || addFieldMut.isPending} onClick={() => addFieldMut.mutate({ formId: selectedId, fieldType, label: fieldLabel.trim(), required: fieldRequired })}>
                            {addFieldMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Add
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(formDetail.fields as { id: number; label: string; fieldType: string; required: boolean }[]).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No fields yet. Add fields to build your form.</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {(formDetail.fields as { id: number; label: string; fieldType: string; required: boolean }[]).map(f => (
                      <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                        <span className="text-sm font-medium">{f.label}</span>
                        <Badge variant="outline" className="text-xs">{f.fieldType}</Badge>
                        {f.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                        <Button variant="ghost" size="icon" className="ml-auto shrink-0" onClick={() => deleteFieldMut.mutate({ id: f.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pt-3 border-t">
                  <Label className="text-xs text-muted-foreground">Share link (for active form)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input readOnly value={shareUrl} className="font-mono text-sm" />
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link copied"); }}><Copy className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={() => setShowResponses(!showResponses)}><ListChecks className="h-3.5 w-3.5 mr-1" />{showResponses ? "Hide" : "View"} responses ({(responses?.length ?? formDetail.submissionCount) ?? 0})</Button>
                </div>
                {showResponses && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">Responses</h4>
                    {!responses?.length ? <p className="text-sm text-muted-foreground">No responses yet.</p> : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {(responses as { id: number; data: Record<string, string>; createdAt: string }[]).map(r => (
                          <div key={r.id} className="p-2 rounded border text-sm">
                            {Object.entries(r.data || {}).map(([k, v]) => <div key={k}><span className="text-muted-foreground">{k}:</span> {String(v)}</div>)}
                            <div className="text-muted-foreground text-xs mt-1">{new Date(r.createdAt).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center text-muted-foreground">Select a form or create one to edit fields and get the share link.</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
