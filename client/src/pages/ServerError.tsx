import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home, Mail } from "lucide-react";
import { useLocation } from "wouter";

export default function ServerError() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-lg shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-100 rounded-full animate-pulse" />
              <AlertTriangle className="relative h-16 w-16 text-amber-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">500</h1>
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Server Error</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Something went wrong on our end. We've been notified and are working on it. Please try again in a moment or contact support.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setLocation("/")} className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:support@otobi.ai" className="gap-2">
                <Mail className="h-4 w-4" />
                Contact support (support@otobi.ai)
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
