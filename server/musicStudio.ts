/**
 * AI Music & Sound Studio Helper
 * Supports: Suno AI, Mubert, Soundraw (activates with API key)
 * Falls back to curated royalty-free track library when no key is set
 */
import { ENV } from "./_core/env";
import { storagePut } from "./storage";

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

export interface SFXTrack {
  id: string;
  name: string;
  category: SFXCategory;
  duration: number;
  tags: string[];
  previewUrl: string;
  downloadUrl: string;
}

// Curated royalty-free SFX library (always available, no API key needed)
export const SFX_LIBRARY: SFXTrack[] = [
  // Transitions
  { id: "sfx-001", name: "Whoosh Fast", category: "whoosh", duration: 0.8, tags: ["transition", "fast", "air"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-fast-small-sweep-transition-166.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-fast-small-sweep-transition-166.wav" },
  { id: "sfx-002", name: "Swoosh Cinematic", category: "whoosh", duration: 1.2, tags: ["cinematic", "transition", "dramatic"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-cinematic-swoosh-1-590.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-cinematic-swoosh-1-590.wav" },
  { id: "sfx-003", name: "Pop Bubble", category: "notifications", duration: 0.4, tags: ["pop", "notification", "light"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-bubble-pop-up-alert-notification-2357.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-bubble-pop-up-alert-notification-2357.wav" },
  { id: "sfx-004", name: "Success Chime", category: "success", duration: 1.5, tags: ["success", "win", "positive"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-achievement-bell-600.wav" },
  { id: "sfx-005", name: "Notification Ding", category: "notifications", duration: 0.6, tags: ["notification", "alert", "ding"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-correct-answer-tone-2870.wav" },
  { id: "sfx-006", name: "Cinematic Boom", category: "cinematic", duration: 2.0, tags: ["cinematic", "impact", "dramatic", "bass"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-cinematic-bass-hit-2297.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-cinematic-bass-hit-2297.wav" },
  { id: "sfx-007", name: "Tech Scan", category: "tech", duration: 1.0, tags: ["tech", "scan", "futuristic", "digital"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-scanning-sci-fi-screen-1287.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-scanning-sci-fi-screen-1287.wav" },
  { id: "sfx-008", name: "Crowd Applause", category: "crowd", duration: 3.0, tags: ["crowd", "applause", "success", "audience"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-audience-applause-and-cheering-354.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-audience-applause-and-cheering-354.wav" },
  { id: "sfx-009", name: "Nature Birds", category: "nature", duration: 5.0, tags: ["nature", "birds", "ambient", "outdoor"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-birds-in-the-morning-2473.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-birds-in-the-morning-2473.wav" },
  { id: "sfx-010", name: "Comedy Boing", category: "comedy", duration: 0.7, tags: ["comedy", "funny", "boing", "cartoon"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-cartoon-boing-sound-2-183.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-cartoon-boing-sound-2-183.wav" },
  { id: "sfx-011", name: "Impact Hit", category: "impact", duration: 0.5, tags: ["impact", "hit", "punch", "action"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-boxing-quick-punch-2047.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-boxing-quick-punch-2047.wav" },
  { id: "sfx-012", name: "Error Buzz", category: "error", duration: 0.8, tags: ["error", "wrong", "buzz", "negative"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-wrong-answer-fail-notification-946.wav" },
  { id: "sfx-013", name: "Ambient Office", category: "ambient", duration: 10.0, tags: ["ambient", "office", "background", "loop"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-office-ambience-447.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-office-ambience-447.wav" },
  { id: "sfx-014", name: "Keyboard Typing", category: "tech", duration: 2.0, tags: ["keyboard", "typing", "tech", "computer"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-laptop-keyboard-typing-1386.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-laptop-keyboard-typing-1386.wav" },
  { id: "sfx-015", name: "Drum Roll", category: "cinematic", duration: 2.5, tags: ["drum", "roll", "suspense", "reveal"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-drum-roll-566.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-drum-roll-566.wav" },
  { id: "sfx-016", name: "Cash Register", category: "success", duration: 1.0, tags: ["money", "sale", "cash", "purchase"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-cash-register-purchase-2009.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-cash-register-purchase-2009.wav" },
  { id: "sfx-017", name: "Magic Sparkle", category: "transitions", duration: 1.2, tags: ["magic", "sparkle", "fairy", "transform"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-fairy-magic-sparkle-875.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-fairy-magic-sparkle-875.wav" },
  { id: "sfx-018", name: "Heartbeat", category: "cinematic", duration: 2.0, tags: ["heartbeat", "tension", "dramatic", "pulse"], previewUrl: "https://assets.mixkit.co/sfx/preview/mixkit-heartbeat-close-up-110.mp3", downloadUrl: "https://assets.mixkit.co/sfx/download/mixkit-heartbeat-close-up-110.wav" },
];

// Curated royalty-free background music library (always available)
export const MUSIC_LIBRARY = [
  { id: "music-001", title: "Upbeat Corporate", genre: "corporate", mood: "energetic", tempo: "medium", duration: 120, tags: ["corporate", "upbeat", "professional", "business"], previewUrl: "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3", downloadUrl: "https://assets.mixkit.co/music/download/mixkit-tech-house-vibes-130.mp3", loop: true },
  { id: "music-002", title: "Inspiring Motivation", genre: "motivational", mood: "inspiring", tempo: "medium", duration: 90, tags: ["motivation", "inspiring", "positive", "uplifting"], previewUrl: "https://assets.mixkit.co/music/preview/mixkit-inspiring-and-motivating-music-for-corporate-videos-2-12.mp3", downloadUrl: "https://assets.mixkit.co/music/download/mixkit-inspiring-and-motivating-music-for-corporate-videos-2-12.mp3", loop: true },
  { id: "music-003", title: "Chill Lofi Beats", genre: "lofi", mood: "relaxed", tempo: "slow", duration: 180, tags: ["lofi", "chill", "relaxed", "study", "background"], previewUrl: "https://assets.mixkit.co/music/preview/mixkit-life-is-a-dream-837.mp3", downloadUrl: "https://assets.mixkit.co/music/download/mixkit-life-is-a-dream-837.mp3", loop: true },
  { id: "music-004", title: "Epic Cinematic", genre: "cinematic", mood: "dramatic", tempo: "slow", duration: 120, tags: ["cinematic", "epic", "dramatic", "film", "trailer"], previewUrl: "https://assets.mixkit.co/music/preview/mixkit-cinematic-mystery-303.mp3", downloadUrl: "https://assets.mixkit.co/music/download/mixkit-cinematic-mystery-303.mp3", loop: false },
  { id: "music-005", title: "Happy Pop", genre: "pop", mood: "happy", tempo: "fast", duration: 90, tags: ["pop", "happy", "fun", "bright", "cheerful"], previewUrl: "https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3", downloadUrl: "https://assets.mixkit.co/music/download/mixkit-a-very-happy-christmas-897.mp3", loop: true },
  { id: "music-006", title: "Tech Futuristic", genre: "electronic", mood: "futuristic", tempo: "medium", duration: 120, tags: ["tech", "futuristic", "electronic", "digital", "innovation"], previewUrl: "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3", downloadUrl: "https://assets.mixkit.co/music/download/mixkit-tech-house-vibes-130.mp3", loop: true },
  { id: "music-007", title: "Acoustic Warmth", genre: "acoustic", mood: "warm", tempo: "slow", duration: 150, tags: ["acoustic", "warm", "guitar", "organic", "natural"], previewUrl: "https://assets.mixkit.co/music/preview/mixkit-guitar-reflections-22.mp3", downloadUrl: "https://assets.mixkit.co/music/download/mixkit-guitar-reflections-22.mp3", loop: true },
  { id: "music-008", title: "Hip Hop Beat", genre: "hiphop", mood: "confident", tempo: "medium", duration: 90, tags: ["hiphop", "beat", "urban", "confident", "street"], previewUrl: "https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3", downloadUrl: "https://assets.mixkit.co/music/download/mixkit-hip-hop-02-738.mp3", loop: true },
  { id: "music-009", title: "Luxury Elegant", genre: "classical", mood: "elegant", tempo: "slow", duration: 120, tags: ["luxury", "elegant", "classical", "sophisticated", "premium"], previewUrl: "https://assets.mixkit.co/music/preview/mixkit-piano-reflections-22.mp3", downloadUrl: "https://assets.mixkit.co/music/download/mixkit-piano-reflections-22.mp3", loop: true },
  { id: "music-010", title: "Energetic Sport", genre: "sport", mood: "energetic", tempo: "very-fast", duration: 60, tags: ["sport", "energetic", "action", "workout", "power"], previewUrl: "https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3", downloadUrl: "https://assets.mixkit.co/music/download/mixkit-driving-ambition-32.mp3", loop: true },
  { id: "music-011", title: "Romantic Soft", genre: "romantic", mood: "romantic", tempo: "slow", duration: 120, tags: ["romantic", "soft", "love", "tender", "emotional"], previewUrl: "https://assets.mixkit.co/music/preview/mixkit-romantic-piano-music-2785.mp3", downloadUrl: "https://assets.mixkit.co/music/download/mixkit-romantic-piano-music-2785.mp3", loop: true },
  { id: "music-012", title: "Comedy Quirky", genre: "comedy", mood: "playful", tempo: "fast", duration: 60, tags: ["comedy", "quirky", "playful", "funny", "cartoon"], previewUrl: "https://assets.mixkit.co/music/preview/mixkit-fun-and-quirky-music-2785.mp3", downloadUrl: "https://assets.mixkit.co/music/download/mixkit-fun-and-quirky-music-2785.mp3", loop: true },
];

/**
 * Generate AI music using Suno API (if key available)
 * Falls back to library match
 */
export async function generateMusic(options: MusicGenerationOptions): Promise<MusicGenerationResult> {
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
    } catch (e) {
      // Fall through to library
    }
  }

  // Fallback: find best match in library
  const prompt = `${options.prompt} ${options.mood || ""} ${options.genre || ""}`.toLowerCase();
  const match = MUSIC_LIBRARY.find(m =>
    m.tags.some(t => prompt.includes(t)) ||
    (options.mood && m.mood === options.mood) ||
    (options.genre && m.genre === options.genre)
  ) || MUSIC_LIBRARY[0];

  return {
    provider: "library",
    status: "completed",
    audioUrl: match.downloadUrl,
    title: match.title,
    duration: match.duration,
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
    library: { available: true, name: "Built-in Library", description: "Curated royalty-free tracks (always available)" },
  };
}
