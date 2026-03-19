import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Palette, Loader2, Sparkles, Plus, Trash2, Edit2, CheckCircle2,
  Upload, Star, Type, Volume2, Target, Check, X, Copy
} from "lucide-react";

const TONE_OPTIONS = [
  { value: "professional", label: "Professional", desc: "Authoritative, trustworthy, formal" },
  { value: "playful", label: "Playful", desc: "Fun, energetic, lighthearted" },
  { value: "bold", label: "Bold", desc: "Confident, direct, powerful" },
  { value: "minimal", label: "Minimal", desc: "Clean, simple, understated" },
  { value: "luxury", label: "Luxury", desc: "Premium, sophisticated, exclusive" },
  { value: "friendly", label: "Friendly", desc: "Warm, approachable, conversational" },
  { value: "authoritative", label: "Authoritative", desc: "Expert, knowledgeable, commanding" },
  { value: "inspirational", label: "Inspirational", desc: "Motivating, uplifting, visionary" },
];

const FONT_OPTIONS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Raleway", "Poppins",
  "Playfair Display", "Merriweather", "Source Serif Pro", "DM Sans", "Nunito",
  "Work Sans", "Outfit", "Plus Jakarta Sans", "Sora", "Space Grotesk",
  "Cormorant Garamond", "EB Garamond", "Libre Baskerville",
];

const PERSONALITY_OPTIONS = [
  "Innovative", "Trustworthy", "Bold", "Empathetic", "Energetic", "Sophisticated",
  "Authentic", "Playful", "Expert", "Approachable", "Disruptive", "Reliable",
  "Creative", "Transparent", "Ambitious", "Caring", "Confident", "Inclusive",
];

export default function BrandKit() {
  const utils = trpc.useUtils();
  const { data: kits, isLoading } = trpc.brandKit.list.useQuery();
  const createMut = trpc.brandKit.create.useMutation({
    onSuccess: () => { utils.brandKit.list.invalidate(); setShowCreate(false); resetForm(); toast.success("Brand Kit created!"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.brandKit.update.useMutation({
    onSuccess: () => { utils.brandKit.list.invalidate(); setEditingId(null); toast.success("Brand Kit updated!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.brandKit.delete.useMutation({
    onSuccess: () => { utils.brandKit.list.invalidate(); toast.success("Brand Kit deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const generateAIMut = trpc.brandKit.generateWithAI.useMutation({
    onSuccess: (data) => {
      if (data.primaryColor) setPrimaryColor(data.primaryColor);
      if (data.secondaryColor) setSecondaryColor(data.secondaryColor);
      if (data.accentColor) setAccentColor(data.accentColor);
      if (data.fontHeading) setFontHeading(data.fontHeading);
      if (data.fontBody) setFontBody(data.fontBody);
      if (data.toneOfVoice) setToneOfVoice(data.toneOfVoice);
      if (data.toneDescription) setToneDescription(data.toneDescription);
      if (data.brandPersonality) setPersonality(data.brandPersonality);
      if (data.tagline) setTagline(data.tagline);
      if (data.missionStatement) setMissionStatement(data.missionStatement);
      if (data.doList) setDoList(data.doList);
      if (data.dontList) setDontList(data.dontList);
      toast.success("AI generated your brand identity!");
    },
    onError: (e) => toast.error(e.message),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [aiDesc, setAiDesc] = useState("");
  const [aiIndustry, setAiIndustry] = useState("");
  const [showAiGen, setShowAiGen] = useState(false);

  // Form state
  const [kitName, setKitName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [fontHeading, setFontHeading] = useState("Montserrat");
  const [fontBody, setFontBody] = useState("Inter");
  const [toneOfVoice, setToneOfVoice] = useState("professional");
  const [toneDescription, setToneDescription] = useState("");
  const [personality, setPersonality] = useState<string[]>([]);
  const [tagline, setTagline] = useState("");
  const [missionStatement, setMissionStatement] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [doList, setDoList] = useState<string[]>(["", ""]);
  const [dontList, setDontList] = useState<string[]>(["", ""]);
  const [isDefault, setIsDefault] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setKitName(""); setLogoUrl(""); setLogoPreview(""); setPrimaryColor("#6366f1");
    setSecondaryColor("#8b5cf6"); setAccentColor("#f59e0b"); setFontHeading("Montserrat");
    setFontBody("Inter"); setToneOfVoice("professional"); setToneDescription("");
    setPersonality([]); setTagline(""); setMissionStatement(""); setTargetAudience("");
    setDoList(["", ""]); setDontList(["", ""]); setIsDefault(false);
  };

  const loadKitForEdit = (kit: any) => {
    setEditingId(kit.id);
    setKitName(kit.name || "");
    setLogoUrl(kit.logoUrl || "");
    setLogoPreview(kit.logoUrl || "");
    setPrimaryColor(kit.primaryColor || "#6366f1");
    setSecondaryColor(kit.secondaryColor || "#8b5cf6");
    setAccentColor(kit.accentColor || "#f59e0b");
    setFontHeading(kit.fontHeading || "Montserrat");
    setFontBody(kit.fontBody || "Inter");
    setToneOfVoice(kit.toneOfVoice || "professional");
    setToneDescription(kit.toneDescription || "");
    setPersonality(kit.brandPersonality || []);
    setTagline(kit.tagline || "");
    setMissionStatement(kit.missionStatement || "");
    setTargetAudience(kit.targetAudience || "");
    setDoList(kit.doList?.length ? kit.doList : ["", ""]);
    setDontList(kit.dontList?.length ? kit.dontList : ["", ""]);
    setIsDefault(kit.isDefault || false);
    setShowCreate(true);
  };

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLogoPreview(dataUrl);
      setLogoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const togglePersonality = (p: string) => {
    setPersonality(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const saveKit = () => {
    if (!kitName.trim()) { toast.error("Kit name is required"); return; }
    const payload = {
      name: kitName,
      logoUrl: logoUrl || undefined,
      primaryColor, secondaryColor, accentColor,
      fontHeading, fontBody, toneOfVoice,
      toneDescription: toneDescription || undefined,
      brandPersonality: personality.length ? personality : undefined,
      tagline: tagline || undefined,
      missionStatement: missionStatement || undefined,
      targetAudience: targetAudience || undefined,
      doList: doList.filter(d => d.trim()),
      dontList: dontList.filter(d => d.trim()),
      isDefault,
    };
    if (editingId) {
      updateMut.mutate({ id: editingId, ...payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6 max-w-6xl animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" /> Brand Kit
          </h1>
          <p className="page-subtitle">
            Define your brand identity — logo, colors, fonts, and voice. Applied automatically to all generated content.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingId(null); setShowCreate(true); }}>
          <Plus className="h-4 w-4 mr-2" />New Brand Kit
        </Button>
      </div>

      {/* Brand Kit Editor */}
      {showCreate && (
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{editingId ? "Edit Brand Kit" : "Create Brand Kit"}</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AI Generator */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">AI Brand Generator</span>
                <Badge variant="secondary" className="text-xs">Optional</Badge>
              </div>
              <p className="text-xs text-zinc-500 mb-3">Describe your business and AI will generate colors, fonts, tone, tagline, and more.</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Textarea value={aiDesc} onChange={e => setAiDesc(e.target.value)} placeholder="e.g. A premium fitness coaching brand for busy professionals who want to transform their body in 90 days..." rows={2} className="col-span-2" />
                <Input value={aiIndustry} onChange={e => setAiIndustry(e.target.value)} placeholder="Industry (e.g. fitness, SaaS, fashion)" />
                <Input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="Target audience" />
              </div>
              <Button size="sm" disabled={!aiDesc.trim() || generateAIMut.isPending} onClick={() => generateAIMut.mutate({ businessDescription: aiDesc, industry: aiIndustry, targetAudience })}>
                {generateAIMut.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Generating...</> : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Generate Brand Identity</>}
              </Button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kit Name *</Label>
                <Input className="mt-1" value={kitName} onChange={e => setKitName(e.target.value)} placeholder="e.g. Main Brand, Dark Theme, Campaign 2025" />
              </div>
              <div>
                <Label>Tagline</Label>
                <Input className="mt-1" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. Just Do It, Think Different" />
              </div>
            </div>

            {/* Logo */}
            <div>
              <Label className="flex items-center gap-2 mb-2"><Upload className="h-4 w-4" />Logo</Label>
              <div className="flex items-start gap-4">
                <div
                  className="w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-zinc-900/50 transition-all shrink-0"
                  onClick={() => logoRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleLogoUpload(f); }}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2 rounded-xl" />
                  ) : (
                    <div className="text-center">
                      <Upload className="h-5 w-5 mx-auto text-zinc-500 mb-1" />
                      <p className="text-[10px] text-zinc-500">Upload</p>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-zinc-500 mb-2">Or paste a URL:</p>
                  <Input value={logoUrl.startsWith("data:") ? "" : logoUrl} onChange={e => { setLogoUrl(e.target.value); setLogoPreview(e.target.value); }} placeholder="https://example.com/logo.png" />
                  {logoPreview && !logoPreview.startsWith("data:") && (
                    <img src={logoPreview} alt="Logo preview" className="mt-2 h-12 object-contain rounded" onError={() => setLogoPreview("")} />
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
              </div>
            </div>

            {/* Colors */}
            <div>
              <Label className="flex items-center gap-2 mb-3"><Palette className="h-4 w-4" />Brand Colors</Label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Primary", value: primaryColor, set: setPrimaryColor },
                  { label: "Secondary", value: secondaryColor, set: setSecondaryColor },
                  { label: "Accent", value: accentColor, set: setAccentColor },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <p className="text-xs text-zinc-500 mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-lg border cursor-pointer shadow-sm" style={{ backgroundColor: value }} onClick={() => document.getElementById(`color-${label}`)?.click()} />
                        <input id={`color-${label}`} type="color" value={value} onChange={e => set(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                      </div>
                      <Input value={value} onChange={e => set(e.target.value)} className="font-mono text-xs h-9" placeholder="#000000" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Color Preview */}
              <div className="mt-3 p-3 rounded-xl border flex items-center gap-3">
                <div className="h-8 w-8 rounded-full" style={{ backgroundColor: primaryColor }} />
                <div className="h-8 w-8 rounded-full" style={{ backgroundColor: secondaryColor }} />
                <div className="h-8 w-8 rounded-full" style={{ backgroundColor: accentColor }} />
                <div className="flex-1 h-8 rounded-lg" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { navigator.clipboard.writeText(`${primaryColor}, ${secondaryColor}, ${accentColor}`); toast.success("Colors copied!"); }}>
                  <Copy className="h-3 w-3 mr-1" />Copy
                </Button>
              </div>
            </div>

            {/* Fonts */}
            <div>
              <Label className="flex items-center gap-2 mb-3"><Type className="h-4 w-4" />Typography</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Heading Font</p>
                  <Select value={fontHeading} onValueChange={setFontHeading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FONT_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                  <p className="mt-2 text-2xl font-bold" style={{ fontFamily: fontHeading }}>{fontHeading}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Body Font</p>
                  <Select value={fontBody} onValueChange={setFontBody}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FONT_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                  <p className="mt-2 text-sm" style={{ fontFamily: fontBody }}>The quick brown fox jumps over the lazy dog.</p>
                </div>
              </div>
            </div>

            {/* Tone of Voice */}
            <div>
              <Label className="flex items-center gap-2 mb-3"><Volume2 className="h-4 w-4" />Tone of Voice</Label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {TONE_OPTIONS.map(t => (
                  <button key={t.value} onClick={() => setToneOfVoice(t.value)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${toneOfVoice === t.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-zinc-900/40"}`}>
                    <p className="text-xs font-semibold">{t.label}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
              <Textarea value={toneDescription} onChange={e => setToneDescription(e.target.value)} placeholder="Describe your brand voice in more detail... e.g. 'We speak like a trusted friend who happens to be an expert. Never corporate jargon, always clear and human.'" rows={2} />
            </div>

            {/* Brand Personality */}
            <div>
              <Label className="flex items-center gap-2 mb-3"><Star className="h-4 w-4" />Brand Personality (pick up to 5)</Label>
              <div className="flex flex-wrap gap-2">
                {PERSONALITY_OPTIONS.map(p => (
                  <button key={p} onClick={() => togglePersonality(p)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${personality.includes(p) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-zinc-800"}`}>
                    {personality.includes(p) && <Check className="h-3 w-3 inline mr-1" />}{p}
                  </button>
                ))}
              </div>
            </div>

            {/* Mission */}
            <div>
              <Label className="flex items-center gap-2 mb-2"><Target className="h-4 w-4" />Mission Statement</Label>
              <Textarea value={missionStatement} onChange={e => setMissionStatement(e.target.value)} placeholder="e.g. We help busy professionals transform their health through science-backed, time-efficient fitness programs." rows={2} />
            </div>

            {/* Do's and Don'ts */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-green-600 flex items-center gap-1 mb-2"><CheckCircle2 className="h-4 w-4" />Brand Do's</Label>
                <div className="space-y-2">
                  {doList.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={item} onChange={e => { const n = [...doList]; n[i] = e.target.value; setDoList(n); }} placeholder={`Do #${i + 1}`} className="text-sm" />
                      {doList.length > 1 && <Button size="sm" variant="ghost" className="h-9 w-9 p-0 shrink-0" onClick={() => setDoList(doList.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5" /></Button>}
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setDoList([...doList, ""])}><Plus className="h-3 w-3 mr-1" />Add</Button>
                </div>
              </div>
              <div>
                <Label className="text-red-500 flex items-center gap-1 mb-2"><X className="h-4 w-4" />Brand Don'ts</Label>
                <div className="space-y-2">
                  {dontList.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={item} onChange={e => { const n = [...dontList]; n[i] = e.target.value; setDontList(n); }} placeholder={`Don't #${i + 1}`} className="text-sm" />
                      {dontList.length > 1 && <Button size="sm" variant="ghost" className="h-9 w-9 p-0 shrink-0" onClick={() => setDontList(dontList.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5" /></Button>}
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setDontList([...dontList, ""])}><Plus className="h-3 w-3 mr-1" />Add</Button>
                </div>
              </div>
            </div>

            {/* Default toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40">
              <button onClick={() => setIsDefault(!isDefault)} className={`w-10 h-5 rounded-full transition-all ${isDefault ? "bg-primary" : "bg-muted-foreground/30"} relative`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isDefault ? "left-5" : "left-0.5"}`} />
              </button>
              <div>
                <p className="text-sm font-medium">Set as Default Brand Kit</p>
                <p className="text-xs text-zinc-500">Applied automatically to all AI-generated content</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={saveKit} disabled={isSaving}>
                {isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : <><Check className="h-4 w-4 mr-2" />{editingId ? "Update Brand Kit" : "Create Brand Kit"}</>}
              </Button>
              <Button variant="outline" onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Brand Kits List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !kits?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Palette className="h-12 w-12 text-zinc-500/30 mb-4" />
            <p className="font-semibold">No Brand Kits Yet</p>
            <p className="text-sm text-zinc-500 mt-1 text-center max-w-xs">Create your first brand kit to ensure consistent identity across all generated content.</p>
            <Button className="mt-4" onClick={() => { resetForm(); setEditingId(null); setShowCreate(true); }}>
              <Plus className="h-4 w-4 mr-2" />Create Brand Kit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {kits.map(kit => (
            <Card key={kit.id} className={`border-0 shadow-sm hover:shadow-md transition-all ${kit.isDefault ? "ring-2 ring-primary" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {kit.logoUrl ? (
                      <img src={kit.logoUrl} alt={kit.name} className="w-10 h-10 rounded-lg object-contain border bg-white p-1" onError={e => (e.currentTarget.style.display = "none")} />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: kit.primaryColor || "#6366f1" }}>
                        {kit.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{kit.name}</p>
                      {kit.isDefault && <Badge variant="default" className="text-[10px] h-4">Default</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => loadKitForEdit(kit)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteMut.mutate({ id: kit.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                {/* Color swatches */}
                <div className="flex gap-1.5 mb-3">
                  {[kit.primaryColor, kit.secondaryColor, kit.accentColor].filter(Boolean).map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: c! }} title={c!} />
                  ))}
                  <div className="flex-1 h-6 rounded-full" style={{ background: `linear-gradient(90deg, ${kit.primaryColor || "#6366f1"}, ${kit.secondaryColor || "#8b5cf6"})` }} />
                </div>

                {kit.tagline && <p className="text-xs italic text-zinc-500 mb-2">"{kit.tagline}"</p>}

                <div className="flex flex-wrap gap-1 mb-2">
                  {kit.toneOfVoice && <Badge variant="outline" className="text-[10px]">{kit.toneOfVoice}</Badge>}
                  {kit.fontHeading && <Badge variant="outline" className="text-[10px]">{kit.fontHeading}</Badge>}
                </div>

                {kit.brandPersonality && kit.brandPersonality.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {kit.brandPersonality.slice(0, 3).map(p => (
                      <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-muted">{p}</span>
                    ))}
                    {kit.brandPersonality.length > 3 && <span className="text-[10px] text-zinc-500">+{kit.brandPersonality.length - 3}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
