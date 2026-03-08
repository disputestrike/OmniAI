import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Zap } from "lucide-react";
import { getLoginPageUrl } from "@/const";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-4 text-[#1a1a1a]">{title}</h2>
      <div className="text-[#6b5e4f] leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function Terms() {
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-3">Terms of Service</h1>
          <p className="text-[#9b8e7e] text-sm">Last updated: March 1, 2026</p>
        </div>

        <p className="text-[#6b5e4f] leading-relaxed mb-10">
          Welcome to OTOBI AI. By accessing or using our platform, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully. If you do not agree to these Terms, you may not use our service.
        </p>

        <Section title="1. Acceptance of Terms">
          <p>By creating an account or using OTOBI AI, you confirm that you are at least 16 years old, have the legal authority to enter into these Terms, and agree to comply with all applicable laws and regulations.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>OTOBI AI provides an AI-powered marketing platform that enables users to create, manage, and publish marketing content across multiple platforms. Features include AI content generation, image and video creation, campaign management, competitor analysis, and multi-platform publishing.</p>
          <p>We reserve the right to modify, suspend, or discontinue any aspect of the service at any time with reasonable notice.</p>
        </Section>

        <Section title="3. Account Registration">
          <p>You must provide accurate and complete information when creating your account. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account.</p>
          <p>You must notify us immediately of any unauthorized use of your account at security@otobi.ai.</p>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree not to use OTOBI AI to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Create or distribute spam, malware, or deceptive content</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights of others</li>
            <li>Generate content that is defamatory, harassing, or hateful</li>
            <li>Create misleading advertising or deceptive marketing materials</li>
            <li>Attempt to reverse-engineer, hack, or compromise our systems</li>
            <li>Use the platform for any illegal commercial purpose</li>
            <li>Scrape or extract data from our platform without authorization</li>
          </ul>
        </Section>

        <Section title="5. Content Ownership and License">
          <p><strong>Your Content:</strong> You retain ownership of all content you create, upload, or generate using OTOBI AI. By using our platform, you grant us a limited license to store, process, and display your content solely to provide the service.</p>
          <p><strong>AI-Generated Content:</strong> Content generated by our AI tools is provided to you for your use. You are responsible for ensuring AI-generated content complies with applicable laws and platform policies before publishing.</p>
          <p><strong>Platform Content:</strong> Our platform, including its design, code, and proprietary AI models, is owned by OTOBI AI and protected by intellectual property laws.</p>
        </Section>

        <Section title="6. Third-Party Integrations">
          <p>OTOBI AI integrates with third-party platforms (Meta, Google, TikTok, etc.) and AI providers. Your use of these integrations is subject to the respective third-party terms of service. We are not responsible for the actions or policies of third-party platforms.</p>
          <p>When you connect advertising accounts, you authorize OTOBI AI to access and manage those accounts as specified during the authorization process.</p>
        </Section>

        <Section title="7. Subscription and Payment">
          <p>Paid plans are billed on a recurring basis. By subscribing, you authorize us to charge your payment method on each billing cycle.</p>
          <p>Refunds are available within 7 days of initial purchase for annual plans. Monthly subscriptions are non-refundable but you may cancel at any time to prevent future charges.</p>
          <p>We reserve the right to change pricing with 30 days notice. Continued use after a price change constitutes acceptance.</p>
        </Section>

        <Section title="8. Disclaimer of Warranties">
          <p>OTOBI AI is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or that AI-generated content will meet your specific requirements or achieve particular marketing results.</p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>To the maximum extent permitted by law, OTOBI AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the service.</p>
          <p>Our total liability for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
        </Section>

        <Section title="10. Indemnification">
          <p>You agree to indemnify and hold harmless OTOBI AI, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the service, violation of these Terms, or infringement of any third-party rights.</p>
        </Section>

        <Section title="11. Termination">
          <p>We may suspend or terminate your account at any time for violation of these Terms, with or without notice. You may terminate your account at any time through the account settings.</p>
          <p>Upon termination, your right to use the service ceases immediately. We may retain your data for up to 30 days before deletion.</p>
        </Section>

        <Section title="12. Governing Law">
          <p>These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration, except where prohibited by law.</p>
        </Section>

        <Section title="13. Changes to Terms">
          <p>We may update these Terms from time to time. We will notify you of material changes via email or platform notification. Continued use after changes constitutes acceptance.</p>
        </Section>

        <Section title="14. Contact">
          <p>For questions about these Terms, contact us at legal@otobi.ai.</p>
        </Section>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-[#e8e0d4] bg-amber-50/30 text-center text-sm text-[#9b8e7e]">
        &copy; {new Date().getFullYear()} OTOBI AI. All rights reserved.
        <span className="mx-2">·</span>
        <a href="/about" className="hover:text-[#1a1a1a]">About</a>
        <span className="mx-2">·</span>
        <a href="/privacy" className="hover:text-[#1a1a1a]">Privacy</a>
        <span className="mx-2">·</span>
        <a href="/contact" className="hover:text-[#1a1a1a]">Contact</a>
      </footer>
    </div>
  );
}
