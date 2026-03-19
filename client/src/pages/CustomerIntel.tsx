import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Brain, Heart, Target, TrendingUp, DollarSign, Activity, Sparkles, Tag, BarChart3, Filter, Zap, ArrowUpRight, Star, MessageSquare, ShoppingCart, Eye, Clock, Trash2 } from "lucide-react";

const sentimentColors: Record<string, string> = { positive: "text-green-600", neutral: "text-gray-600", negative: "text-red-600", mixed: "text-yellow-600" };
const engagementColors: Record<string, string> = { cold: "bg-blue-100 text-blue-800", warm: "bg-yellow-100 text-yellow-800", hot: "bg-orange-100 text-orange-800", champion: "bg-green-100 text-green-800" };

export default function CustomerIntel() {
  const [tab, setTab] = useState("dashboard");
  const [addOpen, setAddOpen] = useState(false);
  const [segmentOpen, setSegmentOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [journeyData, setJourneyData] = useState<any>(null);
  const [intimacyData, setIntimacyData] = useState<any>(null);
  // Add form
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custCompany, setCustCompany] = useState("");
  const [custIndustry, setCustIndustry] = useState("");
  const [custSource, setCustSource] = useState("");
  // Segment form
  const [segName, setSegName] = useState("");
  const [segDesc, setSegDesc] = useState("");
  const [segCriteria, setSegCriteria] = useState("");

  const { data: stats } = trpc.customerIntel.getDashboardStats.useQuery();
  const { data: customers, refetch } = trpc.customerIntel.listCustomers.useQuery();
  const { data: segments, refetch: refetchSegments } = trpc.customerIntel.listSegments.useQuery();
  const addMut = trpc.customerIntel.createCustomer.useMutation({ onSuccess: () => { refetch(); setAddOpen(false); setCustName(""); setCustEmail(""); setCustCompany(""); toast.success("Customer added!"); } });
  const deleteMut = trpc.customerIntel.deleteCustomer.useMutation({ onSuccess: () => { refetch(); toast.success("Removed"); } });
  const enrichMut = trpc.customerIntel.enrichCustomer.useMutation({ onSuccess: () => { refetch(); toast.success("Profile enriched with AI!"); }, onError: () => toast.error("Enrichment failed") });
  // Journey and intimacy are loaded via getOutreachPlan mutation
  const outreachMut = trpc.customerIntel.getOutreachPlan.useMutation({ onSuccess: (d: any) => { setJourneyData(d); toast.success("Plan generated!"); }, onError: () => toast.error("Failed") });
  const intimacyMut = trpc.customerIntel.enrichCustomer.useMutation({ onSuccess: () => { refetch(); toast.success("Enriched!"); }, onError: () => toast.error("Failed") }); 
   
  const createSegMut = trpc.customerIntel.createSegment.useMutation({ onSuccess: () => { refetchSegments(); setSegmentOpen(false); setSegName(""); setSegDesc(""); setSegCriteria(""); toast.success("Segment created!"); } });
  const deleteSegMut = trpc.customerIntel.deleteSegment.useMutation({ onSuccess: () => { refetchSegments(); toast.success("Segment removed"); } });
  const trackMut = trpc.customerIntel.addInteraction.useMutation({ onSuccess: () => { refetch(); toast.success("Interaction tracked"); } });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Intelligence</h1>
          <p className="text-zinc-500">Deep customer profiles, behavior analysis, segmentation, and intimacy scoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSegmentOpen(true)}><Tag className="w-4 h-4 mr-2" /> New Segment</Button>
          <Button onClick={() => setAddOpen(true)}><UserPlus className="w-4 h-4 mr-2" /> Add Customer</Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center"><Users className="w-5 h-5 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold">{stats?.totalCustomers || 0}</p><p className="text-xs text-zinc-500">Total Customers</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Activity className="w-5 h-5 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold">{stats?.temperature?.hot || 0}</p><p className="text-xs text-zinc-500">Hot Leads</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><DollarSign className="w-5 h-5 mx-auto mb-1 text-purple-600" /><p className="text-2xl font-bold">${((stats?.totalPredictedCLV || 0) / 100).toLocaleString()}</p><p className="text-xs text-zinc-500">Total CLV</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Heart className="w-5 h-5 mx-auto mb-1 text-red-600" /><p className="text-2xl font-bold">{stats?.avgSentiment || "N/A"}</p><p className="text-xs text-zinc-500">Avg Sentiment</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Tag className="w-5 h-5 mx-auto mb-1 text-orange-600" /><p className="text-2xl font-bold">{stats?.activeSegments || 0}</p><p className="text-xs text-zinc-500">Segments</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1" /> Profiles</TabsTrigger>
          <TabsTrigger value="segments"><Tag className="w-4 h-4 mr-1" /> Segments</TabsTrigger>
          <TabsTrigger value="journey"><TrendingUp className="w-4 h-4 mr-1" /> Journey Map</TabsTrigger>
          <TabsTrigger value="intimacy"><Heart className="w-4 h-4 mr-1" /> Intimacy</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {!customers?.length ? (
            <Card><CardContent className="py-12 text-center text-zinc-500"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No customer profiles yet. Add your first customer to start building intelligence.</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {customers.map((c: any) => {
                const psycho = c.psychographics as any;
                return (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{c.name.charAt(0).toUpperCase()}</div>
                            <div>
                              <h3 className="font-medium">{c.name}</h3>
                              <p className="text-xs text-zinc-500">{c.email} {c.company && `- ${c.company}`}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {c.engagementScore && <Badge className={engagementColors[c.engagementScore] || ""}><Activity className="w-3 h-3 mr-1" />{c.engagementScore}</Badge>}
                            {c.sentiment && <span className={`text-xs font-medium ${sentimentColors[c.sentiment]}`}><Heart className="w-3 h-3 inline mr-1" />{c.sentiment}</span>}
                            {c.clvPrediction && <Badge variant="outline"><DollarSign className="w-3 h-3 mr-1" />CLV: ${(c.clvPrediction / 100).toLocaleString()}</Badge>}
                            {c.industry && <Badge variant="outline">{c.industry}</Badge>}
                            {c.source && <Badge variant="outline">{c.source}</Badge>}
                          </div>
                          {c.nextBestAction && <p className="text-xs bg-primary/5 p-2 rounded"><Zap className="w-3 h-3 inline mr-1 text-primary" /><strong>Next best action:</strong> {c.nextBestAction}</p>}
                          {psycho && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {psycho.interests?.slice(0, 4).map((i: string, idx: number) => <Badge key={idx} variant="secondary" className="text-xs">{i}</Badge>)}
                              {psycho.buyingStyle && <Badge variant="secondary" className="text-xs"><ShoppingCart className="w-3 h-3 mr-1" />{psycho.buyingStyle}</Badge>}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 ml-4">
                          <Button size="sm" onClick={() => enrichMut.mutate({ id: c.id })} disabled={enrichMut.isPending}><Brain className="w-3 h-3 mr-1" /> Enrich</Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedCustomer(c.id); outreachMut.mutate({ id: c.id }); setTab("journey"); }}><TrendingUp className="w-3 h-3 mr-1" /> Journey</Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedCustomer(c.id); intimacyMut.mutate({ id: c.id }); setTab("intimacy"); }}><Heart className="w-3 h-3 mr-1" /> Intimacy</Button>
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remove customer?")) deleteMut.mutate({ id: c.id }); }}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          {!segments?.length ? (
            <Card><CardContent className="py-12 text-center text-zinc-500"><Tag className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No segments yet. Create segments to group customers by behavior, value, or demographics.</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {segments.map(s => {
                const criteria = s.criteria as any;
                return (
                  <Card key={s.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{s.name}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete segment?")) deleteSegMut.mutate({ id: s.id }); }}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                      {s.description && <CardDescription className="text-xs">{s.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline"><Users className="w-3 h-3 mr-1" />{s.customerCount || 0} customers</Badge>
                        <Badge variant={s.isActive ? "default" : "secondary"}>{s.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                      {criteria && (
                        <div className="text-xs text-zinc-500 space-y-1">
                          {criteria.engagement && <p>Engagement: {criteria.engagement}</p>}
                          {criteria.sentiment && <p>Sentiment: {criteria.sentiment}</p>}
                          {criteria.clvRange && <p>CLV: ${criteria.clvRange.min?.toLocaleString()} - ${criteria.clvRange.max?.toLocaleString()}</p>}
                          {criteria.industries?.length > 0 && <p>Industries: {criteria.industries.join(", ")}</p>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="journey" className="space-y-4">
          {!journeyData ? (
            <Card><CardContent className="py-12 text-center text-zinc-500"><TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Select a customer and click "Journey" to map their customer journey.</p></CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle>Customer Journey Map</CardTitle><CardDescription>{journeyData.summary}</CardDescription></CardHeader>
                <CardContent>
                  <div className="relative">
                    {journeyData.stages?.map((stage: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 mb-6 last:mb-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${stage.status === "completed" ? "bg-green-600" : stage.status === "current" ? "bg-blue-600 ring-4 ring-blue-200" : "bg-gray-400"}`}>{i + 1}</div>
                          {i < (journeyData.stages?.length || 0) - 1 && <div className="w-0.5 h-8 bg-gray-300 mt-1" />}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{stage.name}</h3>
                            <Badge variant={stage.status === "completed" ? "default" : stage.status === "current" ? "secondary" : "outline"}>{stage.status}</Badge>
                          </div>
                          <p className="text-sm text-zinc-500 mt-1">{stage.description}</p>
                          {stage.touchpoints?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">{stage.touchpoints.map((t: string, j: number) => <Badge key={j} variant="outline" className="text-xs">{t}</Badge>)}</div>
                          )}
                          {stage.emotion && <p className="text-xs mt-1">Emotion: {stage.emotion}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {journeyData.recommendations?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Journey Optimization Recommendations</CardTitle></CardHeader>
                  <CardContent>
                    <ol className="space-y-2">{journeyData.recommendations.map((r: string, i: number) => <li key={i} className="flex items-start gap-3 text-sm"><span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>{r}</li>)}</ol>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="intimacy" className="space-y-4">
          {!intimacyData ? (
            <Card><CardContent className="py-12 text-center text-zinc-500"><Heart className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Select a customer and click "Intimacy" to calculate their intimacy score.</p></CardContent></Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-1">
                  <CardContent className="p-6 text-center">
                    <div className={`w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl font-bold text-white ${intimacyData.overallScore >= 80 ? "bg-green-600" : intimacyData.overallScore >= 60 ? "bg-blue-600" : intimacyData.overallScore >= 40 ? "bg-yellow-600" : "bg-red-600"}`}>
                      {intimacyData.overallScore}
                    </div>
                    <p className="font-medium text-lg">Intimacy Score</p>
                    <p className="text-sm text-zinc-500">{intimacyData.level}</p>
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                  <CardHeader><CardTitle className="text-sm">Score Breakdown</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {intimacyData.dimensions?.map((d: any, i: number) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{d.name}</span>
                          <span className="font-medium">{d.score}/100</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                          <div className={`h-2 rounded-full ${d.score >= 70 ? "bg-green-600" : d.score >= 40 ? "bg-yellow-600" : "bg-red-600"}`} style={{ width: `${d.score}%` }} />
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{d.insight}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              {intimacyData.recommendations?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">How to Deepen This Relationship</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {intimacyData.recommendations.map((r: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-zinc-800 rounded-lg">
                          <Star className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <p className="text-sm">{r}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Customer Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Customer Profile</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Name *</label><Input value={custName} onChange={e => setCustName(e.target.value)} placeholder="John Smith" /></div>
            <div><label className="text-sm font-medium">Email *</label><Input value={custEmail} onChange={e => setCustEmail(e.target.value)} placeholder="john@company.com" type="email" /></div>
            <div><label className="text-sm font-medium">Company</label><Input value={custCompany} onChange={e => setCustCompany(e.target.value)} placeholder="Acme Corp" /></div>
            <div><label className="text-sm font-medium">Industry</label><Input value={custIndustry} onChange={e => setCustIndustry(e.target.value)} placeholder="SaaS, E-commerce..." /></div>
            <div><label className="text-sm font-medium">Source</label><Input value={custSource} onChange={e => setCustSource(e.target.value)} placeholder="Website, Referral, LinkedIn..." /></div>
            <Button onClick={() => addMut.mutate({ name: custName, email: custEmail || undefined, company: custCompany || undefined })} disabled={!custName.trim() || !custEmail.trim() || addMut.isPending} className="w-full">
              {addMut.isPending ? "Adding..." : "Add Customer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Segment Dialog */}
      <Dialog open={segmentOpen} onOpenChange={setSegmentOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Customer Segment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Segment Name *</label><Input value={segName} onChange={e => setSegName(e.target.value)} placeholder="e.g., High-Value Customers" /></div>
            <div><label className="text-sm font-medium">Description</label><Input value={segDesc} onChange={e => setSegDesc(e.target.value)} placeholder="Customers with CLV > $10k" /></div>
            <div><label className="text-sm font-medium">Criteria (JSON)</label><Textarea value={segCriteria} onChange={e => setSegCriteria(e.target.value)} placeholder='{"engagement": "hot", "sentiment": "positive"}' rows={3} /></div>
            <Button onClick={() => { try { const c = segCriteria ? JSON.parse(segCriteria) : {}; createSegMut.mutate({ name: segName, description: segDesc || undefined, criteria: c }); } catch { toast.error("Invalid JSON criteria"); } }} disabled={!segName.trim() || createSegMut.isPending} className="w-full">
              {createSegMut.isPending ? "Creating..." : "Create Segment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
