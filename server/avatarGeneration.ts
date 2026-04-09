/**
 * AI Avatar / UGC Video Generation Helper
 * Supports: HeyGen API
 * Falls back to image generation for avatar stills
 */
import { ENV } from "./_core/env";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";

export type AvatarVideoOptions = {
  script: string;
  avatarId?: string; // HeyGen avatar ID
  voiceId?: string;
  language?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  background?: string; // color or image URL
  style?: "normal" | "closeUp" | "full" | "circle" | "voiceOnly";
};

export type AvatarVideoResult = {
  provider: string;
  videoUrl?: string;
  videoKey?: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  status: "completed" | "processing" | "failed";
  taskId?: string;
  error?: string;
  duration?: number;
};

/**
 * Generate avatar video using HeyGen API
 * Docs: https://docs.heygen.com/reference
 */
async function generateWithHeyGen(options: AvatarVideoOptions): Promise<AvatarVideoResult> {
  const response = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": ENV.heygenApiKey,
    },
    body: JSON.stringify({
      video_inputs: [{
        character: {
          type: "avatar",
          avatar_id: options.avatarId || await (async () => {
            const avatars = await listAvatars();
            return avatars[0]?.id || "Angela-inblackskirt-20220820";
          })(),
          avatar_style: options.style || "normal",
        },
        voice: {
          type: "text",
          input_text: options.script,
          voice_id: options.voiceId || await (async () => {
            const voices = await listVoices();
            // Prefer English voice matching the style's implied gender, else first available
            const preferred = voices.find(v => v.language?.startsWith("en")) ?? voices[0];
            return preferred?.id ?? "1bd001e7e50f421d891986aad5c1e1d0";
          })(),
          speed: 1.0,
          ...(options.language ? { language: options.language } : {}),
        },
        background: options.background ? {
          type: "color",
          value: options.background,
        } : {
          type: "color",
          value: "#FFFFFF",
        },
      }],
      dimension: options.aspectRatio === "9:16"
        ? { width: 1080, height: 1920 }
        : options.aspectRatio === "1:1"
        ? { width: 1080, height: 1080 }
        : { width: 1920, height: 1080 },
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    return { provider: "heygen", status: "failed", error };
  }

  const result = await response.json() as { data?: { video_id: string } };
  if (result.data?.video_id) {
    return { provider: "heygen", status: "processing", taskId: result.data.video_id };
  }
  return { provider: "heygen", status: "failed", error: "No video ID returned" };
}

/**
 * Check HeyGen video status
 */
export async function checkHeyGenStatus(videoId: string): Promise<AvatarVideoResult> {
  const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
    headers: { "X-Api-Key": ENV.heygenApiKey },
  });

  if (!response.ok) {
    return { provider: "heygen", status: "failed", error: "Failed to check status" };
  }

  const result = await response.json() as {
    data?: {
      status: string;
      video_url?: string;
      thumbnail_url?: string;
      duration?: number;
      error?: { message?: string };
    };
  };

  if (result.data?.status === "completed" && result.data.video_url) {
    // Download and store locally
    const videoResponse = await fetch(result.data.video_url);
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const { key: videoKey, url: videoUrl } = await storagePut(`avatars/${Date.now()}-heygen.mp4`, videoBuffer, "video/mp4");

    let thumbnailUrl: string | undefined;
    let thumbnailKey: string | undefined;
    if (result.data.thumbnail_url) {
      const thumbResponse = await fetch(result.data.thumbnail_url);
      const thumbBuffer = Buffer.from(await thumbResponse.arrayBuffer());
      const thumbResult = await storagePut(`avatars/${Date.now()}-thumb.jpg`, thumbBuffer, "image/jpeg");
      thumbnailUrl = thumbResult.url;
      thumbnailKey = thumbResult.key;
    }

    return {
      provider: "heygen",
      status: "completed",
      videoUrl,
      videoKey,
      thumbnailUrl,
      thumbnailKey,
      duration: result.data.duration,
    };
  }

  if (result.data?.status === "failed") {
    return { provider: "heygen", status: "failed", error: result.data.error?.message || "Generation failed" };
  }

  return { provider: "heygen", status: "processing", taskId: videoId };
}

/**
 * List available HeyGen voices
 */
export async function listVoices(): Promise<Array<{ id: string; name: string; language?: string; gender?: string; preview?: string }>> {
  if (!ENV.heygenApiKey) return [];

  try {
    const response = await fetch("https://api.heygen.com/v2/voices", {
      headers: { "X-Api-Key": ENV.heygenApiKey },
    });

    if (response.ok) {
      const data = await response.json() as {
        data?: { voices: Array<{ voice_id: string; display_name: string; language?: string; gender?: string; preview_audio?: string }> };
      };
      return (data.data?.voices || []).map(v => ({
        id: v.voice_id,
        name: v.display_name,
        language: v.language,
        gender: v.gender,
        preview: v.preview_audio,
      }));
    }
  } catch (e) { /* fall through */ }

  return [];
}

/**
 * List available HeyGen avatars
 */
export async function listAvatars(): Promise<Array<{ id: string; name: string; preview?: string; gender?: string }>> {
  if (!ENV.heygenApiKey) {
    return [
      { id: "fallback-professional-male", name: "Professional Male (AI Generated)", gender: "male" },
      { id: "fallback-professional-female", name: "Professional Female (AI Generated)", gender: "female" },
      { id: "fallback-casual-male", name: "Casual Male (AI Generated)", gender: "male" },
      { id: "fallback-casual-female", name: "Casual Female (AI Generated)", gender: "female" },
      { id: "fallback-diverse-1", name: "Diverse Presenter 1 (AI Generated)", gender: "neutral" },
      { id: "fallback-diverse-2", name: "Diverse Presenter 2 (AI Generated)", gender: "neutral" },
    ];
  }

  try {
    const response = await fetch("https://api.heygen.com/v2/avatars", {
      headers: { "X-Api-Key": ENV.heygenApiKey },
    });

    if (response.ok) {
      const data = await response.json() as {
        data?: { avatars: Array<{ avatar_id: string; avatar_name: string; preview_image_url?: string; gender?: string }> };
      };
      return (data.data?.avatars || []).map(a => ({
        id: a.avatar_id,
        name: a.avatar_name,
        preview: a.preview_image_url,
        gender: a.gender,
      }));
    }
  } catch (e) { /* fall through */ }

  return [];
}

/**
 * Fallback: Generate avatar still image using image generation
 */
async function generateFallbackAvatar(options: AvatarVideoOptions): Promise<AvatarVideoResult> {
  try {
    const prompt = `Professional ${options.style || "business"} presenter, photorealistic portrait, studio lighting, clean background, looking at camera, friendly expression, high quality headshot`;
    const result = await generateImage({ prompt });

    return {
      provider: "fallback",
      status: "completed",
      thumbnailUrl: result.url,
      videoUrl: undefined, // No video without HeyGen
    };
  } catch (e) {
    return { provider: "fallback", status: "failed", error: "Failed to generate avatar image" };
  }
}

/**
 * Main entry point: generate avatar video
 */
export async function generateAvatarVideo(options: AvatarVideoOptions): Promise<AvatarVideoResult> {
  if (ENV.heygenApiKey) {
    return generateWithHeyGen(options);
  }
  return generateFallbackAvatar(options);
}

/**
 * Get available avatar providers
 */
export function getAvatarProviders() {
  return {
    heygen: { available: !!ENV.heygenApiKey, name: "HeyGen (AI Avatars)" },
    fallback: { available: true, name: "AI Image Generation (Stills Only)" },
    activeProvider: ENV.heygenApiKey ? "heygen" : "fallback",
  };
}
