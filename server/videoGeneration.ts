/**
 * Video Generation API Helper
 * Supports multiple providers: Runway ML, Luma AI, Kling AI
 * Falls back gracefully — generates video from image generation if no video API key is set
 */
import fs from "fs/promises";
import path from "path";
import { ENV } from "./_core/env";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";

export type VideoGenerationOptions = {
  prompt: string;
  duration?: number; // seconds (5, 10, 15)
  aspectRatio?: "16:9" | "9:16" | "1:1";
  style?: "cinematic" | "realistic" | "animated" | "commercial";
  imageUrl?: string; // optional reference image for image-to-video
};

export type VideoGenerationResult = {
  provider: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: "completed" | "processing" | "failed";
  taskId?: string;
  frames?: string[]; // fallback: array of generated frame URLs
  error?: string;
};

/**
 * Determine which video provider is available
 */
function getAvailableProvider(): "runway" | "luma" | "kling" | "fallback" {
  if (ENV.runwayApiKey) return "runway";
  if (ENV.lumaApiKey) return "luma";
  if (ENV.klingApiKey) return "kling";
  return "fallback";
}

/**
 * Generate video using Runway ML API (Gen-3 Alpha)
 * Docs: https://docs.runwayml.com/
 */
/** Convert any image URL/path to a data URI acceptable by Runway (https:// or data:image/...) */
async function toRunwayImage(imageUrl: string): Promise<string> {
  // Already a valid https:// URL — use directly
  if (imageUrl.startsWith("https://")) return imageUrl;

  // Local /api/uploads/... path — read from disk and base64 encode
  if (imageUrl.startsWith("/api/uploads/")) {
    const uploadDir = ENV.uploadDir || "./uploads";
    const relKey = imageUrl.replace("/api/uploads/", "");
    const filePath = path.join(uploadDir, relKey);
    const buf = await fs.readFile(filePath);
    const ext = path.extname(relKey).toLowerCase().replace(".", "") || "png";
    const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }

  // Already a data URI
  if (imageUrl.startsWith("data:image/")) return imageUrl;

  // External http:// — try to fetch and encode
  const res = await fetch(imageUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "image/png";
  return `data:${ct};base64,${buf.toString("base64")}`;
}

async function generateWithRunway(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
  // Runway image_to_video always requires promptImage — generate one if not supplied
  let imageUrl = options.imageUrl;
  if (!imageUrl) {
    try {
      const imgResult = await generateImage({
        prompt: `${options.prompt}, cinematic still frame, high quality`,
        aspectRatio: options.aspectRatio === "9:16" ? "9:16" : "16:9",
      });
      imageUrl = imgResult.url;
    } catch (_e) {
      return { provider: "runway", status: "failed", error: "Could not generate reference image for Runway (promptImage is required)" };
    }
  }

  // Ensure promptImage is a format Runway accepts (https:// or data:image/...)
  const promptImage = await toRunwayImage(imageUrl!);

  const response = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ENV.runwayApiKey}`,
      "X-Runway-Version": "2024-11-06",
    },
    body: JSON.stringify({
      model: "gen3a_turbo",
      promptImage,
      promptText: options.prompt,
      duration: options.duration || 5,
      ratio: options.aspectRatio === "9:16" ? "768:1280" : "1280:768",
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    return { provider: "runway", status: "failed", error };
  }

  const result = await response.json() as { id: string };
  return {
    provider: "runway",
    status: "processing",
    taskId: result.id,
  };
}

/**
 * Check Runway task status
 */
export async function checkRunwayStatus(taskId: string): Promise<VideoGenerationResult> {
  const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
    headers: {
      "Authorization": `Bearer ${ENV.runwayApiKey}`,
      "X-Runway-Version": "2024-11-06",
    },
  });

  if (!response.ok) {
    return { provider: "runway", status: "failed", error: "Failed to check status" };
  }

  const result = await response.json() as { status: string; output?: string[]; failure?: string };

  if (result.status === "SUCCEEDED" && result.output?.[0]) {
    // Download and store in S3
    const videoResponse = await fetch(result.output[0]);
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const { url } = await storagePut(`videos/${Date.now()}-runway.mp4`, videoBuffer, "video/mp4");
    return { provider: "runway", status: "completed", videoUrl: url };
  }

  if (result.status === "FAILED") {
    return { provider: "runway", status: "failed", error: result.failure || "Generation failed" };
  }

  return { provider: "runway", status: "processing", taskId };
}

/**
 * Generate video using Luma AI (Dream Machine)
 * Docs: https://docs.lumalabs.ai/
 */
async function generateWithLuma(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
  const body: any = {
    prompt: options.prompt,
    aspect_ratio: options.aspectRatio || "16:9",
    loop: false,
  };

  if (options.imageUrl) {
    body.keyframes = {
      frame0: { type: "image", url: options.imageUrl },
    };
  }

  const response = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ENV.lumaApiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    return { provider: "luma", status: "failed", error };
  }

  const result = await response.json() as { id: string };
  return { provider: "luma", status: "processing", taskId: result.id };
}

/**
 * Check Luma task status
 */
export async function checkLumaStatus(taskId: string): Promise<VideoGenerationResult> {
  const response = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${taskId}`, {
    headers: { "Authorization": `Bearer ${ENV.lumaApiKey}` },
  });

  if (!response.ok) {
    return { provider: "luma", status: "failed", error: "Failed to check status" };
  }

  const result = await response.json() as { state: string; assets?: { video?: string }; failure_reason?: string };

  if (result.state === "completed" && result.assets?.video) {
    const videoResponse = await fetch(result.assets.video);
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const { url } = await storagePut(`videos/${Date.now()}-luma.mp4`, videoBuffer, "video/mp4");
    return { provider: "luma", status: "completed", videoUrl: url };
  }

  if (result.state === "failed") {
    return { provider: "luma", status: "failed", error: result.failure_reason || "Generation failed" };
  }

  return { provider: "luma", status: "processing", taskId };
}

/**
 * Generate video using Kling AI API
 */
async function generateWithKling(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
  const response = await fetch("https://api.klingai.com/v1/videos/text2video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ENV.klingApiKey}`,
    },
    body: JSON.stringify({
      model_name: "kling-v1",
      prompt: options.prompt,
      cfg_scale: 0.5,
      mode: "std",
      aspect_ratio: options.aspectRatio || "16:9",
      duration: String(options.duration || 5),
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    return { provider: "kling", status: "failed", error };
  }

  const result = await response.json() as { data?: { task_id: string } };
  if (result.data?.task_id) {
    return { provider: "kling", status: "processing", taskId: result.data.task_id };
  }
  return { provider: "kling", status: "failed", error: "No task ID returned" };
}

/**
 * Check Kling task status
 */
export async function checkKlingStatus(taskId: string): Promise<VideoGenerationResult> {
  const response = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
    headers: { "Authorization": `Bearer ${ENV.klingApiKey}` },
  });

  if (!response.ok) {
    return { provider: "kling", status: "failed", error: "Failed to check status" };
  }

  const result = await response.json() as { data?: { task_status: string; task_result?: { videos?: Array<{ url: string }> } } };

  if (result.data?.task_status === "succeed" && result.data.task_result?.videos?.[0]?.url) {
    const videoUrl = result.data.task_result.videos[0].url;
    const videoResponse = await fetch(videoUrl);
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const { url } = await storagePut(`videos/${Date.now()}-kling.mp4`, videoBuffer, "video/mp4");
    return { provider: "kling", status: "completed", videoUrl: url };
  }

  if (result.data?.task_status === "failed") {
    return { provider: "kling", status: "failed", error: "Generation failed" };
  }

  return { provider: "kling", status: "processing", taskId };
}

/**
 * Fallback: Generate key frames using image generation
 * When no video API is available, generate a sequence of images as a storyboard
 */
async function generateFallbackFrames(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
  const framePrompts = [
    `Opening scene: ${options.prompt}, establishing shot, ${options.style || "cinematic"} style`,
    `Middle scene: ${options.prompt}, action shot, dynamic composition, ${options.style || "cinematic"} style`,
    `Closing scene: ${options.prompt}, final shot with call to action, ${options.style || "cinematic"} style`,
  ];

  const frames: string[] = [];
  for (const framePrompt of framePrompts) {
    try {
      const result = await generateImage({ prompt: framePrompt });
      if (result.url) frames.push(result.url);
    } catch (e) {
      // Continue with remaining frames
    }
  }

  if (frames.length === 0) {
    return { provider: "fallback", status: "failed", error: "Failed to generate any frames" };
  }

  return {
    provider: "fallback",
    status: "completed",
    thumbnailUrl: frames[0],
    frames,
  };
}

/**
 * Main entry point: generate video using the best available provider
 */
export async function generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
  const provider = getAvailableProvider();

  switch (provider) {
    case "runway":
      return generateWithRunway(options);
    case "luma":
      return generateWithLuma(options);
    case "kling":
      return generateWithKling(options);
    case "fallback":
      return generateFallbackFrames(options);
  }
}

/**
 * Check video generation status (for async providers)
 */
export async function checkVideoStatus(provider: string, taskId: string): Promise<VideoGenerationResult> {
  switch (provider) {
    case "runway":
      return checkRunwayStatus(taskId);
    case "luma":
      return checkLumaStatus(taskId);
    case "kling":
      return checkKlingStatus(taskId);
    default:
      return { provider, status: "failed", error: "Unknown provider" };
  }
}

/**
 * Get available video providers and their status
 */
export function getVideoProviders() {
  return {
    runway: { available: !!ENV.runwayApiKey, name: "Runway ML (Gen-3 Alpha)" },
    luma: { available: !!ENV.lumaApiKey, name: "Luma AI (Dream Machine)" },
    kling: { available: !!ENV.klingApiKey, name: "Kling AI" },
    fallback: { available: true, name: "AI Frame Generation (Built-in)" },
    activeProvider: getAvailableProvider(),
  };
}
