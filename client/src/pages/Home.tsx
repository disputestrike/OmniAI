import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Megaphone, BarChart3, Library, ArrowRight, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useState, FormEvent } from "react";

const examplePrompts = [
  "Launch my product for gym enthusiasts on TikTok and email",
  "Run a webinar — registration page, emails, and social posts",
  "Get more leads for my agency with a landing page and ads",
  "Create a full campaign for my new app launch",
];

export default function Home() {
  const { data: campaigns } = trpc.campaign.list.useQuery();
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");

  const activeCampaigns = (campaigns ?? []).filter(
    (c: { status: string }) => c.status === "active" || c.status === "draft"
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (q) {
      setLocation(`/ai-agents?prompt=${encodeURIComponent(q)}`);
      return;
    }
    setLocation("/ai-agents");
  };

  const openWithPrompt = (prompt: string) => {
    setLocation(`/ai-agents?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="space-y-10 max-w-3xl mx-auto pt-6 pb-12">
      {/* Single primary input — audit: "What do you want to launch?" */}
      <section className="text-center space-y-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          What do you want to launch?
        </h1>
        <p className="text-muted-foreground text-sm">
          Tell the AI. It will build your campaign, landing page, emails, and posts.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            placeholder="e.g. Launch my protein powder for gym people on TikTok"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 h-12 text-base rounded-xl border-2 focus-visible:ring-2"
            autoFocus
          />
          <Button type="submit" size="lg" className="rounded-xl h-12 px-6 shrink-0">
            <Sparkles className="h-4 w-4 mr-2" />
            Build it
          </Button>
        </form>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {examplePrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => openWithPrompt(prompt)}
              className="text-xs px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-left max-w-[280px] truncate"
            >
              {prompt}
            </button>
          ))}
        </div>
      </section>

      {/* Active campaigns — compact */}
      {activeCampaigns.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Active campaigns</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {activeCampaigns.slice(0, 6).map((c: { id: number; name: string; status: string; goal?: string | null }) => (
              <Card
                key={c.id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setLocation("/campaigns")}
              >
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate text-sm">{c.name}</p>
                    {c.goal != null && c.goal !== "" && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {String(c.goal).replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                  <Badge variant={c.status === "active" ? "default" : "secondary"} className="shrink-0 text-[10px]">
                    {c.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setLocation("/campaigns")}>
            View all campaigns
          </Button>
        </section>
      )}

      {/* Results — one clean view */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Results
        </h2>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Impressions", value: Number(stats?.analytics?.totalImpressions ?? 0).toLocaleString() },
                { label: "Clicks", value: Number(stats?.analytics?.totalClicks ?? 0).toLocaleString() },
                { label: "Conversions", value: Number(stats?.analytics?.totalConversions ?? 0).toLocaleString() },
                { label: "Revenue", value: `$${Number(stats?.analytics?.totalRevenue ?? 0).toLocaleString()}` },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-lg font-semibold">{m.value}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setLocation("/analytics")}>
              View analytics
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Library + quick links */}
      <section className="flex flex-wrap gap-3">
        <Button variant="outline" className="rounded-xl" onClick={() => setLocation("/content")}>
          <Library className="h-4 w-4 mr-2" />
          Content & creatives
        </Button>
        <Button variant="outline" className="rounded-xl" onClick={() => setLocation("/ai-agents")}>
          <Bot className="h-4 w-4 mr-2" />
          Talk to AI
        </Button>
        <Button variant="outline" className="rounded-xl" onClick={() => setLocation("/campaign-wizard")}>
          <Megaphone className="h-4 w-4 mr-2" />
          Campaign wizard
        </Button>
      </section>
    </div>
  );
}
