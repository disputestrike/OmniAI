# Railway Deployment Guide for OTOBI AI

## Push to Deploy

Once the repo is connected to Railway, **every push to your main branch triggers a new deploy**. Set all required variables in your **app service** → Variables (see below). Do not commit real secrets; use Railway's Variables tab.

## Prerequisites

1. A Railway account at [railway.app](https://railway.app)
2. A MySQL database (Railway provides one-click MySQL provisioning)
3. API keys for the services below

## Quick Deploy

1. Push this repo to GitHub
2. In Railway Dashboard, click "New Project" → "Deploy from GitHub Repo"
3. Select the repository
4. Railway will auto-detect the Dockerfile and build

## Required Environment Variables

Set these in Railway's Variables tab:

### Database
| Variable | Description | How to Get |
|----------|-------------|------------|
| `DATABASE_URL` or `MYSQL_URL` | MySQL connection string | The app uses either. If your MySQL service exposes `MYSQL_URL`, add it to the **app** service Variables (or reference it). Format: `mysql://user:pass@host:port/db` (private: use `mysql.railway.internal` for host when same project). |

### Authentication (Google only)
| Variable | Description | How to Get |
|----------|-------------|------------|
| `JWT_SECRET` | Random 64-char string for session signing | Generate with: `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth 2.0 Client ID (Web app) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Same as above; add redirect URI: `https://your-domain/api/auth/google/callback` |
| `OWNER_OPEN_ID` | Owner's Google-based ID (e.g. `google_123456789`) | Optional; for admin checks. Get after first login from your user record. |

### AI / LLM (Content Generation)
| Variable | Description | How to Get |
|----------|-------------|------------|
| `BUILT_IN_FORGE_API_URL` | LLM API endpoint | OpenAI-compatible API URL (e.g., `https://api.openai.com/v1`) |
| `BUILT_IN_FORGE_API_KEY` | LLM API key (server-side) | Your OpenAI/Anthropic/etc API key |
| `VITE_FRONTEND_FORGE_API_URL` | LLM API URL for frontend | Same as above or a proxy |
| `VITE_FRONTEND_FORGE_API_KEY` | LLM API key for frontend | A restricted/frontend-safe key |

### Stripe (Payments)
| Variable | Description | How to Get |
|----------|-------------|------------|
| `STRIPE_SECRET_KEY` | Stripe secret key | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Create webhook at Stripe Dashboard → Developers → Webhooks |

### Analytics (Optional)
| Variable | Description | How to Get |
|----------|-------------|------------|
| `VITE_ANALYTICS_ENDPOINT` | Analytics endpoint URL | Your analytics provider |
| `VITE_ANALYTICS_WEBSITE_ID` | Analytics website ID | Your analytics provider |

### App Config
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_TITLE` | Application title | `OTOBI AI` |
| `VITE_APP_LOGO` | Logo URL | Your logo CDN URL |
| `PORT` | Server port | Railway sets this automatically |

## Database Setup (required for app to work)

### 1. Add variables to your **OmniAI app service**

In Railway: open your **OmniAI** (app) service → **Variables** tab. Add these (create any that are missing):

| Variable | Example / where to get it |
|----------|----------------------------|
| `DATABASE_URL` or `MYSQL_URL` | From your MySQL service: use the **private** URL, e.g. `mysql://root:YOUR_PASSWORD@mysql.railway.internal:3306/railway`. The app reads either variable. In MySQL service → Variables you see `MYSQL_URL`; copy it into the **app** service as `DATABASE_URL` (or set `MYSQL_URL` on the app if your project shares it). |
| `JWT_SECRET` | **Required.** Generate: `openssl rand -hex 32`. Used to sign session cookies. |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Credentials → OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Same OAuth client → secret |
| `BUILT_IN_FORGE_API_URL` | e.g. `https://api.openai.com/v1` |
| `BUILT_IN_FORGE_API_KEY` | Your LLM API key |
| `VITE_FRONTEND_FORGE_API_URL` | Same as above (or proxy URL) |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend-safe key |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API keys |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → add endpoint → signing secret |

`PORT` is set by Railway; you can leave it out.

### 2. Tables are created automatically on deploy

**The app runs migrations at startup.** When `DATABASE_URL` or `MYSQL_URL` is set on the app service, the server applies `drizzle/apply-all-migrations.sql` before listening. Tables are created or updated automatically; no manual SQL or CLI step is required. If you need to create tables manually: Option A – In Railway MySQL → Data/Query, paste and run **`drizzle/apply-all-migrations.sql`**. Option B – From your machine: `railway link` then `railway run pnpm exec drizzle-kit push`.

**Manual options (only if automatic migration did not run):**  
**Option A – Run SQL in Railway**  
1. In Railway, open your **MySQL** service.  
2. Go to the **Data** or **Query** tab (or use “Query” / “MySQL console”).  
3. Open the file **`drizzle/apply-all-migrations.sql`** in this repo and copy its full contents.  
4. Paste into the MySQL query box and run it.  
5. All tables (users, products, contents, campaigns, and the rest) will be created.


## Stripe Webhook Setup

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-railway-domain.up.railway.app/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

## Healthcheck (fixes "replicas never became healthy")

Railway runs a healthcheck before marking the deploy live. Set it to the lightweight HTTP endpoint:

1. In Railway, go to your **OmniAI** service → **Settings**
2. Find **Healthcheck** (or **Deploy** → **Healthcheck Path**)
3. Set **Healthcheck Path** to: **`/health`**

Do **not** use `/api/trpc/auth.me` — that goes through tRPC and can fail before the app is fully ready. The `/health` route returns `200` and `{"ok":true}` as soon as the HTTP server is listening (no DB or tRPC).

## Custom Domain

1. In Railway, go to your service → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

## LLM Provider Options (Cheapest to Most Capable)

| Provider | Cost | Best For |
|----------|------|----------|
| **OpenAI GPT-4o-mini** | ~$0.15/1M input tokens | Most content generation, good quality/price ratio |
| **OpenAI GPT-4o** | ~$2.50/1M input tokens | Complex analysis, intelligence reports |
| **Anthropic Claude 3.5 Sonnet** | ~$3/1M input tokens | Long-form content, nuanced writing |
| **Groq (Llama 3)** | Free tier available | Quick drafts, high volume |
| **Together AI** | ~$0.20/1M tokens | Budget option with good models |

For the cheapest setup, use GPT-4o-mini for all content generation. The API is OpenAI-compatible, so any provider that supports the OpenAI chat completions format will work.

## Image Generation

The built-in image generation uses the platform's image service. For Railway, you'll need to:
1. Set up your own image generation API (DALL-E, Stability AI, etc.)
2. Or modify `server/_core/imageGeneration.ts` to use your preferred provider

## Testing

Use Stripe test card: `4242 4242 4242 4242` (any future expiry, any CVC)
