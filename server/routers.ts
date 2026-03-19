import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { checkLimit, consumeLimit } from "./creditsAndUsage";
import { checkTierAccess, getFeatureAccess } from "./tierAccess";

const LIMIT_MSG = "Monthly limit reached. Upgrade your plan or add credits in Pricing.";
import { PLATFORM_SPECS, getAllPlatformSpecs, autoFormatContent, getBestPostingTime, getTodayBestTime, getRecommendedAspectRatio } from "@shared/platformSpecs";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import { users, teamMembers, subscriptions } from "../drizzle/schema";
import { eq, desc, count } from "drizzle-orm";
import { getDb } from "./db";
import { brandVoiceRouter, emailMarketingRouter, landingPageRouter, automationRouter, socialPublishRouter, videoRenderRouter, webhookRouter, imageEditorRouter, multiLanguageRouter, competitorSpyRouter, bulkImportRouter } from "./gapRouters";
import { personalVideoRouter, competitorIntelRouter, customerIntelRouter } from "./newFeatureRouters";
import { realVideoRouter, voiceoverRouter, avatarRouter, socialConnectionRouter, ecommerceRouter, memeRouter, creativeEngineRouter, integrationStatusRouter } from "./apiIntegrationRouters";
import { repurposingRouter } from "./repurposingRouter";
import { publishingRouter } from "./publishingRouter";
import { adPerformanceRouter } from "./adPerformanceRouter";
import { funnelRouter } from "./funnelRouter";
import { reviewsRouter } from "./reviewsRouter";
import { formsRouter } from "./formsRouter";
import { reportsRouter } from "./reportsRouter";
import { contentIngestRouter } from "./contentIngestRouter";
import { contentLibraryRouter } from "./contentLibraryRouter";
import { creatorProfileRouter } from "./creatorProfileRouter";
import { publisherRouter } from "./publisherRouter";
import { advancedFeaturesRouter } from "./advancedFeaturesRouter";
import { enhancedChatRouter } from "./enhancedChatRouter";
import { flywheelRouter, selfLearningRouter, narrativeRouter, influenceRouter, referralRouter } from "./autonomousRouters";
import { brandKits } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Dashboard ─────────────────────────────────────────────────────
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getDashboardStats(ctx.user.id);
    }),
  }),

  // ─── Products ──────────────────────────────────────────────────────
  product: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getProductsByUser(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getProductById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      url: z.string().optional(),
      imageUrls: z.array(z.string()).optional(),
      category: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await db.createProduct({
        userId: ctx.user.id,
        name: input.name,
        description: input.description ?? null,
        url: input.url ?? null,
        imageUrls: input.imageUrls ?? null,
        category: input.category ?? null,
        analysisStatus: "pending",
      });
      return result;
    }),
    analyze: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const product = await db.getProductById(input.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });

      await db.updateProduct(input.id, { analysisStatus: "analyzing" });

      let urlContext = "";
      const productUrl = product.url?.trim();
      if (productUrl) {
        try {
          const targetUrl = productUrl.startsWith("http") ? productUrl : `https://${productUrl}`;
          const fetchResponse = await fetch(targetUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; OtobiAIBot/1.0)" },
            signal: AbortSignal.timeout(15000),
          });
          const html = await fetchResponse.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
          const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
          const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
          const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi)?.map(h => h.replace(/<[^>]+>/g, "").trim()).slice(0, 5) || [];
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          const bodyText = bodyMatch ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2500) : "";
          urlContext = `\n\n--- PAGE CONTENT FROM ${targetUrl} ---\nTitle: ${titleMatch?.[1] || "N/A"}\nMeta description: ${metaDescMatch?.[1] || "N/A"}\nOG title: ${ogTitleMatch?.[1] || "N/A"}\nOG description: ${ogDescMatch?.[1] || "N/A"}\nH1: ${h1Matches.join(" | ") || "None"}\nBody preview: ${bodyText}\n--- END PAGE CONTENT ---`;
        } catch {
          urlContext = "\n\n[Could not fetch URL; use name/description/category only.]";
        }
      }

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a marketing strategist AI. Analyze the given product and extract structured marketing intelligence. When page content from the product URL is provided, use it to make your analysis accurate. Reply with ONLY a valid JSON object, no markdown or extra text. Required keys: features (array of strings), benefits (array of strings), targetAudience (array of strings), positioning (string), keywords (array of strings), tone (string), competitiveAdvantages (array of strings), painPoints (array of strings).`
            },
            {
              role: "user",
              content: `Analyze this product for marketing purposes:
Name: ${product.name}
Description: ${product.description || "N/A"}
URL: ${product.url || "N/A"}
Category: ${product.category || "N/A"}
${urlContext}

Return ONLY a JSON object with: features, benefits, targetAudience, positioning, keywords, tone, competitiveAdvantages, painPoints.`
            }
          ],
          max_tokens: 2048,
        });

        const raw = response.choices[0]?.message?.content;
        const str = typeof raw === "string" ? raw : Array.isArray(raw) ? (raw.find((c: { type?: string; text?: string }) => c.type === "text") as { text?: string } | undefined)?.text ?? "" : "";
        const jsonStr = str.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/m, "$1").trim();
        const analysis = JSON.parse(jsonStr || "{}");
        if (!analysis.features || !Array.isArray(analysis.features)) analysis.features = [];
        if (!analysis.benefits || !Array.isArray(analysis.benefits)) analysis.benefits = [];
        if (!analysis.targetAudience || !Array.isArray(analysis.targetAudience)) analysis.targetAudience = [];
        if (!analysis.keywords || !Array.isArray(analysis.keywords)) analysis.keywords = [];
        if (!analysis.competitiveAdvantages || !Array.isArray(analysis.competitiveAdvantages)) analysis.competitiveAdvantages = [];
        if (!analysis.painPoints || !Array.isArray(analysis.painPoints)) analysis.painPoints = [];
        analysis.positioning = analysis.positioning ?? "";
        analysis.tone = analysis.tone ?? "";
        await db.updateProduct(input.id, {
          features: analysis.features,
          benefits: analysis.benefits,
          targetAudience: analysis.targetAudience,
          positioning: analysis.positioning,
          keywords: analysis.keywords,
          tone: analysis.tone,
          rawAnalysis: analysis,
          analysisStatus: "completed",
        });
        return { success: true, analysis };
      } catch (error) {
        await db.updateProduct(input.id, { analysisStatus: "failed" });
        const msg = error instanceof Error ? error.message : "Analysis failed";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
      }
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteProduct(input.id);
      return { success: true };
    }),
  }),

  // ─── Content Generation ────────────────────────────────────────────
  content: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getContentsByUser(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getContentById(input.id);
    }),
    generate: protectedProcedure.input(z.object({
      productId: z.number().optional(),
      campaignId: z.number().optional(),
      type: z.enum(["ad_copy_short", "ad_copy_long", "blog_post", "seo_meta", "social_caption", "video_script", "email_copy", "pr_release", "podcast_script", "tv_script", "radio_script", "copywriting", "amazon_listing", "google_ads", "youtube_seo", "twitter_thread", "linkedin_article", "whatsapp_broadcast", "sms_copy", "story_content", "ugc_script", "landing_page"]),
      platform: z.string().optional(),
      customPrompt: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const limit = await checkLimit(ctx.user.id, "ai_generation");
      if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG, cause: limit });

      let productContext = "";
      if (input.productId) {
        const product = await db.getProductById(input.productId);
        if (product) {
          productContext = `Product: ${product.name}\nDescription: ${product.description || ""}\nFeatures: ${(product.features as string[] || []).join(", ")}\nBenefits: ${(product.benefits as string[] || []).join(", ")}\nTarget Audience: ${(product.targetAudience as string[] || []).join(", ")}\nTone: ${product.tone || "professional"}\nKeywords: ${(product.keywords as string[] || []).join(", ")}`;
        }
      }

      const typePrompts: Record<string, string> = {
        ad_copy_short: "Write a compelling short ad copy (under 90 characters) that drives clicks. Include a strong CTA.",
        ad_copy_long: "Write a detailed long-form ad copy (200-400 words) with headline, body, and CTA. Make it persuasive and benefit-focused.",
        blog_post: "Write a comprehensive SEO-optimized blog post (800-1200 words) with title, introduction, subheadings, body paragraphs, and conclusion. Include relevant keywords naturally.",
        seo_meta: "Generate SEO meta tags including: title tag (60 chars max), meta description (155 chars max), 10 focus keywords, and 5 long-tail keywords. Format as structured text.",
        social_caption: `Write an engaging social media caption for ${input.platform || "general social media"}. Include relevant hashtags, emojis, and a CTA. Keep it platform-appropriate.`,
        video_script: `Write a video script for ${input.platform || "YouTube"} including: hook (first 3 seconds), intro, main content points, CTA, and outro. Include timing notes and visual cues.`,
        email_copy: "Write a marketing email with: subject line, preview text, greeting, body with benefits, CTA button text, and closing. Make it personal and action-oriented.",
        pr_release: "Write a professional press release with: headline, dateline, lead paragraph, body with quotes, boilerplate, and media contact info. Follow AP style.",
        podcast_script: "Write a podcast episode script including: intro hook, topic introduction, 3-5 discussion points with talking notes, listener engagement prompts, and outro with CTA. Include timing estimates.",
        tv_script: "Write a TV commercial script (30-60 seconds) with: visual descriptions for each scene, voiceover text, on-screen text, music/SFX cues, and final CTA with brand tag.",
        radio_script: "Write a radio ad script (30-60 seconds) with: attention-grabbing opening, key message, benefits, CTA with phone/web info, and closing. Include SFX and music direction.",
        copywriting: "Write persuasive sales copy for a landing page including: headline, subheadline, pain points, solution, benefits, social proof section, FAQ, and CTA. Use proven copywriting frameworks (AIDA/PAS).",
        amazon_listing: "Write an Amazon product listing with: SEO title (200 chars), 5 bullet points highlighting features/benefits, product description (2000 chars), and 5 backend search keywords.",
        google_ads: "Write Google Ads copy with: 3 headline variations (30 chars each), 2 description variations (90 chars each), display URL path, sitelink extensions, and callout extensions.",
        youtube_seo: "Write YouTube video SEO package: optimized title (60 chars), description (5000 chars with timestamps and links), 30 tags, 3 thumbnail text options, and end screen CTA.",
        twitter_thread: "Write a viral Twitter/X thread (8-12 tweets) with: hook tweet, value-packed middle tweets, engagement prompts, and final CTA tweet. Include thread numbering.",
        linkedin_article: "Write a professional LinkedIn article (600-1000 words) with: attention-grabbing headline, personal story hook, insights with data, actionable takeaways, and engagement question.",
        whatsapp_broadcast: "Write a WhatsApp broadcast message: greeting, concise value proposition, key offer details, CTA with link, and opt-out note. Keep under 1024 characters.",
        sms_copy: "Write SMS marketing copy (160 characters max): include brand name, offer, urgency element, CTA, and opt-out. Write 3 variations.",
        story_content: `Write Instagram/TikTok Story content: 5-7 story slides with text overlay, sticker suggestions, poll/quiz ideas, swipe-up CTA, and engagement hooks for ${input.platform || "Instagram"}.`,
        ugc_script: "Write a UGC (User-Generated Content) style script for a creator: natural talking-to-camera intro, authentic product experience, genuine reaction, subtle CTA. Keep it conversational and unscripted-feeling.",
        landing_page: "Write complete landing page copy: hero headline + subheadline, 3 feature sections with icons, testimonial placeholders, pricing section, FAQ (5 questions), and final CTA section.",
      };

      const systemPrompt = `You are an expert marketing copywriter and content strategist. Create high-converting marketing content. Always be specific, benefit-focused, and action-oriented.`;
      const userPrompt = `${typePrompts[input.type]}\n\n${productContext}\n\n${input.customPrompt ? `Additional instructions: ${input.customPrompt}` : ""}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const generatedContent = response.choices[0].message.content as string;
      const title = generatedContent.split("\n")[0]?.replace(/^#+\s*/, "").substring(0, 255) || `${input.type} content`;

      const result = await db.createContent({
        userId: ctx.user.id,
        productId: input.productId ?? null,
        campaignId: input.campaignId ?? null,
        type: input.type,
        platform: input.platform ?? null,
        title,
        body: generatedContent,
        status: "draft",
      });

      await consumeLimit(ctx.user.id, "ai_generation", limit);
      return { id: result.id, title, body: generatedContent };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      body: z.string().optional(),
      status: z.enum(["draft", "approved", "published", "archived"]).optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateContent(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteContent(input.id);
      return { success: true };
    }),
    byProduct: protectedProcedure.input(z.object({ productId: z.number() })).query(async ({ input }) => {
      return db.getContentsByProduct(input.productId);
    }),
    remix: protectedProcedure.input(z.object({
      originalContent: z.string().min(1),
      instruction: z.string().optional(),
      targetType: z.enum(["ad_copy_short", "ad_copy_long", "blog_post", "seo_meta", "social_caption", "video_script", "email_copy", "pr_release", "podcast_script", "tv_script", "radio_script", "copywriting", "amazon_listing", "google_ads", "youtube_seo", "twitter_thread", "linkedin_article", "whatsapp_broadcast", "sms_copy", "story_content", "ugc_script", "landing_page"]).optional(),
      platform: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const limit = await checkLimit(ctx.user.id, "ai_generation");
      if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG, cause: limit });
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert content remixer. Take the given content and recreate it — make it better, more engaging, more persuasive, and more effective. Maintain the core message but elevate everything: the hook, the structure, the emotional appeal, and the CTA. If a target format is specified, adapt the content to that format." },
          { role: "user", content: `Original content to remix:\n\n${input.originalContent}\n\n${input.targetType ? `Remix into format: ${input.targetType.replace(/_/g, " ")}` : "Remix and make it significantly better"}\n${input.platform ? `Target platform: ${input.platform}` : ""}\n${input.instruction ? `Additional instructions: ${input.instruction}` : ""}` },
        ],
      });
      const remixed = response.choices[0].message.content as string;
      const title = `[Remixed] ${remixed.split("\n")[0]?.replace(/^#+\s*/, "").substring(0, 240) || "Remixed content"}`;
      const result = await db.createContent({
        userId: ctx.user.id,
        type: input.targetType || "copywriting",
        platform: input.platform ?? null,
        title,
        body: remixed,
        status: "draft",
        metadata: { remixedFrom: input.originalContent.substring(0, 200) },
      });
      await consumeLimit(ctx.user.id, "ai_generation", limit);
      return { id: result.id, title, body: remixed };
    }),
    repurpose: protectedProcedure.input(z.object({
      contentId: z.number(),
      targetTypes: z.array(z.string()).min(1),
    })).mutation(async ({ ctx, input }) => {
      const limit = await checkLimit(ctx.user.id, "ai_generation");
      if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG, cause: limit });
      const original = await db.getContentById(input.contentId);
      if (!original) throw new TRPCError({ code: "NOT_FOUND" });
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a content repurposing expert. Take one piece of content and transform it into multiple formats while preserving the core message. Return JSON." },
          { role: "user", content: `Repurpose this content into these formats: ${input.targetTypes.join(", ")}\n\nOriginal (${original.type}):\n${original.body}\n\nReturn JSON with an array called 'pieces', each with: { type, title, body }` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "repurposed_content",
            strict: true,
            schema: {
              type: "object",
              properties: {
                pieces: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      title: { type: "string" },
                      body: { type: "string" },
                    },
                    required: ["type", "title", "body"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["pieces"],
              additionalProperties: false,
            },
          },
        },
      });
      const { pieces } = JSON.parse(response.choices[0].message.content as string);
      const created = [];
      for (const piece of pieces) {
        const r = await db.createContent({
          userId: ctx.user.id,
          productId: original.productId ?? null,
          campaignId: original.campaignId ?? null,
          type: piece.type as any,
          title: piece.title,
          body: piece.body,
          status: "draft",
          metadata: { repurposedFrom: input.contentId },
        });
        created.push({ id: r.id, type: piece.type, title: piece.title });
      }
      await consumeLimit(ctx.user.id, "ai_generation", limit);
      return { created };
    }),
  }),

  // ─── AI Chat Agent (executor with tools) ───────────────────────────
  aiChat: router({
    send: protectedProcedure.input(z.object({
      message: z.string(),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional(),
      attachments: z.array(z.object({ url: z.string(), name: z.string().optional() })).optional(),
    })).mutation(async ({ ctx, input }) => {
      const hasMessage = (input.message ?? "").trim().length > 0;
      const hasAttach = (input.attachments?.length ?? 0) > 0;
      if (!hasMessage && !hasAttach) throw new TRPCError({ code: "BAD_REQUEST", message: "Message or attachment required" });
      const { runAgentLoop } = await import("./aiAgent");
      const history = input.history ?? [];
      let message = (input.message ?? "").trim() || "I’ve attached the file(s) above. Please use them for context.";
      if (input.attachments?.length) {
        const attachLine = input.attachments.map(a => `[Attached: ${a.name || "file"} (${a.url})]`).join(" ");
        message = `${attachLine}\n\n${message}`;
      }
      const { reply, toolResults } = await runAgentLoop(ctx.user.id, message, history);
      return { reply, toolResults };
    }),
  }),

  // ─── Creative (Image) Generation ──────────────────────────────────
  creative: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCreativesByUser(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getCreativeById(input.id);
    }),
    generate: protectedProcedure.input(z.object({
      productId: z.number().optional(),
      campaignId: z.number().optional(),
      type: z.enum(["ad_image", "social_graphic", "thumbnail", "banner", "story"]),
      platform: z.string().optional(),
      style: z.string().optional(),
      customPrompt: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const limit = await checkLimit(ctx.user.id, "ai_image");
      if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG, cause: limit });
      let productInfo = "";
      if (input.productId) {
        const product = await db.getProductById(input.productId);
        if (product) productInfo = `for "${product.name}" - ${product.description || ""}`;
      }

      const typeStyles: Record<string, string> = {
        ad_image: "professional advertising photo, clean composition, product-focused, high contrast, commercial quality",
        social_graphic: "eye-catching social media graphic, bold colors, modern design, shareable, engaging",
        thumbnail: "YouTube/video thumbnail, dramatic, high contrast, text-overlay friendly, attention-grabbing",
        banner: "wide banner format, clean layout, brand-consistent, professional, web-optimized",
        story: "vertical story format, mobile-optimized, vibrant, trendy, Instagram/TikTok style",
      };

      const dimensions: Record<string, string> = {
        ad_image: "1200x628",
        social_graphic: "1080x1080",
        thumbnail: "1280x720",
        banner: "1920x480",
        story: "1080x1920",
      };

      const prompt = `Create a ${typeStyles[input.type]} ${productInfo}. ${input.style ? `Style: ${input.style}.` : ""} ${input.customPrompt || ""} ${input.platform ? `Optimized for ${input.platform}.` : ""} Photorealistic, professional marketing quality.`;

      const creativeRecord = await db.createCreative({
        userId: ctx.user.id,
        productId: input.productId ?? null,
        campaignId: input.campaignId ?? null,
        type: input.type,
        prompt,
        platform: input.platform ?? null,
        dimensions: dimensions[input.type],
        status: "generating",
      });

      try {
        const { url } = await generateImage({ prompt });
        await db.updateCreative(creativeRecord.id, { imageUrl: url, status: "completed" });
        await consumeLimit(ctx.user.id, "ai_image", limit);
        return { id: creativeRecord.id, imageUrl: url, status: "completed" };
      } catch (error) {
        await db.updateCreative(creativeRecord.id, { status: "failed" });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Image generation failed" });
      }
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteCreative(input.id);
      return { success: true };
    }),
  }),

  // ─── Website Intelligence Analyzer (SimilarWeb Competitor) ────────
  intelligence: router({
    analyzeWebsite: protectedProcedure.input(z.object({
      url: z.string().min(1),
      depth: z.enum(["quick", "standard", "deep"]).default("standard"),
    })).mutation(async ({ ctx, input }) => {
      const limit = await checkLimit(ctx.user.id, "website_analysis");
      if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG, cause: limit });
      // Real-time website scraping: fetch actual page data before AI analysis
      let scrapedData = "";
      try {
        const targetUrl = input.url.startsWith("http") ? input.url : `https://${input.url}`;
        const fetchResponse = await fetch(targetUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; OtobiAIBot/1.0)" },
          signal: AbortSignal.timeout(15000),
        });
        const html = await fetchResponse.text();
        // Extract useful metadata from HTML
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const metaKeywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
        const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
        const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
        const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi)?.map(h => h.replace(/<[^>]+>/g, "").trim()).slice(0, 5) || [];
        const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi)?.map(h => h.replace(/<[^>]+>/g, "").trim()).slice(0, 10) || [];
        const linkCount = (html.match(/<a /gi) || []).length;
        const imageCount = (html.match(/<img /gi) || []).length;
        const scriptTags = html.match(/<script[^>]*src=["']([^"']+)["']/gi)?.map(s => s.match(/src=["']([^"']+)["']/)?.[1] || "").filter(Boolean).slice(0, 20) || [];
        const hasAnalytics = /google-analytics|gtag|gtm|facebook.*pixel|hotjar|mixpanel|segment|amplitude/i.test(html);
        const hasChat = /intercom|drift|crisp|zendesk|tawk|livechat|hubspot/i.test(html);
        const hasCMS = /wordpress|shopify|wix|squarespace|webflow|ghost/i.test(html);
        const techStack: string[] = [];
        if (/react/i.test(html)) techStack.push("React");
        if (/vue/i.test(html)) techStack.push("Vue.js");
        if (/angular/i.test(html)) techStack.push("Angular");
        if (/next/i.test(html)) techStack.push("Next.js");
        if (/wordpress/i.test(html)) techStack.push("WordPress");
        if (/shopify/i.test(html)) techStack.push("Shopify");
        if (/wix/i.test(html)) techStack.push("Wix");
        if (/squarespace/i.test(html)) techStack.push("Squarespace");
        if (/webflow/i.test(html)) techStack.push("Webflow");
        if (/tailwind/i.test(html)) techStack.push("Tailwind CSS");
        if (/bootstrap/i.test(html)) techStack.push("Bootstrap");
        if (/stripe/i.test(html)) techStack.push("Stripe");
        if (/cloudflare/i.test(html)) techStack.push("Cloudflare");
        if (hasAnalytics) techStack.push("Analytics (GA/GTM/etc)");
        if (hasChat) techStack.push("Live Chat");
        if (hasCMS) techStack.push("CMS Detected");
        // Extract visible text (strip HTML tags, limit to ~3000 chars)
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const bodyText = bodyMatch ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000) : "";
        scrapedData = `\n\n--- REAL SCRAPED DATA FROM WEBSITE ---\nTitle: ${titleMatch?.[1] || "N/A"}\nMeta Description: ${metaDescMatch?.[1] || "N/A"}\nMeta Keywords: ${metaKeywordsMatch?.[1] || "N/A"}\nOG Title: ${ogTitleMatch?.[1] || "N/A"}\nOG Description: ${ogDescMatch?.[1] || "N/A"}\nOG Image: ${ogImageMatch?.[1] || "N/A"}\nCanonical: ${canonicalMatch?.[1] || "N/A"}\nH1 Tags: ${h1Matches.join(", ") || "None"}\nH2 Tags: ${h2Matches.join(", ") || "None"}\nTotal Links: ${linkCount}\nTotal Images: ${imageCount}\nDetected Tech Stack: ${techStack.join(", ") || "Unknown"}\nHas Analytics: ${hasAnalytics}\nHas Live Chat: ${hasChat}\nHas CMS: ${hasCMS}\nKey Scripts: ${scriptTags.slice(0, 10).join(", ")}\nPage Content Preview: ${bodyText.slice(0, 2000)}\n--- END SCRAPED DATA ---`;
      } catch (e) {
        scrapedData = "\n\n[Note: Could not scrape website directly. Analysis based on URL and AI knowledge only.]";
      }

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a world-class competitive intelligence analyst and marketing strategist, similar to SimilarWeb's analysis engine. Given a website URL and real scraped data from the website (when available), provide an extremely comprehensive marketing intelligence report. Use the scraped data (title, meta tags, headings, tech stack, content preview) to make your analysis as accurate as possible. Analyze everything: traffic patterns, audience demographics, SEO strategy, content strategy, social presence, technology stack, competitive landscape, and actionable recommendations. Be specific with numbers, percentages, and data-driven insights. When real data is provided, use it to ground your estimates. Return JSON only.`
          },
          {
            role: "user",
            content: `Provide a comprehensive marketing intelligence report for: ${input.url}

Analysis depth: ${input.depth}
${scrapedData}

Return JSON with:
- overview: { domain, industry, estimatedMonthlyTraffic, globalRank, categoryRank, bounceRate, avgVisitDuration, pagesPerVisit }
- trafficSources: { organic, paid, social, direct, referral, email } (percentages)
- audienceDemographics: { topCountries: [{country, percentage}], ageDistribution: [{range, percentage}], genderSplit: {male, female}, interests: [string] }
- seoAnalysis: { domainAuthority, topKeywords: [{keyword, position, volume}], backlinks, organicTraffic, contentGaps: [string] }
- socialPresence: [{platform, followers, engagement, postFrequency}]
- contentStrategy: { blogFrequency, topContent: [{title, estimatedViews}], contentTypes: [string], tone }
- competitors: [{name, url, overlapScore, strengths: [string]}]
- technologyStack: [string]
- marketingChannels: [{channel, effectiveness, recommendation}]
- swotAnalysis: { strengths: [string], weaknesses: [string], opportunities: [string], threats: [string] }
- actionableRecommendations: [{priority, category, recommendation, expectedImpact}]
- marketingBudgetSuggestion: { monthly, breakdown: [{channel, amount, percentage}] }`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "website_intelligence",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overview: {
                  type: "object",
                  properties: {
                    domain: { type: "string" },
                    industry: { type: "string" },
                    estimatedMonthlyTraffic: { type: "string" },
                    globalRank: { type: "string" },
                    categoryRank: { type: "string" },
                    bounceRate: { type: "string" },
                    avgVisitDuration: { type: "string" },
                    pagesPerVisit: { type: "string" },
                  },
                  required: ["domain", "industry", "estimatedMonthlyTraffic", "globalRank", "categoryRank", "bounceRate", "avgVisitDuration", "pagesPerVisit"],
                  additionalProperties: false,
                },
                trafficSources: {
                  type: "object",
                  properties: {
                    organic: { type: "string" },
                    paid: { type: "string" },
                    social: { type: "string" },
                    direct: { type: "string" },
                    referral: { type: "string" },
                    email: { type: "string" },
                  },
                  required: ["organic", "paid", "social", "direct", "referral", "email"],
                  additionalProperties: false,
                },
                audienceDemographics: {
                  type: "object",
                  properties: {
                    topCountries: { type: "array", items: { type: "object", properties: { country: { type: "string" }, percentage: { type: "string" } }, required: ["country", "percentage"], additionalProperties: false } },
                    ageDistribution: { type: "array", items: { type: "object", properties: { range: { type: "string" }, percentage: { type: "string" } }, required: ["range", "percentage"], additionalProperties: false } },
                    genderSplit: { type: "object", properties: { male: { type: "string" }, female: { type: "string" } }, required: ["male", "female"], additionalProperties: false },
                    interests: { type: "array", items: { type: "string" } },
                  },
                  required: ["topCountries", "ageDistribution", "genderSplit", "interests"],
                  additionalProperties: false,
                },
                seoAnalysis: {
                  type: "object",
                  properties: {
                    domainAuthority: { type: "string" },
                    topKeywords: { type: "array", items: { type: "object", properties: { keyword: { type: "string" }, position: { type: "string" }, volume: { type: "string" } }, required: ["keyword", "position", "volume"], additionalProperties: false } },
                    backlinks: { type: "string" },
                    organicTraffic: { type: "string" },
                    contentGaps: { type: "array", items: { type: "string" } },
                  },
                  required: ["domainAuthority", "topKeywords", "backlinks", "organicTraffic", "contentGaps"],
                  additionalProperties: false,
                },
                socialPresence: { type: "array", items: { type: "object", properties: { platform: { type: "string" }, followers: { type: "string" }, engagement: { type: "string" }, postFrequency: { type: "string" } }, required: ["platform", "followers", "engagement", "postFrequency"], additionalProperties: false } },
                contentStrategy: {
                  type: "object",
                  properties: {
                    blogFrequency: { type: "string" },
                    topContent: { type: "array", items: { type: "object", properties: { title: { type: "string" }, estimatedViews: { type: "string" } }, required: ["title", "estimatedViews"], additionalProperties: false } },
                    contentTypes: { type: "array", items: { type: "string" } },
                    tone: { type: "string" },
                  },
                  required: ["blogFrequency", "topContent", "contentTypes", "tone"],
                  additionalProperties: false,
                },
                competitors: { type: "array", items: { type: "object", properties: { name: { type: "string" }, url: { type: "string" }, overlapScore: { type: "string" }, strengths: { type: "array", items: { type: "string" } } }, required: ["name", "url", "overlapScore", "strengths"], additionalProperties: false } },
                technologyStack: { type: "array", items: { type: "string" } },
                marketingChannels: { type: "array", items: { type: "object", properties: { channel: { type: "string" }, effectiveness: { type: "string" }, recommendation: { type: "string" } }, required: ["channel", "effectiveness", "recommendation"], additionalProperties: false } },
                swotAnalysis: {
                  type: "object",
                  properties: {
                    strengths: { type: "array", items: { type: "string" } },
                    weaknesses: { type: "array", items: { type: "string" } },
                    opportunities: { type: "array", items: { type: "string" } },
                    threats: { type: "array", items: { type: "string" } },
                  },
                  required: ["strengths", "weaknesses", "opportunities", "threats"],
                  additionalProperties: false,
                },
                actionableRecommendations: { type: "array", items: { type: "object", properties: { priority: { type: "string" }, category: { type: "string" }, recommendation: { type: "string" }, expectedImpact: { type: "string" } }, required: ["priority", "category", "recommendation", "expectedImpact"], additionalProperties: false } },
                marketingBudgetSuggestion: {
                  type: "object",
                  properties: {
                    monthly: { type: "string" },
                    breakdown: { type: "array", items: { type: "object", properties: { channel: { type: "string" }, amount: { type: "string" }, percentage: { type: "string" } }, required: ["channel", "amount", "percentage"], additionalProperties: false } },
                  },
                  required: ["monthly", "breakdown"],
                  additionalProperties: false,
                },
              },
              required: ["overview", "trafficSources", "audienceDemographics", "seoAnalysis", "socialPresence", "contentStrategy", "competitors", "technologyStack", "marketingChannels", "swotAnalysis", "actionableRecommendations", "marketingBudgetSuggestion"],
              additionalProperties: false,
            },
          },
        },
      });

      await consumeLimit(ctx.user.id, "website_analysis", limit);
      return JSON.parse(response.choices[0].message.content as string);
    }),
    generateHookVariations: protectedProcedure.input(z.object({
      topic: z.string().min(1),
      platform: z.string().optional(),
      count: z.number().min(1).max(20).default(10),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a viral content hook specialist. Generate attention-grabbing hooks that stop people from scrolling. Return JSON only." },
          {
            role: "user",
            content: `Generate ${input.count} viral hooks for: ${input.topic}\nPlatform: ${input.platform || "all"}\n\nReturn JSON: { hooks: [{ text: string, type: string, psychologicalTrigger: string }] }`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "hooks",
            strict: true,
            schema: {
              type: "object",
              properties: {
                hooks: { type: "array", items: { type: "object", properties: { text: { type: "string" }, type: { type: "string" }, psychologicalTrigger: { type: "string" } }, required: ["text", "type", "psychologicalTrigger"], additionalProperties: false } },
              },
              required: ["hooks"],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(response.choices[0].message.content as string);
    }),
  }),

  // ─── Video Ad Generation (Arcads-level) ──────────────────────────────
  videoAd: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getVideoAdsByUser(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getVideoAdById(input.id);
    }),
    generate: protectedProcedure.input(z.object({
      productId: z.number().optional(),
      campaignId: z.number().optional(),
      platform: z.enum(["tiktok", "youtube_shorts", "instagram_reels", "youtube", "facebook", "snapchat", "pinterest"]),
      platforms: z.array(z.enum(["tiktok", "youtube_shorts", "instagram_reels", "youtube", "facebook", "snapchat", "pinterest"])).optional(),
      duration: z.number().min(5).max(180).default(30),
      avatarStyle: z.string().optional(),
      avatarName: z.string().optional(),
      emotion: z.enum(["neutral", "happy", "excited", "urgent", "calm", "surprised", "empathetic", "authoritative"]).default("neutral"),
      language: z.string().default("English"),
      adPreset: z.enum(["ugc_testimonial", "product_demo", "before_after", "problem_solution", "listicle", "unboxing", "tutorial", "comparison", "trending_sound", "custom"]).default("custom"),
      includeSubtitles: z.boolean().default(true),
      includeBroll: z.boolean().default(true),
      musicStyle: z.string().optional(),
      customPrompt: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const limit = await checkLimit(ctx.user.id, "video_script");
      if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG, cause: limit });

      let productContext = "";
      if (input.productId) {
        const product = await db.getProductById(input.productId);
        if (product) {
          productContext = `Product: ${product.name}\nDescription: ${product.description || ""}\nKey Features: ${(product.features as string[] || []).join(", ")}\nBenefits: ${(product.benefits as string[] || []).join(", ")}`;
        }
      }

      const platformSpecs: Record<string, string> = {
        tiktok: "TikTok (vertical 9:16, fast-paced, trending, hook in first 1s, 15-60s)",
        youtube_shorts: "YouTube Shorts (vertical 9:16, engaging, educational or entertaining, 15-60s)",
        instagram_reels: "Instagram Reels (vertical 9:16, aesthetic, lifestyle-focused, 15-90s)",
        youtube: "YouTube (horizontal 16:9, detailed, professional, 30-180s)",
        facebook: "Facebook (square or vertical, broad appeal, 15-60s)",
        snapchat: "Snapchat (vertical, casual, young audience, 10-30s)",
        pinterest: "Pinterest (vertical 2:3 or 9:16, inspirational, 15-30s)",
      };
      const platformsList = (input.platforms?.length ? input.platforms : [input.platform]) as (keyof typeof platformSpecs)[];
      const platformPrompt =
        platformsList.length > 1
          ? `optimized for multiple platforms: ${platformsList.map(p => platformSpecs[p] || p).join("; ")}. Ensure the script works across all (e.g. vertical-first, punchy hook).`
          : platformSpecs[input.platform];

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a video ad creative director. Create compelling video ad scripts with detailed storyboards. Return JSON only."
          },
          {
            role: "user",
            content: `Create a ${input.duration}-second video ad script ${platformPrompt}.

${productContext}
${input.customPrompt ? `Additional direction: ${input.customPrompt}` : ""}

Return JSON with:
- script: full narration/voiceover script
- voiceoverText: clean voiceover text without stage directions
- storyboard: array of scenes, each with { scene: "Scene N", description: "visual description", duration: "Xs" }
- hook: the opening hook text
- cta: the call to action`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "video_ad",
            strict: true,
            schema: {
              type: "object",
              properties: {
                script: { type: "string" },
                voiceoverText: { type: "string" },
                storyboard: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      scene: { type: "string" },
                      description: { type: "string" },
                      duration: { type: "string" },
                    },
                    required: ["scene", "description", "duration"],
                    additionalProperties: false,
                  },
                },
                hook: { type: "string" },
                cta: { type: "string" },
              },
              required: ["script", "voiceoverText", "storyboard", "hook", "cta"],
              additionalProperties: false,
            },
          },
        },
      });

      const videoData = JSON.parse(response.choices[0].message.content as string);

      // Generate thumbnail
      let thumbnailUrl: string | undefined;
      try {
        const thumbResult = await generateImage({
          prompt: `Video ad thumbnail for ${platformSpecs[input.platform]}: ${videoData.hook}. Professional, eye-catching, high contrast, photorealistic.`
        });
        thumbnailUrl = thumbResult.url;
      } catch (e) {
        // Thumbnail generation is optional
      }

      await consumeLimit(ctx.user.id, "video_script", limit);
      const result = await db.createVideoAd({
        userId: ctx.user.id,
        productId: input.productId ?? null,
        campaignId: input.campaignId ?? null,
        platform: input.platform,
        script: videoData.script,
        storyboard: videoData.storyboard,
        voiceoverText: videoData.voiceoverText,
        avatarStyle: input.avatarStyle ?? "professional",
        duration: input.duration,
        thumbnailUrl: thumbnailUrl ?? null,
        status: "completed",
        metadata: {
          hook: videoData.hook,
          cta: videoData.cta,
          ...(platformsList.length > 1 && { platforms: platformsList }),
        },
      });

      return { id: result.id, ...videoData, thumbnailUrl };
    }),
    // AI Actor library
    getActors: protectedProcedure.query(async () => {
      return {
        actors: [
          { id: "actor_1", name: "Sarah", style: "professional", gender: "female", age: "25-35", ethnicity: "caucasian", languages: ["English", "Spanish", "French"] },
          { id: "actor_2", name: "Marcus", style: "casual", gender: "male", age: "25-35", ethnicity: "african_american", languages: ["English", "French"] },
          { id: "actor_3", name: "Yuki", style: "energetic", gender: "female", age: "20-30", ethnicity: "asian", languages: ["English", "Japanese", "Korean", "Mandarin"] },
          { id: "actor_4", name: "Diego", style: "authoritative", gender: "male", age: "30-45", ethnicity: "hispanic", languages: ["English", "Spanish", "Portuguese"] },
          { id: "actor_5", name: "Priya", style: "warm", gender: "female", age: "25-35", ethnicity: "south_asian", languages: ["English", "Hindi", "Tamil"] },
          { id: "actor_6", name: "Alex", style: "gen_z", gender: "non_binary", age: "18-25", ethnicity: "mixed", languages: ["English", "German"] },
          { id: "actor_7", name: "Fatima", style: "elegant", gender: "female", age: "25-40", ethnicity: "middle_eastern", languages: ["English", "Arabic", "French"] },
          { id: "actor_8", name: "James", style: "corporate", gender: "male", age: "35-50", ethnicity: "caucasian", languages: ["English", "German", "Dutch"] },
          { id: "actor_9", name: "Amara", style: "influencer", gender: "female", age: "20-30", ethnicity: "african", languages: ["English", "Swahili", "French"] },
          { id: "actor_10", name: "Chen", style: "tech_savvy", gender: "male", age: "25-35", ethnicity: "asian", languages: ["English", "Mandarin", "Cantonese"] },
        ],
      };
    }),
    // Create custom AI avatar with full diversity options
    createAvatar: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      gender: z.enum(["male", "female", "non-binary"]),
      ageRange: z.enum(["18-25", "25-35", "35-45", "45-55", "55-65", "65+"]),
      style: z.enum(["professional", "casual", "creative", "corporate", "streetwear", "athletic", "luxury", "bohemian"]),
      ethnicity: z.enum(["african", "african_american", "east_asian", "south_asian", "southeast_asian", "middle_eastern", "hispanic_latino", "caucasian", "indigenous", "pacific_islander", "mixed", "other"]).optional(),
      skinTone: z.enum(["very_light", "light", "medium_light", "medium", "medium_dark", "dark", "very_dark"]).optional(),
      hairStyle: z.enum(["straight", "wavy", "curly", "coily", "braids", "locs", "afro", "bald", "short", "long", "ponytail", "bun", "hijab", "turban"]).optional(),
      hairColor: z.enum(["black", "dark_brown", "brown", "light_brown", "blonde", "red", "auburn", "gray", "white", "blue", "pink", "purple"]).optional(),
      bodyType: z.enum(["slim", "average", "athletic", "curvy", "plus_size"]).optional(),
      facialFeatures: z.string().optional(),
      clothing: z.string().optional(),
      background: z.enum(["studio_white", "studio_gray", "office", "outdoor", "home", "urban", "nature", "abstract"]).optional(),
      languages: z.array(z.string()),
    })).mutation(async ({ input }) => {
      const ethnicityDesc = input.ethnicity ? `${input.ethnicity.replace(/_/g, " ")} ethnicity, ` : "";
      const skinDesc = input.skinTone ? `${input.skinTone.replace(/_/g, " ")} skin tone, ` : "";
      const hairStyleDesc = input.hairStyle ? `${input.hairStyle.replace(/_/g, " ")} hair, ` : "";
      const hairColorDesc = input.hairColor ? `${input.hairColor.replace(/_/g, " ")} hair color, ` : "";
      const bodyDesc = input.bodyType ? `${input.bodyType.replace(/_/g, " ")} build, ` : "";
      const facialDesc = input.facialFeatures ? `${input.facialFeatures}, ` : "";
      const clothingDesc = input.clothing ? `wearing ${input.clothing}, ` : "";
      const bgDesc = input.background ? `${input.background.replace(/_/g, " ")} background` : "clean studio background";

      const avatarImage = await generateImage({
        prompt: `Professional headshot portrait of a ${input.description}. ${input.gender}, ${input.ageRange} years old, ${ethnicityDesc}${skinDesc}${hairStyleDesc}${hairColorDesc}${bodyDesc}${facialDesc}${clothingDesc}${input.style} style. ${bgDesc}, studio lighting, high quality, photorealistic, 4K.`
      });
      return {
        ...input,
        id: `custom_${Date.now()}`,
        imageUrl: avatarImage.url,
      };
    }),
    // Localize video to another language
    localize: protectedProcedure.input(z.object({
      videoAdId: z.number(),
      targetLanguage: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const original = await db.getVideoAdById(input.videoAdId);
      if (!original) throw new TRPCError({ code: "NOT_FOUND" });

      const response = await invokeLLM({
        messages: [
          { role: "system", content: `You are a professional translator and cultural adaptation specialist. Translate and culturally adapt video ad scripts. Return JSON only.` },
          {
            role: "user",
            content: `Translate and culturally adapt this video ad to ${input.targetLanguage}:\n\nOriginal script: ${original.script}\nOriginal voiceover: ${original.voiceoverText}\n\nReturn JSON with: { script: string, voiceoverText: string, culturalNotes: string }`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "localized_video",
            strict: true,
            schema: {
              type: "object",
              properties: {
                script: { type: "string" },
                voiceoverText: { type: "string" },
                culturalNotes: { type: "string" },
              },
              required: ["script", "voiceoverText", "culturalNotes"],
              additionalProperties: false,
            },
          },
        },
      });

      const localized = JSON.parse(response.choices[0].message.content as string);
      const result = await db.createVideoAd({
        userId: ctx.user.id,
        productId: original.productId,
        campaignId: original.campaignId,
        platform: original.platform,
        script: localized.script,
        storyboard: original.storyboard,
        voiceoverText: localized.voiceoverText,
        avatarStyle: original.avatarStyle,
        duration: original.duration,
        thumbnailUrl: original.thumbnailUrl,
        status: "completed",
        metadata: { language: input.targetLanguage, culturalNotes: localized.culturalNotes, originalId: input.videoAdId },
      });
      return { id: result.id, ...localized };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteVideoAd(input.id);
      return { success: true };
    }),
  }),

  // ─── Campaigns ─────────────────────────────────────────────────────
  campaign: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCampaignsByUser(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getCampaignById(input.id);
    }),
    assets: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      return db.getCampaignAssetsByCampaignId(input.campaignId);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      productId: z.number().optional(),
      goal: z.string().optional(),
      platforms: z.array(z.string()),
      objective: z.enum(["awareness", "traffic", "engagement", "leads", "sales", "app_installs"]),
      budget: z.string().optional(),
      totalBudget: z.number().optional(),
      targetAudience: z.any().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await db.createCampaign({
        userId: ctx.user.id,
        productId: input.productId ?? null,
        name: input.name,
        description: input.description ?? null,
        goal: input.goal ?? null,
        platforms: input.platforms,
        objective: input.objective,
        budget: input.budget ?? null,
        totalBudget: input.totalBudget != null ? String(input.totalBudget) : null,
        targetAudience: input.targetAudience ?? null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        status: "draft",
      });
      return result;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["draft", "active", "paused", "completed", "archived"]).optional(),
      platforms: z.array(z.string()).optional(),
      budget: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCampaign(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteCampaign(input.id);
      return { success: true };
    }),
    generateStrategy: protectedProcedure.input(z.object({
      campaignId: z.number(),
    })).mutation(async ({ input }) => {
      const campaign = await db.getCampaignById(input.campaignId);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      let productContext = "";
      if (campaign.productId) {
        const product = await db.getProductById(campaign.productId);
        if (product) productContext = `Product: ${product.name} - ${product.description || ""}\nFeatures: ${(product.features as string[] || []).join(", ")}`;
      }

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a marketing campaign strategist. Create a comprehensive campaign strategy." },
          {
            role: "user",
            content: `Create a campaign strategy for:
Campaign: ${campaign.name}
Objective: ${campaign.objective}
Platforms: ${(campaign.platforms as string[] || []).join(", ")}
Budget: ${campaign.budget || "Not specified"}
${productContext}

Provide: recommended content types per platform, posting schedule, audience targeting tips, budget allocation, KPIs to track, and creative recommendations.`
          }
        ],
      });

      return { strategy: response.choices[0].message.content as string };
    }),
    wizardGenerate: protectedProcedure.input(z.object({
      goals: z.array(z.string().min(1)).min(1),
      businessContext: z.object({
        businessName: z.string().optional(),
        whatYouSell: z.string().optional(),
        targetAudience: z.string().optional(),
        brandTone: z.string().optional(),
      }).optional(),
      details: z.object({
        campaignName: z.string().min(1),
        offer: z.string().min(1),
        targetAudience: z.string().optional(),
        budget: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        channels: z.array(z.enum(["landing_page", "paid_ads", "email", "social", "sms"])),
      }),
    })).mutation(async ({ ctx, input }) => {
      const { generateCampaignFromWizard } = await import("./campaignWizard");
      return generateCampaignFromWizard(
        ctx.user.id,
        input.goals,
        input.businessContext || {},
        input.details
      );
    }),
    wizardLaunch: protectedProcedure.input(z.object({ campaignId: z.number() })).mutation(async ({ ctx, input }) => {
      const { launchWizardCampaign } = await import("./campaignWizard");
      return launchWizardCampaign(ctx.user.id, input.campaignId);
    }),

    // ── Campaign Workspace: everything owned by a campaign in one call ──
    workspace: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ ctx, input }) => {
      const { campaignId } = input;
      const campaign = await db.getCampaignById(campaignId);
      if (!campaign || campaign.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });

      const safe = async <T>(fn: () => Promise<T[]>): Promise<T[]> => {
        try { return await fn(); } catch { return []; }
      };

      const [
        contents,
        creatives,
        videoAds,
        emailSequences,
        landingPages,
        scheduledPosts,
        analytics,
        leads,
        assets,
      ] = await Promise.all([
        safe(() => db.getContentsByCampaign(campaignId)),
        safe(() => db.getCreativesByCampaign(campaignId)),
        safe(() => db.getVideoAdsByCampaign(campaignId)),
        safe(() => db.getEmailCampaignsByCampaign(campaignId)),
        safe(() => db.getLandingPagesByCampaign(campaignId)),
        safe(() => db.getScheduledPostsByCampaign(campaignId)),
        safe(() => db.getAnalyticsByCampaign(campaignId)),
        safe(() => db.getLeadsByCampaign(campaignId)),
        safe(() => db.getCampaignAssetsByCampaignId(campaignId)),
      ]);

      // Backfill fallback: if assets were created before campaignId column existed
      // (NULL campaignId), show the user's most recent assets created within
      // 5 minutes of this campaign as a best-effort association
      const totalAssets = contents.length + creatives.length + videoAds.length +
        emailSequences.length + landingPages.length;

      let fallbackContents = contents;
      let fallbackVideoAds = videoAds;
      let fallbackEmailSeqs = emailSequences;
      let fallbackPages = landingPages;

      if (totalAssets === 0) {
        const campaignCreatedAt = new Date(campaign.createdAt).getTime();
        const windowMs = 10 * 60 * 1000; // 10 minute window

        const [allContents, allVideos, allEmails, allPages] = await Promise.all([
          safe(() => db.getContentsByUser(ctx.user.id)),
          safe(() => db.getVideoAdsByUser(ctx.user.id)),
          safe(() => db.getEmailCampaignsByUser(ctx.user.id)),
          safe(() => db.getLandingPagesByUser(ctx.user.id)),
        ]);

        const inWindow = (item: { createdAt: Date | string }) => {
          const t = new Date(item.createdAt).getTime();
          return Math.abs(t - campaignCreatedAt) < windowMs;
        };

        fallbackContents = allContents.filter(inWindow).slice(0, 20) as typeof contents;
        fallbackVideoAds = allVideos.filter(inWindow).slice(0, 10) as typeof videoAds;
        fallbackEmailSeqs = allEmails.filter(inWindow).slice(0, 5) as typeof emailSequences;
        fallbackPages = allPages.filter(inWindow).slice(0, 3) as typeof landingPages;

        // Backfill campaignId on these orphaned assets so they're linked going forward
        const updatePromises: Promise<unknown>[] = [];
        for (const c of fallbackContents) {
          if (!(c as any).campaignId) updatePromises.push(safe(() => db.updateContent((c as any).id, { campaignId } as any).then(() => [])));
        }
        for (const v of fallbackVideoAds) {
          if (!(v as any).campaignId) updatePromises.push(safe(() => db.updateVideoAd((v as any).id, { campaignId } as any).then(() => [])));
        }
        for (const e of fallbackEmailSeqs) {
          if (!(e as any).campaignId) updatePromises.push(safe(() => db.updateEmailCampaign((e as any).id, { campaignId } as any).then(() => [])));
        }
        for (const p of fallbackPages) {
          if (!(p as any).campaignId) updatePromises.push(safe(() => db.updateLandingPage((p as any).id, { campaignId } as any).then(() => [])));
        }
        await Promise.allSettled(updatePromises);
      }

      const finalContents = fallbackContents;
      const finalVideoAds = fallbackVideoAds;
      const finalEmailSeqs = fallbackEmailSeqs;
      const finalPages = fallbackPages;

      const totalImpressions = analytics.reduce((s, e) => s + Number(e.impressions || 0), 0);
      const totalClicks      = analytics.reduce((s, e) => s + Number(e.clicks || 0), 0);
      const totalConversions = analytics.reduce((s, e) => s + Number(e.conversions || 0), 0);
      const totalRevenue     = analytics.reduce((s, e) => s + Number(e.revenue || 0), 0);

      return {
        campaign,
        contents: finalContents,
        creatives,
        videoAds: finalVideoAds,
        emailSequences: finalEmailSeqs,
        landingPages: finalPages,
        scheduledPosts,
        leads,
        assets,
        analytics: { totalImpressions, totalClicks, totalConversions, totalRevenue, events: analytics },
        summary: {
          contentCount:  finalContents.length,
          creativeCount: creatives.length,
          videoCount:    finalVideoAds.length,
          emailCount:    finalEmailSeqs.length,
          leadCount:     leads.length,
          pageCount:     finalPages.length,
          postCount:     scheduledPosts.length,
        },
      };
    }),
  }),

  // ─── A/B Testing ───────────────────────────────────────────────────
  abTest: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getAbTestsByUser(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const test = await db.getAbTestById(input.id);
      if (!test) return null;
      const variants = await db.getVariantsByTest(input.id);
      return { ...test, variants };
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      campaignId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createAbTest({
        userId: ctx.user.id,
        campaignId: input.campaignId ?? null,
        name: input.name,
        status: "draft",
      });
    }),
    addVariant: protectedProcedure.input(z.object({
      testId: z.number(),
      name: z.string(),
      contentId: z.number().optional(),
      creativeId: z.number().optional(),
    })).mutation(async ({ input }) => {
      return db.createAbTestVariant({
        testId: input.testId,
        name: input.name,
        contentId: input.contentId ?? null,
        creativeId: input.creativeId ?? null,
      });
    }),
    updateVariant: protectedProcedure.input(z.object({
      id: z.number(),
      impressions: z.number().optional(),
      clicks: z.number().optional(),
      conversions: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const ctr = data.impressions && data.clicks ? ((data.clicks / data.impressions) * 100).toFixed(2) : undefined;
      const conversionRate = data.clicks && data.conversions ? ((data.conversions / data.clicks) * 100).toFixed(2) : undefined;
      await db.updateAbTestVariant(id, { ...data, ctr, conversionRate });
      return { success: true };
    }),
    generateVariations: protectedProcedure.input(z.object({
      testId: z.number(),
      productId: z.number().optional(),
      type: z.enum(["ad_copy_short", "ad_copy_long", "social_caption"]),
      count: z.number().min(2).max(5).default(3),
    })).mutation(async ({ ctx, input }) => {
      let productContext = "";
      if (input.productId) {
        const product = await db.getProductById(input.productId);
        if (product) productContext = `Product: ${product.name}\nDescription: ${product.description || ""}\nBenefits: ${(product.benefits as string[] || []).join(", ")}`;
      }

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an A/B testing specialist. Generate distinct creative variations for testing. Return JSON array." },
          {
            role: "user",
            content: `Generate ${input.count} distinct ${input.type.replace(/_/g, " ")} variations for A/B testing.
${productContext}
Each variation should test a different angle: emotional appeal, logical/feature-based, urgency/scarcity, social proof, or curiosity.
Return JSON array of objects with: { name: "Variant A/B/C...", content: "the copy text", angle: "the testing angle" }`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ab_variations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                variations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      content: { type: "string" },
                      angle: { type: "string" },
                    },
                    required: ["name", "content", "angle"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["variations"],
              additionalProperties: false,
            },
          },
        },
      });

      const { variations } = JSON.parse(response.choices[0].message.content as string);
      const createdVariants = [];

      for (const v of variations) {
        const contentResult = await db.createContent({
          userId: ctx.user.id,
          productId: input.productId ?? null,
          type: input.type,
          title: v.name,
          body: v.content,
          status: "draft",
          metadata: { angle: v.angle },
        });
        const variantResult = await db.createAbTestVariant({
          testId: input.testId,
          name: v.name,
          contentId: contentResult.id,
        });
        createdVariants.push({ ...variantResult, content: v.content, angle: v.angle });
      }

      return { variants: createdVariants };
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["draft", "running", "completed", "cancelled"]),
      winnerVariantId: z.number().optional(),
    })).mutation(async ({ input }) => {
      await db.updateAbTest(input.id, { status: input.status, winnerVariantId: input.winnerVariantId ?? null });
      return { success: true };
    }),
  }),

  // ─── Scheduled Posts ───────────────────────────────────────────────
  schedule: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getScheduledPostsByUser(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      campaignId: z.number().optional(),
      contentId: z.number().optional(),
      creativeId: z.number().optional(),
      platform: z.string(),
      scheduledAt: z.string(),
    })).mutation(async ({ ctx, input }) => {
      return db.createScheduledPost({
        userId: ctx.user.id,
        campaignId: input.campaignId ?? null,
        contentId: input.contentId ?? null,
        creativeId: input.creativeId ?? null,
        platform: input.platform,
        scheduledAt: new Date(input.scheduledAt),
        status: "scheduled",
      });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["scheduled", "publishing", "published", "failed", "cancelled"]).optional(),
      scheduledAt: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
      await db.updateScheduledPost(id, updateData);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteScheduledPost(input.id);
      return { success: true };
    }),
    getOptimalTimes: protectedProcedure.input(z.object({
      platform: z.string(),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a social media timing expert. Return JSON only." },
          {
            role: "user",
            content: `What are the optimal posting times for ${input.platform}? Return JSON with:
- bestTimes: array of { day: "Monday-Sunday", times: ["HH:MM"] } objects
- reasoning: brief explanation
- timezone: "UTC"`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "optimal_times",
            strict: true,
            schema: {
              type: "object",
              properties: {
                bestTimes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string" },
                      times: { type: "array", items: { type: "string" } },
                    },
                    required: ["day", "times"],
                    additionalProperties: false,
                  },
                },
                reasoning: { type: "string" },
                timezone: { type: "string" },
              },
              required: ["bestTimes", "reasoning", "timezone"],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(response.choices[0].message.content as string);
    }),
  }),

  // ─── Leads ─────────────────────────────────────────────────────────
  lead: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getLeadsByUser(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getLeadById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      campaignId: z.number().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      source: z.string().optional(),
      platform: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await db.createLead({
        userId: ctx.user.id,
        campaignId: input.campaignId ?? null,
        name: input.name ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        company: input.company ?? null,
        source: input.source ?? null,
        platform: input.platform ?? null,
        notes: input.notes ?? null,
        status: "new",
        score: 0,
      });
      const setting = await db.getAssignmentSetting(ctx.user.id);
      if (setting?.mode === "round_robin" && setting.memberOrder?.length) {
        const nextIndex = ((setting.lastAssignedIndex ?? 0) + 1) % setting.memberOrder.length;
        const assigneeId = setting.memberOrder[nextIndex];
        await db.updateLead(result.id, { assignedToUserId: assigneeId });
        await db.upsertAssignmentSetting(ctx.user.id, { lastAssignedIndex: nextIndex, memberOrder: setting.memberOrder });
      }
      return result;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).optional(),
      score: z.number().optional(),
      notes: z.string().optional(),
      assignedToUserId: z.number().nullable().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateLead(id, data);
      return { success: true };
    }),
    assign: protectedProcedure.input(z.object({ id: z.number(), assignedToUserId: z.number().nullable() })).mutation(async ({ input }) => {
      await db.updateLead(input.id, { assignedToUserId: input.assignedToUserId });
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteLead(input.id);
      return { success: true };
    }),
    byCampaign: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      return db.getLeadsByCampaign(input.campaignId);
    }),
    bulkImport: protectedProcedure.input(z.object({
      leads: z.array(z.object({
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        source: z.string().optional(),
      })),
    })).mutation(async ({ ctx, input }) => {
      const results = [];
      for (const lead of input.leads) {
        const result = await db.createLead({
          userId: ctx.user.id,
          name: lead.name ?? null,
          email: lead.email ?? null,
          phone: lead.phone ?? null,
          company: lead.company ?? null,
          source: lead.source ?? null,
          status: "new",
          score: 0,
        });
        const setting = await db.getAssignmentSetting(ctx.user.id);
        if (setting?.mode === "round_robin" && setting.memberOrder?.length) {
          const nextIndex = ((setting.lastAssignedIndex ?? 0) + 1) % setting.memberOrder.length;
          const assigneeId = setting.memberOrder[nextIndex];
          await db.updateLead(result.id, { assignedToUserId: assigneeId });
          await db.upsertAssignmentSetting(ctx.user.id, { lastAssignedIndex: nextIndex, memberOrder: setting.memberOrder });
        }
        results.push(result);
      }
      return { imported: results.length };
    }),
    getAssignmentSetting: protectedProcedure.query(async ({ ctx }) => {
      return db.getAssignmentSetting(ctx.user.id);
    }),
    saveAssignmentSetting: protectedProcedure.input(z.object({
      mode: z.enum(["manual", "round_robin"]),
      memberOrder: z.array(z.number()).optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.upsertAssignmentSetting(ctx.user.id, { mode: input.mode, memberOrder: input.memberOrder ?? [] });
      return { success: true };
    }),
  }),

  // ─── Analytics ─────────────────────────────────────────────────────
  analytics: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      return db.getAnalyticsSummary(ctx.user.id);
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getAnalyticsByUser(ctx.user.id);
    }),
    byCampaign: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      return db.getAnalyticsByCampaign(input.campaignId);
    }),
    record: protectedProcedure.input(z.object({
      campaignId: z.number().optional(),
      platform: z.string().optional(),
      eventType: z.string(),
      impressions: z.number().optional(),
      clicks: z.number().optional(),
      conversions: z.number().optional(),
      spend: z.string().optional(),
      revenue: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createAnalyticsEvent({
        userId: ctx.user.id,
        campaignId: input.campaignId ?? null,
        platform: input.platform ?? null,
        eventType: input.eventType,
        impressions: input.impressions ?? 0,
        clicks: input.clicks ?? 0,
        conversions: input.conversions ?? 0,
        spend: input.spend ?? null,
        revenue: input.revenue ?? null,
      });
    }),
    getInsights: protectedProcedure.mutation(async ({ ctx }) => {
      const stats = await db.getDashboardStats(ctx.user.id);
      const events = await db.getAnalyticsByUser(ctx.user.id);

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a marketing analytics expert. Provide actionable insights based on campaign data." },
          {
            role: "user",
            content: `Analyze this marketing data and provide insights:
Products: ${stats?.products || 0}
Campaigns: ${stats?.campaigns || 0}
Content pieces: ${stats?.contents || 0}
Leads: ${stats?.leads || 0}
Total Impressions: ${stats?.analytics?.totalImpressions || 0}
Total Clicks: ${stats?.analytics?.totalClicks || 0}
Total Conversions: ${stats?.analytics?.totalConversions || 0}
Total Spend: $${stats?.analytics?.totalSpend || 0}
Total Revenue: $${stats?.analytics?.totalRevenue || 0}

Recent events: ${JSON.stringify(events.slice(0, 20))}

Provide: performance summary, top recommendations, areas for improvement, and predicted trends.`
          }
        ],
      });

      return { insights: response.choices[0].message.content as string };
    }),
  }),

  // ─── Subscription ────────────────────────────────────────────────
  subscription: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      const { getCurrentPeriod, getOrCreateUserUsage, getOrCreateCreditWallet, getSubscriptionForUser } = await import("./creditsAndUsage");
      const plan = (ctx.user.subscriptionPlan || "free") as string;
      const period = await getCurrentPeriod(ctx.user.id);
      const usage = await getOrCreateUserUsage(ctx.user.id, period.start, period.end);
      const wallet = await getOrCreateCreditWallet(ctx.user.id);
      const sub = await getSubscriptionForUser(ctx.user.id);
      return {
        plan,
        stripeCustomerId: ctx.user.stripeCustomerId || null,
        stripeSubscriptionId: ctx.user.stripeSubscriptionId || null,
        trialEndsAt: sub?.trialEndsAt?.toISOString() ?? null,
        periodEnd: sub?.currentPeriodEnd?.toISOString() ?? period.end.toISOString(),
        usage: usage
          ? {
              aiGenerationsUsed: usage.aiGenerationsUsed,
              aiImagesUsed: usage.aiImagesUsed,
              videoScriptsUsed: usage.videoScriptsUsed,
              videoMinutesUsed: usage.videoMinutesUsed,
              websiteAnalysesUsed: usage.websiteAnalysesUsed,
              abTestsUsed: usage.abTestsUsed,
              scheduledPostsUsed: usage.scheduledPostsUsed,
            }
          : null,
        purchasedCredits: wallet?.purchasedCredits ?? 0,
      };
    }),
    featureAccess: protectedProcedure.query(({ ctx }) => {
      return getFeatureAccess(ctx.user.subscriptionPlan ?? undefined);
    }),
  }),

  // ─── Pricing (public — read from tier_limits_config when available; never hardcode in frontend) ─
  pricing: router({
    userCount: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db || typeof db.select !== "function") return 0;
      try {
        const [row] = await db.select({ count: count() }).from(users);
        return Number(row?.count ?? 0);
      } catch {
        return 0;
      }
    }),
    list: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { tierLimitsConfig } = await import("../drizzle/schema");
      const { asc } = await import("drizzle-orm");
      const db = await getDb();
      if (db && typeof db.select === "function") {
        try {
          const rows = await db.select().from(tierLimitsConfig).orderBy(asc(tierLimitsConfig.priceMonthlyCents));
          if (rows.length > 0) {
            return rows.map((r) => ({
              key: r.tier,
              name: r.displayName,
              monthlyPrice: Math.round(r.priceMonthlyCents / 100),
              annualPrice: Math.round(r.priceAnnualCents / 100 / 12),
              annualTotal: Math.round(r.priceAnnualCents / 100),
              tagline: r.tier === "free" ? "Try OTOBI AI risk-free" : r.tier === "agency" ? "Agencies managing multiple clients" : "For growing teams",
              cta: r.tier === "free" ? "Start Free — No Card Required" : r.tier === "agency" ? "Contact Sales" : "Start 7-Day Free Trial",
              popular: r.tier === "professional",
              contactSales: r.tier === "agency",
              featureDspAccess: !!r.featureDspAccess,
              dspMinAdSpendCents: r.dspMinAdSpendCents ?? 0,
            }));
          }
        } catch {
          // fallback to config
        }
      }
      const { PRICING_TIERS } = await import("./pricingConfig");
      return PRICING_TIERS;
    }),
  }),

  // ─── DSP / Programmatic Ads (Spec v4) — gated: Starter+ only ────────
  dsp: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      const access = checkTierAccess(ctx.user.subscriptionPlan ?? undefined, "programmatic_ads");
      if (!access.allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Programmatic Ads is available on Starter and above.", cause: access });
      const db = await getDb();
      if (!db) return { balanceCents: 0, totalSpentCents: 0, totalMarkupEarnedCents: 0, campaigns: [], enabled: false };
      const { dspAdWallets, dspCampaigns } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const wallets = await db.select().from(dspAdWallets).where(eq(dspAdWallets.userId, ctx.user.id)).limit(1);
      const wallet = wallets[0] ?? null;
      const campaigns = await db.select().from(dspCampaigns).where(eq(dspCampaigns.userId, ctx.user.id));
      const { isEpomConfigured } = await import("./services/epom.service");
      return {
        balanceCents: wallet?.balanceCents ?? 0,
        totalDepositedCents: wallet?.totalDepositedCents ?? 0,
        totalSpentCents: wallet?.totalSpentCents ?? 0,
        totalMarkupEarnedCents: wallet?.totalMarkupEarnedCents ?? 0,
        campaigns: campaigns.map((c) => ({ id: c.id, name: c.name, status: c.status, impressions: c.impressions, clicks: c.clicks, spentCents: c.spentCents, aiQualityScore: c.aiQualityScore })),
        enabled: isEpomConfigured(),
      };
    }),
    fundCheckout: protectedProcedure.input(z.object({ amountCents: z.number().min(100) })).mutation(async ({ ctx, input }) => {
      const access = checkTierAccess(ctx.user.subscriptionPlan ?? undefined, "programmatic_ads");
      if (!access.allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Programmatic Ads is available on Starter and above.", cause: access });
      const { createDspFundCheckout } = await import("./stripe-routes");
      const origin = process.env.PUBLIC_URL || process.env.BASE_URL || "https://localhost:5000";
      const { url } = await createDspFundCheckout(ctx.user.id, input.amountCents, origin);
      if (!url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured or session failed" });
      return { url };
    }),
    campaigns: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        const access = checkTierAccess(ctx.user.subscriptionPlan ?? undefined, "programmatic_ads");
        if (!access.allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Programmatic Ads is available on Starter and above.", cause: access });
        const db = await getDb();
        if (!db) return [];
        const { dspCampaigns } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return db.select().from(dspCampaigns).where(eq(dspCampaigns.userId, ctx.user.id));
      }),
      create: protectedProcedure.input(z.object({
        name: z.string().min(1).max(255),
        dailyBudgetCents: z.number().min(0).optional(),
        totalBudgetCents: z.number().min(0).optional(),
        targetingGeo: z.record(z.string(), z.unknown()).optional(),
        creativeType: z.string().max(50).optional(),
        creativeUrl: z.string().url().max(500).optional(),
      })).mutation(async ({ ctx, input }) => {
        const access = checkTierAccess(ctx.user.subscriptionPlan ?? undefined, "programmatic_ads");
        if (!access.allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Programmatic Ads is available on Starter and above.", cause: access });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const { dspAdWallets, dspCampaigns, tierLimitsConfig } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const tier = (ctx.user.subscriptionPlan || "free") as string;
        const tierRows = await db.select({ dspMinAdSpendCents: tierLimitsConfig.dspMinAdSpendCents, dspMarkupRateBps: tierLimitsConfig.dspMarkupRateBps }).from(tierLimitsConfig).where(eq(tierLimitsConfig.tier, tier)).limit(1);
        const minSpendCents = tierRows[0]?.dspMinAdSpendCents ?? 10_000;
        const markupBps = tierRows[0]?.dspMarkupRateBps ?? 3500;
        const budgetCents = (input.totalBudgetCents ?? 0) || (input.dailyBudgetCents ?? 0) * 30;
        if (budgetCents < minSpendCents) throw new TRPCError({ code: "BAD_REQUEST", message: `Minimum campaign spend for your plan is $${(minSpendCents / 100).toFixed(0)}.` });
        const [wallet] = await db.select().from(dspAdWallets).where(eq(dspAdWallets.userId, ctx.user.id)).limit(1);
        const balance = wallet?.balanceCents ?? 0;
        if (balance < (input.dailyBudgetCents ?? 0) && balance < (input.totalBudgetCents ?? 0)) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient ad wallet balance. Fund your wallet first." });
        const insertResult = await db.insert(dspCampaigns).values({
          userId: ctx.user.id,
          name: input.name,
          status: "draft",
          dailyBudgetCents: input.dailyBudgetCents ?? null,
          totalBudgetCents: input.totalBudgetCents ?? null,
          markupRateBps: markupBps,
          targetingGeo: input.targetingGeo ?? null,
          creativeType: input.creativeType ?? null,
          creativeUrl: input.creativeUrl ?? null,
        });
        const id = Number((insertResult as unknown as { insertId?: number }[])?.[0]?.insertId ?? 0);
        const { isEpomConfigured } = await import("./services/epom.service");
        if (isEpomConfigured() && wallet?.epomAccountId) {
          try {
            const { createEpomCampaign, setEpomStatus } = await import("./services/epom.service");
            const epomRes = await createEpomCampaign(wallet.epomAccountId, {
              name: input.name,
              daily_budget_cents: input.dailyBudgetCents ?? Math.floor((input.totalBudgetCents ?? 0) / 30),
              total_budget_cents: input.totalBudgetCents ?? (input.dailyBudgetCents ?? 0) * 30,
              creative_url: input.creativeUrl,
              creative_type: input.creativeType ?? "display",
            }) as { campaignId?: string; id?: string };
            const epomId = epomRes?.campaignId ?? epomRes?.id;
            if (epomId) {
              await db.update(dspCampaigns).set({ epomCampaignId: epomId, status: "active" }).where(eq(dspCampaigns.id, id));
              await setEpomStatus(wallet.epomAccountId, epomId, "active");
            }
          } catch (e) {
            console.warn("[dsp.campaigns.create] Epom create failed:", e);
          }
        }
        return { id, status: "draft" as const };
      }),
    }),
  }),


  // ─── Credits ───────────────────────────────────────────────────────
  credits: router({
    balance: protectedProcedure.query(async ({ ctx }) => {
      const { getOrCreateCreditWallet, getCurrentPeriod, getOrCreateUserUsage } = await import("./creditsAndUsage");
      const wallet = await getOrCreateCreditWallet(ctx.user.id);
      const period = await getCurrentPeriod(ctx.user.id);
      const usage = await getOrCreateUserUsage(ctx.user.id, period.start, period.end);
      const { TIER_LIMITS } = await import("./tierLimits");
      const tier = (ctx.user.subscriptionPlan || "free") as keyof typeof TIER_LIMITS;
      const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
      return {
        purchasedCredits: wallet?.purchasedCredits ?? 0,
        periodStart: period.start.toISOString(),
        periodEnd: period.end.toISOString(),
        usage: usage
          ? {
              aiGenerationsUsed: usage.aiGenerationsUsed,
              aiImagesUsed: usage.aiImagesUsed,
              aiGenerationsLimit: limits.aiGenerationsMonthly,
              aiImagesLimit: limits.aiImagesMonthly,
            }
          : null,
      };
    }),
    packages: protectedProcedure.query(async ({ ctx }) => {
      const { CREDIT_PACKS } = await import("./tierLimits");
      const { TIER_LIMITS } = await import("./tierLimits");
      const tier = (ctx.user.subscriptionPlan || "free") as keyof typeof TIER_LIMITS;
      const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
      const discount = limits.creditTopupDiscountPercent ?? 0;
      return CREDIT_PACKS.map((p) => ({
        id: p.id,
        name: p.name,
        credits: p.credits,
        priceCents: p.priceCents,
        priceCentsAfterDiscount: Math.round((p.priceCents * (100 - discount)) / 100),
        discountPercent: discount,
      }));
    }),
  }),

  // ─── CRM Deals (Pipeline Automation) ──────────────────────────────
  deal: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getDealsByUser(ctx.user.id);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getDealById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1).max(255),
      leadId: z.number().optional(),
      campaignId: z.number().optional(),
      value: z.string().optional(),
      currency: z.string().default("USD"),
      stage: z.enum(["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"]).default("prospecting"),
      probability: z.number().min(0).max(100).default(0),
      expectedCloseDate: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createDeal({
        userId: ctx.user.id,
        title: input.title,
        leadId: input.leadId,
        campaignId: input.campaignId,
        value: input.value,
        currency: input.currency,
        stage: input.stage,
        probability: input.probability,
        expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : undefined,
        notes: input.notes,
      });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      stage: z.enum(["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"]).optional(),
      value: z.string().optional(),
      probability: z.number().min(0).max(100).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateDeal(id, data as any);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteDeal(input.id);
      return { success: true };
    }),
    pipeline: protectedProcedure.query(async ({ ctx }) => {
      return db.getDealPipelineSummary(ctx.user.id);
    }),
    aiForecasting: protectedProcedure.mutation(async ({ ctx }) => {
      const deals = await db.getDealsByUser(ctx.user.id);
      const pipeline = await db.getDealPipelineSummary(ctx.user.id);
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a sales forecasting AI. Analyze the deal pipeline and provide revenue forecasts, win probability analysis, and recommendations. Return JSON with: { forecast30d: string, forecast90d: string, winRate: string, avgDealSize: string, bottlenecks: string[], recommendations: string[], riskDeals: string[] }" },
          { role: "user", content: `Pipeline summary: ${JSON.stringify(pipeline)}\nActive deals: ${JSON.stringify(deals.slice(0, 50))}` }
        ],
        response_format: { type: "json_schema", json_schema: { name: "forecast", strict: true, schema: { type: "object", properties: { forecast30d: { type: "string" }, forecast90d: { type: "string" }, winRate: { type: "string" }, avgDealSize: { type: "string" }, bottlenecks: { type: "array", items: { type: "string" } }, recommendations: { type: "array", items: { type: "string" } }, riskDeals: { type: "array", items: { type: "string" } } }, required: ["forecast30d", "forecast90d", "winRate", "avgDealSize", "bottlenecks", "recommendations", "riskDeals"], additionalProperties: false } } }
      });
      return JSON.parse(response.choices[0].message.content as string);
    }),
  }),

  // ─── CRM Activities ───────────────────────────────────────────────
  activity: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getActivitiesByUser(ctx.user.id);
    }),
    byDeal: protectedProcedure.input(z.object({ dealId: z.number() })).query(async ({ input }) => {
      return db.getActivitiesByDeal(input.dealId);
    }),
    byLead: protectedProcedure.input(z.object({ leadId: z.number() })).query(async ({ input }) => {
      return db.getActivitiesByLead(input.leadId);
    }),
    create: protectedProcedure.input(z.object({
      dealId: z.number().optional(),
      leadId: z.number().optional(),
      type: z.enum(["call", "email", "meeting", "note", "task", "follow_up"]).default("note"),
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      dueDate: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createActivity({
        userId: ctx.user.id,
        dealId: input.dealId,
        leadId: input.leadId,
        type: input.type,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      });
    }),
    complete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.updateActivity(input.id, { status: "completed", completedAt: new Date() });
      return { success: true };
    }),
  }),

  // ─── Ad Platform Connections ──────────────────────────────────────
  adPlatform: router({
    connections: protectedProcedure.query(async ({ ctx }) => {
      return db.getAdPlatformConnectionsByUser(ctx.user.id);
    }),
    connect: protectedProcedure.input(z.object({
      platform: z.string().min(1),
      accountId: z.string().optional(),
      accountName: z.string().optional(),
      accessToken: z.string().optional(),
      refreshToken: z.string().optional(),
      scopes: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createAdPlatformConnection({
        userId: ctx.user.id,
        platform: input.platform,
        accountId: input.accountId,
        accountName: input.accountName,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        scopes: input.scopes,
        status: "connected",
      });
    }),
    disconnect: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.updateAdPlatformConnection(input.id, { status: "disconnected" });
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteAdPlatformConnection(input.id);
      return { success: true };
    }),
    campaigns: protectedProcedure.input(z.object({ connectionId: z.number() })).query(async ({ input }) => {
      return db.getAdPlatformCampaignsByConnection(input.connectionId);
    }),
    allCampaigns: protectedProcedure.query(async ({ ctx }) => {
      return db.getAdPlatformCampaignsByUser(ctx.user.id);
    }),
    launchAd: protectedProcedure.input(z.object({
      connectionId: z.number(),
      campaignId: z.number().optional(),
      name: z.string(),
      budget: z.string().optional(),
      contentId: z.number().optional(),
      creativeId: z.number().optional(),
      targetAudience: z.any().optional(),
    })).mutation(async ({ ctx, input }) => {
      const connection = await db.getAdPlatformConnectionById(input.connectionId);
      if (!connection) throw new TRPCError({ code: "NOT_FOUND", message: "Connection not found" });
      if (connection.status !== "connected") throw new TRPCError({ code: "BAD_REQUEST", message: "Platform not connected" });
      // Create the ad platform campaign record — actual API call would go here with the platform's SDK
      const result = await db.createAdPlatformCampaign({
        userId: ctx.user.id,
        connectionId: input.connectionId,
        campaignId: input.campaignId,
        externalCampaignId: `ext_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        platform: connection.platform,
        name: input.name,
        status: "pending_launch",
        budget: input.budget,
        metadata: { targetAudience: input.targetAudience, contentId: input.contentId, creativeId: input.creativeId },
      });
      return { id: result.id, message: `Ad campaign '${input.name}' queued for launch on ${connection.platform}. Connect your ${connection.platform} API key in Settings to enable auto-posting.` };
    }),
    syncMetrics: protectedProcedure.input(z.object({ connectionId: z.number() })).mutation(async ({ ctx, input }) => {
      // Placeholder for real API sync — would call Meta/Google/TikTok APIs with stored tokens
      const campaigns = await db.getAdPlatformCampaignsByConnection(input.connectionId);
      return { synced: campaigns.length, message: "Metrics sync initiated. Connect platform API keys for live data." };
    }),
  }),

  // ─── Team Collaboration ───────────────────────────────────────────
  team: router({
    members: protectedProcedure.query(async ({ ctx }) => {
      return db.getTeamMembersByOwner(ctx.user.id);
    }),
    invite: protectedProcedure.input(z.object({
      email: z.string().email(),
      name: z.string().optional(),
      role: z.enum(["admin", "editor", "viewer"]).default("viewer"),
      permissions: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const token = `invite_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
      return db.createTeamMember({
        ownerId: ctx.user.id,
        email: input.email,
        name: input.name,
        role: input.role,
        permissions: input.permissions || ["view_campaigns", "view_content", "view_analytics"],
        inviteToken: token,
        inviteStatus: "pending",
      });
    }),
    updateRole: protectedProcedure.input(z.object({
      id: z.number(),
      role: z.enum(["admin", "editor", "viewer"]),
      permissions: z.array(z.string()).optional(),
    })).mutation(async ({ input }) => {
      await db.updateTeamMember(input.id, { role: input.role, permissions: input.permissions });
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteTeamMember(input.id);
      return { success: true };
    }),
  }),

  // ─── Approval Workflows ───────────────────────────────────────────
  approval: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getApprovalsByUser(ctx.user.id);
    }),
    pending: protectedProcedure.query(async ({ ctx }) => {
      return db.getPendingApprovals(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      type: z.enum(["content", "creative", "campaign", "ad_launch"]),
      title: z.string().min(1).max(255),
      contentId: z.number().optional(),
      creativeId: z.number().optional(),
      campaignId: z.number().optional(),
      reviewerId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createApprovalWorkflow({
        userId: ctx.user.id,
        requestedById: ctx.user.id,
        type: input.type,
        title: input.title,
        contentId: input.contentId,
        creativeId: input.creativeId,
        campaignId: input.campaignId,
        reviewerId: input.reviewerId,
        status: "pending",
      });
    }),
    review: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["approved", "rejected", "revision_requested"]),
      comment: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.updateApprovalWorkflow(input.id, {
        status: input.status,
        reviewerId: ctx.user.id,
        reviewerComment: input.comment,
        reviewedAt: new Date(),
      });
      return { success: true };
    }),
  }),

  // ─── Predictive Analytics ─────────────────────────────────────────
  predictive: router({
    scores: protectedProcedure.query(async ({ ctx }) => {
      return db.getPredictiveScoresByUser(ctx.user.id);
    }),
    scoreEntity: protectedProcedure.input(z.object({
      entityType: z.enum(["campaign", "content", "creative", "ad"]),
      entityId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      // Get entity data for AI scoring
      let entityData: any = null;
      if (input.entityType === "campaign") entityData = await db.getCampaignById(input.entityId);
      else if (input.entityType === "content") entityData = await db.getContentById(input.entityId);
      else if (input.entityType === "creative") entityData = await db.getCreativeById(input.entityId);
      if (!entityData) throw new TRPCError({ code: "NOT_FOUND", message: "Entity not found" });

      // Get historical performance data and flywheel patterns (central learning) for context
      const analytics = await db.getAnalyticsByUser(ctx.user.id);
      const flywheelPatterns = await db.getFlywheelPatterns(30);
      const flywheelContext = flywheelPatterns.length > 0
        ? `\nPlatform learning (anonymized patterns from all users): ${JSON.stringify(flywheelPatterns.slice(0, 15).map(p => ({ platform: p.platform, ctrBand: p.ctrBand, patternSummary: p.patternSummary })))}`
        : "";
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a predictive marketing analytics AI. Score the given marketing entity based on historical data, best practices, and any platform learning patterns provided. Return JSON with predicted performance metrics." },
          { role: "user", content: `Entity type: ${input.entityType}\nEntity data: ${JSON.stringify(entityData)}\nHistorical analytics (last 20): ${JSON.stringify(analytics.slice(0, 20))}${flywheelContext}\n\nPredict: CTR, conversion rate, ROAS, engagement score (0-100), virality score (0-100), quality score (0-100), and provide recommendations.` }
        ],
        response_format: { type: "json_schema", json_schema: { name: "prediction", strict: true, schema: { type: "object", properties: { predictedCtr: { type: "string" }, predictedConversionRate: { type: "string" }, predictedRoas: { type: "string" }, engagementScore: { type: "integer" }, viralityScore: { type: "integer" }, qualityScore: { type: "integer" }, recommendations: { type: "array", items: { type: "string" } }, confidence: { type: "string" } }, required: ["predictedCtr", "predictedConversionRate", "predictedRoas", "engagementScore", "viralityScore", "qualityScore", "recommendations", "confidence"], additionalProperties: false } } }
      });

      const prediction = JSON.parse(response.choices[0].message.content as string);
      const saved = await db.createPredictiveScore({
        userId: ctx.user.id,
        entityType: input.entityType,
        entityId: input.entityId,
        predictedCtr: prediction.predictedCtr,
        predictedConversionRate: prediction.predictedConversionRate,
        predictedRoas: prediction.predictedRoas,
        engagementScore: prediction.engagementScore,
        viralityScore: prediction.viralityScore,
        qualityScore: prediction.qualityScore,
        recommendations: prediction.recommendations,
        confidence: prediction.confidence,
      });
      return { id: saved.id, ...prediction };
    }),
    budgetOptimizer: protectedProcedure.input(z.object({
      totalBudget: z.string(),
      platforms: z.array(z.string()),
      objective: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const analytics = await db.getAnalyticsByUser(ctx.user.id);
      const campaigns = await db.getCampaignsByUser(ctx.user.id);
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a marketing budget optimization AI. Analyze historical performance and recommend optimal budget allocation across platforms. Return JSON." },
          { role: "user", content: `Total budget: $${input.totalBudget}\nTarget platforms: ${input.platforms.join(", ")}\nObjective: ${input.objective}\nHistorical analytics: ${JSON.stringify(analytics.slice(0, 30))}\nPast campaigns: ${JSON.stringify(campaigns.slice(0, 20))}\n\nProvide: allocation per platform (%), expected ROI per platform, risk assessment, and optimization tips.` }
        ],
        response_format: { type: "json_schema", json_schema: { name: "budget", strict: true, schema: { type: "object", properties: { allocations: { type: "array", items: { type: "object", properties: { platform: { type: "string" }, percentage: { type: "number" }, amount: { type: "string" }, expectedRoi: { type: "string" }, risk: { type: "string" } }, required: ["platform", "percentage", "amount", "expectedRoi", "risk"], additionalProperties: false } }, overallExpectedRoi: { type: "string" }, optimizationTips: { type: "array", items: { type: "string" } }, riskAssessment: { type: "string" } }, required: ["allocations", "overallExpectedRoi", "optimizationTips", "riskAssessment"], additionalProperties: false } } }
      });
      return JSON.parse(response.choices[0].message.content as string);
    }),
  }),

  // ─── Platform Intelligence ────────────────────────────────────────
  platformIntel: router({
    // Get all platform specs
    allSpecs: protectedProcedure.query(async () => {
      return getAllPlatformSpecs();
    }),
    // Get spec for a single platform
    getSpec: protectedProcedure.input(z.object({ platformId: z.string() })).query(async ({ input }) => {
      const spec = PLATFORM_SPECS[input.platformId];
      if (!spec) throw new TRPCError({ code: "NOT_FOUND", message: "Platform not found" });
      return spec;
    }),
    // Auto-format content for a platform
    formatContent: protectedProcedure.input(z.object({
      content: z.string().min(1),
      platformId: z.string(),
    })).mutation(async ({ input }) => {
      return autoFormatContent(input.content, input.platformId);
    }),
    // Get best posting time for a platform today
    bestTimeToday: protectedProcedure.input(z.object({ platformId: z.string() })).query(async ({ input }) => {
      const result = getTodayBestTime(input.platformId);
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Platform not found" });
      return result;
    }),
    // Get best posting time for a platform on a specific day
    bestTimeForDay: protectedProcedure.input(z.object({
      platformId: z.string(),
      day: z.string(),
    })).query(async ({ input }) => {
      const result = getBestPostingTime(input.platformId, input.day);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),
    // Get recommended aspect ratio
    aspectRatio: protectedProcedure.input(z.object({
      platformId: z.string(),
      contentType: z.enum(["feed", "story", "video"]),
    })).query(async ({ input }) => {
      return { ratio: getRecommendedAspectRatio(input.platformId, input.contentType) };
    }),
    // Multi-platform content formatter — takes content and formats for multiple platforms at once
    multiFormat: protectedProcedure.input(z.object({
      content: z.string().min(1),
      platformIds: z.array(z.string()).min(1),
    })).mutation(async ({ input }) => {
      const results: Record<string, ReturnType<typeof autoFormatContent>> = {};
      for (const pid of input.platformIds) {
        results[pid] = autoFormatContent(input.content, pid);
      }
      return results;
    }),
    // AI-powered platform-specific content adaptation
    adaptContent: protectedProcedure.input(z.object({
      content: z.string().min(1),
      sourcePlatform: z.string(),
      targetPlatform: z.string(),
    })).mutation(async ({ input }) => {
      const sourceSpec = PLATFORM_SPECS[input.sourcePlatform];
      const targetSpec = PLATFORM_SPECS[input.targetPlatform];
      if (!sourceSpec || !targetSpec) throw new TRPCError({ code: "NOT_FOUND", message: "Platform not found" });

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a cross-platform content adaptation expert. Adapt content from one platform's format to another while maintaining the core message but optimizing for the target platform's best practices.`
          },
          {
            role: "user",
            content: `Adapt this content from ${sourceSpec.name} to ${targetSpec.name}.

Original content (${sourceSpec.name}):
${input.content}

Target platform specs:
- Character limit: ${targetSpec.characterLimits.post}
- Best format: ${targetSpec.formatRecommendations[0]?.type || "standard"}
- Hashtag strategy: ${targetSpec.hashtagStrategy.tips}
- Content tips: ${targetSpec.contentTips.join("; ")}

Adapt the content to be native-feeling on ${targetSpec.name}. Maintain the core message but adjust tone, length, hashtags, and format for maximum engagement on ${targetSpec.name}.`
          }
        ],
      });

      return {
        adapted: response.choices[0].message.content as string,
        targetPlatform: targetSpec.name,
        characterLimit: targetSpec.characterLimits.post,
        hashtagStrategy: targetSpec.hashtagStrategy,
      };
    }),
  }),

  // ─── Campaign Continuity & Momentum ──────────────────────────────
  momentum: router({
    // Analyze a campaign and suggest next steps for momentum
    analyze: protectedProcedure.input(z.object({
      campaignId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const campaign = await db.getCampaignById(input.campaignId);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      // Gather all related data
      const contents = await db.getContentsByCampaign(input.campaignId);
      const analytics = await db.getAnalyticsByCampaign(input.campaignId);
      const leads = await db.getLeadsByCampaign(input.campaignId);

      let productContext = "";
      if (campaign.productId) {
        const product = await db.getProductById(campaign.productId);
        if (product) productContext = `Product: ${product.name} - ${product.description || ""}\nFeatures: ${(product.features as string[] || []).join(", ")}`;
      }

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a campaign momentum strategist. Analyze campaign performance and recommend the next wave of content, optimizations, and scaling strategies. Your goal is to maintain and accelerate campaign momentum. Return JSON."
          },
          {
            role: "user",
            content: `Analyze this campaign and recommend next steps for momentum:

Campaign: ${campaign.name}
Objective: ${campaign.objective}
Platforms: ${(campaign.platforms as string[] || []).join(", ")}
Status: ${campaign.status}
${productContext}

Content pieces created: ${contents?.length || 0}
Analytics events: ${analytics?.length || 0}
Leads generated: ${leads?.length || 0}

Recent content: ${JSON.stringify((contents || []).slice(0, 5).map((c: any) => ({ type: c.type, title: c.title, status: c.status })))}
Recent analytics: ${JSON.stringify((analytics || []).slice(0, 10))}

Provide:
1. Campaign health score (0-100)
2. What's working (top performers)
3. What needs improvement
4. Next 5 content pieces to create (with type, platform, and brief)
5. Scaling recommendations
6. A/B test suggestions
7. Budget reallocation advice
8. Timeline for next 2 weeks`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "momentum_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                healthScore: { type: "integer" },
                whatsWorking: { type: "array", items: { type: "string" } },
                needsImprovement: { type: "array", items: { type: "string" } },
                nextContentPieces: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      platform: { type: "string" },
                      brief: { type: "string" },
                      priority: { type: "string" },
                    },
                    required: ["type", "platform", "brief", "priority"],
                    additionalProperties: false,
                  },
                },
                scalingRecommendations: { type: "array", items: { type: "string" } },
                abTestSuggestions: { type: "array", items: { type: "string" } },
                budgetAdvice: { type: "string" },
                twoWeekTimeline: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      week: { type: "string" },
                      actions: { type: "array", items: { type: "string" } },
                    },
                    required: ["week", "actions"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["healthScore", "whatsWorking", "needsImprovement", "nextContentPieces", "scalingRecommendations", "abTestSuggestions", "budgetAdvice", "twoWeekTimeline"],
              additionalProperties: false,
            },
          },
        },
      });

      return JSON.parse(response.choices[0].message.content as string);
    }),

    // Generate a full content calendar for campaign continuity
    contentCalendar: protectedProcedure.input(z.object({
      campaignId: z.number(),
      weeks: z.number().min(1).max(12).default(4),
    })).mutation(async ({ ctx, input }) => {
      const campaign = await db.getCampaignById(input.campaignId);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      let productContext = "";
      if (campaign.productId) {
        const product = await db.getProductById(campaign.productId);
        if (product) productContext = `Product: ${product.name} - ${product.description || ""}`;
      }

      // Get platform specs for the campaign's platforms
      const platformTips = (campaign.platforms as string[] || []).map(p => {
        const spec = PLATFORM_SPECS[p];
        return spec ? `${spec.name}: Best times ${spec.peakEngagement.timeRange} on ${spec.peakEngagement.days.join(", ")}. ${spec.peakEngagement.notes}` : "";
      }).filter(Boolean).join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a content calendar strategist. Create a detailed content calendar that maintains campaign momentum with consistent posting, varied content types, and strategic timing. Return JSON."
          },
          {
            role: "user",
            content: `Create a ${input.weeks}-week content calendar for:

Campaign: ${campaign.name}
Objective: ${campaign.objective}
Platforms: ${(campaign.platforms as string[] || []).join(", ")}
${productContext}

Platform timing intelligence:
${platformTips}

For each day, specify: platform, content type, topic/brief, optimal posting time, and hashtag suggestions.`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "content_calendar",
            strict: true,
            schema: {
              type: "object",
              properties: {
                weeks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      weekNumber: { type: "integer" },
                      theme: { type: "string" },
                      posts: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            day: { type: "string" },
                            platform: { type: "string" },
                            contentType: { type: "string" },
                            topic: { type: "string" },
                            postingTime: { type: "string" },
                            hashtags: { type: "array", items: { type: "string" } },
                          },
                          required: ["day", "platform", "contentType", "topic", "postingTime", "hashtags"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["weekNumber", "theme", "posts"],
                    additionalProperties: false,
                  },
                },
                strategy: { type: "string" },
              },
              required: ["weeks", "strategy"],
              additionalProperties: false,
            },
          },
        },
      });

      return JSON.parse(response.choices[0].message.content as string);
    }),

    // Double down on what works — analyze top performers and create variations
    doubleDown: protectedProcedure.input(z.object({
      campaignId: z.number(),
      contentId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const content = await db.getContentById(input.contentId);
      if (!content) throw new TRPCError({ code: "NOT_FOUND" });

      const campaign = await db.getCampaignById(input.campaignId);
      const platforms = campaign?.platforms as string[] || [];

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a content scaling expert. Take a high-performing piece of content and create variations for different platforms and angles to maximize its reach. Return JSON."
          },
          {
            role: "user",
            content: `This content is performing well. Create variations to scale its impact:

Original (${content.type} for ${content.platform || "general"}):
${content.body}

Target platforms: ${platforms.join(", ")}

Create 5 variations: same core message, different angles/formats/platforms. Include platform-specific optimizations.`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "scaled_content",
            strict: true,
            schema: {
              type: "object",
              properties: {
                variations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      platform: { type: "string" },
                      contentType: { type: "string" },
                      angle: { type: "string" },
                      content: { type: "string" },
                      whyItWorks: { type: "string" },
                    },
                    required: ["platform", "contentType", "angle", "content", "whyItWorks"],
                    additionalProperties: false,
                  },
                },
                scalingStrategy: { type: "string" },
              },
              required: ["variations", "scalingStrategy"],
              additionalProperties: false,
            },
          },
        },
      });

      const result = JSON.parse(response.choices[0].message.content as string);

      // Save each variation as new content
      const savedVariations = [];
      for (const v of result.variations) {
        const saved = await db.createContent({
          userId: ctx.user.id,
          productId: content.productId ?? null,
          campaignId: input.campaignId,
          type: v.contentType as any || "copywriting",
          platform: v.platform,
          title: `[Scaled] ${v.angle} - ${v.platform}`,
          body: v.content,
          status: "draft",
          metadata: { scaledFrom: input.contentId, angle: v.angle, whyItWorks: v.whyItWorks },
        });
        savedVariations.push({ id: saved.id, ...v });
      }

      return { variations: savedVariations, scalingStrategy: result.scalingStrategy };
    }),
  }),

  // ─── Voice Transcription ──────────────────────────────────────────
  voice: router({
    transcribe: protectedProcedure.input(z.object({
      audioUrl: z.string(),
      language: z.string().optional(),
      prompt: z.string().optional(),
    })).mutation(async ({ input }) => {
      const result = await transcribeAudio(input);
      if ('error' in result) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: (result as any).error });
      }
      return result;
    }),
    uploadAndTranscribe: protectedProcedure.input(z.object({
      audioBase64: z.string(),
      mimeType: z.string().default("audio/webm"),
      language: z.string().optional(),
    })).mutation(async ({ input }) => {
      // Decode base64 audio, upload to S3, then transcribe
      const buffer = Buffer.from(input.audioBase64, 'base64');
      const ext = input.mimeType.includes('webm') ? 'webm' : input.mimeType.includes('wav') ? 'wav' : 'mp3';
      const key = `voice/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      const result = await transcribeAudio({ audioUrl: url, language: input.language });
      if ('error' in result) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: (result as any).error });
      }
      return result;
    }),
  }),

  // ─── Admin Panel ─────────────────────────────────────────────────────
  admin: router({
    // Get all users (admin only)
    users: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const allUsers = await drizzleDb.select().from(users).orderBy(desc(users.createdAt));
      return allUsers;
    }),
    // Get platform stats
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [userCount] = await drizzleDb.select({ count: count() }).from(users);
      const [teamCount] = await drizzleDb.select({ count: count() }).from(teamMembers);
      const [subCount] = await drizzleDb.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, 'active'));
      const planBreakdown = await drizzleDb.select({
        plan: users.subscriptionPlan,
        count: count(),
      }).from(users).groupBy(users.subscriptionPlan);
      return {
        totalUsers: userCount.count,
        totalTeamMembers: teamCount.count,
        activeSubscriptions: subCount.count,
        planBreakdown,
      };
    }),
    // Update user role
    updateUserRole: protectedProcedure.input(z.object({
      userId: z.number(),
      role: z.enum(['user', 'admin']),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      await drizzleDb.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      return { success: true };
    }),
    // Update user subscription plan
    updateUserPlan: protectedProcedure.input(z.object({
      userId: z.number(),
      plan: z.enum(['free', 'starter', 'professional', 'business', 'enterprise']),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      await drizzleDb.update(users).set({ subscriptionPlan: input.plan }).where(eq(users.id, input.userId));
      return { success: true };
    }),
  }),

  // ─── SEO Audit Engine ─────────────────────────────────────────────
  seo: router({
    audits: protectedProcedure.query(async ({ ctx }) => {
      return db.getSeoAuditsByUser(ctx.user.id);
    }),
    getAudit: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getSeoAuditById(input.id);
    }),
    runAudit: protectedProcedure.input(z.object({
      url: z.string().url(),
    })).mutation(async ({ ctx, input }) => {
      // Real-time website scraping
      let scrapedData = "";
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(input.url, {
          signal: controller.signal,
          headers: { "User-Agent": "OtobiAI-SEO-Bot/1.0" },
        });
        clearTimeout(timeout);
        const html = await res.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi)?.slice(0, 5) || [];
        const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi)?.slice(0, 10) || [];
        const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
        const ogTags = html.match(/<meta[^>]*property=["']og:[^"']+["'][^>]*>/gi)?.slice(0, 10) || [];
        const schemaMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)?.slice(0, 3) || [];
        const imgWithoutAlt = (html.match(/<img(?![^>]*alt=["'][^"']+["'])[^>]*>/gi) || []).length;
        const totalImages = (html.match(/<img[^>]*>/gi) || []).length;
        const internalLinks = (html.match(/href=["']\/[^"']*["']/gi) || []).length;
        const externalLinks = (html.match(/href=["']https?:\/\/[^"']*["']/gi) || []).length;
        const hasViewport = /meta[^>]*name=["']viewport["']/i.test(html);
        const hasRobots = /meta[^>]*name=["']robots["']/i.test(html);
        const pageSize = html.length;
        scrapedData = `Title: ${titleMatch?.[1] || 'Not found'}\nMeta Description: ${metaDescMatch?.[1] || 'Not found'}\nCanonical: ${canonicalMatch?.[1] || 'Not found'}\nH1 Tags: ${h1Matches.length}\nH2 Tags: ${h2Matches.length}\nImages without alt: ${imgWithoutAlt}/${totalImages}\nInternal links: ${internalLinks}\nExternal links: ${externalLinks}\nHas viewport: ${hasViewport}\nHas robots meta: ${hasRobots}\nPage size: ${(pageSize / 1024).toFixed(1)}KB\nOG Tags: ${ogTags.length}\nSchema markup: ${schemaMatch.length} blocks\nH1 content: ${h1Matches.join(', ')}\nH2 content: ${h2Matches.slice(0, 5).join(', ')}`;
      } catch (e) {
        scrapedData = "Could not scrape website - analyzing URL pattern and domain only.";
      }

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert SEO auditor. Perform a comprehensive SEO audit based on the scraped website data. Provide scores, keyword analysis, issues, and actionable recommendations. Return JSON." },
          { role: "user", content: `URL: ${input.url}\n\nScraped Data:\n${scrapedData}\n\nPerform a full SEO audit with: overall score (0-100), technical score, content score, authority score, top keywords with estimated volume/difficulty/position, issues with severity and fixes, estimated backlink profile, competitor domains, and prioritized recommendations.` }
        ],
        response_format: { type: "json_schema", json_schema: { name: "seo_audit", strict: true, schema: { type: "object", properties: { overallScore: { type: "integer" }, technicalScore: { type: "integer" }, contentScore: { type: "integer" }, authorityScore: { type: "integer" }, keywords: { type: "array", items: { type: "object", properties: { keyword: { type: "string" }, volume: { type: "string" }, difficulty: { type: "string" }, position: { type: "string" } }, required: ["keyword", "volume", "difficulty", "position"], additionalProperties: false } }, issues: { type: "array", items: { type: "object", properties: { severity: { type: "string" }, description: { type: "string" }, fix: { type: "string" } }, required: ["severity", "description", "fix"], additionalProperties: false } }, backlinks: { type: "array", items: { type: "object", properties: { domain: { type: "string" }, authority: { type: "integer" }, type: { type: "string" } }, required: ["domain", "authority", "type"], additionalProperties: false } }, competitors: { type: "array", items: { type: "object", properties: { domain: { type: "string" }, overlap: { type: "integer" }, ranking: { type: "string" } }, required: ["domain", "overlap", "ranking"], additionalProperties: false } }, recommendations: { type: "array", items: { type: "string" } } }, required: ["overallScore", "technicalScore", "contentScore", "authorityScore", "keywords", "issues", "backlinks", "competitors", "recommendations"], additionalProperties: false } } }
      });

      const audit = JSON.parse(response.choices[0].message.content as string);
      const saved = await db.createSeoAudit({
        userId: ctx.user.id,
        url: input.url,
        overallScore: audit.overallScore,
        technicalScore: audit.technicalScore,
        contentScore: audit.contentScore,
        authorityScore: audit.authorityScore,
        keywords: audit.keywords,
        issues: audit.issues,
        backlinks: audit.backlinks,
        competitors: audit.competitors,
        recommendations: audit.recommendations,
      });
      return { id: saved.id, ...audit };
    }),
    keywordResearch: protectedProcedure.input(z.object({
      seed: z.string().min(1),
      industry: z.string().optional(),
      region: z.string().optional(),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an SEO keyword research expert. Generate comprehensive keyword research with volume estimates, difficulty scores, and content suggestions. Return JSON." },
          { role: "user", content: `Seed keyword: ${input.seed}\nIndustry: ${input.industry || 'general'}\nRegion: ${input.region || 'global'}\n\nGenerate: 20 keyword suggestions with estimated monthly volume, difficulty (0-100), CPC estimate, intent type (informational/commercial/transactional/navigational), and content angle suggestion.` }
        ],
        response_format: { type: "json_schema", json_schema: { name: "keywords", strict: true, schema: { type: "object", properties: { keywords: { type: "array", items: { type: "object", properties: { keyword: { type: "string" }, volume: { type: "string" }, difficulty: { type: "integer" }, cpc: { type: "string" }, intent: { type: "string" }, contentAngle: { type: "string" } }, required: ["keyword", "volume", "difficulty", "cpc", "intent", "contentAngle"], additionalProperties: false } }, summary: { type: "string" }, topOpportunities: { type: "array", items: { type: "string" } } }, required: ["keywords", "summary", "topOpportunities"], additionalProperties: false } } }
      });
      return JSON.parse(response.choices[0].message.content as string);
    }),
    rankTracker: protectedProcedure.input(z.object({
      url: z.string().url(),
      keywords: z.array(z.string()).min(1).max(20),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an SEO rank tracking expert. Estimate current search rankings for the given keywords and URL. Return JSON." },
          { role: "user", content: `URL: ${input.url}\nKeywords to track: ${input.keywords.join(", ")}\n\nEstimate current position, trend (up/down/stable), and improvement suggestions for each keyword.` }
        ],
        response_format: { type: "json_schema", json_schema: { name: "rankings", strict: true, schema: { type: "object", properties: { rankings: { type: "array", items: { type: "object", properties: { keyword: { type: "string" }, estimatedPosition: { type: "integer" }, trend: { type: "string" }, suggestion: { type: "string" } }, required: ["keyword", "estimatedPosition", "trend", "suggestion"], additionalProperties: false } }, overallVisibility: { type: "string" }, topRecommendation: { type: "string" } }, required: ["rankings", "overallVisibility", "topRecommendation"], additionalProperties: false } } }
      });
      return JSON.parse(response.choices[0].message.content as string);
    }),
  }),

  // ─── Gap Closure Features ──────────────────────────────────────────
  brandVoice: brandVoiceRouter,
  emailMarketing: emailMarketingRouter,
  landingPageBuilder: landingPageRouter,
  automation: automationRouter,
  socialPublish: socialPublishRouter,
  videoRender: videoRenderRouter,
  webhooks: webhookRouter,
  imageEditor: imageEditorRouter,
  multiLanguage: multiLanguageRouter,
  competitorSpy: competitorSpyRouter,
  bulkImport: bulkImportRouter,
  // ─── New Features: Video Studio, Competitor Intel, Customer Intel ──
  personalVideo: personalVideoRouter,
  competitorIntel: competitorIntelRouter,
  customerIntel: customerIntelRouter,
  // ─── Real API Integrations (Gap Closers) ──────────────────────────
  realVideo: realVideoRouter,
  voiceoverApi: voiceoverRouter,
  avatar: avatarRouter,
  socialConnection: socialConnectionRouter,
  ecommerce: ecommerceRouter,
  meme: memeRouter,
  creativeEngine: creativeEngineRouter,
  integrationStatus: integrationStatusRouter,
  repurposing: repurposingRouter,
  publishing: publishingRouter,
  adPerformance: adPerformanceRouter,
  ingest: contentIngestRouter,
  library: contentLibraryRouter,
  creatorProfile: creatorProfileRouter,
  publisher: publisherRouter,
  advanced: advancedFeaturesRouter,
  enhanced: enhancedChatRouter,
  flywheel: flywheelRouter,
  selfLearning: selfLearningRouter,
  narrative: narrativeRouter,
  influence: influenceRouter,
  referral: referralRouter,
  brandKit: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db2 = await getDb(); if (!db2) return [];
      return db2.select().from(brandKits).where(eq(brandKits.userId, ctx.user.id)).orderBy(desc(brandKits.createdAt));
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const db2 = await getDb(); if (!db2) throw new TRPCError({ code: "NOT_FOUND" });
      const [kit] = await db2.select().from(brandKits).where(eq(brandKits.id, input.id));
      if (!kit || kit.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      return kit;
    }),
    getDefault: protectedProcedure.query(async ({ ctx }) => {
      const db2 = await getDb(); if (!db2) return null;
      const kits = await db2.select().from(brandKits).where(eq(brandKits.userId, ctx.user.id)).orderBy(desc(brandKits.isDefault), desc(brandKits.createdAt)).limit(1);
      return kits[0] ?? null;
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      fontHeading: z.string().optional(),
      fontBody: z.string().optional(),
      toneOfVoice: z.string().optional(),
      toneDescription: z.string().optional(),
      brandPersonality: z.array(z.string()).optional(),
      tagline: z.string().optional(),
      missionStatement: z.string().optional(),
      targetAudience: z.string().optional(),
      doList: z.array(z.string()).optional(),
      dontList: z.array(z.string()).optional(),
      isDefault: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const db2 = await getDb(); if (!db2) throw new Error("DB unavailable");
      if (input.isDefault) {
        await db2.update(brandKits).set({ isDefault: false }).where(eq(brandKits.userId, ctx.user.id));
      }
      const result = await db2.insert(brandKits).values({ ...input, userId: ctx.user.id });
      return { id: Number(result[0].insertId) };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      fontHeading: z.string().optional(),
      fontBody: z.string().optional(),
      toneOfVoice: z.string().optional(),
      toneDescription: z.string().optional(),
      brandPersonality: z.array(z.string()).optional(),
      tagline: z.string().optional(),
      missionStatement: z.string().optional(),
      targetAudience: z.string().optional(),
      doList: z.array(z.string()).optional(),
      dontList: z.array(z.string()).optional(),
      isDefault: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const db2 = await getDb(); const { id, ...data } = input;
      if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [existing] = await db2.select().from(brandKits).where(eq(brandKits.id, id));
      if (!existing || existing.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      if (data.isDefault) {
        await db2.update(brandKits).set({ isDefault: false }).where(eq(brandKits.userId, ctx.user.id));
      }
      await db2.update(brandKits).set(data).where(eq(brandKits.id, id));
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const db2 = await getDb(); if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [existing] = await db2.select().from(brandKits).where(eq(brandKits.id, input.id));
      if (!existing || existing.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      await db2.delete(brandKits).where(eq(brandKits.id, input.id));
      return { success: true };
    }),
    generateWithAI: protectedProcedure.input(z.object({
      businessDescription: z.string(),
      industry: z.string().optional(),
      targetAudience: z.string().optional(),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a brand identity expert. Generate a comprehensive brand kit based on the business description." },
          { role: "user", content: `Generate a brand kit for: ${input.businessDescription}\nIndustry: ${input.industry || "not specified"}\nTarget Audience: ${input.targetAudience || "not specified"}\n\nReturn JSON with: { primaryColor (hex), secondaryColor (hex), accentColor (hex), fontHeading (Google Font name), fontBody (Google Font name), toneOfVoice (single word), toneDescription (2-3 sentences), brandPersonality (array of 5 adjectives), tagline (catchy tagline), missionStatement (1-2 sentences), doList (array of 5 brand dos), dontList (array of 5 brand don'ts) }` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "brand_kit",
            strict: true,
            schema: {
              type: "object",
              properties: {
                primaryColor: { type: "string" },
                secondaryColor: { type: "string" },
                accentColor: { type: "string" },
                fontHeading: { type: "string" },
                fontBody: { type: "string" },
                toneOfVoice: { type: "string" },
                toneDescription: { type: "string" },
                brandPersonality: { type: "array", items: { type: "string" } },
                tagline: { type: "string" },
                missionStatement: { type: "string" },
                doList: { type: "array", items: { type: "string" } },
                dontList: { type: "array", items: { type: "string" } },
              },
              required: ["primaryColor", "secondaryColor", "accentColor", "fontHeading", "fontBody", "toneOfVoice", "toneDescription", "brandPersonality", "tagline", "missionStatement", "doList", "dontList"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0]?.message?.content ?? "{}";
      return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    }),
  }),
  musicStudio: router({
    getMusicLibrary: publicProcedure.query(async () => {
      const { MUSIC_LIBRARY } = await import("./musicStudio");
      return MUSIC_LIBRARY;
    }),
    getSFXLibrary: publicProcedure.input(z.object({ category: z.string().optional() })).query(async ({ input }) => {
      const { SFX_LIBRARY } = await import("./musicStudio");
      if (input.category) return SFX_LIBRARY.filter((s: { category: string }) => s.category === input.category);
      return SFX_LIBRARY;
    }),
    getProviders: publicProcedure.query(async () => {
      const { getMusicProviders } = await import("./musicStudio");
      return getMusicProviders();
    }),
    generateMusic: protectedProcedure.input(z.object({
      prompt: z.string().min(1).max(500),
      genre: z.string().optional(),
      mood: z.string().optional(),
      tempo: z.enum(["slow", "medium", "fast", "very-fast"]).optional(),
      duration: z.number().min(15).max(120).optional(),
      loop: z.boolean().optional(),
      instrumental: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { generateMusic } = await import("./musicStudio");
      return generateMusic(input);
    }),
  }),
  funnel: funnelRouter,
  reviews: reviewsRouter,
  forms: formsRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
