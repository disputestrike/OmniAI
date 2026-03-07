import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-4">About OTOBI AI</h1>
        <p className="text-muted-foreground leading-relaxed mb-4">
          OTOBI AI is the ultimate AI-powered marketing engine. We help businesses market anything to anybody, anywhere — with one platform that creates ads, videos, blogs, SEO, emails, and social content across 21+ platforms.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          From product to viral campaign in minutes. No credit card required to start.
        </p>
      </div>
    </div>
  );
}
