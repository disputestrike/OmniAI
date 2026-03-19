import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Search, Monitor } from "lucide-react";
import CompetitorSpy from "./CompetitorSpy";
import CompetitorIntel from "./CompetitorIntel";
import CompetitorMonitor from "./CompetitorMonitor";

type TabValue = "spy" | "intel" | "monitor";

export default function CompetitorIntelligenceHub() {
  const [location] = useLocation();
  const [tab, setTab] = useState<TabValue>("spy");
  useEffect(() => {
    if (location === "/competitor-intel") setTab("intel");
    else if (location === "/competitor-monitor") setTab("monitor");
    else setTab("spy");
  }, [location]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold">Competitor Intelligence</h1>
        <p className="text-zinc-500 mt-1">
          Spy on ads, deep-dive with Intel, and monitor content to generate counter-campaigns — all in one place.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="spy" className="gap-2">
            <Eye className="h-4 w-4" />
            Spy
          </TabsTrigger>
          <TabsTrigger value="intel" className="gap-2">
            <Search className="h-4 w-4" />
            Intel
          </TabsTrigger>
          <TabsTrigger value="monitor" className="gap-2">
            <Monitor className="h-4 w-4" />
            Monitor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="spy" className="mt-6">
          <CompetitorSpy />
        </TabsContent>
        <TabsContent value="intel" className="mt-6">
          <CompetitorIntel />
        </TabsContent>
        <TabsContent value="monitor" className="mt-6">
          <CompetitorMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
