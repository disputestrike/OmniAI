# OTOBI AI vs DashClicks â€” Feature Gap Analysis

**Reference:** [DashClicks](https://www.dashclicks.com/) â€” White-label fulfillment and software for marketing agencies.  
**Date:** March 7, 2026

---

## Summary

**We did not incorporate DashClicks-style â€œresell fulfillmentâ€ or several of their agency-focused software modules.** OTOBI AI is strong on **AI creation, campaigns, and intelligence**; DashClicks is strong on **ordering white-label services** (someone else runs ads/SEO/backlinks for you or your clients) and **agency ops** (reviews, funnels, client dashboards, invoicing). Below is what we have, what they have that we donâ€™t, and suggested priorities.

---

## 1. What DashClicks Offers (from their site)

### A. White-label fulfillment (resell services)

| Service | Description | In OTOBI AI? |
|--------|-------------|--------------|
| White-label Facebook/Instagram Ads | Order ad campaigns; they fulfill under your brand | âŒ No â€“ we have **Ad Platforms** (connect your accounts) and **Ad Performance** (analyze), not ordering/fulfillment |
| White-label Google Ads | Same | âŒ No |
| White-label TikTok Ads | Same | âŒ No |
| White-label SEO | Order SEO work; they fulfill | âŒ No â€“ we have **SEO Audits** (analyze), not ordering/fulfillment |
| White-label Backlinks | Order backlink campaigns | âŒ No |
| White-label GBP Ranker | AI-optimized Google Business Profile management | âŒ No |
| White-label Content | Order blog/content; they write and publish | âš ï¸ Partial â€“ we **generate** content; we donâ€™t have an â€œorder content as a serviceâ€ fulfillment flow |
| White-label Social Posts | Order social posts; they create/post | âš ï¸ Partial â€“ we have **Social Publish** (you publish); no â€œorder and they post for youâ€ |
| White-label Listings | List clients on 70+ directories | âŒ No |

### B. Software (attract / convert / maintain)

| DashClicks module | What it does | In OTOBI AI? |
|------------------|--------------|--------------|
| **Sales Funnels** | Funnel builder to convert leads to sales | âœ… **Funnels** â€“ full multi-step builder (landing, form, payment, thank-you) |
| **Websites** | Drag-and-drop site builder, white-label | âš ï¸ Partial â€“ we have **Landing Pages** (templates + hosting), not full site builder |
| **Reviews** | Manage reviews and listings from one dashboard | âœ… **Reviews** â€“ sources, add/reply from one dashboard |
| **Lead Management** | Inbound leads, distribute to sales reps | âœ… **Lead Manager** + **CRM Deals** + **Lead assignment** (round-robin) |
| **InstaReports** | Quick reports to close deals | âœ… **One-click reports** â€“ shareable links from Dashboard, Analytics, Ad Performance |
 âš ï¸ Partial â€“ we have **Analytics** / **Ad Performance**; not â€œone-click client reportâ€ |
| **InstaSites** | AI-built websites in seconds | âš ï¸ Partial â€“ **Landing Page Builder** has AI generation; not â€œInstaSitesâ€ product |
| **Forms & Surveys** | Custom forms | âœ… **Forms** â€“ standalone builder, share link, responses, create-lead-on-submit |
| **CRM** | Contacts, deals | âœ… **CRM Deals** + leads |
| **Sales Pipelines** | Pipelines + automation | âš ï¸ Partial â€“ **Deals**; no full pipeline automations like DashClicks |
| **Inbox** | Live chat + two-way SMS/email | âŒ No unified inbox |
| **Payments** | Invoicing, Stripe billing | âš ï¸ Partial â€“ we have **Stripe** for **our** subscriptions; no client invoicing/billing |
| **Templates** | Templates across apps | âš ï¸ **Content Templates**; not cross-app like theirs |
| **Projects** | Project management | âœ… **Projects** |
| **Analytics / Reporting** | Campaign reporting | âœ… **Analytics**, **Ad Performance**, **Momentum** |
| **Dashboard** | Unified client dashboard, widgets | âš ï¸ **Dashboard** for the user; no **client-facing white-label dashboard** or sub-accounts |

### C. Agency model

| Capability | DashClicks | OTOBI AI |
|------------|-----------|----------|
| Sub-accounts (multiple clients under one agency) | âœ… | âŒ No client sub-accounts |
| White-label client login (client sees your brand) | âœ… | âŒ No white-label client portal |
| Order fulfillment for â€œmy businessâ€ or â€œresell to clientsâ€ | âœ… | âŒ No fulfillment ordering |
| Mobile app | âœ… | âŒ No |
| Zapier / API | âœ… | âœ… **Webhooks** / Zapier-style; API not fully exposed |

---

## 2. What We Have That Overlaps or Is Stronger

- **22 content types** and **Content Repurposer** (video â†’ all formats) â€” creation breadth beyond DashClicks.
- **Ad Performance Analyzer** and **One-Push Publisher** â€” you run and analyze ads; we donâ€™t â€œfulfillâ€ them.
- **SEO Audits** â€” we analyze; we donâ€™t order SEO as a service.
- **Team, Approvals, Collaboration, Projects** â€” internal team, not client sub-accounts.
- **Stripe** â€” our own subscription billing only; no client invoicing.
- **Landing Pages** â€” build and host; not full website builder or â€œInstaSitesâ€ clone.

So: **paid SEO / paid â€œbig clicksâ€ (paid media) as fulfillment** â€” i.e. â€œorder white-label Facebook/Google/TikTok/SEO and someone else does itâ€ â€” is **not** in OTOBI AI. We have the tools to **run and analyze** campaigns and content; we donâ€™t have the **marketplace/order-and-fulfill** layer that DashClicks has.

---

## 3. Suggested Priorities If You Want â€œDashClicks-Likeâ€ Functions

1. **Document and position**  
   - Keep this gap doc and make it clear in positioning: â€œOTOBI AI = create, run, and analyze campaigns yourself; for white-label fulfillment (someone else runs ads/SEO), use a partner or add later.â€

2. **High impact, no fulfillment partner needed**  
   - **Reviews / reputation** â€” One place to see and respond to Google/social reviews (read-only or with reply hooks if APIs allow).  
   - **Client-facing reports** â€” â€œInstaReports-styleâ€: one-click PDF/export of performance for a campaign or client.  
   - **Simple funnel builder** â€” Multi-step landing/funnel (e.g. lead capture â†’ thank you â†’ optional payment) using existing landing pages and Stripe.

3. **Medium term (needs partners or heavy build)**  
   - **Fulfillment ordering** â€” â€œOrder white-label Facebook/Google/TikTok/SEOâ€ with a catalog, cart, and handoff to a fulfillment partner (youâ€™d need a partner or internal ops).  
   - **Backlinks / GBP ranker** â€” Either integrate with a provider (e.g. API) or build; both are non-trivial.  
   - **Directory listings** â€” Integrate with a listings provider or scrape/manage 70+ directories; significant ops.

4. **Lower priority for â€œDashClicks parityâ€**  
   - Full **website builder** (we have landing pages).  
   - **Unified inbox** (SMS/email/chat).  
   - **White-label client sub-accounts** (big product/scope).

---

## 4. One-Line Answer

**Did we incorporate DashClicksâ€™ functions?**  
- **Partially.** We have creation, campaigns, ads analysis, SEO audits, CRM, team, reporting, landing pages, and Stripe for *our* billing.  
- **We did not add:** white-label **fulfillment** (order paid media/SEO/backlinks/GBP/content and have someone else do it), **reviews/listings** app, **funnel builder**, **client sub-accounts**, or **client invoicing**.  
- So â€œpaid SEOâ€ and â€œpaid big clicksâ€ in the **DashClicks sense** (resell fulfillment) are **not** in the product yet; adding them would mean a fulfillment/ordering layer and possibly partner integrations.
