# OTOBI AI — Complete API Keys & Environment Variables

**Nothing is “not implemented.”** Every feature below is **built and wired** in the codebase. Missing keys only mean that feature stays inactive or falls back to a built-in option (e.g. LLM/Whisper use Forge; voice/video show “not connected” until you add keys). This list is the single source of truth for what you need to provide.

---

## Required to run the app (must have)

| Variable | Purpose | Where to get it |
|----------|---------|------------------|
| `DATABASE_URL` | MySQL/TiDB connection (Railway, PlanetScale, etc.) | Your DB provider → connection string |
| `JWT_SECRET` | Signing session cookies (auth) | e.g. `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth (only login method) | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth server-side | Same as above |

Without these, the app won’t run or users can’t log in.

---

## Required for AI (content, images, transcription)

If you don’t set these, most AI features won’t work. The code expects a single “Forge”-style API (OpenAI-compatible).

| Variable | Purpose | Where to get it |
|----------|---------|------------------|
| `BUILT_IN_FORGE_API_URL` | Base URL for LLM + Whisper + storage (e.g. OpenAI API) | Your LLM provider (OpenAI, Azure OpenAI, etc.) |
| `BUILT_IN_FORGE_API_KEY` | API key for that endpoint | Same provider |
| `VITE_FRONTEND_FORGE_API_URL` | (Optional) Frontend LLM URL if you expose it to client | Same |
| `VITE_FRONTEND_FORGE_API_KEY` | (Optional) Frontend LLM key | Same |

Used for: all 22 content types, Content Repurposer, image generation, voice transcription (Whisper), storage proxy, notifications. **Implementations are in the code;** they just need this one endpoint + key.

---

## Required for payments (Stripe)

| Variable | Purpose | Where to get it |
|----------|---------|------------------|
| `STRIPE_SECRET_KEY` | Server-side Stripe (create checkout, webhooks) | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Verify webhook signatures | Stripe → Webhooks → Add endpoint → signing secret |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe (checkout UI) | Same dashboard (publishable key) |

Without these, billing and upgrades won’t work. Test keys (`sk_test_`, `pk_test_`) are fine for development.

---

## Optional: admin

| Variable | Purpose | Where to get it |
|----------|---------|------------------|
| `OWNER_OPEN_ID` | First user to get admin role (e.g. `google_123456789`) | After first Google login, copy from DB or logs |
| `PORT` | Server port (default 3000) | Railway sets automatically |

---

## Optional: social publishing (API-ready — code is done, needs your keys)

**Status:** Implemented in `server/socialPosting.ts` and related routes. OAuth flows and “post to X” logic exist. When these env vars are set, the UI shows the platform as “connectable” and users can connect and post.

| Variable | Purpose | Where to get it |
|----------|---------|------------------|
| `META_APP_ID` | Facebook/Instagram OAuth & posting | [Meta for Developers](https://developers.facebook.com/apps/) → App ID |
| `META_APP_SECRET` | Server-side Meta API calls | Same app → Settings → Basic |
| `TWITTER_API_KEY` | Twitter/X OAuth (Client ID) | [Twitter Developer Portal](https://developer.twitter.com/) |
| `TWITTER_API_SECRET` | Twitter/X API secret | Same portal |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth | [LinkedIn Developers](https://www.linkedin.com/developers/apps) |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn server-side | Same app |
| `TIKTOK_CLIENT_KEY` | TikTok OAuth (Client Key) | [TikTok for Developers](https://developers.tiktok.com/) |
| `TIKTOK_CLIENT_SECRET` | TikTok server-side | Same app |

Note: Meta and TikTok often require app review (e.g. 2–4 weeks) before production posting. The **implementation is done**; approval is a platform policy step.

---

## Optional: video generation (API-ready — code is done)

**Status:** Implemented in `server/videoGeneration.ts`. When a key is set, that provider is used for AI video generation; otherwise the feature shows as “not connected.”

| Variable | Purpose | Where to get it |
|----------|---------|------------------|
| `RUNWAY_API_KEY` | Runway ML (Gen-3 Alpha) video generation | [Runway](https://app.runwayml.com/settings/api-keys) |
| `LUMA_API_KEY` | Luma Dream Machine video generation | [Luma AI](https://lumalabs.ai/api) |
| `KLING_API_KEY` | Kling AI video generation | [Kling](https://klingai.com/developer) |

At least one unlocks “real” AI video; multiple give fallback options.

---

## Optional: voice / voiceover (API-ready — code is done)

**Status:** Implemented in `server/voiceover.ts`. When a key is set, that provider is used for TTS; otherwise voiceover shows as “not connected.”

| Variable | Purpose | Where to get it |
|----------|---------|------------------|
| `ELEVENLABS_API_KEY` | ElevenLabs TTS (many voices, 29 languages) | [ElevenLabs](https://elevenlabs.io/api) |
| `OPENAI_API_KEY` | OpenAI TTS (6 voices, cheaper) | [OpenAI API Keys](https://platform.openai.com/api-keys) |

---

## Optional: AI avatars (API-ready — code is done)

**Status:** Implemented in `server/avatarGeneration.ts`. When the key is set, HeyGen is used for avatar video; otherwise the feature shows as “not connected.”

| Variable | Purpose | Where to get it |
|----------|---------|------------------|
| `HEYGEN_API_KEY` | HeyGen AI avatars / UGC-style video | [HeyGen](https://app.heygen.com/settings/api) |

---

## Optional: e-commerce (API-ready — code is done)

**Status:** Implemented in `server/ecommerceSync.ts`. When keys are set, Shopify connect and product sync work.

| Variable | Purpose | Where to get it |
|----------|---------|------------------|
| `SHOPIFY_API_KEY` | Shopify OAuth (Client ID) | [Shopify Partners](https://partners.shopify.com/) → Create app → Client ID |
| `SHOPIFY_API_SECRET` | Shopify server-side | Same app → Client secret |

---

## Optional: music studio (API-ready — code is done)

**Status:** Implemented in `server/musicStudio.ts`. When keys are set, AI music generation uses those providers; otherwise built-in library is used.

| Variable | Purpose | Where to get it |
|----------|---------|------------------|
| `SUNO_API_KEY` | Suno AI music generation | Suno API / partner access |
| `MUBERT_API_KEY` | Mubert AI music | [Mubert](https://mubert.com/render) |
| `SOUNDRAW_API_KEY` | Soundraw AI music | [Soundraw](https://soundraw.io/) |

---

## Not env vars: user-provided tokens (already implemented)

These are **per-user** and stored in your DB; no platform-wide API key in `.env`:

- **Medium** — User connects with their Medium integration token in the app (Content Repurposer / Publishing).
- **WordPress** — User connects with their site URL + application password (or base64 token).
- **Substack** — No full API; we guide “copy from repurposer and paste in Substack.”

So “native publishing” is implemented; only user tokens are needed in the UI.

---

## Summary: one checklist

**Must have (app + auth + core AI):**

- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`

**Must have for paid plans:**

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_PUBLISHABLE_KEY`

**Optional (feature turns on when set):**

- Social: `META_APP_ID`, `META_APP_SECRET`, `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
- Video: `RUNWAY_API_KEY`, `LUMA_API_KEY`, `KLING_API_KEY`
- Voice: `ELEVENLABS_API_KEY`, `OPENAI_API_KEY`
- Avatars: `HEYGEN_API_KEY`
- E‑commerce: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`
- Music: `SUNO_API_KEY`, `MUBERT_API_KEY`, `SOUNDRAW_API_KEY`
- Admin: `OWNER_OPEN_ID`

**Nothing in this list is “not implemented.”** If something doesn’t work, it’s either a missing/incorrect key or a configuration step (e.g. OAuth redirect URLs, Stripe webhook URL). When you’re ready to revisit pricing, we can tie specific keys to specific plans (e.g. “Pro includes Runway” or “Social publishing add-on”).
