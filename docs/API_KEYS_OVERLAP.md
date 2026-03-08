# API Keys — Overlaps & Minimum Set

This doc clarifies which keys do the **same job** (you can pick one) vs **different jobs** (you may want several). It also calls out keys that are **not yet used** in the code.

---

## 1. Overlapping (pick one per row)

| Capability | APIs | How it works today | Recommendation |
|------------|------|--------------------|-----------------|
| **AI video (text/image → video)** | Runway, Luma, Kling | First key found wins: Runway → Luma → Kling | **One is enough.** Add **RUNWAY_API_KEY** (or Luma/Kling if you prefer). The rest are optional fallbacks. |
| **Voiceover (text → speech)** | ElevenLabs, OpenAI | First key found wins: ElevenLabs → OpenAI | **One is enough.** Add **ELEVENLABS_API_KEY** (best quality) or **OPENAI_API_KEY** (you may already have it). |

So for “AI video” you don’t need all three (Runway + Luma + Kling). For “voiceover” you don’t need both ElevenLabs and OpenAI. Pick the one you prefer in each row.

---

## 2. Not overlapping (different jobs)

| API | Job | Overlaps with? |
|-----|-----|----------------|
| **HeyGen** | AI **avatar** video (talking head, person reads script) | **No.** Runway/Luma/Kling do **generative scene video**, not avatar. You need HeyGen for avatar UGC; Runway/Luma/Kling for “AI-generated clip” video. |
| **Forge** (BUILT_IN_FORGE_*) | LLM + image generation (content, chat, creatives) | **No.** This is the main AI backend. Not replaceable by OpenAI key for that flow. |
| **OpenAI** | Used **only for voiceover (TTS)** in this app, not for LLM | See “Voiceover” above — overlaps with ElevenLabs. |

So: **HeyGen ≠ Runway.** One is avatars, one is generative video. Both are optional; add one or both depending on whether you want avatar videos and/or AI scene videos.

---

## 3. Music: three keys, only one used in code

| API | Used in generation? | Note |
|-----|----------------------|------|
| **Suno** | **Yes** — `generateMusic()` calls Suno when `SUNO_API_KEY` is set | **Only music key you need** for AI music. |
| **Mubert** | **No** — only listed in “providers” UI | No API calls. Key not required unless we add Mubert later. |
| **Soundraw** | **No** — only listed in “providers” UI | No API calls. Key not required unless we add Soundraw later. |

**Recommendation:** For music, get **SUNO_API_KEY** only. Skip Mubert and Soundraw unless we implement them.

---

## 4. Minimum set (fewest keys for full experience)

| Purpose | Minimum key(s) |
|---------|-----------------|
| App + DB | `DATABASE_URL` or `MYSQL_URL`, `JWT_SECRET` |
| LLM + images + storage | `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` |
| AI video (generative) | **One of:** `RUNWAY_API_KEY` **or** `LUMA_API_KEY` **or** `KLING_API_KEY` |
| Voiceover (TTS) | **One of:** `ELEVENLABS_API_KEY` **or** `OPENAI_API_KEY` |
| AI avatars (talking head) | `HEYGEN_API_KEY` (optional; only if you want avatar videos) |
| AI music | `SUNO_API_KEY` (optional; Mubert/Soundraw not implemented) |
| Social publishing | Per platform: Meta, Twitter, LinkedIn, TikTok (each optional) |
| Payments | Stripe keys (optional) |
| Google Sign-In | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional) |

---

## 5. Summary

- **Overlapping:** Video (Runway/Luma/Kling) — pick one. Voice (ElevenLabs/OpenAI) — pick one.
- **Not overlapping:** HeyGen vs Runway (avatars vs generative video). Forge is separate (LLM/images).
- **Music:** Only Suno is used; Mubert and Soundraw are UI-only, no backend yet. One key (Suno) is enough.

You can safely get **one video key**, **one voice key**, and **one music key (Suno)** and skip the rest in each category unless you want fallbacks or future features.
