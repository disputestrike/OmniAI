import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Loader2, Trash2, Mail, Phone, Star, Search, Download, Upload } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const statusOptions = ["new", "contacted", "qualified", "converted", "lost"];
const sourceOptions = ["Instagram", "TikTok", "YouTube", "Facebook", "LinkedIn", "Twitter/X", "Google Ads", "Email", "WhatsApp", "Website", "Referral", "Other"];

export default function Leads() {
  const utils = trpc.useUtils();
  const { data: leads, isLoading } = trpc.lead.list.useQuery();
  const createMut = trpc.lead.create.useMutation({ onSuccess: () => { utils.lead.list.invalidate(); setOpen(false); resetForm(); toast.success("Lead added"); } });
  const updateMut = trpc.lead.update.useMutation({ onSuccess: () => { utils.lead.list.invalidate(); toast.success("Updated"); } });
  const deleteMut = trpc.lead.delete.useMutation({ onSuccess: () => { utils.lead.list.invalidate(); toast.success("Deleted"); } });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("Website");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const resetForm = () => { setName(""); setEmail(""); setPhone(""); setSource("Website"); };

  const filtered = useMemo(() => {
    if (!leads) return [];
    return leads.filter(l => {
      const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || l.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [leads, search, filterStatus]);

  const statusColors: Record<string, string> = {
    new: "bg-blue-50 text-blue-700",
    contacted: "bg-amber-50 text-amber-700",
    qualified: "bg-violet-50 text-violet-700",
    converted: "bg-emerald-50 text-emerald-700",
    lost: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Capture, score, and manage leads from all your campaigns and channels.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4 mr-2" />Add Lead</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Lead</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /></div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" /></div>
              <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" /></div>
              <div><Label>Source</Label>
                <Select value={source} onValueChange={setSource}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{sourceOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full rounded-xl" disabled={!name || createMut.isPending} onClick={() => createMut.mutate({ name, email: email || undefined, phone: phone || undefined, source })}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}Add Lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => {
          if (!leads?.length) return toast.error("No leads to export");
          const headers = ["Name", "Email", "Phone", "Source", "Status", "Score", "Created"];
          const rows = leads.map((l: any) => [l.name, l.email || "", l.phone || "", l.source || "", l.status, l.score || 0, new Date(l.createdAt).toLocaleDateString()]);
          const csv = [headers.join(","), ...rows.map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = `leads-${Date.now()}.csv`; a.click();
          URL.revokeObjectURL(url);
          toast.success(`Exported ${leads.length} leads as CSV`);
        }}><Download className="h-3.5 w-3.5 mr-1" />Export</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <Card key={i} className="border-0 shadow-sm animate-pulse"><CardContent className="p-4 h-16" /></Card>)}</div>
      ) : !filtered.length ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg">{leads?.length ? "No matching leads" : "No leads yet"}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Add leads manually or capture them automatically from your campaigns.</p>
            {!leads?.length && <Button className="mt-4 rounded-xl" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Your First Lead</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(lead => (
            <Card key={lead.id} className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-3">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-rose-600">{lead.name?.charAt(0).toUpperCase() || "?"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{lead.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                      {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {lead.source && <Badge variant="secondary" className="text-xs">{lead.source}</Badge>}
                    <Select value={lead.status} onValueChange={(val) => updateMut.mutate({ id: lead.id, status: val as any })}>
                      <SelectTrigger className="h-7 text-xs w-28 border-0">
                        <Badge className={`text-xs border-0 ${statusColors[lead.status] || ""}`}>{lead.status}</Badge>
                      </SelectTrigger>
                      <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                    </Select>
                    {lead.score != null && (
                      <div className="flex items-center gap-1 text-xs"><Star className="h-3 w-3 text-amber-500" />{lead.score}</div>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteMut.mutate({ id: lead.id })}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
