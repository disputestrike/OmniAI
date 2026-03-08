import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Zap, Target, Globe, Brain, Rocket, Users, Shield, TrendingUp } from "lucide-react";
import { getLoginPageUrl } from "@/const";

export default function AboutUs() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1a1a1a]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-[#e8e0d4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => navigate("/")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
                OTOBI AI
              </span>
            </button>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5 text-[#6b5e4f]">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Button>
              <Button size="sm" onClick={() => window.location.href = getLoginPageUrl()} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0">
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold mb-6 border border-amber-200/50">
            <Zap className="w-4 h-4" />
            Our Story
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            Built for Marketers Who{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              Refuse to Lose
            </span>
          </h1>
          <p className="text-xl text-[#6b5e4f] max-w-2xl mx-auto leading-relaxed">
            OTOBI AI was born from a simple frustration: great products were losing to inferior ones because of bad marketing. We built the solution.
          </p>
        </div>
      </section>

      {/* The Name */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">What Does OTOBI Mean?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                letter: "O",
                word: "Optimal",
                desc: "Targeting",
                full: "We find the exact audience most likely to buy your product — not guesses, but AI-driven precision targeting across every platform.",
                icon: Target,
                color: "from-amber-500 to-amber-600",
              },
              {
                letter: "T",
                word: "Targeting",
                desc: "Outreach",
                full: "Reach the right people at the right time with the right message — automatically adapted for each platform's unique culture and algorithm.",
                icon: Globe,
                color: "from-orange-500 to-orange-600",
              },
              {
                letter: "O",
                word: "Outreach",
                desc: "Blueprint",
                full: "Every campaign gets a complete blueprint: audience segments, content calendar, ad creative, budget allocation, and performance predictions.",
                icon: Brain,
                color: "from-red-500 to-red-600",
              },
              {
                letter: "BI",
                word: "Blueprint Intelligence",
                desc: "Intelligence",
                full: "Real-time intelligence that learns from your campaigns, competitor moves, and market trends to continuously improve your results.",
                icon: TrendingUp,
                color: "from-purple-500 to-purple-600",
              },
            ].map((item) => (
              <div key={item.letter} className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100/50">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-black text-lg mb-4 shadow-md`}>
                  {item.letter}
                </div>
                <div className="text-xs font-bold text-[#9b8e7e] uppercase tracking-widest mb-1">
                  {item.word}
                </div>
                <p className="text-sm text-[#6b5e4f] leading-relaxed">{item.full}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[#6b5e4f] mt-8 text-lg font-medium">
            Together: <span className="font-bold text-[#1a1a1a]">Optimal Targeting. Outreach. Blueprint. Intelligence.</span>
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black mb-6">Our Mission</h2>
              <p className="text-lg text-[#6b5e4f] leading-relaxed mb-4">
                We believe every business — from solo founders to global enterprises — deserves access to world-class marketing intelligence. Not just tools, but a complete operating system that thinks, creates, and optimizes on your behalf.
              </p>
              <p className="text-lg text-[#6b5e4f] leading-relaxed mb-4">
                The marketing landscape has fractured across 21+ platforms, each with its own algorithm, format, and audience behavior. Keeping up requires an army. OTOBI AI is that army — available to everyone.
              </p>
              <p className="text-lg text-[#6b5e4f] leading-relaxed">
                We're not just automating marketing. We're democratizing it.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { icon: Rocket, title: "Speed Without Sacrifice", desc: "From product description to full campaign in minutes, not weeks." },
                { icon: Brain, title: "Intelligence at Scale", desc: "AI that learns your brand voice and continuously improves." },
                { icon: Shield, title: "Built for Real Results", desc: "Every feature is designed to drive measurable business outcomes." },
                { icon: Users, title: "For Every Team Size", desc: "Solo founder or 500-person marketing department — OTOBI scales with you." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white flex-shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-1">{item.title}</div>
                    <div className="text-sm text-[#6b5e4f]">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#1a1a1a] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">What We Stand For</h2>
          <p className="text-[#9b8e7e] mb-12 text-lg">These aren't just words on a wall. They're the principles that drive every product decision.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { title: "Radical Transparency", desc: "We show you exactly what the AI is doing and why. No black boxes. No magic tricks." },
              { title: "Outcome Obsession", desc: "We don't celebrate features. We celebrate results — leads generated, revenue driven, brands built." },
              { title: "Continuous Intelligence", desc: "The platform gets smarter every day. Your campaigns improve automatically as the AI learns." },
            ].map((v) => (
              <div key={v.title} className="text-left">
                <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full mb-4" />
                <h3 className="font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-[#9b8e7e] text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black mb-4">Ready to See What OTOBI Can Do?</h2>
          <p className="text-[#6b5e4f] mb-8 text-lg">Start free. No credit card required. Your first campaign in minutes.</p>
          <Button
            size="lg"
            onClick={() => window.location.href = getLoginPageUrl()}
            className="text-base px-10 py-6 gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl shadow-amber-500/30 border-0 rounded-xl"
          >
            Start Creating for Free <Rocket className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[#e8e0d4] bg-amber-50/30 text-center text-sm text-[#9b8e7e]">
        &copy; {new Date().getFullYear()} OTOBI AI. All rights reserved.
        <span className="mx-2">·</span>
        <a href="/privacy" className="hover:text-[#1a1a1a]">Privacy</a>
        <span className="mx-2">·</span>
        <a href="/terms" className="hover:text-[#1a1a1a]">Terms</a>
        <span className="mx-2">·</span>
        <a href="/contact" className="hover:text-[#1a1a1a]">Contact</a>
      </footer>
    </div>
  );
}
