import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Zap,
  RefreshCw,
  BookOpen,
  Users,
  Gift,
  Loader2,
  Trash2,
  Copy,
  Sparkles,
} from "lucide-react";

export default function AutonomousGrowth() {
  const [campaignIdAgg, setCampaignIdAgg] = useState("");
  const [campaignIdExtract, setCampaignIdExtract] = useState("");
  const [narrativeText, setNarrativeText] = useState("");
  const [narrativeUrl, setNarrativeUrl] = useState("");
  const [infName, setInfName] = useState("");
  const [infType, setInfType] = useState<"persona" | "channel">("persona");
  const [infNotes, setInfNotes] = useState("");

  const { data: flywheelPatterns } = trpc.flywheel.getPatterns.useQuery({ limit: 20 });
  const aggregateMut = trpc.flywheel.aggregateFromCampaign.useMutation({
    onSuccess: (d) => { toast.success(d.message ?? "Aggregated"); },
    onError: (e) => toast.error(e.message),
  });
  const { data: myPatterns, refetch: refetchPatterns } = trpc.selfLearning.listMyPatterns.useQuery();
  const extractMut = trpc.selfLearning.extractWinningPatterns.useMutation({
    onSuccess: () => { refetchPatterns(); toast.success("Winning patterns extracted"); },
    onError: (e) => toast.error(e.message),
  });
  const { data: narratives, refetch: refetchNarratives } = trpc.narrative.list.useQuery();
  const detectNarrativeMut = trpc.narrative.detect.useMutation({
    onSuccess: () => { refetchNarratives(); toast.success("Narrative detected"); },
    onError: (e) => toast.error(e.message),
  });
  const { data: influenceNodes, refetch: refetchInfluence } = trpc.influence.list.useQuery();
  const createInfMut = trpc.influence.create.useMutation({
    onSuccess: () => { refetchInfluence(); setInfName(""); setInfNotes(""); toast.success("Influence node added"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteInfMut = trpc.influence.delete.useMutation({
    onSuccess: () => { refetchInfluence(); toast.success("Removed"); },
  });
  const { data: refCode } = trpc.referral.getOrCreateCode.useQuery();
  const { data: myReferrals } = trpc.referral.listMyReferrals.useQuery();

  const copyRefCode = () => {
    if (refCode?.code) {
      const url = `${window.location.origin}/?ref=${refCode.code}`;
      navigator.clipboard.writeText(url);
      toast.success("Referral link copied");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Growth & Learning Engine
          </h1>
          <p className="text-muted-foreground mt-1">
            Data flywheel, self-learning campaigns, market narratives, influence graph, and referral.
          </p>
        </div>

        {/* Data Flywheel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" /> Data Flywheel</CardTitle>
            <p className="text-sm text-muted-foreground">Anonymized patterns from campaigns improve predictions for everyone.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Input
                type="number"
                placeholder="Campaign ID to aggregate"
                value={campaignIdAgg}
                onChange={(e) => setCampaignIdAgg(e.target.value)}
                className="w-48"
              />
              <Button
                onClick={() => aggregateMut.mutate({ campaignId: parseInt(campaignIdAgg) })}
                disabled={!campaignIdAgg || aggregateMut.isPending}
              >
                {aggregateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aggregate"}
              </Button>
            </div>
            {flywheelPatterns && flywheelPatterns.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Recent patterns: </span>
                {flywheelPatterns.slice(0, 5).map((p) => (
                  <Badge key={p.id} variant="secondary" className="ml-1">{p.platform} {p.ctrBand}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Self-Learning Campaign Engine */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Self-Learning Campaign Engine</CardTitle>
            <p className="text-sm text-muted-foreground">Extract winning patterns from a campaign to reuse in future content.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Input
                type="number"
                placeholder="Campaign ID"
                value={campaignIdExtract}
                onChange={(e) => setCampaignIdExtract(e.target.value)}
                className="w-40"
              />
              <Button
                onClick={() => extractMut.mutate({ campaignId: parseInt(campaignIdExtract) })}
                disabled={!campaignIdExtract || extractMut.isPending}
              >
                {extractMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Extract patterns"}
              </Button>
            </div>
            {myPatterns && myPatterns.length > 0 && (
              <ul className="space-y-2 text-sm">
                {myPatterns.slice(0, 8).map((p) => (
                  <li key={p.id} className="p-2 rounded bg-muted/50">{p.summary || `${p.platform} – ${p.emotion}`}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Market Narrative Engine */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Market Narrative Engine</CardTitle>
            <p className="text-sm text-muted-foreground">Detect emerging narratives from content to align campaigns.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Paste content or trend summary</Label>
              <Textarea
                placeholder="Paste trending posts, article excerpt, or trend description..."
                value={narrativeText}
                onChange={(e) => setNarrativeText(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
            <Input placeholder="Source URL (optional)" value={narrativeUrl} onChange={(e) => setNarrativeUrl(e.target.value)} />
            <Button
              onClick={() => detectNarrativeMut.mutate({ sourceText: narrativeText, sourceUrl: narrativeUrl || undefined })}
              disabled={!narrativeText.trim() || detectNarrativeMut.isPending}
            >
              {detectNarrativeMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Detect narrative"}
            </Button>
            {narratives && narratives.length > 0 && (
              <ul className="space-y-2 text-sm">
                {narratives.slice(0, 5).map((n) => (
                  <li key={n.id} className="p-2 rounded bg-muted/50">
                    <p className="font-medium">{n.summary.slice(0, 120)}…</p>
                    {n.suggestedAngles?.length ? <p className="text-muted-foreground mt-1">Angles: {n.suggestedAngles.join(", ")}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Audience Influence Graph */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Audience Influence Graph</CardTitle>
            <p className="text-sm text-muted-foreground">Define who influences your audience (personas, channels) for targeting.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap items-end">
              <div>
                <Label>Name</Label>
                <Input placeholder="e.g. Tech Twitter creators" value={infName} onChange={(e) => setInfName(e.target.value)} className="w-48 mt-1" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={infType} onValueChange={(v: "persona" | "channel") => setInfType(v)}>
                  <SelectTrigger className="w-32 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="persona">Persona</SelectItem>
                    <SelectItem value="channel">Channel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Notes" value={infNotes} onChange={(e) => setInfNotes(e.target.value)} className="w-40" />
              <Button onClick={() => createInfMut.mutate({ name: infName, type: infType, notes: infNotes || undefined })} disabled={!infName.trim() || createInfMut.isPending}>
                Add
              </Button>
            </div>
            {influenceNodes && influenceNodes.length > 0 && (
              <ul className="space-y-2">
                {influenceNodes.map((n) => (
                  <li key={n.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span><Badge variant="outline" className="mr-2">{n.type}</Badge>{n.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => deleteInfMut.mutate({ id: n.id })}><Trash2 className="h-4 w-4" /></Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Referral (growth lever) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" /> Referral</CardTitle>
            <p className="text-sm text-muted-foreground">Share your link; when someone signs up, you get credit.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {refCode?.code && (
              <div className="flex items-center gap-2">
                <Input readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${refCode.code}`} className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyRefCode}><Copy className="h-4 w-4" /></Button>
              </div>
            )}
            {myReferrals && myReferrals.length > 0 && (
              <p className="text-sm text-muted-foreground">Referrals: {myReferrals.length}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
