# Landing Page Visual Strategy: Fun, Exciting, Inviting

**Goal:** Move from a text-heavy, icon-only landing page to one that feels like Bacon’s — photorealistic people, example creatives, and “what you can create” front and center so the page feels fun, exciting, and inviting.

---

## 1. What to change (high level)

| Current | Target (Bacon-style) |
|--------|-----------------------|
| Hero = headline + one dashboard screenshot | Hero + **floating example creatives** (people, products, UGC-style) around the message |
| Feature cards = abstract icons only | Keep icons; **add one small “proof” image or example output** per section where it fits |
| One generic “ad grid” image | **Dedicated “What you can create”** section: grid of 6–8 real-looking example outputs (ads, UGC, video stills, social posts) with short labels |
| Testimonials = text only | **Circular profile photos + name + role + star rating** (and optional short quote) |
| Results = one stock analytics image | Optionally add **screenshot of your real dashboard** or **collage of creatives + overlay stats** |
| AI Video = one image | **Explicit “AI actors” row**: 6–8 circular headshots of diverse, friendly faces (like Bacon’s “AI-Generated Video Actors”) |
| Little human presence | **More people**: smiling faces, diverse actors, creators at desks — in hero, examples, and testimonials |

---

## 2. Image checklist (what to source or generate)

Use these as a production checklist. Replace placeholders in code with your final assets.

- [ ] **Hero “floating creatives”** (4–6 images)  
  - Mix: 1–2 people (smiling, casual), 1–2 product/lifestyle, 1 UGC-style.  
  - Format: Square or 4:5, ~200–400px wide.  
  - Feel: Bright, relatable, like real ad/UGC content.

- [ ] **“What you can create” grid** (6–8 images)  
  - One tile per type: e.g. “Ad Creative”, “UGC Video Still”, “Social Post”, “Product Shot”, “Email Header”, “Video Ad Frame”.  
  - Prefer **actual outputs from OTOBI** (or close mockups).  
  - Format: Mixed aspect ratios OK (Pinterest-style); min height ~200px.

- [ ] **Testimonial avatars** (3–6 photos)  
  - Circular crop, friendly and professional.  
  - Real customers > stock; if stock, use diverse, relatable faces.  
  - Size: ~80–100px display.

- [ ] **AI Video Actors** (6–8 headshots)  
  - Diverse ages, ethnicities, expressions (e.g. friendly, confident).  
  - Circular crop; can be from your AI avatar feature or curated stock.  
  - Use in the “Diverse AI Actors” section.

- [ ] **Optional:**  
  - One “creator at desk” or “team high-five” for “Replace your entire team” or social proof.  
  - Real dashboard screenshot for Results section (instead of or next to generic analytics image).

---

## 3. Copy and tone tweaks

- Add one **warm, outcome-focused line** near the hero, e.g.  
  “Create ads that look like real people made them.” or “Studio-quality creatives in minutes.”
- Use **concrete, benefit-led** subheads: e.g. “Scroll-stopping ads”, “UGC without the hassle”, “One platform, every format.”
- In testimonials, **short, punchy quotes** + clear role (e.g. “Head of Marketing”, “Agency Owner”) and **star rating** (e.g. 4.5) to mirror Bacon’s trust block.
- Optional **social proof line**: “Trusted by X+ marketers” or “Y+ creatives generated” if you have numbers.

---

## 4. Layout and structure (what we implemented)

1. **Hero**  
   - Headline + primary CTA unchanged.  
   - **New:** A strip of 4–6 “floating” example creatives (small cards with rounded corners, optional light tilt/shadow) so the hero immediately shows “things you can create.”

2. **“What you can create”** (new section)  
   - Placed after the hero or after “Scroll-Stopping Ads”.  
   - Grid of 6–8 tiles: image + short label (e.g. “Ad Creative”, “UGC”, “Video Ad”, “Social Post”).  
   - Encourages scrolling and makes variety obvious.

3. **Testimonials**  
   - **New:** Circular avatar, name, role, star rating (e.g. 4.5), then quote.  
   - Same testimonial copy; layout matches Bacon-style trust.

4. **AI Video / Diverse Actors**  
   - **New:** A row of 6–8 circular headshots under the “Diverse AI Actors” subhead.  
   - Reinforces “real people, diverse faces” and ties to your video ad feature.

5. **Feature cards**  
   - Keep current icons and copy.  
   - Later: add a small “example output” image or screenshot on 1–2 cards (e.g. “Launch in Minutes” → tiny campaign preview; “Creative Engine” → one ad creative).

---

## 5. Where to put new images in code

- **Hero floating creatives:** `Landing.tsx` — constant `HERO_CREATIVES` (array of `{ src, alt }`). Replace with your CDN or asset paths.
- **What you can create:** constant `EXAMPLE_CREATIVES` (array of `{ src, label }`). Swap to real OTOBI outputs when ready.
- **Testimonials:** each testimonial object gets an `avatar` URL. Replace with real or final stock.
- **AI actors row:** constant `AI_ACTOR_AVATARS` (array of image URLs). Use your AI avatar outputs or curated headshots.

---

## 6. Don’t copy Bacon — differentiate

- You’re **full-stack marketing** (create + publish + CRM + analytics + 22 modules). Keep that clear in one line (e.g. “From product to viral campaign in minutes”).
- Emphasize **breadth**: “Ads, videos, UGC, emails, SEO, funnels — one platform.”
- Use **photorealistic people and example creatives** for warmth and proof, not to mimic their layout 1:1. Your structure (hero → what you create → how it works → proof → testimonials → modules) can stay; the **visual language** (people, smiles, real-looking outputs) is what we’re aligning with.

Once you have final assets, drop them into the constants above and the page will read as more fun, exciting, and inviting while still clearly selling OTOBI as the only marketing platform they need.

---

## 7. Current implementation (placeholders)

The landing page now includes:

- **Hero:** A strip of 5 “floating” example creatives (slight rotation, shadow) + line: “Create ads, UGC, and creatives that look like real people made them.”
- **“What you can create”:** A 6-tile grid with image + label (Ad creatives, Social posts, UGC style, Product ads, Video stills, Campaigns). Uses `EXAMPLE_CREATIVES`; one tile uses your existing `adGrid` image.
- **Testimonials:** Each card has a 4.5 star rating, circular profile photo (from `TESTIMONIAL_AVATARS`), name, and role.
- **AI Video section:** A row of 6 circular “AI-Generated Video Actors” headshots above the CTA, from `AI_ACTOR_AVATARS`.

Placeholder images use Unsplash (people, product, team, etc.) so the layout works out of the box. **Replace with your own CDN URLs or OTOBI-generated creatives** for production; see the constants at the top of `client/src/pages/Landing.tsx` (`HERO_CREATIVES`, `EXAMPLE_CREATIVES`, `TESTIMONIAL_AVATARS`, `AI_ACTOR_AVATARS`).
