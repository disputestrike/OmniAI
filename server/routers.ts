import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

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

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a marketing strategist AI. Analyze the given product and extract structured marketing intelligence. Return JSON only.`
            },
            {
              role: "user",
              content: `Analyze this product for marketing purposes:
Name: ${product.name}
Description: ${product.description || "N/A"}
URL: ${product.url || "N/A"}
Category: ${product.category || "N/A"}

Return a JSON object with these fields:
- features: array of key product features (strings)
- benefits: array of customer benefits (strings)
- targetAudience: array of target audience segments (strings)
- positioning: a positioning statement (string)
- keywords: array of SEO keywords (strings)
- tone: recommended brand tone (string)
- competitiveAdvantages: array of competitive advantages (strings)
- painPoints: array of customer pain points this solves (strings)`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "product_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  features: { type: "array", items: { type: "string" } },
                  benefits: { type: "array", items: { type: "string" } },
                  targetAudience: { type: "array", items: { type: "string" } },
                  positioning: { type: "string" },
                  keywords: { type: "array", items: { type: "string" } },
                  tone: { type: "string" },
                  competitiveAdvantages: { type: "array", items: { type: "string" } },
                  painPoints: { type: "array", items: { type: "string" } },
                },
                required: ["features", "benefits", "targetAudience", "positioning", "keywords", "tone", "competitiveAdvantages", "painPoints"],
                additionalProperties: false,
              },
            },
          },
        });

        const analysis = JSON.parse(response.choices[0].message.content as string);
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
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Analysis failed" });
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
      return { id: result.id, title, body: remixed };
    }),
    repurpose: protectedProcedure.input(z.object({
      contentId: z.number(),
      targetTypes: z.array(z.string()).min(1),
    })).mutation(async ({ ctx, input }) => {
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
      return { created };
    }),
  }),

  // ─── AI Chat Agent ────────────────────────────────────────────────
  aiChat: router({
    send: protectedProcedure.input(z.object({
      message: z.string().min(1),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional(),
    })).mutation(async ({ input }) => {
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: `You are the OmniMarket AI Marketing Agent — the most powerful marketing strategist in the world. You help users dominate any market, make any product #1, make any person viral, and spread any concept into mass consciousness.\n\nYour expertise covers:\n- Campaign strategy across all platforms (social, search, email, SMS, WhatsApp, TV, radio, print, podcasts)\n- Psychological persuasion (Cialdini's principles, AIDA, PAS, Monroe's Motivated Sequence)\n- Micro-targeting by demographics, psychographics, behavior, and cultural context\n- Viral content creation and amplification\n- SEO, SEM, content marketing, influencer strategy\n- Lead generation, nurturing, and conversion\n- A/B testing and optimization\n- Global marketing across all regions and languages\n- Competitor analysis and market positioning\n- Brand building and personal branding\n- Political and cause marketing\n- UGC, creator economy, and community building\n\nBe specific, actionable, and data-driven. Give concrete steps, not vague advice. Think like a $500/hour marketing consultant.` },
      ];
      if (input.history) {
        for (const h of input.history) {
          messages.push({ role: h.role, content: h.content });
        }
      }
      messages.push({ role: "user", content: input.message });
      const response = await invokeLLM({ messages });
      return { reply: response.choices[0].message.content as string };
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
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a world-class competitive intelligence analyst and marketing strategist, similar to SimilarWeb's analysis engine. Given a website URL, provide an extremely comprehensive marketing intelligence report. Analyze everything: traffic patterns, audience demographics, SEO strategy, content strategy, social presence, technology stack, competitive landscape, and actionable recommendations. Be specific with numbers, percentages, and data-driven insights. Return JSON only.`
          },
          {
            role: "user",
            content: `Provide a comprehensive marketing intelligence report for: ${input.url}

Analysis depth: ${input.depth}

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
      };

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a video ad creative director. Create compelling video ad scripts with detailed storyboards. Return JSON only."
          },
          {
            role: "user",
            content: `Create a ${input.duration}-second video ad script for ${platformSpecs[input.platform]}.

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
        metadata: { hook: videoData.hook, cta: videoData.cta },
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
    // Create custom AI avatar
    createAvatar: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      gender: z.string(),
      ageRange: z.string(),
      style: z.string(),
      languages: z.array(z.string()),
    })).mutation(async ({ input }) => {
      const avatarImage = await generateImage({
        prompt: `Professional headshot portrait of a ${input.description}. ${input.gender}, ${input.ageRange} years old, ${input.style} style. Clean background, studio lighting, high quality, photorealistic.`
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
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      productId: z.number().optional(),
      platforms: z.array(z.string()),
      objective: z.enum(["awareness", "traffic", "engagement", "leads", "sales", "app_installs"]),
      budget: z.string().optional(),
      targetAudience: z.any().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await db.createCampaign({
        userId: ctx.user.id,
        productId: input.productId ?? null,
        name: input.name,
        description: input.description ?? null,
        platforms: input.platforms,
        objective: input.objective,
        budget: input.budget ?? null,
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
      return db.createLead({
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
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).optional(),
      score: z.number().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateLead(id, data);
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
        results.push(result);
      }
      return { imported: results.length };
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
      return {
        plan: ctx.user.subscriptionPlan || "free",
        stripeCustomerId: ctx.user.stripeCustomerId || null,
        stripeSubscriptionId: ctx.user.stripeSubscriptionId || null,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
