# OTOBI AI — Testing & Click-Through Guide

## Automated tests

Run the full suite (no DB required for most tests):

```bash
pnpm test
```

- **429 tests** across 15 files (7 gap integration tests skip unless `RUN_DB_INTEGRATION=1`).
- **Full-stack smoke** (`server/fullStackSmoke.test.ts`): all routers wired, public procedures callable, protected procedures require auth.
- **Router/integration**: core routers, gap features, new features, security, platform intel, etc.

To run DB-backed integration tests (e.g. brandVoice.list, emailMarketing.listLists) set:

```bash
RUN_DB_INTEGRATION=1 pnpm test
```

(Requires `DATABASE_URL` and a reachable database.)

---

## Video & camera permissions

- **Video Studio** (`/video-studio`) and **AI Agents voice** use the browser’s camera/microphone.
- They only work in a **secure context**: **HTTPS** or **localhost**. Over plain HTTP you’ll see a clear error.
- If the user denies permission, the app shows a specific message (e.g. “Permission denied. Please allow camera and microphone when your browser prompts you…”).
- **Click-through**: Open Video Studio → click “Start Camera” → allow when prompted. Same for AI Agents → mic button for voice input.

---

## Manual click-through checklist

Use this to sanity-check routes and key flows (logged in as a user).

| Area | Route | What to check |
|------|--------|----------------|
| Landing | `/` | Hero, CTAs, footer links (About, Terms, Privacy, Contact). |
| Dashboard | `/dashboard` | Stats, quick actions, guided paths. |
| Content | `/content` | Generate content, list, edit. |
| Content Repurposer | `/content-repurposer` | Paste transcript or upload audio/video → generate all formats. |
| Creatives | `/creatives` | Generate image, list. |
| Video Ads | `/video-ads` | List, generate script, actors. |
| Video Studio | `/video-studio` | Start camera (HTTPS/localhost), record, save. |
| AI Agents | `/ai-agents` | Send message, use mic (HTTPS/localhost). |
| Campaigns | `/campaigns` | List, create. |
| Scheduler | `/scheduler` | List scheduled posts. |
| Leads / Deals | `/leads`, `/deals` | List, create. |
| Analytics | `/analytics` | Summary and list. |
| Ad Performance | `/ad-performance` | List reports. |
| One-Push Publisher | `/one-push-publisher` | List queue. |
| Repurposing | `/content-repurposer` | List projects, generate formats. |
| Settings / Pricing | `/pricing` | Plans, upgrade CTA. |
| Admin | `/admin` | Only for admin role. |

---

## Type check

```bash
pnpm run check
```

Runs `tsc --noEmit` to ensure the project compiles with no type errors.
