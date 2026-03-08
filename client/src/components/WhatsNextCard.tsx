import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass } from "lucide-react";
import { useLocation } from "wouter";
import type { NextStepOption } from "@/config/pathBlueprint";

interface WhatsNextCardProps {
  steps: NextStepOption[];
  title?: string;
  /** Max number of steps to show (default 2). */
  maxSteps?: number;
}

export function WhatsNextCard({ steps, title = "Next in your path", maxSteps = 2 }: WhatsNextCardProps) {
  const [, setLocation] = useLocation();
  const toShow = steps.slice(0, maxSteps);
  if (toShow.length === 0) return null;

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-3">
          <Compass className="h-3.5 w-3.5" />
          {title}
        </p>
        <div className="flex flex-wrap gap-2">
          {toShow.map((step) => (
            <Button
              key={step.path}
              variant="outline"
              size="sm"
              className="rounded-lg text-left h-auto py-2 px-3 justify-start gap-2"
              onClick={() => setLocation(step.path)}
            >
              <span className="truncate">{step.label}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
