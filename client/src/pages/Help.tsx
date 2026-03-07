import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, GitBranch, FileBarChart, FileQuestion, BarChart3, FlaskConical } from "lucide-react";

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
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" /> Help &amp; docs
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Quick guides for key features. Everything is wired and works end-to-end.</p>
      </div>

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
