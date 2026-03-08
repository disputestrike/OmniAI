import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, GitBranch, FileBarChart, FileQuestion, BarChart3, FlaskConical, Shield, Copy, Check, Zap } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";

const helpSections = [
  {
    id: "funnel",
    title: "How to create a funnel",
    icon: GitBranch,
    steps: [
      "Go to Manage → Funnels.",
      "Click New Funnel and enter a name and URL slug (e.g. lead-magnet).",
      "Select the funnel and click Add step. Add steps in order: e.g. Landing page → Form → Payment → Thank you.",
      "For each step, choose the type (landing, form, payment, thank_you) and link to an existing landing page or form if needed.",
      "Set status to Active when ready. Use Funnel health to see drop-off analytics (record view/complete events from your funnel pages).",
      "Optional: Create an A/B test on a step (New A/B test) to test different variants and see results in the Results table.",
    ],
  },
  {
    id: "report",
    title: "How to share a report",
    icon: FileBarChart,
    steps: [
      "On Dashboard, Analytics, or Ad Performance, click the Export / Share report button.",
      "Enter a title for the report and click Generate.",
      "Copy the shareable link. Anyone with the link can view the report (no login) for 30 days.",
      "Share the link with clients or stakeholders. They open it in a browser at /report/[token].",
    ],
  },
  {
    id: "form",
    title: "How to create and share a form",
    icon: FileQuestion,
    steps: [
      "Go to Create → Forms. Click New form, enter name and slug (e.g. contact-us).",
      "Add fields (text, email, phone, textarea, select, checkbox, number). Set required and options as needed.",
      "Set status to Active. Copy the share link: it looks like yourdomain.com/form/[slug].",
      "Share that link or embed it. Submissions appear under the form; you can optionally create a lead per submission and use round-robin assignment (Team → Lead assignment).",
    ],
  },
  {
    id: "analytics",
    title: "Funnel drop-off and A/B tests",
    icon: BarChart3,
    steps: [
      "Funnel health (on the Funnels page when a funnel is selected) shows views and completions per step and drop-off %. Record events by calling funnel.recordStepEvent with eventType view or complete from your funnel step pages.",
      "A/B tests: Create a test on a funnel step, add variation names (e.g. Control, Variant A). Start the test. Record views and conversions via funnel.recordFunnelAbView and funnel.recordFunnelAbConversion. View results in the Results table and end the test when done.",
    ],
  },
  {
    id: "blocks",
    title: "Landing page block library",
    icon: FlaskConical,
    steps: [
      "In Workspace → Landing Pages, select a page. Use the Add block section to insert: Video embed (YouTube/Vimeo URL), Map/Address, Calendly (scheduling link), or Signature.",
      "Each block has editable props (e.g. url, address, calendlyUrl). Edit in the panel and the page updates.",
    ],
  },
];

export default function Help() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyOpenId = () => {
    if (user?.openId) {
      navigator.clipboard.writeText(user.openId);
      setCopied(true);
      toast.success("Open ID copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" /> Help &amp; docs
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Quick guides for key features. Everything is wired and works end-to-end.</p>
      </div>

      {/* Admin & AI setup — how to access admin and get Forge working */}
      <Accordion type="single" collapsible className="space-y-2">
        <AccordionItem value="admin-forge" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="hover:no-underline py-4">
            <span className="flex items-center gap-2 font-medium">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Admin access &amp; AI (Forge) setup
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">Admin panel</p>
              <p>Go to <strong>/admin</strong> (or use Admin in the sidebar). Only users with role <strong>admin</strong> can see it and use it. There is no separate admin password — your account becomes admin when its Open ID matches the <code className="bg-muted px-1 rounded">OWNER_OPEN_ID</code> environment variable.</p>
              {user?.openId ? (
                <div className="mt-3 p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-foreground text-xs mb-1">Your Open ID (use this for admin)</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs break-all">{user.openId}</code>
                    <Button type="button" variant="outline" size="sm" className="shrink-0 h-8" onClick={copyOpenId}>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs">In Railway → Variables, add <code className="bg-muted px-1 rounded">OWNER_OPEN_ID</code> = this value. Redeploy, then log out and log back in. The Admin item will appear in the sidebar and /admin will work.</p>
                </div>
              ) : (
                <p className="mt-2 text-xs">Sign in to see your Open ID here and use it for OWNER_OPEN_ID.</p>
              )}
            </div>
            <div>
              <p className="font-medium text-foreground mb-1 flex items-center gap-1"><Zap className="h-4 w-4" /> AI content &amp; image generation (Forge)</p>
              <p>Content generation and AI images use the Forge LLM API. Set these in Railway (or .env):</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li><code className="bg-muted px-1 rounded">BUILT_IN_FORGE_API_URL</code> — e.g. your Forge/OpenAI-compatible API base URL</li>
                <li><code className="bg-muted px-1 rounded">BUILT_IN_FORGE_API_KEY</code> — your API key</li>
              </ul>
              <p className="mt-2">If these are missing, you’ll see an error when generating content or images. Add them and redeploy.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Accordion type="single" collapsible className="space-y-2">
        {helpSections.map(section => (
          <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="flex items-center gap-2 font-medium">
                <section.icon className="h-4 w-4 text-muted-foreground" />
                {section.title}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                {section.steps.map((step, i) => (
                  <li key={i} className="pl-1">{step}</li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
