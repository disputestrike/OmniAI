/**
 * AI Voiceover Generation Helper
 * Supports: ElevenLabs, OpenAI TTS
 * Falls back to browser-side Web Speech API if no API key is set
 */
import { ENV } from "./_core/env";
import { storagePut } from "./storage";

export type VoiceoverOptions = {
  text: string;
  voice?: string; // voice ID or name
  language?: string;
  speed?: number; // 0.5 to 2.0
  provider?: "elevenlabs" | "openai" | "auto";
};

export type VoiceoverResult = {
  provider: string;
  audioUrl?: string;
  duration?: number;
  status: "completed" | "failed";
  error?: string;
  availableVoices?: Array<{ id: string; name: string; preview?: string }>;
};

function getVoiceProvider(): "elevenlabs" | "openai" | "none" {
  if (ENV.elevenLabsApiKey) return "elevenlabs";
  if (ENV.openaiApiKey) return "openai";
  return "none";
}

/**
 * Generate voiceover using ElevenLabs API
 * Docs: https://elevenlabs.io/docs/api-reference
 */
const OPENAI_VOICES = new Set(["alloy", "echo", "fable", "onyx", "nova", "shimmer", "ash", "sage", "coral"]);

// ElevenLabs voice ID map for semantic names
const ELEVENLABS_VOICE_MAP: Record<string, string> = {
  female: "21m00Tcm4TlvDq8ikWAM", // Rachel
  male: "pNInz6obpgDQGcFmaJgB",   // Adam
};

// OpenAI voice map for semantic names
const OPENAI_VOICE_MAP: Record<string, string> = {
  female: "nova",
  male: "onyx",
};

// ElevenLabs voice ID → nearest OpenAI equivalent (by gender/style)
const ELEVENLABS_TO_OPENAI: Record<string, string> = {
  "pNInz6obpgDQGcFmaJgB": "onyx",   // Adam — deep narrator
  "TxGEqnHWrfWFTfGW9XjX": "echo",   // Josh — casual/conversational
  "VR6AewLTigWG4xSOukaG": "onyx",   // Arnold — confident
  "yoZ06aMxZJJ28mfd3POQ": "ash",    // Sam — friendly/warm
  "2EiwWnXFnvU5JabPnv8n": "fable",  // Clyde — character/dramatic
  "D38z5RcWu1voky8WS1ja": "fable",  // Fin — Irish storytelling
  "N2lVS1w4EtoT3dr4eOWO": "onyx",   // Callum — intense/cinematic
  "onwK4e9ZLuTAKqWW03F9": "fable",  // Daniel — British news
  "21m00Tcm4TlvDq8ikWAM": "nova",   // Rachel — calm/professional
  "AZnzlk1XvdvUeBnXmlld": "coral",  // Domi — strong/confident
  "EXAVITQu4vr4xnSDxMaL": "shimmer",// Bella — soft/warm
  "MF3mGyEYCl7XYWbV9V6O": "shimmer",// Elli — emotional/expressive
  "oWAxZDx7w5VEj9dCyTzz": "shimmer",// Grace — gentle/warm
  "XB0fDUnXU5powFXDhCwa": "sage",   // Charlotte — sophisticated
  "ThT5KcBeYPX3keUQqHPh": "fable",  // Dorothy — British pleasant
  "pMsXgVXv3BLzUgSXRplE": "nova",   // Serena — versatile
};

async function generateWithElevenLabs(options: VoiceoverOptions): Promise<VoiceoverResult> {
  const isOpenAIVoice = options.voice && OPENAI_VOICES.has(options.voice);
  const isSemantic = options.voice && ELEVENLABS_VOICE_MAP[options.voice];
  const voiceId = isSemantic
    ? ELEVENLABS_VOICE_MAP[options.voice!]
    : (!options.voice || isOpenAIVoice)
      ? "21m00Tcm4TlvDq8ikWAM"
      : options.voice;

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": ENV.elevenLabsApiKey,
    },
    body: JSON.stringify({
      text: options.text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    return { provider: "elevenlabs", status: "failed", error };
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const { url } = await storagePut(`voiceovers/${Date.now()}-elevenlabs.mp3`, audioBuffer, "audio/mpeg");

  return { provider: "elevenlabs", status: "completed", audioUrl: url };
}

/**
 * Generate voiceover using OpenAI TTS API
 * Docs: https://platform.openai.com/docs/guides/text-to-speech
 */
async function generateWithOpenAI(options: VoiceoverOptions): Promise<VoiceoverResult> {
  // Map semantic names, ElevenLabs IDs, or invalid values to valid OpenAI voices
  const rawVoice = options.voice || "nova";
  const voice = OPENAI_VOICE_MAP[rawVoice]
    ?? ELEVENLABS_TO_OPENAI[rawVoice]
    ?? (OPENAI_VOICES.has(rawVoice) ? rawVoice : "nova");

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ENV.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "tts-1-hd",
      input: options.text,
      voice,
      speed: options.speed || 1.0,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    return { provider: "openai", status: "failed", error };
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const { url } = await storagePut(`voiceovers/${Date.now()}-openai.mp3`, audioBuffer, "audio/mpeg");

  return { provider: "openai", status: "completed", audioUrl: url };
}

/**
 * List available voices for the active provider
 */
export async function listVoices(): Promise<VoiceoverResult> {
  const provider = getVoiceProvider();

  if (provider === "elevenlabs") {
    try {
      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": ENV.elevenLabsApiKey },
      });
      if (response.ok) {
        const data = await response.json() as { voices: Array<{ voice_id: string; name: string; preview_url?: string }> };
        return {
          provider: "elevenlabs",
          status: "completed",
          availableVoices: data.voices.map(v => ({ id: v.voice_id, name: v.name, preview: v.preview_url })),
        };
      }
    } catch (e) { /* fall through */ }
  }

  if (provider === "openai") {
    return {
      provider: "openai",
      status: "completed",
      availableVoices: [
        { id: "nova", name: "Nova (Female)" },
        { id: "shimmer", name: "Shimmer (Warm Female)" },
        { id: "coral", name: "Coral (Female)" },
        { id: "sage", name: "Sage (Female)" },
        { id: "alloy", name: "Alloy (Neutral)" },
        { id: "echo", name: "Echo (Male)" },
        { id: "fable", name: "Fable (British)" },
        { id: "onyx", name: "Onyx (Deep Male)" },
        { id: "ash", name: "Ash (Male)" },
      ],
    };
  }

  return {
    provider: "none",
    status: "completed",
    availableVoices: [{ id: "browser", name: "Browser Speech (No API key needed)" }],
  };
}

/**
 * Main entry point: generate voiceover using the best available provider
 */
export async function generateVoiceover(options: VoiceoverOptions): Promise<VoiceoverResult> {
  const requestedProvider = options.provider || "auto";
  const provider = requestedProvider === "auto" ? getVoiceProvider() : requestedProvider;

  switch (provider) {
    case "elevenlabs":
      if (!ENV.elevenLabsApiKey) return { provider: "elevenlabs", status: "failed", error: "ElevenLabs API key not configured" };
      return generateWithElevenLabs(options);
    case "openai":
      if (!ENV.openaiApiKey) return { provider: "openai", status: "failed", error: "OpenAI API key not configured" };
      return generateWithOpenAI(options);
    default:
      return {
        provider: "none",
        status: "failed",
        error: "No voiceover API key configured. Add ELEVENLABS_API_KEY or OPENAI_API_KEY in Settings > Secrets. Browser-side speech synthesis is available as fallback.",
      };
  }
}

/**
 * Get available voiceover providers and their status
 */
export function getVoiceoverProviders() {
  return {
    elevenlabs: { available: !!ENV.elevenLabsApiKey, name: "ElevenLabs (Premium Voices)" },
    openai: { available: !!ENV.openaiApiKey, name: "OpenAI TTS (6 Voices)" },
    browser: { available: true, name: "Browser Speech Synthesis (Free, No Key)" },
    activeProvider: getVoiceProvider(),
  };
}
