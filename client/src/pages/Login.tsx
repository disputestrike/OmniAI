import { useState } from "react";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Mail } from "lucide-react";
import { getLoginUrl } from "@/const";

const API_BASE = typeof window !== "undefined" ? window.location.origin : "";

export default function Login() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const mode = params.get("mode") === "login" ? "login" : "register";
  const error = params.get("error");

  const [emailMode, setEmailMode] = useState<"register" | "login">(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const errorMessages: Record<string, string> = {
    invalid_email: "Please enter a valid email address.",
    password_too_short: "Password must be at least 8 characters.",
    email_taken: "An account with this email already exists. Sign in instead.",
    invalid_credentials: "Invalid email or password.",
    missing_credentials: "Please enter your email and password.",
    register_failed: "Sign up failed. Please try again.",
    login_failed: "Sign in failed. Please try again.",
    db: "Service temporarily unavailable. Please try again later.",
  };
  const errorMessage = error ? errorMessages[error] || "Something went wrong. Please try again." : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">OTOBI AI</h1>
          <p className="text-sm text-muted-foreground text-center">
            Create an account or sign in to get started.
          </p>
        </div>

        {errorMessage && (
          <p className="text-sm text-destructive font-medium text-center" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-col gap-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => { window.location.href = getLoginUrl(); }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.18H12v4.13h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="border rounded-xl p-4 space-y-4 bg-muted/30">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={emailMode === "register" ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setEmailMode("register")}
              >
                Sign up with email
              </Button>
              <Button
                type="button"
                variant={emailMode === "login" ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setEmailMode("login")}
              >
                Sign in with email
              </Button>
            </div>

            {emailMode === "register" ? (
              <form action={`${API_BASE}/api/auth/email/register`} method="post" className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Name (optional)</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password (min 8 characters)</Label>
                  <Input
                    id="reg-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <Mail className="w-4 h-4 mr-2" />
                  Create account
                </Button>
              </form>
            ) : (
              <form action={`${API_BASE}/api/auth/email/login`} method="post" className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <Mail className="w-4 h-4 mr-2" />
                  Sign in
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
