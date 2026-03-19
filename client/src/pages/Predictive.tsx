import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { TrendingUp, Zap, Target, DollarSign, Loader2 } from "lucide-react";
import { Streamdown } from "streamdown";

export default function Predictive() {
  const { user } = useAuth();
  const { data: scores, isLoading } = trpc.predictive.scores.useQuery(undefined, { enabled: !!user });
  const scoreCampaign = trpc.predictive.scoreEntity.useMutation({ onSuccess: () => toast.success("Campaign scored") });
  const optimizeBudget = trpc.predictive.budgetOptimizer.useMutation({ onSuccess: () => toast.success("Budget optimized") });
  const [entityType, setEntityType] = useState("campaign");
  const [entityId, setEntityId] = useState("");
  const [budget, setBudget] = useState("");
  const [objective, setObjective] = useState("");

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" /> Predictive AI</h1>
        <p className="text-zinc-500">AI-powered performance forecasting, ad scoring, and budget optimization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score Campaign */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Score Campaign</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Entity Type</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Entity ID</Label><Input value={entityId} onChange={e => setEntityId(e.target.value)} placeholder="Enter ID..." type="number" /></div>
            <Button className="w-full" onClick={() => {
              if (!entityId) { toast.error("Enter an entity ID"); return; }
              scoreCampaign.mutate({ entityType: entityType as any, entityId: parseInt(entityId) });
            }} disabled={scoreCampaign.isPending}>
              {scoreCampaign.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Scoring...</> : <><Target className="h-4 w-4 mr-2" /> Generate Score</>}
            </Button>
          </CardContent>
        </Card>

        {/* Budget Optimizer */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Budget Optimizer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Total Budget ($)</Label><Input value={budget} onChange={e => setBudget(e.target.value)} placeholder="5000" type="number" /></div>
            <div><Label>Objective</Label><Input value={objective} onChange={e => setObjective(e.target.value)} placeholder="Maximize conversions for Q2 launch" /></div>
            <Button className="w-full" onClick={() => {
              if (!budget || !objective) { toast.error("Fill in all fields"); return; }
              optimizeBudget.mutate({ totalBudget: budget, platforms: ["meta_ads", "google_ads", "tiktok_ads", "linkedin_ads"], objective });
            }} disabled={optimizeBudget.isPending}>
              {optimizeBudget.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Optimizing...</> : <><DollarSign className="h-4 w-4 mr-2" /> Optimize Budget</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Score Result */}
      {scoreCampaign.data && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle>Predictive Score Result</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center"><p className="text-3xl font-bold text-primary">{scoreCampaign.data.overallScore}</p><p className="text-xs text-zinc-500">Overall Score</p></div>
              <div className="text-center"><p className="text-3xl font-bold">{scoreCampaign.data.engagementScore}</p><p className="text-xs text-zinc-500">Engagement</p></div>
              <div className="text-center"><p className="text-3xl font-bold">{scoreCampaign.data.conversionScore}</p><p className="text-xs text-zinc-500">Conversion</p></div>
              <div className="text-center"><p className="text-3xl font-bold">{scoreCampaign.data.viralityScore}</p><p className="text-xs text-zinc-500">Virality</p></div>
            </div>
            {scoreCampaign.data.recommendations && <Streamdown>{scoreCampaign.data.recommendations}</Streamdown>}
          </CardContent>
        </Card>
      )}

      {/* Budget Optimization Result */}
      {optimizeBudget.data && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-600" /> Budget Allocation Plan</CardTitle></CardHeader>
          <CardContent>
            {optimizeBudget.data.allocations?.length > 0 && (
              <div className="space-y-2 mb-4">
                {optimizeBudget.data.allocations.map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white">
                    <div><p className="font-medium">{a.channel}</p><p className="text-xs text-zinc-500">{a.reasoning}</p></div>
                    <div className="text-right"><p className="font-bold">${a.amount}</p><p className="text-xs text-zinc-500">{a.percentage}%</p></div>
                  </div>
                ))}
              </div>
            )}
            {optimizeBudget.data.projectedROI && <p className="text-sm"><strong>Projected ROI:</strong> {optimizeBudget.data.projectedROI}</p>}
            {optimizeBudget.data.recommendations && <div className="mt-3"><Streamdown>{optimizeBudget.data.recommendations}</Streamdown></div>}
          </CardContent>
        </Card>
      )}

      {/* Historical Scores */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
      ) : scores && scores.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-3">Score History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scores.map((s: any) => (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{s.entityType}</Badge>
                    <span className="text-2xl font-bold text-primary">{s.overallScore}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div><p className="font-medium">{s.engagementScore}</p><p className="text-zinc-500">Engage</p></div>
                    <div><p className="font-medium">{s.conversionScore}</p><p className="text-zinc-500">Convert</p></div>
                    <div><p className="font-medium">{s.viralityScore}</p><p className="text-zinc-500">Viral</p></div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">{new Date(s.createdAt).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed"><CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-zinc-500/30 mb-4" />
          <p className="text-zinc-500">No scores yet. Score a campaign or content piece to get AI-powered predictions.</p>
        </CardContent></Card>
      )}
    </div>
  );
}
