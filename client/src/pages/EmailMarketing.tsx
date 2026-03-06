import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Mail, Send, Users, FileText, Sparkles, Upload, Eye } from "lucide-react";

export default function EmailMarketing() {
  const [tab, setTab] = useState("campaigns");
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Form states
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [listName, setListName] = useState("");
  const [listDesc, setListDesc] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [genSubject, setGenSubject] = useState("");
  const [genBrief, setGenBrief] = useState("");
  const [genStyle, setGenStyle] = useState<string>("modern");
  const [bulkCsv, setBulkCsv] = useState("");

  const { data: campaigns, refetch: refetchCampaigns } = trpc.emailMarketing.listCampaigns.useQuery();
  const { data: lists, refetch: refetchLists } = trpc.emailMarketing.listLists.useQuery();
  const { data: contacts, refetch: refetchContacts } = trpc.emailMarketing.getContacts.useQuery(
    { listId: selectedListId! },
    { enabled: !!selectedListId }
  );

  const createCampaign = trpc.emailMarketing.createCampaign.useMutation({
    onSuccess: () => { toast.success("Campaign created"); setShowCreateCampaign(false); setCampaignName(""); setSubject(""); setHtmlBody(""); refetchCampaigns(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCampaign = trpc.emailMarketing.deleteCampaign.useMutation({
    onSuccess: () => { toast.success("Campaign deleted"); refetchCampaigns(); },
  });
  const sendCampaign = trpc.emailMarketing.sendCampaign.useMutation({
    onSuccess: (data) => { toast.success(`Sent to ${data.delivered} recipients`); refetchCampaigns(); },
    onError: (e) => toast.error(e.message),
  });
  const createList = trpc.emailMarketing.createList.useMutation({
    onSuccess: () => { toast.success("List created"); setShowCreateList(false); setListName(""); setListDesc(""); refetchLists(); },
  });
  const deleteList = trpc.emailMarketing.deleteList.useMutation({
    onSuccess: () => { toast.success("List deleted"); refetchLists(); },
  });
  const addContact = trpc.emailMarketing.addContact.useMutation({
    onSuccess: () => { toast.success("Contact added"); setContactEmail(""); setContactName(""); refetchContacts(); },
  });
  const bulkImport = trpc.emailMarketing.bulkImportContacts.useMutation({
    onSuccess: (data) => { toast.success(`Imported ${data.imported} contacts`); setBulkCsv(""); refetchContacts(); },
    onError: (e) => toast.error(e.message),
  });
  const generateHtml = trpc.emailMarketing.generateEmailHtml.useMutation({
    onSuccess: (data) => { setHtmlBody(data.html); setPreviewHtml(data.html); toast.success("Email HTML generated"); setShowGenerate(false); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Marketing</h1>
          <p className="text-muted-foreground">Create, manage, and send email campaigns</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="campaigns"><Mail className="w-4 h-4 mr-1" /> Campaigns</TabsTrigger>
          <TabsTrigger value="lists"><Users className="w-4 h-4 mr-1" /> Lists</TabsTrigger>
          <TabsTrigger value="contacts"><FileText className="w-4 h-4 mr-1" /> Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex gap-2">
            <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> New Campaign</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Email Campaign</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Campaign Name *</label>
                    <Input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. Spring Sale Announcement" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject Line *</label>
                    <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. 🎉 50% Off Everything This Weekend" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Recipient List</label>
                    <Select onValueChange={v => setSelectedListId(Number(v))}>
                      <SelectTrigger><SelectValue placeholder="Select a list" /></SelectTrigger>
                      <SelectContent>
                        {lists?.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium">Email HTML Body</label>
                      <Button variant="outline" size="sm" onClick={() => setShowGenerate(true)}>
                        <Sparkles className="w-3 h-3 mr-1" /> AI Generate
                      </Button>
                    </div>
                    <Textarea value={htmlBody} onChange={e => setHtmlBody(e.target.value)} placeholder="Paste HTML or use AI to generate..." rows={8} className="font-mono text-xs" />
                  </div>
                  {previewHtml && (
                    <div>
                      <label className="text-sm font-medium flex items-center gap-1"><Eye className="w-3 h-3" /> Preview</label>
                      <div className="border rounded-lg p-4 mt-1 bg-white max-h-64 overflow-y-auto" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                  )}
                  <Button onClick={() => createCampaign.mutate({ name: campaignName, subject, htmlBody, recipientListId: selectedListId || undefined })} disabled={!campaignName || !subject || createCampaign.isPending} className="w-full">
                    {createCampaign.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Campaign"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {!campaigns?.length ? (
            <Card className="border-dashed"><CardContent className="flex flex-col items-center py-12">
              <Mail className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Campaigns Yet</h3>
              <p className="text-muted-foreground mt-2">Create your first email campaign to start reaching your audience.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {campaigns.map(c => (
                <Card key={c.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.name}</span>
                        <Badge variant={c.status === "sent" ? "default" : c.status === "sending" ? "secondary" : "outline"}>{c.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Subject: {c.subject}</p>
                      {c.delivered !== null && <p className="text-xs text-muted-foreground">Delivered: {c.delivered} | Opened: {c.opened || 0} | Clicked: {c.clicked || 0}</p>}
                    </div>
                    <div className="flex gap-2">
                      {c.status === "draft" && (
                        <Button size="sm" onClick={() => sendCampaign.mutate({ campaignId: c.id })} disabled={sendCampaign.isPending}>
                          <Send className="w-4 h-4 mr-1" /> Send
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => deleteCampaign.mutate({ id: c.id })}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lists" className="space-y-4">
          <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> New List</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Email List</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input value={listName} onChange={e => setListName(e.target.value)} placeholder="List name" />
                <Input value={listDesc} onChange={e => setListDesc(e.target.value)} placeholder="Description (optional)" />
                <Button onClick={() => createList.mutate({ name: listName, description: listDesc })} disabled={!listName} className="w-full">Create List</Button>
              </div>
            </DialogContent>
          </Dialog>

          {!lists?.length ? (
            <Card className="border-dashed"><CardContent className="flex flex-col items-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Lists Yet</h3>
              <p className="text-muted-foreground mt-2">Create a list to organize your contacts.</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lists.map(l => (
                <Card key={l.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => { setSelectedListId(l.id); setTab("contacts"); }}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-medium">{l.name}</span>
                      <p className="text-xs text-muted-foreground">{l.description || "No description"}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={e => { e.stopPropagation(); deleteList.mutate({ id: l.id }); }}><Trash2 className="w-4 h-4" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          {!selectedListId ? (
            <Card className="border-dashed"><CardContent className="flex flex-col items-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a list from the Lists tab to view contacts</p>
            </CardContent></Card>
          ) : (
            <>
              <div className="flex gap-2">
                <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Contact</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-4">
                      <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Email *" type="email" />
                      <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Name (optional)" />
                      <Button onClick={() => addContact.mutate({ listId: selectedListId, email: contactEmail, name: contactName })} disabled={!contactEmail} className="w-full">Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild><Button size="sm" variant="outline"><Upload className="w-4 h-4 mr-1" /> Bulk Import</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Bulk Import Contacts</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-4">
                      <p className="text-sm text-muted-foreground">Paste CSV data (email,name per line):</p>
                      <Textarea value={bulkCsv} onChange={e => setBulkCsv(e.target.value)} placeholder="john@example.com,John Doe&#10;jane@example.com,Jane Smith" rows={6} />
                      <Button onClick={() => {
                        const contacts = bulkCsv.split("\n").filter(l => l.trim()).map(line => {
                          const [email, name] = line.split(",").map(s => s.trim());
                          return { email, name };
                        });
                        bulkImport.mutate({ listId: selectedListId, contacts });
                      }} disabled={!bulkCsv || bulkImport.isPending} className="w-full">
                        {bulkImport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import Contacts"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {!contacts?.length ? (
                <Card className="border-dashed"><CardContent className="flex flex-col items-center py-8">
                  <p className="text-muted-foreground">No contacts in this list yet</p>
                </CardContent></Card>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="p-3"></th>
                    </tr></thead>
                    <tbody>
                      {contacts.map(c => (
                        <tr key={c.id} className="border-t">
                          <td className="p-3">{c.email}</td>
                          <td className="p-3">{c.name || "—"}</td>
                          <td className="p-3"><Badge variant={c.unsubscribed ? "destructive" : "default"}>{c.unsubscribed ? "Unsubscribed" : "Active"}</Badge></td>
                          <td className="p-3 text-right"><Button variant="ghost" size="sm"><Trash2 className="w-3 h-3" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* AI Generate Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent>
          <DialogHeader><DialogTitle>AI Email Generator</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Input value={genSubject} onChange={e => setGenSubject(e.target.value)} placeholder="Email subject" />
            <Textarea value={genBrief} onChange={e => setGenBrief(e.target.value)} placeholder="Describe what this email should say..." rows={4} />
            <Select value={genStyle} onValueChange={setGenStyle}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
                <SelectItem value="elegant">Elegant</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => generateHtml.mutate({ subject: genSubject, contentBrief: genBrief, style: genStyle as any })} disabled={!genSubject || !genBrief || generateHtml.isPending} className="w-full">
              {generateHtml.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Email</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
