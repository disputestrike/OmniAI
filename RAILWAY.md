# Railway Deployment — OmniAI

## Healthcheck

- **Use path:** `/health` (not `/api/trpc/auth.me`).
- `/health` returns `200` as soon as the server is up (no DB or auth).
- This avoids deploy failures while the app or DB is still starting.

In Railway: **Settings → Healthcheck Path** → set to `/health`.

---

## Environment Variables (OmniAI service)

Add these in **Railway → OmniAI service → Variables**.

### Required for app to start and DB tables to be created

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `DATABASE_URL` or `MYSQL_URL` | MySQL connection URL for the app | From your **MySQL** service (see below) |
| `JWT_SECRET` | Secret for signing session cookies (any long random string) | Generate one, e.g. `openssl rand -base64 32` |

### Required for AI (Content Studio, AI Agent, product analysis, campaign wizard)

| Variable | Purpose |
|----------|--------|
| `ANTHROPIC_API_KEY` | Claude Haiku — **required** for all text AI. We do not use OpenAI/Forge. |

### Optional (features work without these; add as needed)

| Variable | Purpose |
|----------|--------|
| `UPLOAD_DIR` | Dir for file uploads (default `./uploads`). On Railway, ephemeral unless you add a volume. |
| `PUBLIC_BASE_URL` | Full app URL (e.g. `https://yourapp.railway.app`) so attachment links work. |
| `BUILT_IN_FORGE_API_KEY`, `BUILT_IN_FORGE_API_URL` | Only for **image generation** if you have an image service. |
| `VITE_APP_ID`, `OAUTH_SERVER_URL` | Manus OAuth (primary login) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Sign-In (see **Google OAuth redirect URIs** below) |

### Google OAuth — redirect URIs to add in Google Cloud Console

In **Google Cloud Console** → your project → **APIs & Services** → **Credentials** → open your **OAuth 2.0 Client ID** (Web application) → **Authorized redirect URIs**, add **exactly**:

| Environment | Redirect URI |
|-------------|--------------|
| **Production (Railway)** | `https://omniai-production-778d.up.railway.app/api/auth/google/callback` |
| **Local dev** | `http://localhost:5000/api/auth/google/callback` |

- Use **HTTPS** for Railway (the app uses `X-Forwarded-Proto` so the callback URL is built with `https` when behind the proxy).
- If your Railway app has a **custom domain**, add: `https://<your-domain>/api/auth/google/callback`.
- No trailing slash. Path is exactly: `/api/auth/google/callback`.
- **If redirect still fails:** set **`PUBLIC_URL`** (or **`BASE_URL`**) on Railway to your full app URL, e.g. `https://omniai-production-778d.up.railway.app`. The app will use it to build the callback URL.
- In the same OAuth client, under **Authorized JavaScript origins**, add: `https://omniai-production-778d.up.railway.app` and (for local) `http://localhost:5000`.
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY` | Billing |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend AI usage (if split from backend key) |

### Linking MySQL (Railway MySQL service)

If you added a **MySQL** plugin/service, Railway often exposes:

- `MYSQL_URL` or `MYSQL_PUBLIC_URL` (or similar) on the MySQL service.

**Option A — Reference from OmniAI service**

In the **OmniAI** service variables, add:

- `DATABASE_URL` = copy the value of `MYSQL_PUBLIC_URL` (or `MYSQL_URL`) from the **MySQL** service.

**Option B — Railway “variable reference”**

If your plan supports it, you can reference the MySQL service URL, e.g.:

- `DATABASE_URL` = `${{MySQL.MYSQL_PUBLIC_URL}}` (replace `MySQL` with your MySQL service name if different).

The app reads **either** `DATABASE_URL` or `MYSQL_URL` (or `MYSQL_PUBLIC_URL`). Set one of them so the app can connect. **Google sign-in creates users in the `users` table** — if the database is not connected or the `users` table is missing, sign-in will fail (you’ll be redirected to the dashboard with an error). Check deploy logs for `[Google OAuth]` and `[Database]` to debug.

---

## Tables (automatic)

- Tables are **created automatically** when OmniAI starts **and** has `DATABASE_URL` (or `MYSQL_URL`) set on the OmniAI service.
- On startup the app runs **migrations** from `drizzle/apply-all-migrations.sql` (using `DATABASE_URL` / `MYSQL_URL`).
- No manual SQL or “trigger” is required; **No tables?** Set `DATABASE_URL` on **OmniAI** to the MySQL URL (from MySQL service Variables), redeploy, and check deploy logs for `[migrate]`. Or run `drizzle/apply-all-migrations.sql` in MySQL Data/Query. Otherwise ensure the app has the correct `DATABASE_URL`/`MYSQL_URL` and can reach MySQL.

---

## Build and start

- **Build:** `pnpm build` (Vite builds the client to `dist/public`, then the server is bundled to `dist/index.js`).
- **Start:** `node dist/index.js` (with `NODE_ENV=production` set in the Dockerfile).
- The production server **does not** use or import `vite`; only the dev server does.

---

## Checklist

1. **OmniAI service** has at least `DATABASE_URL` (or `MYSQL_URL`) and `JWT_SECRET`.
2. **Healthcheck path** is set to `/health`.
3. **MySQL service** is running and its URL is set as `DATABASE_URL` (or `MYSQL_URL`) on OmniAI.
4. After the first successful deploy, check the MySQL database; tables should appear once migrations have run.
