import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Loader2, Rocket, Target, FileText, Megaphone } from "lucide-react";
import { toast } from "sonner";

const GOALS = [
  { id: "lead_gen", label: "Generate leads" },
  { id: "webinar", label: "Promote a webinar" },
  { id: "product_launch", label: "Launch a product" },
  { id: "grow_social", label: "Grow social following" },
  { id: "drive_traffic", label: "Drive website traffic" },
  { id: "promote_service", label: "Promote a service" },
  { id: "run_sale", label: "Run a sale or promotion" },
];

const CHANNELS = [
  { id: "landing_page" as const, label: "Landing Page" },
  { id: "paid_ads" as const, label: "Paid Ads" },
  { id: "email" as const, label: "Email" },
  { id: "social" as const, label: "Social Posts" },
  { id: "sms" as const, label: "SMS" },
];

export default function CampaignWizard() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [whatYouSell, setWhatYouSell] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [brandTone, setBrandTone] = useState("professional");
  const [campaignName, setCampaignName] = useState("");
  const [offer, setOffer] = useState("");
  const [budget, setBudget] = useState("");
  const [channels, setChannels] = useState<("landing_page" | "paid_ads" | "email" | "social" | "sms")[]>([]);
  const [generated, setGenerated] = useState<{ campaignId: number; assets: { assetType: string; assetId: number; status: string; preview?: string; title?: string }[] } | null>(null);

  const wizardGenerate = trpc.campaign.wizardGenerate.useMutation({
    onSuccess: (data) => {
      setGenerated(data);
      setStep(5);
      toast.success("Campaign assets generated. Review and launch when ready.");
    },
    onError: (e) => toast.error(e.message),
  });
  const wizardLaunch = trpc.campaign.wizardLaunch.useMutation({
    onSuccess: () => {
      toast.success("Campaign launched!");
      setLocation("/campaigns");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleChannel = (ch: typeof CHANNELS[0]["id"]) => {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  };

  const handleGenerate = () => {
    if (!goal || !campaignName || !offer || channels.length === 0) {
      toast.error("Please fill goal, campaign name, offer, and select at least one channel.");
      return;
    }
    wizardGenerate.mutate({
      goal,
      businessContext: { businessName: businessName || undefined, whatYouSell: whatYouSell || undefined, targetAudience: targetAudience || undefined, brandTone: brandTone || undefined },
      details: { campaignName, offer, targetAudience: targetAudience || undefined, budget: budget || undefined, channels },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="w-6 h-6" />
          Create New Campaign
        </h1>
        <p className="text-muted-foreground mt-1">Set your goal — OTOBI generates landing page, ads, emails, and social posts in one flow.</p>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Step 1: Choose your goal</CardTitle><CardDescription>What do you want this campaign to achieve?</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {GOALS.map((g) => (
              <label key={g.id} className="flex items-center gap-2 cursor-pointer rounded-lg border p-3 hover:bg-muted/50">
                <input type="radio" name="goal" value={g.id} checked={goal === g.id} onChange={() => setGoal(g.id)} className="sr-only" />
                <div className={`w-4 h-4 rounded-full border-2 ${goal === g.id ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                <span>{g.label}</span>
              </label>
            ))}
            <Button onClick={() => goal && setStep(2)} disabled={!goal} className="w-full mt-4"><ArrowRight className="w-4 h-4 mr-2" />Next</Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Step 2: Business context</CardTitle><CardDescription>Help the AI match your brand (optional but recommended).</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Business name</Label><Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Inc." /></div>
            <div><Label>What do you sell? (one sentence)</Label><Input value={whatYouSell} onChange={(e) => setWhatYouSell(e.target.value)} placeholder="B2B SaaS for project management" /></div>
            <div><Label>Target audience</Label><Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Small business owners, 25-45" /></div>
            <div><Label>Brand tone</Label>
              <select value={brandTone} onChange={(e) => setBrandTone(e.target.value)} className="w-full h-10 rounded-md border px-3">
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="bold">Bold</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              <Button onClick={() => setStep(3)}><ArrowRight className="w-4 h-4 mr-2" />Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Step 3: Campaign details</CardTitle><CardDescription>Name, offer, and which channels to generate.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Campaign name *</Label><Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. Spring 2026 Launch" /></div>
            <div><Label>Offer or hook *</Label><Textarea value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="What are you promoting? One sentence." rows={2} /></div>
            <div><Label>Budget (optional)</Label><Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. $500" /></div>
            <div>
              <Label>Channels to generate *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CHANNELS.map((ch) => (
                  <label key={ch.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={channels.includes(ch.id)} onCheckedChange={() => toggleChannel(ch.id)} />
                    <span>{ch.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              <Button onClick={() => setStep(4)} disabled={!campaignName || !offer || channels.length === 0}><ArrowRight className="w-4 h-4 mr-2" />Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>Step 4: Generate with AI</CardTitle><CardDescription>OTOBI will create your landing page, ad copy, email, and social posts.</CardDescription></CardHeader>
          <CardContent>
            <Button onClick={handleGenerate} disabled={wizardGenerate.isPending} className="w-full">
              {wizardGenerate.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Target className="w-4 h-4 mr-2" />Generate campaign</>}
            </Button>
            <Button variant="outline" className="w-full mt-2" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </CardContent>
        </Card>
      )}

      {step === 5 && generated && (
        <Card>
          <CardHeader><CardTitle>Step 5: Review & launch</CardTitle><CardDescription>Generated assets. Edit any in their modules, then launch.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {generated.assets.map((a, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <span className="font-medium capitalize">{a.assetType.replace(/_/g, " ")}</span>
                    {(a.title || a.preview) && <span className="text-muted-foreground ml-2">— {a.title || a.preview?.slice(0, 50)}</span>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    if (a.assetType === "landing_page") setLocation("/landing-pages");
                    else if (a.assetType === "email") setLocation("/email-marketing");
                    else if (a.assetType === "ad_creative") setLocation("/content");
                    else if (a.assetType === "social_post") setLocation("/content");
                    else setLocation("/campaigns");
                  }}>Edit</Button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Button onClick={() => wizardLaunch.mutate({ campaignId: generated.campaignId })} disabled={wizardLaunch.isPending}>
                {wizardLaunch.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                Launch campaign
              </Button>
              <Button variant="outline" onClick={() => setLocation("/campaigns")}>View all campaigns</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
