/**
 * AI Music & Sound Studio Helper
 * Supports: Suno AI (activates with SUNO_API_KEY)
 * Falls back to user's uploaded music library in DB
 */
import { ENV } from "./_core/env";

export type MusicGenerationOptions = {
  prompt: string;
  genre?: string;
  mood?: string;
  tempo?: "slow" | "medium" | "fast" | "very-fast";
  duration?: number; // seconds, 15-120
  loop?: boolean;
  instrumental?: boolean;
};

export type MusicGenerationResult = {
  provider: string;
  audioUrl?: string;
  title?: string;
  duration?: number;
  status: "completed" | "pending" | "failed";
  taskId?: string;
  error?: string;
};

export type SFXCategory =
  | "transitions"
  | "notifications"
  | "cinematic"
  | "nature"
  | "crowd"
  | "tech"
  | "comedy"
  | "whoosh"
  | "impact"
  | "success"
  | "error"
  | "ambient";

/**
 * Generate AI music using Suno API (if key available).
 * Falls back to the user's uploaded DB library.
 */
export async function generateMusic(
  options: MusicGenerationOptions,
  userId?: number
): Promise<MusicGenerationResult> {
  // If Suno API key is available, use it
  if (ENV.sunoApiKey) {
    try {
      const response = await fetch("https://studio-api.suno.ai/api/generate/v2/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ENV.sunoApiKey}`,
        },
        body: JSON.stringify({
          prompt: `${options.mood || ""} ${options.genre || ""} ${options.prompt}`.trim(),
          make_instrumental: options.instrumental !== false,
          wait_audio: false,
        }),
      });
      if (response.ok) {
        const data = await response.json() as { clips?: Array<{ id: string; status: string; audio_url?: string; title?: string }> };
        const clip = data.clips?.[0];
        if (clip) {
          return {
            provider: "suno",
            status: clip.status === "complete" ? "completed" : "pending",
            audioUrl: clip.audio_url,
            title: clip.title || options.prompt,
            taskId: clip.id,
          };
        }
      }
    } catch (_e) {
      // Fall through to library
    }
  }

  // Fallback: query user's uploaded library
  if (userId) {
    const { getMusicTracksByUser } = await import("./db");
    const library = await getMusicTracksByUser(userId);
    if (library.length > 0) {
      const prompt = `${options.prompt} ${options.mood || ""} ${options.genre || ""}`.toLowerCase();
      const match = library.find(m =>
        (m.tags as string[] | null)?.some(t => prompt.includes(t)) ||
        (options.mood && m.mood === options.mood) ||
        (options.genre && m.genre === options.genre)
      ) ?? library[0];
      return {
        provider: "library",
        status: "completed",
        audioUrl: match.fileUrl,
        title: match.title,
        duration: match.duration ?? undefined,
      };
    }
  }

  return {
    provider: "library",
    status: "failed",
    error: "No AI music provider configured and your library is empty. Upload tracks in the Music Library tab.",
  };
}

/**
 * Get music generation providers status
 */
export function getMusicProviders() {
  return {
    suno: { available: !!ENV.sunoApiKey, name: "Suno AI", description: "AI-generated original music from text prompts" },
    mubert: { available: !!ENV.mubertApiKey, name: "Mubert", description: "Real-time AI music generation" },
    soundraw: { available: !!ENV.soundrawApiKey, name: "Soundraw", description: "Royalty-free AI music" },
    library: { available: true, name: "Your Library", description: "Your uploaded tracks (always available)" },
  };
}
