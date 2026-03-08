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

export default function Privacy() {
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
          <h1 className="text-4xl font-black mb-3">Privacy Policy</h1>
          <p className="text-[#9b8e7e] text-sm">Last updated: March 1, 2026</p>
        </div>

        <p className="text-[#6b5e4f] leading-relaxed mb-10">
          OTOBI AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully. If you disagree with its terms, please discontinue use of the service.
        </p>

        <Section title="1. Information We Collect">
          <p><strong>Account Information:</strong> When you create an account, we collect your name, email address, and authentication credentials.</p>
          <p><strong>Content Data:</strong> We store the content you create, upload, or generate using our platform, including text, images, videos, and campaign data.</p>
          <p><strong>Usage Data:</strong> We automatically collect information about how you interact with our platform, including pages visited, features used, and time spent.</p>
          <p><strong>Connected Account Data:</strong> If you connect third-party advertising accounts (Meta, Google, TikTok), we access campaign performance data as authorized by you.</p>
          <p><strong>Payment Information:</strong> Payment processing is handled by Stripe. We do not store full credit card numbers on our servers.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide, operate, and improve our platform and services</li>
            <li>Personalize your experience and deliver AI-powered recommendations</li>
            <li>Process transactions and send related information</li>
            <li>Send administrative information, updates, and security alerts</li>
            <li>Respond to your comments, questions, and customer service requests</li>
            <li>Train and improve our AI models (using anonymized, aggregated data only)</li>
            <li>Comply with legal obligations</li>
          </ul>
        </Section>

        <Section title="3. Sharing Your Information">
          <p>We do not sell, trade, or rent your personal information to third parties. We may share information with:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our platform (hosting, payment processing, analytics)</li>
            <li><strong>AI API Partners:</strong> When you use AI generation features, prompts may be processed by third-party AI providers (OpenAI, ElevenLabs, HeyGen, etc.) under their respective privacy policies</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          </ul>
        </Section>

        <Section title="4. Data Retention">
          <p>We retain your account data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us at privacy@otobi.ai.</p>
          <p>Content you generate is stored until you delete it or your account is closed. Deleted content may remain in backups for up to 30 days.</p>
        </Section>

        <Section title="5. Security">
          <p>We implement industry-standard security measures including encryption in transit (TLS), encryption at rest, regular security audits, and access controls. However, no method of transmission over the Internet is 100% secure.</p>
        </Section>

        <Section title="6. Cookies">
          <p>We use cookies and similar tracking technologies to maintain your session, remember preferences, and analyze platform usage. You can control cookie settings through your browser, though disabling cookies may affect platform functionality.</p>
        </Section>

        <Section title="7. Third-Party Links">
          <p>Our platform may contain links to third-party websites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies.</p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>Our service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.</p>
        </Section>

        <Section title="9. Your Rights">
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to or restrict processing of your information</li>
            <li>Data portability — receive your data in a structured format</li>
          </ul>
          <p>To exercise these rights, contact us at privacy@otobi.ai.</p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="11. Contact Us">
          <p>If you have questions about this Privacy Policy, please contact us:</p>
          <ul className="list-none space-y-1">
            <li><strong>Email:</strong> privacy@otobi.ai</li>
            <li><strong>Address:</strong> OTOBI AI, Inc. — contact us via the platform for mailing address</li>
          </ul>
        </Section>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-[#e8e0d4] bg-amber-50/30 text-center text-sm text-[#9b8e7e]">
        &copy; {new Date().getFullYear()} OTOBI AI. All rights reserved.
        <span className="mx-2">·</span>
        <a href="/about" className="hover:text-[#1a1a1a]">About</a>
        <span className="mx-2">·</span>
        <a href="/terms" className="hover:text-[#1a1a1a]">Terms</a>
        <span className="mx-2">·</span>
        <a href="/contact" className="hover:text-[#1a1a1a]">Contact</a>
      </footer>
    </div>
  );
}
