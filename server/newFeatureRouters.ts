import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";
import {
  createPersonalVideo, getPersonalVideosByUser, getPersonalVideoById,
  getPersonalVideoByShareToken, updatePersonalVideo, deletePersonalVideo,
  createCompetitorProfile, getCompetitorProfilesByUser, getCompetitorProfileById,
  updateCompetitorProfile, deleteCompetitorProfile,
  createCompetitorSnapshot, getCompetitorSnapshotsByCompetitor,
  createCompetitorAlert, getCompetitorAlertsByUser, markCompetitorAlertRead,
  createCustomerProfile, getCustomerProfilesByUser, getCustomerProfileById,
  updateCustomerProfile, deleteCustomerProfile,
  createCustomerInteraction, getCustomerInteractionsByCustomer,
  createCustomerSegment, getCustomerSegmentsByUser, getCustomerSegmentById,
  updateCustomerSegment, deleteCustomerSegment,
} from "./db";

// ─── Personal Video Studio Router ─────────────────────────────────
export const personalVideoRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getPersonalVideosByUser(ctx.user.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const v = await getPersonalVideoById(input.id);
    if (!v || v.userId !== ctx.user.id) return null;
    return v;
  }),

  getByShareToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
    const v = await getPersonalVideoByShareToken(input.token);
    if (!v) return null;
    // Increment view count
    await updatePersonalVideo(v.id, { viewCount: (v.viewCount || 0) + 1 });
    return { title: v.title, videoUrl: v.videoUrl, thumbnailUrl: v.thumbnailUrl, duration: v.duration, viewCount: (v.viewCount || 0) + 1 };
  }),

  generateScript: protectedProcedure.input(z.object({
    topic: z.string().min(1),
    duration: z.number().min(15).max(300).default(60),
    tone: z.string().default("professional"),
    platform: z.string().default("general"),
    includeHook: z.boolean().default(true),
    includeCTA: z.boolean().default(true),
  })).mutation(async ({ input }) => {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: `You are a professional video script writer. Write scripts that are natural, conversational, and optimized for ${input.platform}. Target duration: ${input.duration} seconds (~${Math.round(input.duration * 2.5)} words). Tone: ${input.tone}.` },
        { role: "user", content: `Write a video script about: ${input.topic}\n\n${input.includeHook ? "Start with a strong hook in the first 3 seconds." : ""}\n${input.includeCTA ? "End with a clear call-to-action." : ""}\n\nFormat the script with:\n- [HOOK] section (first 3 seconds)\n- [BODY] main content\n- [CTA] call to action\n\nAlso provide:\n- Suggested B-roll/visual cues in [brackets]\n- Pacing notes\n- Estimated word count` }
      ],
    });
    return { script: response.choices[0].message.content };
  }),

  create: protectedProcedure.input(z.object({
    title: z.string().min(1),
    script: z.string().optional(),
    aspectRatio: z.string().default("16:9"),
    platform: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
    const result = await createPersonalVideo({
      userId: ctx.user.id,
      title: input.title,
      script: input.script,
      aspectRatio: input.aspectRatio,
      platform: input.platform,
      shareToken,
      status: "draft",
    });
    return { id: result.id, shareToken };
  }),

  uploadRecording: protectedProcedure.input(z.object({
    id: z.number(),
    videoBase64: z.string(),
    mimeType: z.string().default("video/webm"),
    duration: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const video = await getPersonalVideoById(input.id);
    if (!video || video.userId !== ctx.user.id) throw new Error("Not found");
    const buffer = Buffer.from(input.videoBase64, "base64");
    const ext = input.mimeType.includes("mp4") ? "mp4" : "webm";
    const key = `personal-videos/${ctx.user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { url } = await storagePut(key, buffer, input.mimeType);
    await updatePersonalVideo(input.id, {
      videoUrl: url,
      duration: input.duration,
      status: "ready",
      metadata: { format: ext },
    });
    return { url };
  }),

  generateThumbnail: protectedProcedure.input(z.object({
    id: z.number(),
    prompt: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const video = await getPersonalVideoById(input.id);
    if (!video || video.userId !== ctx.user.id) throw new Error("Not found");
    const { generateImage } = await import("./_core/imageGeneration");
    const prompt = input.prompt || `Professional video thumbnail for: ${video.title}. Clean, eye-catching, YouTube-style thumbnail with bold text overlay.`;
    const { url } = await generateImage({ prompt });
    await updatePersonalVideo(input.id, { thumbnailUrl: url });
    return { url };
  }),

  getAISuggestions: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const video = await getPersonalVideoById(input.id);
    if (!video || video.userId !== ctx.user.id) throw new Error("Not found");
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a video marketing expert. Analyze the video script and provide specific, actionable suggestions." },
        { role: "user", content: `Analyze this video script and provide suggestions:\n\nTitle: ${video.title}\nScript: ${video.script || "(no script)"}\nPlatform: ${video.platform || "general"}\nDuration: ${video.duration || "unknown"} seconds\n\nProvide:\n1. Hook strength (1-10) and how to improve\n2. Pacing suggestions\n3. CTA effectiveness\n4. 3 specific improvements\n5. Platform-specific tips` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              hooks: { type: "array", items: { type: "string" }, description: "Alternative hook suggestions" },
              pacing: { type: "string", description: "Pacing feedback" },
              cta: { type: "string", description: "CTA improvement suggestion" },
              improvements: { type: "array", items: { type: "string" }, description: "Specific improvements" },
            },
            required: ["hooks", "pacing", "cta", "improvements"],
            additionalProperties: false,
          },
        },
      },
    });
    const suggestions = JSON.parse(response.choices[0].message.content as string || "{}");
    await updatePersonalVideo(input.id, { aiSuggestions: suggestions });
    return suggestions;
  }),

  share: protectedProcedure.input(z.object({
    id: z.number(),
    origin: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const video = await getPersonalVideoById(input.id);
    if (!video || video.userId !== ctx.user.id) throw new Error("Not found");
    const shareUrl = `${input.origin}/shared/video/${video.shareToken}`;
    const embedCode = `<iframe src="${shareUrl}?embed=1" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
    await updatePersonalVideo(input.id, { shareUrl, embedCode, status: "shared" });
    return { shareUrl, embedCode, shareToken: video.shareToken };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    script: z.string().optional(),
    platform: z.string().optional(),
    aspectRatio: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const video = await getPersonalVideoById(input.id);
    if (!video || video.userId !== ctx.user.id) throw new Error("Not found");
    const { id, ...data } = input;
    await updatePersonalVideo(id, data);
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const video = await getPersonalVideoById(input.id);
    if (!video || video.userId !== ctx.user.id) throw new Error("Not found");
    await deletePersonalVideo(input.id);
  }),
});

// ─── Competitor Intelligence Router ───────────────────────────────
export const competitorIntelRouter = router({
  // Competitor Profiles
  listProfiles: protectedProcedure.query(async ({ ctx }) => {
    return getCompetitorProfilesByUser(ctx.user.id);
  }),

  getProfile: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const p = await getCompetitorProfileById(input.id);
    if (!p || p.userId !== ctx.user.id) return null;
    return p;
  }),

  addCompetitor: protectedProcedure.input(z.object({
    name: z.string().min(1),
    domain: z.string().min(1),
    industry: z.string().optional(),
    socialLinks: z.object({
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      instagram: z.string().optional(),
      tiktok: z.string().optional(),
      youtube: z.string().optional(),
    }).optional(),
  })).mutation(async ({ ctx, input }) => {
    const result = await createCompetitorProfile({
      userId: ctx.user.id,
      name: input.name,
      domain: input.domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      industry: input.industry,
      socialLinks: input.socialLinks,
    });
    return result;
  }),

  updateCompetitor: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    industry: z.string().optional(),
    threatLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
    isMonitored: z.boolean().optional(),
    socialLinks: z.object({
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      instagram: z.string().optional(),
      tiktok: z.string().optional(),
      youtube: z.string().optional(),
    }).optional(),
  })).mutation(async ({ ctx, input }) => {
    const p = await getCompetitorProfileById(input.id);
    if (!p || p.userId !== ctx.user.id) throw new Error("Not found");
    const { id, ...data } = input;
    await updateCompetitorProfile(id, data);
  }),

  deleteCompetitor: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const p = await getCompetitorProfileById(input.id);
    if (!p || p.userId !== ctx.user.id) throw new Error("Not found");
    await deleteCompetitorProfile(input.id);
  }),

  // Deep Analysis
  analyzeCompetitor: protectedProcedure.input(z.object({
    competitorId: z.number(),
    analysisType: z.enum(["full_analysis", "ad_scan", "seo_check", "social_check", "content_check"]).default("full_analysis"),
  })).mutation(async ({ ctx, input }) => {
    const competitor = await getCompetitorProfileById(input.competitorId);
    if (!competitor || competitor.userId !== ctx.user.id) throw new Error("Not found");

    const analysisPrompts: Record<string, string> = {
      full_analysis: `Perform a comprehensive competitive analysis of ${competitor.name} (${competitor.domain}). Include: marketing strategies, content approach, SEO tactics, social media presence, ad strategies, pricing model, target audience, unique selling propositions, strengths, weaknesses, opportunities, and threats.`,
      ad_scan: `Analyze the advertising strategy of ${competitor.name} (${competitor.domain}). Identify: likely ad platforms used, ad formats, messaging themes, target audiences, estimated ad spend level, creative approaches, and landing page strategies.`,
      seo_check: `Analyze the SEO strategy of ${competitor.name} (${competitor.domain}). Identify: likely target keywords, content strategy, backlink approach, technical SEO strengths/weaknesses, content gaps, and ranking opportunities.`,
      social_check: `Analyze the social media strategy of ${competitor.name} (${competitor.domain}). Identify: active platforms, posting frequency, content types, engagement patterns, audience demographics, influencer partnerships, and community building approach.`,
      content_check: `Analyze the content marketing strategy of ${competitor.name} (${competitor.domain}). Identify: content types, publishing frequency, topics covered, content quality, distribution channels, lead magnets, and content gaps.`,
    };

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a competitive intelligence analyst. Provide detailed, actionable analysis. Return structured JSON data." },
        { role: "user", content: analysisPrompts[input.analysisType] },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "competitor_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              strategies: { type: "array", items: { type: "object", properties: { category: { type: "string" }, name: { type: "string" }, description: { type: "string" } }, required: ["category", "name", "description"], additionalProperties: false } },
              swot: { type: "object", properties: { strengths: { type: "array", items: { type: "string" } }, weaknesses: { type: "array", items: { type: "string" } }, opportunities: { type: "array", items: { type: "string" } }, threats: { type: "array", items: { type: "string" } } }, required: ["strengths", "weaknesses", "opportunities", "threats"], additionalProperties: false },
              recommendations: { type: "array", items: { type: "string" } },
              analysis: { type: "string" },
              threatLevel: { type: "string", enum: ["low", "medium", "high", "critical"] },
              estimatedMetrics: { type: "object", properties: { estimatedTraffic: { type: "number" }, socialFollowers: { type: "number" }, adCount: { type: "number" }, contentFrequency: { type: "string" }, engagementRate: { type: "number" } }, required: ["estimatedTraffic", "socialFollowers", "adCount", "contentFrequency", "engagementRate"], additionalProperties: false },
            },
            required: ["strategies", "swot", "recommendations", "analysis", "threatLevel", "estimatedMetrics"],
            additionalProperties: false,
          },
        },
      },
    });

    const data = JSON.parse(response.choices[0].message.content as string || "{}");
    
    // Save snapshot
    await createCompetitorSnapshot({
      competitorId: input.competitorId,
      userId: ctx.user.id,
      snapshotType: input.analysisType,
      data: {
        strategies: data.strategies,
        swot: data.swot,
        recommendations: data.recommendations,
        analysis: data.analysis,
      },
    });

    // Update competitor profile with latest metrics
    await updateCompetitorProfile(input.competitorId, {
      threatLevel: data.threatLevel as any,
      metrics: data.estimatedMetrics,
      lastAnalyzedAt: new Date(),
    });

    return data;
  }),

  // Snapshots history
  getSnapshots: protectedProcedure.input(z.object({ competitorId: z.number() })).query(async ({ ctx, input }) => {
    const p = await getCompetitorProfileById(input.competitorId);
    if (!p || p.userId !== ctx.user.id) return [];
    return getCompetitorSnapshotsByCompetitor(input.competitorId);
  }),

  // Competitive positioning
  getPositioningMap: protectedProcedure.mutation(async ({ ctx }) => {
    const competitors = await getCompetitorProfilesByUser(ctx.user.id);
    if (competitors.length === 0) return { analysis: "Add competitors first to generate a positioning map.", positions: [] };

    const competitorList = competitors.map(c => `- ${c.name} (${c.domain}): threat=${c.threatLevel}, metrics=${JSON.stringify(c.metrics || {})}`).join("\n");
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a competitive strategy consultant. Analyze the competitive landscape and provide positioning insights." },
        { role: "user", content: `Based on these competitors, create a competitive positioning analysis:\n\n${competitorList}\n\nProvide:\n1. Where each competitor sits in the market (leader, challenger, follower, nicher)\n2. Key differentiators for each\n3. Market gaps and opportunities\n4. Recommended positioning strategy for our brand` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "positioning_map",
          strict: true,
          schema: {
            type: "object",
            properties: {
              positions: { type: "array", items: { type: "object", properties: { name: { type: "string" }, position: { type: "string" }, differentiators: { type: "array", items: { type: "string" } }, marketShare: { type: "string" } }, required: ["name", "position", "differentiators", "marketShare"], additionalProperties: false } },
              gaps: { type: "array", items: { type: "string" } },
              ourRecommendedPosition: { type: "string" },
              analysis: { type: "string" },
            },
            required: ["positions", "gaps", "ourRecommendedPosition", "analysis"],
            additionalProperties: false,
          },
        },
      },
    });
    return JSON.parse(response.choices[0].message.content as string || "{}");
  }),

  // Alerts
  getAlerts: protectedProcedure.query(async ({ ctx }) => {
    return getCompetitorAlertsByUser(ctx.user.id);
  }),

  markAlertRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await markCompetitorAlertRead(input.id);
  }),
});

// ─── Customer Intelligence Router ─────────────────────────────────
export const customerIntelRouter = router({
  // Customer Profiles
  listCustomers: protectedProcedure.query(async ({ ctx }) => {
    return getCustomerProfilesByUser(ctx.user.id);
  }),

  getCustomer: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const c = await getCustomerProfileById(input.id);
    if (!c || c.userId !== ctx.user.id) return null;
    return c;
  }),

  createCustomer: protectedProcedure.input(z.object({
    name: z.string().min(1),
    email: z.string().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    jobTitle: z.string().optional(),
    leadId: z.number().optional(),
    tags: z.array(z.string()).optional(),
    demographics: z.object({
      age: z.number().optional(),
      gender: z.string().optional(),
      location: z.string().optional(),
      income: z.string().optional(),
      education: z.string().optional(),
    }).optional(),
  })).mutation(async ({ ctx, input }) => {
    return createCustomerProfile({
      userId: ctx.user.id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      jobTitle: input.jobTitle,
      leadId: input.leadId,
      tags: input.tags,
      demographics: input.demographics,
    });
  }),

  updateCustomer: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    jobTitle: z.string().optional(),
    temperature: z.enum(["hot", "warm", "cold", "dormant"]).optional(),
    segment: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    demographics: z.object({
      age: z.number().optional(),
      gender: z.string().optional(),
      location: z.string().optional(),
      income: z.string().optional(),
      education: z.string().optional(),
    }).optional(),
    psychographics: z.object({
      interests: z.array(z.string()).optional(),
      values: z.array(z.string()).optional(),
      personality: z.string().optional(),
      lifestyle: z.string().optional(),
      painPoints: z.array(z.string()).optional(),
      goals: z.array(z.string()).optional(),
    }).optional(),
  })).mutation(async ({ ctx, input }) => {
    const c = await getCustomerProfileById(input.id);
    if (!c || c.userId !== ctx.user.id) throw new Error("Not found");
    const { id, ...data } = input;
    await updateCustomerProfile(id, data);
  }),

  deleteCustomer: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const c = await getCustomerProfileById(input.id);
    if (!c || c.userId !== ctx.user.id) throw new Error("Not found");
    await deleteCustomerProfile(input.id);
  }),

  // Interactions
  addInteraction: protectedProcedure.input(z.object({
    customerId: z.number(),
    type: z.enum(["email_sent", "email_opened", "email_clicked", "call_made", "call_received", "meeting", "social_interaction", "ad_click", "website_visit", "purchase", "support_ticket", "feedback", "content_viewed", "form_submitted", "chat_message"]),
    channel: z.string().optional(),
    subject: z.string().optional(),
    details: z.string().optional(),
    sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    const c = await getCustomerProfileById(input.customerId);
    if (!c || c.userId !== ctx.user.id) throw new Error("Not found");
    const result = await createCustomerInteraction({
      customerId: input.customerId,
      userId: ctx.user.id,
      type: input.type,
      channel: input.channel,
      subject: input.subject,
      details: input.details,
      sentiment: input.sentiment,
    });
    // Update last contact
    await updateCustomerProfile(input.customerId, { lastContactAt: new Date() });
    // Update engagement score
    const newScore = Math.min(100, (c.engagementScore || 0) + 5);
    await updateCustomerProfile(input.customerId, { engagementScore: newScore });
    return result;
  }),

  getInteractions: protectedProcedure.input(z.object({ customerId: z.number() })).query(async ({ ctx, input }) => {
    const c = await getCustomerProfileById(input.customerId);
    if (!c || c.userId !== ctx.user.id) return [];
    return getCustomerInteractionsByCustomer(input.customerId);
  }),

  // AI-powered enrichment
  enrichCustomer: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const customer = await getCustomerProfileById(input.id);
    if (!customer || customer.userId !== ctx.user.id) throw new Error("Not found");
    const interactions = await getCustomerInteractionsByCustomer(input.id);

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a customer intelligence analyst. Analyze customer data and provide insights for building deeper relationships." },
        { role: "user", content: `Analyze this customer and provide enrichment data:\n\nName: ${customer.name}\nEmail: ${customer.email || "N/A"}\nCompany: ${customer.company || "N/A"}\nJob Title: ${customer.jobTitle || "N/A"}\nCurrent Segment: ${customer.segment || "N/A"}\nEngagement Score: ${customer.engagementScore}/100\nTemperature: ${customer.temperature}\nInteractions: ${interactions.length} total\nRecent interactions: ${interactions.slice(0, 5).map(i => `${i.type} (${i.sentiment || "neutral"}) - ${i.subject || "no subject"}`).join(", ")}\n\nProvide:\n1. Psychographic profile (interests, values, personality, pain points, goals)\n2. Predicted lifetime value tier (low/medium/high/premium)\n3. Next best action to deepen the relationship\n4. Recommended engagement strategy\n5. Sentiment trend analysis\n6. Customer health score (0-100)` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "customer_enrichment",
          strict: true,
          schema: {
            type: "object",
            properties: {
              psychographics: { type: "object", properties: { interests: { type: "array", items: { type: "string" } }, values: { type: "array", items: { type: "string" } }, personality: { type: "string" }, lifestyle: { type: "string" }, painPoints: { type: "array", items: { type: "string" } }, goals: { type: "array", items: { type: "string" } } }, required: ["interests", "values", "personality", "lifestyle", "painPoints", "goals"], additionalProperties: false },
              clvTier: { type: "string", enum: ["low", "medium", "high", "premium"] },
              nextBestAction: { type: "string" },
              engagementStrategy: { type: "string" },
              sentimentTrend: { type: "string" },
              healthScore: { type: "number" },
            },
            required: ["psychographics", "clvTier", "nextBestAction", "engagementStrategy", "sentimentTrend", "healthScore"],
            additionalProperties: false,
          },
        },
      },
    });

    const enrichment = JSON.parse(response.choices[0].message.content as string || "{}");
    const clvMap: Record<string, number> = { low: 5000, medium: 25000, high: 100000, premium: 500000 };
    await updateCustomerProfile(input.id, {
      psychographics: enrichment.psychographics,
      clvPrediction: clvMap[enrichment.clvTier] || 25000,
      nextBestAction: enrichment.nextBestAction,
      sentimentScore: enrichment.healthScore,
    });
    return enrichment;
  }),

  // Customer Journey
  getJourney: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const customer = await getCustomerProfileById(input.id);
    if (!customer || customer.userId !== ctx.user.id) return null;
    const interactions = await getCustomerInteractionsByCustomer(input.id);
    
    // Group interactions into journey stages
    const stages = [
      { name: "Awareness", types: ["ad_click", "website_visit", "content_viewed"] },
      { name: "Interest", types: ["email_opened", "email_clicked", "social_interaction", "form_submitted"] },
      { name: "Consideration", types: ["meeting", "call_made", "call_received", "chat_message"] },
      { name: "Decision", types: ["purchase", "feedback"] },
      { name: "Retention", types: ["support_ticket", "email_sent"] },
    ];

    const journey = stages.map(stage => ({
      stage: stage.name,
      touchpoints: interactions.filter(i => stage.types.includes(i.type)).map(i => ({
        type: i.type,
        channel: i.channel,
        subject: i.subject,
        sentiment: i.sentiment,
        date: i.createdAt,
      })),
      count: interactions.filter(i => stage.types.includes(i.type)).length,
    }));

    return { customer, journey, totalInteractions: interactions.length };
  }),

  // Segments
  listSegments: protectedProcedure.query(async ({ ctx }) => {
    return getCustomerSegmentsByUser(ctx.user.id);
  }),

  createSegment: protectedProcedure.input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(["rfm", "behavioral", "demographic", "psychographic", "custom"]).default("custom"),
    criteria: z.object({
      rules: z.array(z.object({
        field: z.string(),
        operator: z.string(),
        value: z.any(),
      })),
      logic: z.enum(["and", "or"]),
    }),
    color: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    return createCustomerSegment({
      userId: ctx.user.id,
      name: input.name,
      description: input.description,
      type: input.type,
      criteria: input.criteria,
      color: input.color,
    });
  }),

  updateSegment: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    color: z.string().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    const s = await getCustomerSegmentById(input.id);
    if (!s || s.userId !== ctx.user.id) throw new Error("Not found");
    const { id, ...data } = input;
    await updateCustomerSegment(id, data);
  }),

  deleteSegment: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const s = await getCustomerSegmentById(input.id);
    if (!s || s.userId !== ctx.user.id) throw new Error("Not found");
    await deleteCustomerSegment(input.id);
  }),

  // AI Outreach Recommendations
  getOutreachPlan: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const customer = await getCustomerProfileById(input.id);
    if (!customer || customer.userId !== ctx.user.id) throw new Error("Not found");
    const interactions = await getCustomerInteractionsByCustomer(input.id);

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a customer relationship expert. Create personalized outreach plans that build genuine intimacy and trust." },
        { role: "user", content: `Create a personalized outreach plan for:\n\nName: ${customer.name}\nCompany: ${customer.company || "N/A"}\nTemperature: ${customer.temperature}\nEngagement: ${customer.engagementScore}/100\nSentiment: ${customer.sentimentScore}/100\nLast Contact: ${customer.lastContactAt || "Never"}\nInterests: ${(customer.psychographics as any)?.interests?.join(", ") || "Unknown"}\nPain Points: ${(customer.psychographics as any)?.painPoints?.join(", ") || "Unknown"}\nRecent Activity: ${interactions.slice(0, 3).map(i => i.type).join(", ") || "None"}\n\nProvide a 7-day outreach plan with:\n1. Day-by-day actions\n2. Channel recommendations (email, call, social, etc.)\n3. Specific messaging suggestions\n4. Personalization hooks\n5. Expected outcomes` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "outreach_plan",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              days: { type: "array", items: { type: "object", properties: { day: { type: "number" }, action: { type: "string" }, channel: { type: "string" }, message: { type: "string" }, personalizationHook: { type: "string" } }, required: ["day", "action", "channel", "message", "personalizationHook"], additionalProperties: false } },
              expectedOutcome: { type: "string" },
              riskFactors: { type: "array", items: { type: "string" } },
            },
            required: ["summary", "days", "expectedOutcome", "riskFactors"],
            additionalProperties: false,
          },
        },
      },
    });
    return JSON.parse(response.choices[0].message.content as string || "{}");
  }),

  // Dashboard stats
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const customers = await getCustomerProfilesByUser(ctx.user.id);
    const segments = await getCustomerSegmentsByUser(ctx.user.id);
    
    const hot = customers.filter(c => c.temperature === "hot").length;
    const warm = customers.filter(c => c.temperature === "warm").length;
    const cold = customers.filter(c => c.temperature === "cold").length;
    const dormant = customers.filter(c => c.temperature === "dormant").length;
    const avgEngagement = customers.length > 0 ? Math.round(customers.reduce((s, c) => s + (c.engagementScore || 0), 0) / customers.length) : 0;
    const avgSentiment = customers.length > 0 ? Math.round(customers.reduce((s, c) => s + (c.sentimentScore || 0), 0) / customers.length) : 0;
    const totalCLV = customers.reduce((s, c) => s + (c.clvPrediction || 0), 0);

    return {
      totalCustomers: customers.length,
      temperature: { hot, warm, cold, dormant },
      avgEngagement,
      avgSentiment,
      totalPredictedCLV: totalCLV,
      activeSegments: segments.filter(s => s.isActive).length,
      needsAttention: customers.filter(c => (c.engagementScore || 0) < 30 || c.temperature === "dormant").length,
    };
  }),
});
