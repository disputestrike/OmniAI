# Google Auth & Dashboard — Current Situation & Options

## What’s supposed to happen

1. User clicks **“Continue with Google”** on `/login` → browser goes to **Google**.
2. User signs in with Google → Google redirects to **your app**:  
   `https://<your-app>/api/auth/google/callback?code=...&state=...`
3. Your server:
   - Exchanges `code` for tokens with Google
   - Fetches user info (email, name)
   - Tries to **upsert user** in DB (optional; if DB fails, it still continues)
   - Builds a **JWT**, sets a **session cookie** (`app_session_id`), and returns **200 + HTML** that does a **meta-refresh** to `https://<your-app>/dashboard`
4. Browser loads that HTML (cookie is stored), then follows the refresh to **`/dashboard`**.
5. Dashboard page loads; the app calls **`auth.me`** (tRPC) **with the cookie**.
6. Server **verifies the JWT** and either finds the user in the DB or **lazy-creates** them from the JWT. If that succeeds, **`auth.me`** returns the user and the **dashboard UI** is shown. If it fails, the app shows the **“Sign in to get started”** screen.

So “I can’t see the dashboard” usually means: you *do* land on `/dashboard`, but **`auth.me`** returns no user, so the app shows the sign-in card instead of the real dashboard.

---

## Where it can break (and what to check)

| # | Failure point | What you see | What to check / do |
|---|----------------|--------------|---------------------|
| 1 | **Google redirect / token** | Google error page or `?error=google_token_failed` on dashboard | **Google Cloud Console**: Authorized redirect URI is **exactly** `https://<your-railway-url>/api/auth/google/callback` (HTTPS, no trailing slash). **Railway**: Set **`PUBLIC_URL`** = `https://<your-railway-url>` so the app uses the same URL. |
| 2 | **Cookie not sent to your app** | Dashboard loads but shows “Sign in to get started” (no user) | Cookie must be set for the **same host** the browser uses. **Railway**: Set **`PUBLIC_URL`** so the cookie is set for that host. Ensure **no ad-blockers / “strict” cookie settings** are stripping the cookie. Try in an **incognito window** with a clean profile. |
| 3 | **JWT verification fails** | Same as above | **Railway → OmniAI service**: Set **`JWT_SECRET`** (same value across restarts). If it’s missing or changes, existing cookies become invalid. |
| 4 | **Database not available** | Same as above | **Railway**: On the **OmniAI** service set **`DATABASE_URL`** (or **`MYSQL_URL`**) to the MySQL connection string from the MySQL service. Without DB, **lazy user creation** on first dashboard load fails, so `auth.me` returns null. Check deploy logs for **`[Auth] Failed to sync user from session`** or **`[Database]`** errors. |
| 5 | **Wrong /dashboard URL** | You end up on another site or wrong path | **`PUBLIC_URL`** (or **`BASE_URL`**) must be the **full public URL** of the app (e.g. `https://omniai-production-778d.up.railway.app`). The app uses it to build the redirect to `/dashboard`. |

---

## What we’ve already done in code

- **Redirect URI**: Built from **`PUBLIC_URL`** or **`BASE_URL`**, then fallback to **`X-Forwarded-Proto`** + **`Host`**, with **HTTPS** forced for `*.railway.app`.
- **Token exchange**: Uses the **same** redirect URI as the one sent to Google.
- **Post-login redirect**: After setting the cookie we send **200 + HTML** with **meta-refresh** to **`/dashboard`** so the browser commits the cookie before navigating.
- **Dashboard retry**: If the dashboard loads with **no user**, the app does **one reload** so a delayed cookie can be sent.
- **Lazy user creation**: If the user is not in the DB yet, we create them from the JWT on first **`auth.me`** (so DB can be temporarily down at callback time and still work later).

---

## What you must do (checklist)

1. **Railway → OmniAI service → Variables**
   - **`PUBLIC_URL`** = `https://<your-app>.up.railway.app` (your real app URL, no trailing slash).
   - **`JWT_SECRET`** = a long random string (e.g. `openssl rand -base64 32`); **must be set** and **unchanging**.
   - **`DATABASE_URL`** (or **`MYSQL_URL`**) = MySQL connection string from the MySQL service (so user can be created/synced).
   - **`GOOGLE_CLIENT_ID`** and **`GOOGLE_CLIENT_SECRET`** = from Google Cloud Console.

2. **Google Cloud Console → Credentials → OAuth 2.0 Client**
   - **Authorized redirect URIs**: add **exactly**  
     `https://<your-app>.up.railway.app/api/auth/google/callback`
   - **Authorized JavaScript origins**: add  
     `https://<your-app>.up.railway.app`

3. **Deploy** after changing variables, then try again in a **clean/incognito** window.

4. **If it still fails**: In Railway **Deploy logs** look for:
   - **`[Google OAuth]`** — callback, token, user info, “Session set, redirecting”.
   - **`[Auth] Failed to sync user from session`** — DB or lazy-sync problem.
   - **`[Database]`** — connection / query errors.

---

## Options if it still doesn’t work

- **Temporary debug**: Add a **server-only** debug route (e.g. behind a secret or only in staging) that returns: whether cookie was received, whether JWT verified, and whether DB is reachable (no user data). Use it to see exactly where the chain breaks.
- **Cookie domain**: We can set the cookie’s **domain** from **`PUBLIC_URL`** when it’s set, so the cookie is explicitly for your public host even if the request’s `Host` header differs behind the proxy.
- **Logging**: Add more logs around cookie setting (e.g. host used) and **`auth.me`** (cookie present? JWT ok? user found/created?) so Railway logs show the exact failure step.

If you tell me which of the above you want (debug route, cookie domain fix, or extra logging), I can outline the exact code changes.
