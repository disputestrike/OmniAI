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
| `DATABASE_URL` | MySQL connection string | Railway auto-provisions if you add a MySQL service. Format: `mysql://user:pass@host:port/db?ssl={"rejectUnauthorized":true}` |

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

## Database Setup

1. If MySQL is already in your project: in your **app service** → Variables, add:
   - `DATABASE_URL` = `mysql://root:YOUR_MYSQL_ROOT_PASSWORD@mysql.railway.internal:3306/railway`
   - Use the same password as your MySQL service; database name is usually `railway`.
2. If you add MySQL via Railway: link it to the app so Railway can inject `DATABASE_URL` or `MYSQL_URL`. If the app expects `DATABASE_URL` and Railway only provides `MYSQL_URL`, add a variable `DATABASE_URL` and set it to the value of `MYSQL_URL` (private URL with `mysql.railway.internal`).
3. **Run migrations once**: from your machine with the public MySQL URL, or from Railway CLI: `railway run pnpm exec drizzle-kit push`. Or run the SQL in `drizzle/0008_next_banshee.sql` (and any earlier migrations) in your MySQL client.

## Stripe Webhook Setup

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-railway-domain.up.railway.app/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

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
