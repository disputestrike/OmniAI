import { useLocation } from "wouter";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function ServerError() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center mesh-bg">
      <div className="text-center space-y-6 px-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <p className="text-6xl font-black text-zinc-800 mb-3">500</p>
          <h1 className="text-xl font-bold text-white mb-2">Server error</h1>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto">Something went wrong on our end. Please try again.</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: "rgba(124,58,237,0.7)" }}>
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <button onClick={() => setLocation("/dashboard")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
