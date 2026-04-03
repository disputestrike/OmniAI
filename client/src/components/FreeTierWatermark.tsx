/**
 * Light, non-intrusive "Made with OmniAI" attribution for Free tier content.
 * Shown on generated creatives/content when user is on free plan.
 */
export function FreeTierWatermark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`text-[10px] text-muted-foreground/70 font-medium tracking-wide ${className}`}
      title="Free plan attribution"
    >
      Made with OmniAI
    </div>
  );
}
