import { useLocation } from "wouter";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center mesh-bg">
      <div className="text-center space-y-6 px-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/10 flex items-center justify-center mx-auto" style={{ border: "1px solid rgba(124,58,237,0.2)" }}>
          <Sparkles className="h-8 w-8 text-violet-400" />
        </div>
        <div>
          <p className="text-6xl font-black text-zinc-800 mb-3">404</p>
          <h1 className="text-xl font-bold text-white mb-2">Page not found</h1>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto">This page doesn't exist or was moved.</p>
        </div>
        <button onClick={() => setLocation("/dashboard")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: "rgba(124,58,237,0.7)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>
      </div>
    </div>
  );
}
