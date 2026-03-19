import { useState } from "react";
import { useSearch } from "wouter";
import { Sparkles, Mail, ArrowRight } from "lucide-react";
import { getLoginUrl } from "@/const";

const API_BASE = typeof window !== "undefined" ? window.location.origin : "";

const ERROR_MSGS: Record<string, string> = {
  invalid_email: "Please enter a valid email address.",
  password_too_short: "Password must be at least 8 characters.",
  email_taken: "An account with this email already exists. Sign in instead.",
  invalid_credentials: "Invalid email or password.",
  missing_credentials: "Please enter your email and password.",
  register_failed: "Sign up failed. Please try again.",
  login_failed: "Sign in failed. Please try again.",
  db: "Service temporarily unavailable. Please try again later.",
};

export default function Login() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const mode = params.get("mode") === "login" ? "login" : "register";
  const error = params.get("error");
  const [emailMode, setEmailMode] = useState<"register" | "login">(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const errorMessage = error ? ERROR_MSGS[error] || "Something went wrong. Please try again." : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 mesh-bg">
      <div className="w-full max-w-sm flex flex-col gap-7">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">OmniAI</h1>
            <p className="text-sm text-zinc-500 mt-1">The Marketing OS — sign in to get started</p>
          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="px-4 py-3 rounded-xl text-sm text-red-400 text-center"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {errorMessage}
          </div>
        )}

        {/* Google OAuth — primary */}
        <button
          onClick={() => { window.location.href = getLoginUrl(); }}
          className="flex items-center justify-center gap-3 w-full h-11 rounded-xl font-semibold text-sm text-white transition-all hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.18H12v4.13h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="divider-labeled">or</div>

        {/* Email section */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Tab switcher */}
          <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {(["register","login"] as const).map(m => (
              <button key={m} onClick={() => setEmailMode(m)}
                className="flex-1 py-2.5 text-xs font-bold transition-all"
                style={emailMode === m
                  ? { background: "rgba(124,58,237,0.12)", color: "#a78bfa", borderBottom: "2px solid #7c3aed" }
                  : { background: "transparent", color: "#52525b" }}>
                {m === "register" ? "Create account" : "Sign in"}
              </button>
            ))}
          </div>

          <div className="p-5">
            {emailMode === "register" ? (
              <form action={`${API_BASE}/api/auth/email/register`} method="post" className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Name (optional)</label>
                  <input id="name" name="name" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} autoComplete="name"
                    className="w-full h-9 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="reg-email" className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Email</label>
                  <input id="reg-email" name="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                    className="w-full h-9 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="reg-password" className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Password (min 8 chars)</label>
                  <input id="reg-password" name="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password"
                    className="w-full h-9 px-3 rounded-lg text-sm input-dark" />
                </div>
                <button type="submit" className="w-full h-10 rounded-xl text-sm font-bold text-white mt-2 flex items-center justify-center gap-2 transition-all"
                  style={{ background: "rgba(124,58,237,0.8)" }}>
                  <Mail className="h-4 w-4" /> Create account <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <form action={`${API_BASE}/api/auth/email/login`} method="post" className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Email</label>
                  <input id="login-email" name="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                    className="w-full h-9 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Password</label>
                  <input id="login-password" name="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                    className="w-full h-9 px-3 rounded-lg text-sm input-dark" />
                </div>
                <button type="submit" className="w-full h-10 rounded-xl text-sm font-bold text-white mt-2 flex items-center justify-center gap-2 transition-all"
                  style={{ background: "rgba(124,58,237,0.8)" }}>
                  <Mail className="h-4 w-4" /> Sign in <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-700">
          By continuing you agree to our{" "}
          <a href="/terms" className="text-zinc-500 hover:text-zinc-300 underline transition-colors">Terms</a>
          {" "}and{" "}
          <a href="/privacy" className="text-zinc-500 hover:text-zinc-300 underline transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
