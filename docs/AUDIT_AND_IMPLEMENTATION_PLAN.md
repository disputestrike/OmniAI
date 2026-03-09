# OTOBI AI — Document 3 Audit Answers & Document 4 Implementation Plan

This document answers every audit question (Document 3) based on the current codebase, then outlines what to implement from Document 4, what is already done, and the proposed implementation plan for your approval.

---

## PART A — AUDIT ANSWERS (Document 3)

### SECTION 1 — THE CORE PROBLEM: HOW CONNECTED ARE THE MODULES?

**1. Right now if a user wants to run a webinar funnel, how many separate modules do they have to visit manually to set it up? List every module.**

They would need to visit: **Landing Page Builder** (create registration page), **Email Marketing** (create sequence and optionally send), **Automations** (create workflow for form submit → email if desired), **Leads/CRM** (if they want leads in one place), **Ad Platforms** or **Video Ads** (if running ads). There is **no single flow** that connects these; each is manual.

**2. Is there any flow in the app right now where a user inputs ONE goal and the system automatically creates content across multiple modules? If yes, show me. If no, confirm.**

**No.** There is no flow where one goal produces content across multiple modules. Content Studio, Creatives, Video Ads, Email Marketing, Landing Pages, and Campaigns work in isolation. The dashboard has “goal pipelines” (e.g. “Make a Product #1”) that are **navigation guides** (links to each step), not automated generation flows.

**3. When a user creates content in Content Studio, does that content automatically flow into any other module — scheduler, email, social, ad platforms? Or does the user have to manually copy and paste?**

**Manual only.** Content is stored in the `contents` table with an optional `campaignId`. There is no automatic flow to Scheduler, Email Marketing, Social Publish, or Ad Platforms. The user must use each module separately.

**4. When a user creates ad creatives in Creative Engine or Video Ads, does that creative automatically connect to Ad Platforms for launching? Or is it manual?**

**Manual.** Creatives and video ads are stored in their own tables. `adPlatform.launchAd` can accept `contentId` and `creativeId` and creates an ad platform campaign record, but the UI does not offer a one-click “Push to Ads” from a creative; the user has to go to Ad Platforms and configure launch. There is no “Push to Ads” button on creatives that opens a modal to select platform and campaign.

**5. When a user builds a landing page in Landing Pages, is there any automatic connection to Lead Manager, Email Marketing, or CRM Deals? Or are these completely separate?**

**Separate.** Landing pages have a form component and form submissions are stored in `form_submissions`. There is **no** automatic add-to-Lead-Manager, add-to-email-sequence, or create-CRM-deal when a form is submitted. The “Where should leads go?” configuration and automatic routing do not exist.

**6. Is there any campaign-level object in the app that ties together: landing page + ads + email sequence + social posts + performance tracking?**

**Partially.** The `campaigns` table exists (name, description, platforms, objective, status, budget, targetAudience, startDate, endDate) but:
- It has **no** `goal` (e.g. webinar, lead_gen, product_launch).
- It has **no** `total_budget`, `total_spend`, `total_leads`, `total_revenue`.
- There is **no** `campaign_assets` (or equivalent) table linking a campaign to landing pages, ad creatives, emails, social posts.
- So each module tracks its own data; there is no single campaign object that ties everything together or rolls up performance.

---

### SECTION 2 — THE LANDING PAGE BUILDER

**7. What can the Landing Pages builder currently do? Drag and drop, template-based, or AI-generated?**

**Template-based + AI-assisted.** User creates a page with title/slug and optional template; the page gets default components (hero, features, form, footer). There is **AI generation** via `landingPage.generateWithAi` (purpose, industry, style) that returns a JSON array of components (hero, features, testimonials, etc.) that can be applied to an **existing** page. It is not a full drag-and-drop builder; components are edited in place.

**8. Can the AI currently generate a complete landing page from a text prompt? Example: “webinar registration page for my coaching business” — does OTOBI build the full page automatically?**

**Not in one step.** The user must first create a page (title + slug), then use “Generate with AI” to fill components. So the flow is create → then generate. There is no single “Build with AI” entry where the user types one sentence and gets a full page (with URL) in one go.

**9. What page types can the landing page builder create?**

Templates exist for: **SaaS, Lead Gen, E-Commerce, Event, Agency, Webinar Signup, App Download, Course, Restaurant, Real Estate.** The builder is generic (components + templateId); page type is chosen via template, not a dedicated “page type” that changes structure.

**10. Can the landing page builder embed a webinar registration form that connects to Zoom, WebinarJam, or Demio automatically?**

**No.** There is no integration with Zoom, WebinarJam, or Demio. Forms are generic (fields + submit); no webinar-provider-specific connection.

**11. When someone submits a form on a landing page, where does that lead go? Does it automatically appear in Lead Manager and CRM Deals?**

**No.** Submissions go only to `form_submissions` (landingPageId, data JSON). There is no automatic creation of a lead in Lead Manager or a deal in CRM. No “lead destination” is configured per form.

**12. Can the landing page builder create a full funnel — multiple connected pages (registration → thank you → upsell)?**

**No.** Only single pages. There is no funnel builder or page-to-page redirect/flow (e.g. “after submit go to thank-you page” or “then to upsell page”).

**13. Is there an AI that suggests landing page structure, headline, and copy based on what the user is selling?**

**Partially.** `generateWithAi` uses the user’s purpose/industry/style to generate components and copy. There is no separate “suggestion” step; the AI generates the full component set in one call.

---

### SECTION 3 — EMAIL MARKETING MODULE

**14. Can OTOBI send emails directly to a user's subscriber list? Or is it just a content creation tool?**

**Partially.** The app has **lists and contacts** (create list, add/bulk import contacts) and **email campaigns** (subject, htmlBody, textBody, recipientListId). There is a **sendCampaign** mutation that iterates over the list and “sends” — but today it uses **notifyOwner()** (internal notification), **not** Resend to the contact’s email. So functionally it does **not** send real emails to subscribers yet. Resend is used for **transactional** emails (welcome, trial, payment, etc.) only.

**15. If OTOBI can send emails — what is the sending infrastructure?**

Resend is integrated for transactional emails (email.service.ts). For **marketing** campaigns, the code path exists (sendCampaign loops over contacts) but it does not call Resend; it would need to be wired to `sendEmail(to, subject, html)` per contact.

**16. Can the AI automatically generate a full email sequence when given a goal? Example: “7-day webinar follow-up sequence”.**

**No.** Email campaigns are single emails (one subject, one body). There is no “sequence” entity (multiple emails with delay rules) and no AI that generates a full sequence from a goal. The Email Marketing UI has “campaigns,” not sequences.

**17. When a lead comes in from a landing page form, does OTOBI automatically add them to an email sequence?**

**No.** Form submissions are not linked to lead creation or email sequences. No automation runs on form submit.

**18. Is there any automation builder that connects triggers to actions? Example: “When someone registers for webinar → send confirmation → reminder 24h before → follow-up after”. Does this exist?**

**Partially.** The **Automations** module exists: trigger types (form_submission, lead_status_change, campaign_event, schedule, manual) and actions (send_email, notify_team, update_lead_status, generate_content, create_task). So the **model** exists. But: (1) “send_email” in automation execution uses notifyOwner, not real email to a contact. (2) Form submission does not **invoke** automations — nothing calls “run automations for this trigger” when a form is submitted. (3) There is no visual drag-and-drop builder; workflows are created/edited via API with triggerType + actions array.

---

### SECTION 4 — AUTOMATIONS MODULE

**19. What does the Automations module currently do? What triggers and actions exist?**

**Triggers:** form_submission, lead_status_change, campaign_event, schedule, manual.  
**Actions:** send_email (currently notifyOwner), notify_team, update_lead_status, generate_content, create_task.  
Workflows are stored and can be executed manually via `automation.execute`; execution runs the action list (e.g. notify, status update placeholder).

**20. Can a user build a trigger-based automation without writing code? Is it a visual builder?**

**No.** The UI uses selects and form fields for trigger type and action list; it is **not** a visual drag-and-drop canvas. Automation is configured, not drawn.

**21. What triggers are currently available?**

form_submission, lead_status_change, campaign_event, schedule, manual.

**22. What actions are currently available?**

send_email, notify_team, update_lead_status, generate_content, create_task. No “add to email sequence,” “create CRM deal,” “publish social post,” “pause ad,” “send webhook” in execution today (some may exist in schema/config only).

**23. Can Automations connect across modules — e.g. trigger email when landing page form is submitted?**

**Only in design, not in runtime.** A workflow can be set to trigger on form_submission, but no code runs when a form is actually submitted (no hook from form submit → automation execution). So cross-module connection is not wired.

**24. Is there any AI in Automations that suggests or builds workflows from a goal?**

**No.** User builds each workflow manually. No AI suggester.

---

### SECTION 5 — AD PLATFORMS MODULE

**25. What ad platforms are currently connected and actually working?**

**None with real API.** The app has `ad_platform_connections` (platform, accountId, accessToken, etc.) and `ad_platform_campaigns`. User can “connect” (store tokens) and “launch” an ad — but `launchAd` only creates an internal campaign record with a placeholder `externalCampaignId`; there is **no** call to Meta Ads API, Google Ads API, or TikTok Ads API. `syncMetrics` is a placeholder. So: **listed** (Meta, Google, TikTok in UI/copy) but **not** integrated.

**26. Can a user launch a real Meta ad campaign from inside OTOBI without leaving the app?**

**No.** Launch creates an internal record and a message like “Connect your platform API key for auto-posting.” No real Meta API integration.

**27. When a user creates an ad creative in Creative Engine or Video Ads, can they push it directly to Ad Platforms with one click?**

**No.** There is no “Push to Ads” button on creatives that opens a modal to choose platform and campaign and then push. User would use Ad Platforms separately and reference content/creative manually.

**28. Does OTOBI have access to Meta Ads API, Google Ads API, TikTok Ads API? Properly authenticated and functional?**

**No.** Stored tokens and placeholder sync only; no real API calls.

**29. Can OTOBI automatically optimize ad campaigns (pause underperformers, increase budget on winners)?**

**No.** No optimization logic or API integration.

**30. When ad performance data comes back, does it automatically flow into Analytics and Ad Performance modules?**

**No.** syncMetrics is placeholder; no automatic pull or flow into analytics.

---

### SECTION 6 — ONE-PUSH PUBLISHER

**31. What does One-Push Publisher currently do?**

It is an **ad-focused** publisher: create “ads” (image, video, carousel, text) tied to an ad platform connection, then “publish” or “bulk publish.” It uses `publisher` router (publisher queue), not “one piece of content to many social platforms.” So it is **not** “one content → many social channels with one click.”

**32. Which platforms can One-Push Publisher currently publish to?**

Whatever is in `ad_platform_connections`. Since no real ad API is connected, “publish” is queue/status only, not live to Meta/Google/TikTok.

**33. When content is published via One-Push Publisher, does it automatically resize/reformat per platform (e.g. 1:1 Instagram, 16:9 YouTube, 9:16 TikTok)?**

**No.** No auto-resize or format variants. The publisher is ad-placement oriented, not multi-format social content.

**34. Is One-Push Publisher connected to the Scheduler? Can user schedule a one-push publish for a future time?**

**No.** Scheduler and publisher are separate; no integration for “schedule this one-push.”

---

### SECTION 7 — THE AI CAMPAIGN WIZARD (DOES IT EXIST?)

**35. Is there any feature that works like a campaign wizard — user inputs goal, AI builds a complete multi-channel campaign?**

**No.** “AI Campaign Wizard” is mentioned in trial email and testimonials copy only. There is no wizard flow in the app.

**36. Is there any feature that connects: goal → audience → offer → landing page + ads + email sequence + social posts in one flow?**

**No.**

**37. What does AI Agents module do?**

AI Agents is the **chat** (e.g. aiChat) for strategy, ideas, targeting — not a campaign builder. It does not create or link assets across modules.

**38. Is there a “campaign” object in the database that has relationships to landing pages, ad creatives, email sequences, and social posts?**

**No.** `campaigns` table has no `goal` or `campaign_assets`. Other tables (landing_pages, contents, creatives, email_campaigns, scheduled_posts) have optional `campaignId` FKs, but there is no **campaign_assets** (or similar) table that explicitly links a campaign to asset_type + asset_id. So the campaign does not act as a parent of all pieces.

**39. What would it take to build an AI Campaign Wizard (goal, audience, offer, budget → landing page, 3 ad creatives, 5-email sequence, 3 social posts → review → launch)? Foundation there or build from scratch?**

**Mostly from scratch.** We have: separate modules (landing, content, creatives, email, scheduler, ad platform), AI generation in many of them (landing generateWithAi, content generation, image generation, email single-campaign creation), and a basic `campaigns` table. We do **not** have: (1) unified wizard UI and flow, (2) campaign goal + business context driving generation, (3) campaign_assets linking all created pieces, (4) single “launch” that goes live on landing, ads, email, social. So the **foundation is partial**; the wizard flow, campaign model, and launch orchestration need to be built.

---

### SECTION 8 — SOCIAL PUBLISH & SCHEDULER

**40. Which social platforms are currently connected and working in Social Publish and Scheduler?**

Same as ad platforms: **connections can be stored**, but there is no real OAuth or publish API integration. So **none** are “actually working” for live publish.

**41. Can a user connect their social accounts (Meta, Instagram, LinkedIn, TikTok, Twitter/X, YouTube) from inside the app? Walk through OAuth.**

The app has an **Ad Platform** connection flow (platform, accountId, accessToken, etc.) for “ad” connections. There is no separate, documented social-publish OAuth flow for each social network (e.g. Instagram Graph, LinkedIn, TikTok). So **no** — we don’t have a clear, working OAuth connection flow for each of those for **organic** social publish.

**42. When content is scheduled, does OTOBI publish it automatically at the scheduled time?**

**Unknown without cron/job review.** There is a `social_publish_queue` and scheduler data; whether a job actually runs at scheduled time and calls external APIs would need to be verified. Given no real API integration, it would at most update status, not post to networks.

**43. Does the Content Calendar show scheduled posts from all platforms in one view?**

The **Content Calendar** page exists; whether it aggregates all platforms in one view depends on how it queries scheduler/queue. There is no single “campaign” view that shows all assets and their schedule.

---

## PART B — WHAT I AGREE WITH (Document 4)

- **Core principle:** Connecting existing modules and making “one goal → OTOBI does the rest” is the right direction. The audit shows heavy manual, siloed use today.
- **Campaign object first:** Adding a proper campaign model and `campaign_assets` (or equivalent) is the right foundation. The current `campaigns` table is insufficient.
- **AI Campaign Wizard as flagship:** A single “Create New Campaign” flow (goal → context → details → AI generation → review → launch) is the highest-impact feature and should be built early.
- **Landing page AI-first:** “Build with AI” as a first-class path (one sentence → full page) and “Start from template” is correct. So is configuring “where do leads go?” (Lead Manager, CRM, Email sequence) once per form.
- **Email as real sender:** Marketing campaigns should send via Resend (or similar) to the list, not notifyOwner. Sequences (multiple emails with delays) and AI-generated sequences from a goal are worth building.
- **Push to Ads:** A “Push to Ads” (or “Push to Ad Platforms”) button on creatives/video ads that opens a modal (platform + campaign) and creates/queues the ad is the right UX; it can work with current placeholder APIs and later with real Meta/Google/TikTok.
- **Automation that actually runs:** Form submission (and other events) should trigger automation execution, and “send_email” in automations should send real emails to contacts. Pre-built templates (webinar funnel, lead nurture, ad optimization) are valuable.
- **One-Push as true multi-platform content:** Rebranding or extending so that “one content → many social platforms” with auto-resize and caption variation is a clear improvement over the current ad-only publisher.
- **Dashboard campaign-first:** Showing active campaigns as the main dashboard view with a prominent “Create New Campaign” CTA aligns with the wizard and reduces confusion for new users.

---

## PART C — IMPLEMENTATION PLAN (For Your Approval)

Order follows Document 4’s priority where it makes sense; items are split into “foundation,” “wizard and flows,” and “polish.” Many items are **integrations** of existing pieces rather than brand-new apps.

### Phase 1 — Foundation (Campaign object & wiring)

| # | Task | What exists | What to do |
|---|------|-------------|------------|
| 1.1 | **Campaign table extension** | `campaigns` with name, platforms, objective, status, budget, dates | Add columns: `goal` (webinar, lead_gen, product_launch, etc.), `total_budget`, `total_spend`, `total_leads`, `total_revenue`. Migrate. |
| 1.2 | **campaign_assets table** | None | Create table: id, campaign_id, asset_type (landing_page, ad_creative, email, social_post, sms), asset_id, status (draft, approved, live, paused, completed), created_at. Migrate. |
| 1.3 | **Form submission → Lead + Automation** | form_submissions stored; createFormSubmission in db | Add API route (e.g. POST `/api/landing/:slug/submit` or tRPC) that: (1) creates form submission, (2) optionally creates lead and/or CRM deal from config, (3) finds automations with trigger form_submission for this page and runs them. Add “lead destination” config to landing page (Lead Manager, CRM, Email sequence, or combo). |

### Phase 2 — AI Campaign Wizard (Flagship)

| # | Task | What exists | What to do |
|---|------|-------------|------------|
| 2.1 | **Wizard UI and routing** | None | New route e.g. `/campaign-wizard` or `/new-campaign`. Steps: (1) Goal selection (list from Doc 4), (2) Business context (first time / saved), (3) Campaign details (name, offer, audience, budget, dates, channels), (4) AI generation (backend only), (5) Review & edit, (6) Launch. Primary CTA on dashboard: “Create New Campaign” → wizard. |
| 2.2 | **Wizard backend: create campaign + assets** | campaigns table; landing, content, creatives, email, scheduler modules | Single procedure (or orchestration) that: creates campaign record with goal; for each selected channel calls existing or new generators (landing page, ad creatives, email sequence, social posts, SMS); creates records in each module and inserts rows into campaign_assets. Return asset IDs and preview data for review step. |
| 2.3 | **Wizard: Launch** | Modules exist but not orchestrated | “Launch” step: set landing page live (status + URL), create/queue ad platform campaigns for creatives, activate email sequence (or queue first emails), schedule social posts, create/update campaign_assets status. Redirect to campaign dashboard. |
| 2.4 | **Campaign dashboard (minimal)** | None | Page or section that shows one campaign: name, goal, status, links to each asset (landing, ads, emails, social), and key metrics (total_leads, total_spend, etc.) when available. |

### Phase 3 — Landing Page AI & Lead Routing

| # | Task | What exists | What to do |
|---|------|-------------|------------|
| 3.1 | **“Build with AI” as first option** | generateWithAi returns components; user must create page first | On “New Page,” show two options: “Build with AI” (one sentence) and “Start from template.” For “Build with AI”: call generateWithAi (and optionally create page in one step with generated slug), then create page with returned components. Single flow: describe → get full page. |
| 3.2 | **Page type templates for AI** | Templates by use case (webinar, lead-gen, etc.) | When using “Build with AI,” let user pick page type (webinar registration, lead magnet, product sales, thank you, etc.) and pass to AI so structure and copy match. |
| 3.3 | **Lead destination on form** | Form component in landing page | In builder, when form block is present: “Where should leads go?” → Lead Manager, CRM Deals, Email sequence (choose), or All. Store on landing page metadata. On form submit (Phase 1.3), use this config to create lead, deal, and/or add to sequence. |
| 3.4 | **Funnel: redirect after submit** | Single pages only | Optional “After submit, redirect to” dropdown: thank-you page or another landing page (same user). On submit, return redirect URL in response so frontend can redirect. No full funnel builder yet — just one redirect. |

### Phase 4 — Email: Real Sending & Sequences

| # | Task | What exists | What to do |
|---|------|-------------|------------|
| 4.1 | **Send campaigns via Resend** | sendCampaign loops contacts, calls notifyOwner | Replace notifyOwner with email.service `sendEmail(contact.email, campaign.subject, campaign.htmlBody || campaign.textBody)`. Honor unsubscribed; optional batch/chunk to respect rate limits. |
| 4.2 | **Email sequences (entity + UI)** | Only single email campaigns | Add `email_sequences` table (name, goal type, user_id) and `email_sequence_steps` (sequence_id, subject, body, delay_days, order). UI: “New sequence” → “What is this for?” → AI generates full sequence (subjects + bodies); user edits; activate. |
| 4.3 | **Add contact to sequence from automation** | Automation action send_email only | New action: “add_to_email_sequence” (sequence_id). When a lead is added (e.g. from form), automation can add contact to a sequence; sequence engine (cron) sends emails by delay_days. |
| 4.4 | **Form submit → add to sequence** | Phase 1.3 lead destination | If “Email sequence” selected for form, on submit add contact (from form email/name) to chosen sequence (create contact if needed, then enroll). |

### Phase 5 — Automations That Run & Suggest

| # | Task | What exists | What to do |
|---|------|-------------|------------|
| 5.1 | **Run automations on form submit** | Phase 1.3 | When form is submitted, after saving submission and creating lead/deal: load automations where triggerType = form_submission and triggerConfig matches (e.g. landingPageId). Run execute for each (with context: submission id, lead id). |
| 5.2 | **Real “send_email” in automations** | notifyOwner in execute | For action send_email: resolve recipient (e.g. from trigger context — new lead email), use email.service sendEmail with template/body from action config. |
| 5.3 | **Pre-built automation templates** | Some templates in getTemplates | Add Doc 4 templates: Webinar Funnel (form submit → add lead, confirmation email, reminder 24h before, reminder 1h before, follow-up after); Lead Nurture (new lead → CRM deal, start 7-day sequence, notify team); Ad Optimization (trigger: ad CTR &lt; 1% for 48h → pause ad, notify). Last one needs a periodic job + ad metrics. |
| 5.4 | **AI automation suggester** | None | When user creates a campaign (or in wizard), optional step: “Here are 3 automations we recommend for this campaign” (based on goal). User clicks to add to their automations; no full visual builder yet. |

### Phase 6 — Ad Creative → Ad Platforms & One-Push

| # | Task | What exists | What to do |
|---|------|-------------|------------|
| 6.1 | **“Push to Ads” on creatives** | Creatives and ad platform launchAd | In Creative Engine and Video Ads (and Video Render if applicable): add “Push to Ads” button. Modal: select connection (platform), optional campaign, then call adPlatform.launchAd(connectionId, campaignId, name, contentId/creativeId). Same for “Push to Ads” from wizard-generated creatives. |
| 6.2 | **One-Push: multi-format social** | Publisher is ad-focused | Either extend current publisher or add a “Social One-Push” flow: one piece of content (image/copy) → system generates per-platform sizes (1:1, 9:16, 16:9, etc.) and optional caption variations, user approves, then “publish” queues to scheduler or connected social connections. Depends on having at least one real social publish API; otherwise implement “queue + sizes + captions” and document “connect APIs for live publish.” |
| 6.3 | **Ad performance sync (placeholder → real)** | syncMetrics placeholder | Keep placeholder behavior until APIs are connected. When Meta/Google/TikTok are integrated: hourly job that pulls metrics for active campaigns and updates ad_platform_campaigns and any analytics tables. |

### Phase 7 — Dashboard & Campaign-First UX

| # | Task | What exists | What to do |
|---|------|-------------|------------|
| 7.1 | **Dashboard: campaign-first** | Home shows stat cards and goal pipelines | Redesign Home (or add “Campaigns” as default tab): list **active campaigns** as cards (name, goal, status, key metrics, links to assets). Below: “Create New Campaign” as primary CTA. Keep existing stats/quick actions in a secondary section or sidebar. |
| 7.2 | **Campaign card metrics** | campaign total_leads, total_spend, etc. | When campaign_assets and campaign table are updated, show on card: leads, spend, revenue (if tracked), and a simple “health” or status (e.g. all live / partial / draft). |

---

## Summary: What’s Already Done vs What’s Not

| Area | Done | Not done / To integrate |
|------|------|--------------------------|
| Campaigns | Basic table, FKs in some modules | goal, totals, campaign_assets, wizard, campaign dashboard |
| Landing | Pages, templates, generateWithAi, form | One-sentence “Build with AI” flow, lead destination, funnel redirect, form submit → lead/automation |
| Email | Lists, contacts, campaigns, Resend for transactional | Send campaign via Resend, sequences, AI sequence from goal, add to sequence from form/automation |
| Automations | Trigger/action model, execute manually | Form submit triggers execution, real send_email, more actions, AI suggester, pre-built webinar/lead templates |
| Ad platforms | Connections and launch records | Real API integration, “Push to Ads” from creatives, performance sync |
| One-Push | Ad queue and publish UI | Multi-format social (sizes + captions), link to scheduler |
| Wizard | Mentioned in copy only | Full flow: goal → context → details → generate → review → launch |
| Dashboard | Stats, pipelines, quick actions | Campaign-first view, “Create New Campaign” as primary CTA |

---

## Recommended Approval

- **Approve** the extended campaign model and campaign_assets (Phase 1).
- **Approve** the AI Campaign Wizard as the next major feature (Phase 2), with the understanding that “launch” may initially create/queue assets and update status (full external API launch when APIs are available).
- **Approve** landing page “Build with AI” and lead routing (Phase 3) and email real sending + sequences (Phase 4) so the wizard has real value (landing + email).
- **Approve** automation execution on form submit and real send_email (Phase 5.1–5.2); then templates and AI suggester (5.3–5.4).
- **Approve** “Push to Ads” UX (Phase 6.1) and One-Push multi-format when social APIs are in scope (6.2); performance sync when ad APIs are connected (6.3).
- **Approve** dashboard campaign-first and campaign cards (Phase 7).

If you approve this plan, next step is to implement in the order above (Phase 1 → 2 → … → 7), with each phase merged and tested before moving on. I will not start implementation until you explicitly approve.
