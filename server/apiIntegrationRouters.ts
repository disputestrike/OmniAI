/**
 * Real API Integration Routers
 * Closes all gaps vs Predis.ai by wiring actual external APIs
 */
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { TRPCError } from "@trpc/server";
import { checkLimit, consumeLimit } from "./creditsAndUsage";

const LIMIT_MSG = "Monthly limit reached. Upgrade your plan or add credits in Pricing.";
import { generateVideo, checkVideoStatus, getVideoProviders } from "./videoGeneration";
import { generateVoiceover, listVoices, getVoiceoverProviders } from "./voiceover";
import { generateAvatarVideo, checkHeyGenStatus, listAvatars, listVoices as listHeyGenVoices, getAvatarProviders } from "./avatarGeneration";
import { getSocialPlatformStatus, getMetaOAuthUrl, getTwitterOAuthUrl, getLinkedInOAuthUrl, getTikTokOAuthUrl } from "./socialPosting";
import { getEcommercePlatformStatus, syncProducts, getShopifyOAuthUrl } from "./ecommerceSync";
import type { StoreConnection } from "./ecommerceSync";
import { storagePut, storageDelete } from "./storage";
import * as db from "./db";
import {
  createAvatarGeneration, getAvatarGenerationsByUser,
  getAvatarGenerationByTaskId, getAvatarGenerationById,
  updateAvatarGeneration, deleteAvatarGeneration,
} from "./db";

// ─── Real Video Generation Router ────────────────────────────────
export const realVideoRouter = router({
  providers: protectedProcedure.query(() => getVideoProviders()),
  generate: protectedProcedure.input(z.object({
    prompt: z.string().min(1),
    imageUrl: z.string().optional(),
    duration: z.number().optional(),
    aspectRatio: z.enum(["16:9", "9:16", "1:1"]).optional(),
    provider: z.enum(["runway", "luma", "kling", "auto"]).optional(),
  })).mutation(async ({ input }) => {
    return generateVideo({
      prompt: input.prompt,
      imageUrl: input.imageUrl,
      duration: input.duration,
      aspectRatio: input.aspectRatio,
    });
  }),
  checkStatus: protectedProcedure.input(z.object({
    taskId: z.string(),
    provider: z.enum(["runway", "luma", "kling"]),
  })).query(async ({ input }) => {
    return checkVideoStatus(input.taskId, input.provider);
  }),
  // Generate a full video ad from script (scene-by-scene with real video)
  generateFromScript: protectedProcedure.input(z.object({
    script: z.string().min(1),
    style: z.string().optional(),
    aspectRatio: z.enum(["16:9", "9:16", "1:1"]).optional(),
    withVoiceover: z.boolean().optional(),
    voiceId: z.string().optional(),
  })).mutation(async ({ input }) => {
    // Step 1: Break script into scenes
    const sceneResponse = await invokeLLM({
      messages: [
        { role: "system", content: "Break this video script into 3-5 visual scenes. For each scene, provide a detailed visual prompt for video generation (describe motion, camera angles, lighting), the spoken narration, and duration in seconds. Return JSON." },
        { role: "user", content: input.script },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_scenes",
          strict: true,
          schema: {
            type: "object",
            properties: {
              scenes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    visualPrompt: { type: "string" },
                    narration: { type: "string" },
                    duration: { type: "integer" },
                    overlayText: { type: "string" },
                  },
                  required: ["visualPrompt", "narration", "duration", "overlayText"],
                  additionalProperties: false,
                },
              },
            },
            required: ["scenes"],
            additionalProperties: false,
          },
        },
      },
    });
    const { scenes } = JSON.parse(String(sceneResponse.choices[0].message.content).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim());

    // Step 2: Generate video/image for each scene
    const generatedScenes: Array<{
      videoUrl?: string;
      imageUrl?: string;
      narration: string;
      duration: number;
      overlayText: string;
      status: string;
      taskId?: string;
    }> = [];

    for (const scene of scenes) {
      try {
        const result = await generateVideo({
          prompt: scene.visualPrompt,
          duration: Math.min(scene.duration, 10),
          aspectRatio: input.aspectRatio,
        });
        generatedScenes.push({
          videoUrl: result.videoUrl,
          imageUrl: result.thumbnailUrl,
          narration: scene.narration,
          duration: scene.duration,
          overlayText: scene.overlayText,
          status: result.status,
          taskId: result.taskId,
        });
      } catch (e) {
        // Fallback to image generation
        const imgResult = await generateImage({
          prompt: `${input.style || "Professional, cinematic"}, ${scene.visualPrompt}. High quality.`,
        });
        generatedScenes.push({
          imageUrl: imgResult.url,
          narration: scene.narration,
          duration: scene.duration,
          overlayText: scene.overlayText,
          status: "image_fallback",
        });
      }
    }

    // Step 3: Generate voiceover if requested
    let voiceoverUrl: string | undefined;
    if (input.withVoiceover) {
      const fullNarration = scenes.map((s: any) => s.narration).join(" ");
      const voiceResult = await generateVoiceover({
        text: fullNarration,
        voice: input.voiceId,
      });
      voiceoverUrl = voiceResult.audioUrl;
    }

    return {
      scenes: generatedScenes,
      voiceoverUrl,
      totalDuration: scenes.reduce((sum: number, s: any) => sum + s.duration, 0),
    };
  }),
});

// ─── AI Voiceover Router ─────────────────────────────────────────
export const voiceoverRouter = router({
  providers: protectedProcedure.query(() => getVoiceoverProviders()),
  voices: protectedProcedure.query(async () => listVoices()),
  generate: protectedProcedure.input(z.object({
    text: z.string().min(1).max(5000),
    voice: z.string().optional(),
    language: z.string().optional(),
    speed: z.number().min(0.5).max(2.0).optional(),
    provider: z.enum(["elevenlabs", "openai", "auto"]).optional(),
  })).mutation(async ({ input }) => {
    return generateVoiceover({
      text: input.text,
      voice: input.voice,
      language: input.language,
      speed: input.speed,
      provider: input.provider,
    });
  }),
});

// ─── AI Avatar / UGC Video Router ────────────────────────────────
export const avatarRouter = router({
  providers: protectedProcedure.query(() => getAvatarProviders()),
  listAvatars: protectedProcedure.query(async () => listAvatars()),
  listVoices: protectedProcedure.query(async () => listHeyGenVoices()),

  /** Submit generation to HeyGen and persist a DB record immediately */
  generate: protectedProcedure.input(z.object({
    script: z.string().min(1).max(5000),
    avatarId: z.string().optional(),
    voiceId: z.string().optional(),
    language: z.string().optional(),
    aspectRatio: z.enum(["16:9", "9:16", "1:1"]).optional(),
    background: z.string().optional(),
    style: z.enum(["normal", "closeUp", "full", "circle", "voiceOnly"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    const result = await generateAvatarVideo({
      script: input.script,
      avatarId: input.avatarId,
      voiceId: input.voiceId,
      language: input.language,
      aspectRatio: input.aspectRatio,
      background: input.background,
      style: input.style,
    });

    // Persist regardless of processing/completed/failed
    const { id: generationId } = await createAvatarGeneration({
      userId: ctx.user.id,
      taskId: result.taskId ?? `local-${Date.now()}`,
      status: result.status,
      script: input.script,
      avatarId: input.avatarId ?? null,
      voiceId: input.voiceId ?? null,
      style: input.style ?? null,
      aspectRatio: input.aspectRatio ?? null,
      language: input.language ?? null,
      videoUrl: result.videoUrl ?? null,
      videoKey: result.videoKey ?? null,
      thumbnailUrl: result.thumbnailUrl ?? null,
      thumbnailKey: result.thumbnailKey ?? null,
      duration: result.duration ?? null,
      error: result.error ?? null,
    });

    return { ...result, generationId };
  }),

  /** Poll HeyGen for status; updates DB record when complete */
  checkStatus: protectedProcedure.input(z.object({
    taskId: z.string(),
    generationId: z.number(),
  })).query(async ({ ctx, input }) => {
    // Short-circuit: if DB already has a terminal status, return it
    const existing = await getAvatarGenerationById(input.generationId, ctx.user.id);
    if (existing?.status === "completed" || existing?.status === "failed") {
      return {
        provider: "heygen" as const,
        status: existing.status,
        videoUrl: existing.videoUrl ?? undefined,
        videoKey: existing.videoKey ?? undefined,
        thumbnailUrl: existing.thumbnailUrl ?? undefined,
        duration: existing.duration ?? undefined,
        error: existing.error ?? undefined,
        generationId: existing.id,
      };
    }

    // Still processing — ask HeyGen
    const result = await checkHeyGenStatus(input.taskId);

    // Update DB when HeyGen finishes
    if (result.status === "completed" || result.status === "failed") {
      await updateAvatarGeneration(input.generationId, ctx.user.id, {
        status: result.status,
        videoUrl: result.videoUrl ?? null,
        videoKey: result.videoKey ?? null,
        thumbnailUrl: result.thumbnailUrl ?? null,
        thumbnailKey: result.thumbnailKey ?? null,
        duration: result.duration ?? null,
        error: result.error ?? null,
      });
    }

    return { ...result, generationId: input.generationId };
  }),

  /** List all past generations for the logged-in user */
  listGenerations: protectedProcedure.query(async ({ ctx }) => {
    return getAvatarGenerationsByUser(ctx.user.id);
  }),

  /** Delete a generation and its stored files */
  deleteGeneration: protectedProcedure.input(z.object({
    id: z.number().int().positive(),
  })).mutation(async ({ ctx, input }) => {
    const gen = await getAvatarGenerationById(input.id, ctx.user.id);
    if (!gen) throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
    if (gen.videoKey) await storageDelete(gen.videoKey).catch(() => {});
    if (gen.thumbnailKey) await storageDelete(gen.thumbnailKey).catch(() => {});
    await deleteAvatarGeneration(input.id, ctx.user.id);
    return { success: true };
  }),

  // Generate UGC-style product review video
  generateUGC: protectedProcedure.input(z.object({
    productName: z.string(),
    productDescription: z.string().optional(),
    tone: z.enum(["enthusiastic", "honest", "professional", "casual"]).optional(),
    duration: z.number().optional(),
    platform: z.enum(["instagram", "tiktok", "youtube", "general"]).optional(),
  })).mutation(async ({ input }) => {
    const scriptResponse = await invokeLLM({
      messages: [
        { role: "system", content: `You are a UGC content creator. Write a natural, authentic-sounding product review script for a ${input.platform || "social media"} video. The script should sound like a real person talking to camera, not an ad. Keep it under ${input.duration || 30} seconds when spoken.` },
        { role: "user", content: `Product: ${input.productName}\nDescription: ${input.productDescription || "No description provided"}\nTone: ${input.tone || "enthusiastic"}` },
      ],
    });
    const script = String(scriptResponse.choices[0].message.content);
    const videoResult = await generateAvatarVideo({
      script,
      style: "normal",
      aspectRatio: input.platform === "tiktok" || input.platform === "instagram" ? "9:16" : "16:9",
    });
    return { script, ...videoResult };
  }),
});

// ─── Social Account Connection Router ────────────────────────────
export const socialConnectionRouter = router({
  platforms: protectedProcedure.query(() => getSocialPlatformStatus()),
  getOAuthUrl: protectedProcedure.input(z.object({
    platform: z.enum(["instagram", "facebook", "twitter", "linkedin", "tiktok"]),
    origin: z.string(),
  })).mutation(async ({ input }) => {
    const redirectUri = `${input.origin}/api/social/callback/${input.platform}`;
    const state = Buffer.from(JSON.stringify({ platform: input.platform, origin: input.origin })).toString("base64");

    let url: string | null = null;
    switch (input.platform) {
      case "instagram":
      case "facebook":
        url = getMetaOAuthUrl(redirectUri, state);
        break;
      case "twitter":
        url = getTwitterOAuthUrl(redirectUri, state);
        break;
      case "linkedin":
        url = getLinkedInOAuthUrl(redirectUri, state);
        break;
      case "tiktok":
        url = getTikTokOAuthUrl(redirectUri, state);
        break;
    }

    if (!url) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `${input.platform} API credentials not configured. Add them in Settings > Secrets.`,
      });
    }

    return { url };
  }),
});

// ─── E-Commerce Sync Router ─────────────────────────────────────
export const ecommerceRouter = router({
  platforms: protectedProcedure.query(() => getEcommercePlatformStatus()),
  getShopifyOAuthUrl: protectedProcedure.input(z.object({
    shop: z.string(),
    origin: z.string(),
  })).mutation(async ({ input }) => {
    const redirectUri = `${input.origin}/api/ecommerce/callback/shopify`;
    const state = Buffer.from(JSON.stringify({ shop: input.shop, origin: input.origin })).toString("base64");
    const url = getShopifyOAuthUrl(input.shop, redirectUri, state);
    if (!url) throw new TRPCError({ code: "BAD_REQUEST", message: "Shopify API key not configured" });
    return { url };
  }),
  syncProducts: protectedProcedure.input(z.object({
    platform: z.enum(["shopify", "woocommerce"]),
    storeUrl: z.string(),
    accessToken: z.string(),
    consumerKey: z.string().optional(),
    consumerSecret: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const connection: StoreConnection = {
      platform: input.platform,
      storeUrl: input.storeUrl,
      accessToken: input.accessToken,
      consumerKey: input.consumerKey,
      consumerSecret: input.consumerSecret,
    };
    const result = await syncProducts(connection);

    if (result.success) {
      // Store products in database
      for (const product of result.products) {
        await db.createProduct({
          userId: ctx.user.id,
          name: product.title,
          description: product.description,
          url: product.url,
          imageUrls: product.images,
          category: product.category || "imported",
        });
      }
    }

    return result;
  }),
});

// ─── Meme Generator Router ──────────────────────────────────────
export const memeRouter = router({
  generate: protectedProcedure.input(z.object({
    topic: z.string().min(1),
    style: z.enum(["classic", "modern", "corporate", "gen-z", "surreal"]).optional(),
    platform: z.enum(["instagram", "twitter", "linkedin", "tiktok", "general"]).optional(),
    productName: z.string().optional(),
    brandVoice: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const limitGen = await checkLimit(ctx.user.id, "ai_generation");
    if (!limitGen.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
    const limitImg = await checkLimit(ctx.user.id, "ai_image");
    if (!limitImg.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
    // Step 1: Generate meme concept using LLM
    const conceptResponse = await invokeLLM({
      messages: [
        { role: "system", content: `You are a viral meme creator. Generate a meme concept that will get high engagement on ${input.platform || "social media"}. The meme should be relevant to the topic, funny but not offensive, and shareable. Return JSON with: topText (text at top of meme), bottomText (text at bottom), imagePrompt (detailed description of the meme image to generate), caption (social media caption with hashtags), viralScore (1-10 estimated virality).` },
        { role: "user", content: `Topic: ${input.topic}\nStyle: ${input.style || "modern"}\n${input.productName ? `Product: ${input.productName}` : ""}\n${input.brandVoice ? `Brand voice: ${input.brandVoice}` : ""}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "meme_concept",
          strict: true,
          schema: {
            type: "object",
            properties: {
              topText: { type: "string" },
              bottomText: { type: "string" },
              imagePrompt: { type: "string" },
              caption: { type: "string" },
              viralScore: { type: "integer" },
            },
            required: ["topText", "bottomText", "imagePrompt", "caption", "viralScore"],
            additionalProperties: false,
          },
        },
      },
    });
    const concept = JSON.parse(String(conceptResponse.choices[0].message.content).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim());
    await consumeLimit(ctx.user.id, "ai_generation", limitGen);

    // Step 2: Generate the meme image
    const imageResult = await generateImage({
      prompt: `Meme image: ${concept.imagePrompt}. Funny, shareable, high quality, meme format, bold impact font text overlay: "${concept.topText}" at top and "${concept.bottomText}" at bottom.`,
    });
    await consumeLimit(ctx.user.id, "ai_image", limitImg);

    return {
      ...concept,
      imageUrl: imageResult.url,
    };
  }),
  // Generate multiple meme variations
  generateBatch: protectedProcedure.input(z.object({
    topic: z.string().min(1),
    count: z.number().min(1).max(5).optional(),
    style: z.enum(["classic", "modern", "corporate", "gen-z", "surreal"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    const limitGen = await checkLimit(ctx.user.id, "ai_generation");
    if (!limitGen.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
    const count = input.count || 3;
    const batchResponse = await invokeLLM({
      messages: [
        { role: "system", content: `Generate ${count} different meme concepts on the same topic. Each should have a different angle/joke. Return JSON array.` },
        { role: "user", content: `Topic: ${input.topic}\nStyle: ${input.style || "modern"}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "meme_batch",
          strict: true,
          schema: {
            type: "object",
            properties: {
              memes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    topText: { type: "string" },
                    bottomText: { type: "string" },
                    imagePrompt: { type: "string" },
                    caption: { type: "string" },
                    viralScore: { type: "integer" },
                  },
                  required: ["topText", "bottomText", "imagePrompt", "caption", "viralScore"],
                  additionalProperties: false,
                },
              },
            },
            required: ["memes"],
            additionalProperties: false,
          },
        },
      },
    });
    const { memes } = JSON.parse(String(batchResponse.choices[0].message.content).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim());
    await consumeLimit(ctx.user.id, "ai_generation", limitGen);

    // Generate images for each meme
    const results = [];
    for (const meme of memes) {
      const limitImg = await checkLimit(ctx.user.id, "ai_image");
      if (!limitImg.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
      try {
        const imageResult = await generateImage({
          prompt: `Meme image: ${meme.imagePrompt}. Funny, meme format.`,
        });
        await consumeLimit(ctx.user.id, "ai_image", limitImg);
        results.push({ ...meme, imageUrl: imageResult.url });
      } catch (e) {
        results.push({ ...meme, imageUrl: null, error: "Image generation failed" });
      }
    }
    return results;
  }),
});

// ─── Creative Engine Router (Real Image Generation) ──────────────
export const creativeEngineRouter = router({
  // Generate ad creative with real image
  generateAd: protectedProcedure.input(z.object({
    productName: z.string(),
    productDescription: z.string().optional(),
    productImageUrl: z.string().optional(),
    platform: z.enum(["instagram", "facebook", "twitter", "linkedin", "tiktok", "google", "general"]).optional(),
    style: z.enum(["minimal", "bold", "luxury", "playful", "professional", "dark", "vibrant"]).optional(),
    adType: z.enum(["product-showcase", "lifestyle", "before-after", "testimonial", "sale", "announcement"]).optional(),
    headline: z.string().optional(),
    cta: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const limitImg = await checkLimit(ctx.user.id, "ai_image");
    if (!limitImg.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
    // Step 1: Generate ad copy if not provided
    let headline = input.headline;
    let cta = input.cta;
    if (!headline || !cta) {
      const limitGen = await checkLimit(ctx.user.id, "ai_generation");
      if (!limitGen.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
      const copyResponse = await invokeLLM({
        messages: [
          { role: "system", content: "Generate a compelling ad headline and CTA for this product. Return JSON." },
          { role: "user", content: `Product: ${input.productName}\nDescription: ${input.productDescription || ""}\nPlatform: ${input.platform || "general"}\nAd Type: ${input.adType || "product-showcase"}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ad_copy",
            strict: true,
            schema: {
              type: "object",
              properties: {
                headline: { type: "string" },
                cta: { type: "string" },
                subheadline: { type: "string" },
              },
              required: ["headline", "cta", "subheadline"],
              additionalProperties: false,
            },
          },
        },
      });
      const copy = JSON.parse(String(copyResponse.choices[0].message.content).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim());
      headline = headline || copy.headline;
      cta = cta || copy.cta;
      await consumeLimit(ctx.user.id, "ai_generation", limitGen);
    }

    // Step 2: Generate the ad image
    const styleMap: Record<string, string> = {
      minimal: "Minimalist, clean white space, elegant typography, subtle shadows",
      bold: "Bold colors, high contrast, dynamic composition, eye-catching",
      luxury: "Premium feel, gold accents, dark background, sophisticated",
      playful: "Bright colors, fun shapes, energetic, youthful",
      professional: "Corporate, clean, trustworthy, blue tones",
      dark: "Dark mode, neon accents, modern, sleek",
      vibrant: "Colorful gradient, energetic, modern, Instagram-worthy",
    };

    const adTypeMap: Record<string, string> = {
      "product-showcase": "Product centered in frame, studio lighting, clean background",
      "lifestyle": "Product in use, lifestyle setting, aspirational",
      "before-after": "Split image showing before and after, dramatic transformation",
      "testimonial": "Happy customer with product, authentic feel, warm lighting",
      "sale": "Bold sale text, discount prominently displayed, urgency",
      "announcement": "New product reveal, dramatic lighting, teaser style",
    };

    const styleDesc = styleMap[input.style || "bold"] || styleMap.bold;
    const adTypeDesc = adTypeMap[input.adType || "product-showcase"] || adTypeMap["product-showcase"];

    const imageResult = await generateImage({
      prompt: `Professional advertising image for ${input.productName}. ${adTypeDesc}. ${styleDesc}. Include text overlay: "${headline}". Call to action: "${cta}". High quality, ${input.platform || "social media"} ad format, photorealistic.`,
      ...(input.productImageUrl ? { originalImages: [{ url: input.productImageUrl, mimeType: "image/jpeg" as const }] } : {}),
    });

    return {
      imageUrl: imageResult.url,
      headline,
      cta,
      platform: input.platform || "general",
      style: input.style || "bold",
      adType: input.adType || "product-showcase",
    };
  }),

  // Generate product photoshoot
  productPhotoshoot: protectedProcedure.input(z.object({
    productName: z.string(),
    productImageUrl: z.string().optional(),
    scenes: z.array(z.string()).optional(),
    count: z.number().min(1).max(6).optional(),
  })).mutation(async ({ ctx, input }) => {
    const scenes = input.scenes || [
      "Clean white studio background with soft shadows",
      "Lifestyle setting on a modern desk with accessories",
      "Outdoor natural lighting with bokeh background",
      "Flat lay arrangement with complementary items",
    ];
    const count = Math.min(input.count || scenes.length, scenes.length);

    const photos = [];
    for (let i = 0; i < count; i++) {
      const limitImg = await checkLimit(ctx.user.id, "ai_image");
      if (!limitImg.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
      try {
        const result = await generateImage({
          prompt: `Professional product photography of ${input.productName}. Scene: ${scenes[i]}. High-end commercial photography, perfect lighting, sharp focus, 4K quality.`,
          ...(input.productImageUrl ? { originalImages: [{ url: input.productImageUrl, mimeType: "image/jpeg" as const }] } : {}),
        });
        await consumeLimit(ctx.user.id, "ai_image", limitImg);
        photos.push({ scene: scenes[i], imageUrl: result.url });
      } catch (e) {
        photos.push({ scene: scenes[i], imageUrl: null, error: "Generation failed" });
      }
    }
    return photos;
  }),
});

// ─── Integration Status Router ──────────────────────────────────
export const integrationStatusRouter = router({
  all: protectedProcedure.query(() => {
    return {
      video: getVideoProviders(),
      voiceover: getVoiceoverProviders(),
      avatar: getAvatarProviders(),
      social: getSocialPlatformStatus(),
      ecommerce: getEcommercePlatformStatus(),
    };
  }),
});
