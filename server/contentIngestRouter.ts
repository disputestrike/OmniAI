/**
 * Universal Content Ingestion Router
 * Handles: URL processing (YouTube/Instagram/TikTok/Twitter/articles),
 * file uploads (video/image/PDF/document), auto-captions, clip suggestions,
 * image-to-content, document-to-content, one-click remix/repost
 */
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";
import { TRPCError } from "@trpc/server";
import * as db from "./db";

// Platform detection from URL
function detectPlatform(url: string): { platform: string; type: string; id?: string } {
  const u = url.toLowerCase();
  if (u.includes("youtube.com/watch") || u.includes("youtu.be/")) {
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return { platform: "youtube", type: "video", id: match?.[1] };
  }
  if (u.includes("youtube.com/shorts")) {
    const match = url.match(/shorts\/([a-zA-Z0-9_-]{11})/);
    return { platform: "youtube", type: "short", id: match?.[1] };
  }
  if (u.includes("instagram.com/p/") || u.includes("instagram.com/reel/")) {
    const isReel = u.includes("/reel/");
    const match = url.match(/\/(p|reel)\/([a-zA-Z0-9_-]+)/);
    return { platform: "instagram", type: isReel ? "reel" : "post", id: match?.[2] };
  }
  if (u.includes("tiktok.com")) {
    const match = url.match(/video\/(\d+)/);
    return { platform: "tiktok", type: "video", id: match?.[1] };
  }
  if (u.includes("twitter.com/") || u.includes("x.com/")) {
    const match = url.match(/status\/(\d+)/);
    return { platform: "twitter", type: "tweet", id: match?.[1] };
  }
  if (u.includes("linkedin.com/posts/") || u.includes("linkedin.com/feed/")) {
    return { platform: "linkedin", type: "post" };
  }
  if (u.includes("facebook.com")) {
    return { platform: "facebook", type: "post" };
  }
  if (u.includes("reddit.com")) {
    return { platform: "reddit", type: "post" };
  }
  if (u.includes("threads.net")) {
    return { platform: "threads", type: "post" };
  }
  return { platform: "website", type: "article" };
}

// Scrape basic content from a URL
async function scrapeUrl(url: string): Promise<{
  title: string;
  description: string;
  text: string;
  images: string[];
  ogImage?: string;
  author?: string;
}> {
  try {
    const targetUrl = url.startsWith("http") ? url : `https://${url}`;
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OmniMarketBot/1.0; +https://omnimarket.ai)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });
    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);

    // Extract main text content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let text = "";
    if (bodyMatch) {
      text = bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[\s\S]*?<\/footer>/gi, "")
        .replace(/<header[\s\S]*?<\/header>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 5000);
    }

    // Extract images
    const imgMatches = html.match(/<img[^>]*src=["']([^"']+)["']/gi) || [];
    const images = imgMatches
      .map(img => img.match(/src=["']([^"']+)["']/)?.[1])
      .filter((src): src is string => !!src && (src.startsWith("http") || src.startsWith("//")))
      .slice(0, 10);

    return {
      title: ogTitleMatch?.[1] || titleMatch?.[1] || "",
      description: ogDescMatch?.[1] || metaDescMatch?.[1] || "",
      text,
      images,
      ogImage: ogImageMatch?.[1],
      author: authorMatch?.[1],
    };
  } catch (error) {
    return { title: "", description: "", text: "", images: [] };
  }
}

export const contentIngestRouter = router({
  // ─── Process URL: paste any link and AI extracts everything ─────────
  processUrl: protectedProcedure.input(z.object({
    url: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    const platformInfo = detectPlatform(input.url);
    const scraped = await scrapeUrl(input.url);

    // Use LLM to analyze and extract structured content from the scraped data
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a content extraction and analysis expert. Given scraped data from a ${platformInfo.platform} ${platformInfo.type}, extract and analyze the content comprehensively. Return JSON with:
{
  "title": "content title or headline",
  "originalText": "the main content/caption/post text (clean, no HTML)",
  "summary": "2-3 sentence summary of what this content is about",
  "keyPoints": ["array of key points, hooks, or takeaways"],
  "viralElements": ["what makes this content engaging/viral - hooks, emotions, patterns"],
  "hashtags": ["extracted or suggested hashtags"],
  "contentType": "video|image|text|article|reel|short|tweet|thread",
  "tone": "the tone/style of the content (funny, inspirational, educational, etc.)",
  "targetAudience": "who this content is aimed at",
  "bestMoments": ["if video/long content: key moments that could be clipped for reels/shorts"],
  "suggestedRemixes": [
    {"format": "instagram_caption", "description": "why this would work as an IG caption"},
    {"format": "tiktok_script", "description": "how to adapt for TikTok"},
    {"format": "twitter_thread", "description": "how to turn into a thread"},
    {"format": "ad_copy", "description": "how to turn into an ad"},
    {"format": "blog_post", "description": "how to expand into a blog"}
  ],
  "captionSuggestions": ["3-5 ready-to-use caption variations for reposting"],
  "improvementSuggestions": ["how to make this content even better"]
}`
        },
        {
          role: "user",
          content: `URL: ${input.url}\nPlatform: ${platformInfo.platform} (${platformInfo.type})\nTitle: ${scraped.title}\nDescription: ${scraped.description}\nContent text:\n${scraped.text.substring(0, 4000)}`
        },
      ],
      response_format: { type: "json_object" },
    });

    let analysis: any = {};
    try {
      analysis = JSON.parse(response.choices[0].message.content as string);
    } catch {
      analysis = { title: scraped.title, originalText: scraped.text.substring(0, 1000), summary: scraped.description };
    }

    return {
      platform: platformInfo,
      scraped: {
        title: scraped.title,
        description: scraped.description,
        ogImage: scraped.ogImage,
        images: scraped.images.slice(0, 5),
        author: scraped.author,
        textPreview: scraped.text.substring(0, 500),
      },
      analysis,
    };
  }),

  // ─── Process uploaded file (image/video/audio/document) ─────────────
  processFile: protectedProcedure.input(z.object({
    fileBase64: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    fileSize: z.number(),
  })).mutation(async ({ ctx, input }) => {
    // Validate file size (50MB max)
    if (input.fileSize > 50 * 1024 * 1024) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "File too large. Maximum 50MB." });
    }

    const buffer = Buffer.from(input.fileBase64, "base64");
    const ext = input.fileName.split(".").pop() || "bin";
    const key = `ingest/${ctx.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { url: fileUrl } = await storagePut(key, buffer, input.mimeType);

    const isImage = input.mimeType.startsWith("image/");
    const isVideo = input.mimeType.startsWith("video/");
    const isAudio = input.mimeType.startsWith("audio/");
    const isPdf = input.mimeType === "application/pdf";
    const isDocument = input.mimeType.includes("document") || input.mimeType.includes("text/") || input.mimeType.includes("msword") || input.mimeType.includes("officedocument");

    let extractedText = "";
    let transcript = null;
    let imageAnalysis = null;

    // Process based on file type
    if (isImage) {
      // Use LLM vision to analyze image
      const visionResponse = await invokeLLM({
        messages: [
          { role: "system", content: "You are a visual content analyst for marketing. Analyze this image in detail and return JSON with: { \"description\": \"detailed description\", \"objects\": [\"objects/people/products visible\"], \"mood\": \"emotional mood/vibe\", \"colors\": [\"dominant colors\"], \"textInImage\": \"any text visible in the image\", \"marketingPotential\": \"how this image could be used in marketing\", \"suggestedCaptions\": [\"5 ready-to-use social media captions for this image\"], \"suggestedHashtags\": [\"relevant hashtags\"], \"adCopyIdeas\": [\"3 ad copy ideas based on this image\"], \"platforms\": [\"best platforms to post this on and why\"] }" },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image for marketing content creation:" },
              { type: "image_url", image_url: { url: fileUrl, detail: "high" } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });
      try {
        imageAnalysis = JSON.parse(visionResponse.choices[0].message.content as string);
      } catch {
        imageAnalysis = { description: visionResponse.choices[0].message.content };
      }
    } else if (isVideo || isAudio) {
      // Transcribe audio/video
      try {
        const transcriptResult = await transcribeAudio({
          audioUrl: fileUrl,
          prompt: "Transcribe this content for marketing analysis",
        });
        if (!("error" in transcriptResult)) {
          transcript = {
            text: transcriptResult.text,
            language: transcriptResult.language,
            segments: transcriptResult.segments?.map((s: any) => ({
              start: s.start,
              end: s.end,
              text: s.text,
            })),
          };
          extractedText = transcriptResult.text;
        }
      } catch {
        // Transcription failed, continue without it
      }
    } else if (isPdf || isDocument) {
      // Use LLM to process document via file_url
      const docResponse = await invokeLLM({
        messages: [
          { role: "system", content: "Extract and summarize the key content from this document. Return JSON with: { \"title\": \"document title\", \"summary\": \"comprehensive summary\", \"keyPoints\": [\"main points\"], \"quotes\": [\"notable quotes or statistics\"], \"marketingAngles\": [\"how this content could be used for marketing\"], \"suggestedContent\": [{ \"type\": \"blog_post\", \"idea\": \"...\" }, { \"type\": \"social_caption\", \"idea\": \"...\" }, { \"type\": \"ad_copy\", \"idea\": \"...\" }] }" },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this document for marketing content extraction:" },
              { type: "file_url", file_url: { url: fileUrl, mime_type: input.mimeType as any } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });
      try {
        const docAnalysis = JSON.parse(docResponse.choices[0].message.content as string);
        extractedText = docAnalysis.summary || "";
        imageAnalysis = docAnalysis; // Reuse field for document analysis
      } catch {
        extractedText = docResponse.choices[0].message.content as string;
      }
    }

    return {
      fileUrl,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileType: isImage ? "image" : isVideo ? "video" : isAudio ? "audio" : isPdf ? "pdf" : isDocument ? "document" : "other",
      extractedText,
      transcript,
      imageAnalysis,
    };
  }),

  // ─── Auto-generate captions from video/audio transcript ─────────────
  generateCaptions: protectedProcedure.input(z.object({
    transcript: z.string().min(1),
    platform: z.string().optional(),
    tone: z.string().optional(),
    style: z.string().optional(),
  })).mutation(async ({ input }) => {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a social media caption expert who creates viral, engaging captions. Given a video/audio transcript, generate multiple caption variations. Return JSON with:
{
  "captions": [
    { "text": "caption text with emojis and hashtags", "platform": "instagram", "style": "engaging", "charCount": 150 },
    { "text": "...", "platform": "tiktok", "style": "trendy", "charCount": 100 },
    { "text": "...", "platform": "twitter", "style": "punchy", "charCount": 280 },
    { "text": "...", "platform": "linkedin", "style": "professional", "charCount": 200 },
    { "text": "...", "platform": "facebook", "style": "conversational", "charCount": 200 },
    { "text": "...", "platform": "youtube", "style": "descriptive", "charCount": 300 }
  ],
  "hashtags": { "trending": ["#hashtag1"], "niche": ["#hashtag2"], "branded": ["#hashtag3"] },
  "hooks": ["3 attention-grabbing first lines"],
  "ctas": ["3 call-to-action suggestions"],
  "subtitles": [{ "start": 0, "end": 5, "text": "subtitle text" }]
}`
        },
        {
          role: "user",
          content: `Generate captions from this transcript:\n\n${input.transcript.substring(0, 3000)}\n\n${input.platform ? `Primary platform: ${input.platform}` : ""}\n${input.tone ? `Tone: ${input.tone}` : ""}\n${input.style ? `Style: ${input.style}` : ""}`
        },
      ],
      response_format: { type: "json_object" },
    });

    try {
      return JSON.parse(response.choices[0].message.content as string);
    } catch {
      return { captions: [{ text: response.choices[0].message.content, platform: "general", style: "default", charCount: 0 }], hashtags: {}, hooks: [], ctas: [] };
    }
  }),

  // ─── Identify best clip moments from transcript ─────────────────────
  identifyClipMoments: protectedProcedure.input(z.object({
    transcript: z.string().min(1),
    segments: z.array(z.object({
      start: z.number(),
      end: z.number(),
      text: z.string(),
    })).optional(),
    targetDurations: z.array(z.number()).default([15, 30, 60]),
  })).mutation(async ({ input }) => {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a viral content editor who identifies the best moments from videos for clips, reels, shorts, and TikToks. Analyze the transcript and identify the most engaging, shareable, or viral-worthy moments. Return JSON with:
{
  "clips": [
    {
      "title": "clip title",
      "startTime": 0,
      "endTime": 30,
      "duration": 30,
      "transcript": "the text of this clip segment",
      "viralScore": 9,
      "reason": "why this moment is clip-worthy",
      "bestFor": ["tiktok", "reels", "shorts"],
      "suggestedCaption": "ready-to-use caption for this clip",
      "hook": "the attention-grabbing opening line",
      "emotion": "the dominant emotion (funny, shocking, inspiring, educational)"
    }
  ],
  "overallAnalysis": {
    "bestMoment": "timestamp and description of the single best moment",
    "contentStyle": "educational/entertainment/motivational/etc",
    "audienceAppeal": "who would love this content",
    "viralPotential": "1-10 score with explanation"
  }
}`
        },
        {
          role: "user",
          content: `Identify the best clip moments from this transcript. Target durations: ${input.targetDurations.join(", ")} seconds.\n\n${input.segments ? input.segments.map(s => `[${Math.floor(s.start)}s-${Math.floor(s.end)}s] ${s.text}`).join("\n") : input.transcript.substring(0, 4000)}`
        },
      ],
      response_format: { type: "json_object" },
    });

    try {
      return JSON.parse(response.choices[0].message.content as string);
    } catch {
      return { clips: [], overallAnalysis: { bestMoment: "Could not analyze", contentStyle: "unknown", audienceAppeal: "general", viralPotential: "N/A" } };
    }
  }),

  // ─── Quick remix: take ingested content and remix into specific format ──
  quickRemix: protectedProcedure.input(z.object({
    sourceContent: z.string().min(1),
    sourceType: z.string().default("text"),
    targetFormat: z.enum(["ad_copy_short", "ad_copy_long", "social_caption", "video_script", "twitter_thread", "linkedin_article", "blog_post", "email_copy", "story_content", "ugc_script", "tiktok_script", "youtube_description", "instagram_caption"]),
    platform: z.string().optional(),
    tone: z.string().optional(),
    customInstructions: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const formatInstructions: Record<string, string> = {
      ad_copy_short: "Create a punchy ad copy under 90 characters with a strong CTA. Make it impossible to ignore.",
      ad_copy_long: "Create a detailed 200-400 word ad copy with headline, body, and CTA. Persuasive and benefit-focused.",
      social_caption: "Create an engaging social media caption with emojis, hashtags, and a CTA. Platform-optimized.",
      video_script: "Create a video script with hook (first 3 seconds), intro, main points, CTA, and outro. Include timing notes.",
      twitter_thread: "Create a Twitter/X thread (5-10 tweets). First tweet is the hook. Each tweet under 280 chars. End with CTA.",
      linkedin_article: "Create a professional LinkedIn article (500-800 words). Thought leadership style with personal insights.",
      blog_post: "Create an SEO-optimized blog post (800-1200 words) with title, intro, subheadings, and conclusion.",
      email_copy: "Create a marketing email with subject line, preview text, greeting, body, CTA button text, and closing.",
      story_content: "Create Instagram/TikTok Story content: 5-7 story slides with text overlays, polls, and CTAs.",
      ugc_script: "Create a UGC-style script that feels authentic and unscripted. Include talking points and B-roll suggestions.",
      tiktok_script: "Create a TikTok script: strong hook in first 1 second, fast-paced, trendy, with text overlay suggestions.",
      youtube_description: "Create a YouTube video description with timestamps, links, keywords, and subscribe CTA.",
      instagram_caption: "Create an Instagram caption: hook first line, storytelling body, CTA, and 20-30 relevant hashtags.",
    };

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert content remixer who takes any content and transforms it into marketing gold. ${formatInstructions[input.targetFormat] || "Create compelling marketing content."} Make it significantly better than the original — better hooks, better structure, better emotional appeal, better CTA.${input.tone ? ` Tone: ${input.tone}.` : ""}${input.platform ? ` Optimized for ${input.platform}.` : ""}`
        },
        {
          role: "user",
          content: `Remix this ${input.sourceType} content into ${input.targetFormat.replace(/_/g, " ")}:\n\n${input.sourceContent.substring(0, 3000)}${input.customInstructions ? `\n\nAdditional instructions: ${input.customInstructions}` : ""}`
        },
      ],
    });

    const remixed = response.choices[0].message.content as string;
    const title = `[Remixed] ${remixed.split("\n")[0]?.replace(/^#+\s*/, "").substring(0, 200) || "Remixed content"}`;

    // Save to content library
    const result = await db.createContent({
      userId: ctx.user.id,
      type: (["ad_copy_short", "ad_copy_long", "social_caption", "video_script", "twitter_thread", "linkedin_article", "blog_post", "email_copy", "story_content", "ugc_script"].includes(input.targetFormat) ? input.targetFormat : "copywriting") as any,
      platform: input.platform ?? null,
      title,
      body: remixed,
      status: "draft",
      metadata: { remixedFrom: input.sourceContent.substring(0, 200), sourceType: input.sourceType },
    });

    return { id: result.id, title, body: remixed, format: input.targetFormat };
  }),

  // ─── Batch remix: one content → multiple formats at once ────────────
  batchRemix: protectedProcedure.input(z.object({
    sourceContent: z.string().min(1),
    targetFormats: z.array(z.string()).min(1),
    platform: z.string().optional(),
    tone: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a content repurposing machine. Take one piece of content and transform it into ALL of these formats simultaneously. Each version must be platform-optimized, engaging, and significantly better than the original. Return JSON with: { "pieces": [{ "format": "format_name", "title": "title", "body": "full content", "platform": "best platform for this", "charCount": 150 }] }`
        },
        {
          role: "user",
          content: `Transform this content into these formats: ${input.targetFormats.join(", ")}\n\nOriginal content:\n${input.sourceContent.substring(0, 3000)}${input.tone ? `\nTone: ${input.tone}` : ""}${input.platform ? `\nPrimary platform: ${input.platform}` : ""}`
        },
      ],
      response_format: { type: "json_object" },
    });

    let pieces: any[] = [];
    try {
      const parsed = JSON.parse(response.choices[0].message.content as string);
      pieces = parsed.pieces || [];
    } catch {
      pieces = [{ format: "general", title: "Remixed content", body: response.choices[0].message.content }];
    }

    // Save all pieces to content library
    const saved = [];
    for (const piece of pieces) {
      const validTypes = ["ad_copy_short", "ad_copy_long", "blog_post", "seo_meta", "social_caption", "video_script", "email_copy", "pr_release", "podcast_script", "tv_script", "radio_script", "copywriting", "amazon_listing", "google_ads", "youtube_seo", "twitter_thread", "linkedin_article", "whatsapp_broadcast", "sms_copy", "story_content", "ugc_script", "landing_page"];
      const type = validTypes.includes(piece.format) ? piece.format : "copywriting";
      const result = await db.createContent({
        userId: ctx.user.id,
        type: type as any,
        platform: piece.platform ?? input.platform ?? null,
        title: `[Batch Remix] ${piece.title || piece.format}`.substring(0, 255),
        body: piece.body,
        status: "draft",
        metadata: { batchRemix: true, sourceFormat: "ingested" },
      });
      saved.push({ id: result.id, format: piece.format, title: piece.title, body: piece.body });
    }

    return { count: saved.length, pieces: saved };
  }),

  // ─── Generate image from content (for visual posts) ─────────────────
  generateVisual: protectedProcedure.input(z.object({
    content: z.string().min(1),
    type: z.enum(["ad_image", "social_graphic", "thumbnail", "banner", "story"]),
    platform: z.string().optional(),
    style: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const dimensions: Record<string, string> = {
      ad_image: "1200x628",
      social_graphic: "1080x1080",
      thumbnail: "1280x720",
      banner: "1920x480",
      story: "1080x1920",
    };

    // Use LLM to create an image prompt from the content
    const promptResponse = await invokeLLM({
      messages: [
        { role: "system", content: "You are a creative director. Given marketing content, create a single compelling image generation prompt that would make a perfect visual to accompany this content. The prompt should be specific, visual, and produce a professional marketing image. Return only the prompt text, nothing else." },
        { role: "user", content: `Create an image prompt for this content (${input.type} format, ${dimensions[input.type]} dimensions${input.platform ? `, for ${input.platform}` : ""}${input.style ? `, style: ${input.style}` : ""}):\n\n${input.content.substring(0, 500)}` },
      ],
    });

    const imagePrompt = `${promptResponse.choices[0].message.content as string}. Photorealistic, professional marketing quality, ${dimensions[input.type]} aspect ratio.`;

    const { url: imageUrl } = await generateImage({ prompt: imagePrompt });

    // Save to creatives
    const creative = await db.createCreative({
      userId: ctx.user.id,
      type: input.type,
      prompt: imagePrompt,
      imageUrl,
      platform: input.platform ?? null,
      dimensions: dimensions[input.type],
      status: "completed",
    });

    return { id: creative.id, imageUrl, dimensions: dimensions[input.type] };
  }),

  // ─── Quick action: content → scheduled post in one click ────────────
  quickPost: protectedProcedure.input(z.object({
    contentBody: z.string().min(1),
    platforms: z.array(z.string()).min(1),
    scheduledAt: z.string().optional(),
    imageUrl: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    // First save the content to the content library
    const content = await db.createContent({
      userId: ctx.user.id,
      type: "social_caption",
      title: `Quick Post - ${input.platforms.join(", ")}`,
      body: input.contentBody,
      status: "draft",
      metadata: input.imageUrl ? { imageUrl: input.imageUrl } : undefined,
    });
    const posts = [];
    for (const platform of input.platforms) {
      const post = await db.createScheduledPost({
        userId: ctx.user.id,
        platform,
        contentId: content.id,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : new Date(),
        status: "scheduled",
        metadata: { contentBody: input.contentBody, imageUrl: input.imageUrl },
      });
      posts.push(post);
    }
    return { count: posts.length, posts };
  }),
});
