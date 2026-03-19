import { ArrowRight, Compass } from "lucide-react";
import { useLocation } from "wouter";
import type { NextStepOption } from "@/config/pathBlueprint";

interface WhatsNextCardProps {
  steps: NextStepOption[];
  title?: string;
  maxSteps?: number;
}

export function WhatsNextCard({ steps, title = "Next in your path", maxSteps = 2 }: WhatsNextCardProps) {
  const [, setLocation] = useLocation();
  const toShow = steps.slice(0, maxSteps);
  if (toShow.length === 0) return null;

  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
      <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
        <Compass className="h-3 w-3" /> {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {toShow.map(step => (
          <button key={step.path} onClick={() => setLocation(step.path)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {step.label}
            <ArrowRight className="h-3 w-3 shrink-0 text-zinc-600" />
          </button>
        ))}
      </div>
    </div>
  );
}
