# OTOBI AI — Features and Where to Find Them

Everything in the product is **wired end-to-end**: front-end pages, back-end APIs, database, and sidebar. Use this as a quick map when you log in.

---

## Sidebar categories

### Overview
- **Dashboard** (`/dashboard`) — Home, stats, guided paths (Make a Product #1, Make Someone Viral, Spread a Concept), Export/Share report.

### Create
- **Product Analyzer** (`/products`) — Add and AI-analyze products.
- **Content Studio** (`/content`) — 22 content types, generate, remix, repurpose.
- **Content Repurposer** (`/content-repurposer`) — Video/audio upload → transcribe → all formats.
- **Creative Engine** (`/creatives`) — AI images, thumbnails, banners.
- **Video Ads** (`/video-ads`) — Scripts, storyboards, AI avatars.
- **Video Render** (`/video-render`) — Generate MP4 from frames.
- **Video Studio** (`/video-studio`) — Personal/webcam recording.
- **Image Editor** (`/image-editor`) — Resize, background removal, filters.
- **Brand Voice** (`/brand-voice`) — Train and use brand voice.
- **Translate** (`/translate`) — 30+ languages.
- **AI Avatars** (`/ai-avatars`) — Avatar creation and voice.
- **Meme Generator** (`/meme-generator`) — Meme creation.
- **Content Ingest** (`/content-ingest`) — Ingest URLs/content.
- **Content Library** (`/content-library`) — Library and management.
- **Templates** (`/content-templates`) — Content templates.
- **Content Scorer** (`/content-scorer`) — Score content.
- **Bulk Import** (`/bulk-import`) — Bulk CSV/JSON.
- **Brand Kit** (`/brand-kit`) — Brand assets.
- **Music Studio** (`/music-studio`) — Music and SFX.
- **Voiceover Studio** (`/voiceover-studio`) — Voiceover.
- **Forms** (`/forms`) — Standalone form builder; share link; responses; create lead on submit.

### Manage
- **Campaigns** (`/campaigns`) — Create and manage campaigns.
- **Funnels** (`/funnels`) — Multi-step funnels (landing, form, payment, thank-you).
- **A/B Testing** (`/ab-testing`) — A/B tests for campaigns/creatives.
- **Scheduler** (`/scheduler`) — Schedule posts.
- **Lead Manager** (`/leads`) — Leads, assign to team, status, export.
- **CRM Deals** (`/deals`) — Deal pipeline.
- **Ad Platforms** (`/ad-platforms`) — Connect ad accounts.
- **Ad Performance** (`/ad-performance`) — AI ad analysis, reports, Export report.
- **One-Push Publisher** (`/one-push-publisher`) — Publish to multiple platforms.
- **Momentum** (`/momentum`) — Campaign momentum.
- **Social Publish** (`/social-publish`) — Social publishing.
- **Email Marketing** (`/email-marketing`) — Lists, campaigns, send.
- **Content Calendar** (`/content-calendar`) — Calendar view.
- **Performance** (`/performance`) — Performance tracking.
- **Social Planner** (`/social-planner`) — Plan social content.

### Intelligence
- **Website Intel** (`/intelligence`) — Website analysis.
- **Reviews** (`/reviews`) — Review sources, add/reply to reviews.
- **Platform Intel** (`/platform-intel`) — Platform specs.
- **SEO Audits** (`/seo-audits`) — SEO audits.
- **Analytics** (`/analytics`) — Unified analytics, Export report.
- **Predictive AI** (`/predictive`) — Predictions.
- **AI Agents** (`/ai-agents`) — AI marketing chat (6 modes).
- **Competitor Spy** (`/competitor-spy`) — Ad spy.
- **Customer Intel** (`/customer-intel`) — Customer 360.
- **Competitor Intel** (`/competitor-intel`) — Competitor intelligence.
- **Competitor Monitor** (`/competitor-monitor`) — Monitor competitors.

### Workspace
- **Collaboration** (`/collaboration`) — Team collaboration.
- **Approvals** (`/approvals`) — Approval workflows.
- **Export / Import** (`/export-import`) — Export/import data.
- **Webhooks** (`/webhooks`) — Zapier-style webhooks.
- **Landing Pages** (`/landing-pages`) — Landing page builder.
- **Automations** (`/automations`) — Automation workflows.
- **Projects** (`/projects`) — Projects.

### Account
- **Pricing & Plans** (`/pricing`) — Plans and billing.
- **Creator Profile** (`/creator-profile`) — Your profile.

### Admin
- **Admin Panel** (`/admin`) — Platform admin (admin role only).

---

## One-click reports

- **Dashboard** — “Export / Share report” → generate shareable link (dashboard report).
- **Analytics** — “Export / Share report” → analytics report link.
- **Ad Performance** — “Export / Share report” → ad performance report link.

Shared links open at `/report/:shareToken` (no login; 30-day expiry).

---

## Lead assignment and round-robin

- **Lead Manager** (`/leads`) — “Assigned to” dropdown: Unassigned, Me, or team members.
- **Team** (`/team`) — “Lead assignment” card: Manual vs Round-robin; Save. New leads (from forms or bulk import) are auto-assigned when round-robin is on.

---

## Public routes (no login)

- `/` — Landing page.
- `/about`, `/terms`, `/privacy`, `/contact` — Legal and contact.
- `/report/:shareToken` — View shared report.

---

All features above are **real, wired, and integrated** — no placeholders. Backend (tRPC), database (Drizzle/MySQL), and front-end (React) are connected for each item.
