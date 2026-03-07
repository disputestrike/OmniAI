import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { ArrowLeft, Zap, Mail, MessageSquare, BookOpen, Rocket, CheckCircle2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Contact() {
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    // Simulate form submission
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

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
              <Button size="sm" onClick={() => window.location.href = getLoginUrl()} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0">
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-black mb-4">Get in Touch</h1>
          <p className="text-xl text-[#6b5e4f] max-w-xl mx-auto">
            We're here to help. Whether you have a question, feedback, or need support — reach out and we'll respond within 24 hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Message Sent!</h2>
                <p className="text-[#6b5e4f] mb-6">
                  Thanks for reaching out, {form.name}. We'll get back to you at {form.email} within 24 hours.
                </p>
                <Button
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  variant="outline"
                  className="border-amber-200"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-[#4a3f35]">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Your full name"
                      className="border-[#e8e0d4] focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-[#4a3f35]">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@company.com"
                      className="border-[#e8e0d4] focus:border-amber-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-[#4a3f35]">Subject</label>
                  <Input
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="What's this about?"
                    className="border-[#e8e0d4] focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-[#4a3f35]">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    className="border-[#e8e0d4] focus:border-amber-400 resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 text-base bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 rounded-xl shadow-lg shadow-amber-500/25"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Mail className="w-5 h-5" /> Send Message
                    </span>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-amber-50/60 rounded-2xl p-6 border border-amber-100/50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Email Support</h3>
                  <p className="text-sm text-[#6b5e4f] mb-2">For general questions and support requests</p>
                  <a href="mailto:support@otobi.ai" className="text-amber-600 font-semibold text-sm hover:underline">
                    support@otobi.ai
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/60 rounded-2xl p-6 border border-amber-100/50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white flex-shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Live Chat</h3>
                  <p className="text-sm text-[#6b5e4f] mb-2">Available for Professional and Business plan users</p>
                  <Button
                    size="sm"
                    onClick={() => window.location.href = getLoginUrl()}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 text-xs"
                  >
                    Open Chat in Dashboard
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/60 rounded-2xl p-6 border border-amber-100/50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Documentation</h3>
                  <p className="text-sm text-[#6b5e4f] mb-2">Guides, tutorials, and API reference</p>
                  <span className="text-amber-600 font-semibold text-sm">docs.otobi.ai (coming soon)</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/60 rounded-2xl p-6 border border-amber-100/50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white flex-shrink-0">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Enterprise & Sales</h3>
                  <p className="text-sm text-[#6b5e4f] mb-2">Custom plans, white-label, and API access</p>
                  <a href="mailto:sales@otobi.ai" className="text-amber-600 font-semibold text-sm hover:underline">
                    sales@otobi.ai
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-2">Response Times</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#9b8e7e]">Free plan</span>
                  <span>Within 48 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9b8e7e]">Starter plan</span>
                  <span>Within 24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9b8e7e]">Professional plan</span>
                  <span>Within 8 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9b8e7e]">Business plan</span>
                  <span className="text-amber-400 font-semibold">Priority + dedicated manager</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-[#e8e0d4] bg-amber-50/30 text-center text-sm text-[#9b8e7e]">
        &copy; {new Date().getFullYear()} OTOBI AI. All rights reserved.
        <span className="mx-2">·</span>
        <a href="/about" className="hover:text-[#1a1a1a]">About</a>
        <span className="mx-2">·</span>
        <a href="/privacy" className="hover:text-[#1a1a1a]">Privacy</a>
        <span className="mx-2">·</span>
        <a href="/terms" className="hover:text-[#1a1a1a]">Terms</a>
      </footer>
    </div>
  );
}
