import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Blog() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-4">OmniAI Blog</h1>
        <p className="text-zinc-500 leading-relaxed">
          Marketing tips, product updates, and AI best practices. Coming soon.
        </p>
      </div>
    </div>
  );
}
