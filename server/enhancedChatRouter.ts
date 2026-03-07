import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

export const enhancedChatRouter = router({
  // ─── Projects CRUD ─────────────────────────────────────────────
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getProjectsByUser(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getProjectById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createProject({ userId: ctx.user.id, name: input.name, description: input.description });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["active", "paused", "completed", "archived"]).optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateProject(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteProject(input.id);
      return { success: true };
    }),
  }),

  // ─── Conversations CRUD ────────────────────────────────────────
  conversations: router({
    list: protectedProcedure.input(z.object({ projectId: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.getConversationsByUser(ctx.user.id, input?.projectId);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getConversationById(input.id);
    }),
    save: protectedProcedure.input(z.object({
      id: z.number().optional(),
      projectId: z.number().optional(),
      title: z.string().optional(),
      messages: z.any(),
      agentMode: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      if (input.id) {
        await db.updateConversation(input.id, {
          title: input.title,
          messages: input.messages,
          projectId: input.projectId,
        });
        return db.getConversationById(input.id);
      } else {
        return db.createConversation({
          userId: ctx.user.id,
          projectId: input.projectId,
          title: input.title || "New Conversation",
          messages: input.messages,
          agentMode: input.agentMode,
        });
      }
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteConversation(input.id);
      return { success: true };
    }),
  }),

  // ─── Enhanced AI Chat with file/link support ───────────────────
  sendWithAttachments: protectedProcedure.input(z.object({
    message: z.string().min(1),
    history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional(),
    attachments: z.array(z.object({
      type: z.enum(["image", "file", "url"]),
      url: z.string().optional(),
      name: z.string().optional(),
      mimeType: z.string().optional(),
      content: z.string().optional(),
    })).optional(),
    projectId: z.number().optional(),
    conversationId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    // Build attachment context for the AI
    let attachmentContext = "";
    if (input.attachments && input.attachments.length > 0) {
      attachmentContext = "\n\n[ATTACHMENTS PROVIDED BY USER]\n";
      for (const att of input.attachments) {
        if (att.type === "url") {
          attachmentContext += `- URL: ${att.url}\n`;
        } else if (att.type === "image") {
          attachmentContext += `- Image: ${att.name || "uploaded image"} (${att.url})\n`;
        } else if (att.type === "file") {
          attachmentContext += `- File: ${att.name || "uploaded file"} (${att.mimeType || "unknown type"})\n`;
          if (att.content) attachmentContext += `  Content preview: ${att.content.slice(0, 500)}\n`;
        }
      }
      attachmentContext += "\nProcess these attachments and help the user with their request. If they shared a URL, analyze it. If they shared an image, describe what you see and suggest marketing content. If they shared a file, extract key information and suggest how to use it for marketing.\n";
    }

    // Build project context if in a project
    let projectContext = "";
    if (input.projectId) {
      const project = await db.getProjectById(input.projectId);
      if (project) {
        projectContext = `\n\n[CURRENT PROJECT: "${project.name}"]\n${project.description || ""}\nAll content created in this conversation should be associated with this project.\n`;
      }
    }

    const systemPrompt = `You are the OTOBI AI Marketing Agent — the most powerful marketing strategist in the world and a TRUSTED ADVISOR. You help users dominate any market, make any product #1, make any person viral, and spread any concept into mass consciousness.

Your expertise covers:
- Campaign strategy across all platforms (social, search, email, SMS, WhatsApp, TV, radio, print, podcasts)
- Psychological persuasion (Cialdini's principles, AIDA, PAS, Monroe's Motivated Sequence)
- Micro-targeting by demographics, psychographics, behavior, and cultural context
- Viral content creation and amplification
- SEO, SEM, content marketing, influencer strategy
- Lead generation, nurturing, and conversion
- A/B testing and optimization
- Global marketing across all regions and languages
- Competitor analysis and market positioning
- Brand building and personal branding
- UGC, creator economy, and community building

CRITICAL RULES — YOU ARE A TRUSTED ADVISOR:
1. NEVER leave the user hanging. After EVERY response, suggest 3-5 specific next actions.
2. ALWAYS walk users step-by-step from discovery to execution.
3. ALWAYS reference the specific OmniMarket tools they should use:
   - **Product Analyzer** (/products) — analyze products
   - **Content Studio** (/content) — create 22 types of marketing content
   - **Creative Engine** (/creatives) — generate AI images
   - **Video Ads** (/video-ads) — video ad scripts
   - **Video Render** (/video-render) — render MP4 videos
   - **Video Studio** (/video-studio) — personal videos with teleprompter
   - **Image Editor** (/image-editor) — edit images
   - **Brand Voice** (/brand-voice) — train AI on brand voice
   - **Translate** (/translate) — translate to 30+ languages
   - **Campaigns** (/campaigns) — manage campaigns
   - **A/B Testing** (/ab-testing) — test variations
   - **Scheduler** (/scheduler) — schedule publishing
   - **Content Ingest** (/content-ingest) — paste URLs, upload files, remix content
   - **Content Library** (/content-library) — search and manage all content
   - **Projects** (/projects) — organize campaigns into project folders
   - **Social Publish** (/social-publish) — publish to social media
   - **Email Marketing** (/email-marketing) — email campaigns
   - **Analytics** (/analytics) — performance analytics
   - **Competitor Spy** (/competitor-spy) — analyze competitors
   - **Landing Pages** (/landing-pages) — build landing pages
   - **Automations** (/automations) — marketing automation

4. FORMAT your next actions under "## 🎯 Your Next Steps" heading with numbered list.
5. ORCHESTRATE full workflows from discovery to execution.
6. When the user shares attachments (URLs, images, files), IMMEDIATELY process them and create actionable marketing content or strategy.
7. If the user shares a link to a competitor's post or content they like, analyze it and suggest how to remix/improve it.
8. Be specific, actionable, and data-driven.
9. Track conversation flow — push forward from strategy to execution.
10. When creating content from attachments, save it to the project if one is active.
${projectContext}${attachmentContext}`;

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];
    if (input.history) {
      for (const h of input.history) {
        messages.push({ role: h.role, content: h.content });
      }
    }

    // Build user message with attachment references
    let userContent = input.message;
    if (input.attachments && input.attachments.length > 0) {
      userContent += "\n\n[I've attached the following:";
      for (const att of input.attachments) {
        if (att.type === "url") userContent += `\n- Link: ${att.url}`;
        else if (att.type === "image") userContent += `\n- Image: ${att.name || att.url}`;
        else userContent += `\n- File: ${att.name} (${att.mimeType})`;
      }
      userContent += "]";
    }
    messages.push({ role: "user", content: userContent });

    const response = await invokeLLM({ messages });
    const reply = response.choices[0].message.content as string;

    // Auto-save conversation if conversationId provided
    if (input.conversationId) {
      const conv = await db.getConversationById(input.conversationId);
      if (conv) {
        const existingMessages = (conv.messages as any[]) || [];
        existingMessages.push({ role: "user", content: input.message });
        existingMessages.push({ role: "assistant", content: reply });
        await db.updateConversation(input.conversationId, { messages: existingMessages });
      }
    }

    return { reply };
  }),

  // ─── Upload file for chat attachment ───────────────────────────
  uploadAttachment: protectedProcedure.input(z.object({
    base64: z.string(),
    filename: z.string(),
    mimeType: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const buffer = Buffer.from(input.base64, "base64");
    const suffix = Math.random().toString(36).slice(2, 8);
    const key = `chat-attachments/${ctx.user.id}/${suffix}-${input.filename}`;
    const result = await storagePut(key, buffer, input.mimeType);
    const url = result.url;
    return { url, filename: input.filename, mimeType: input.mimeType };
  }),

  // ─── Content Templates CRUD ────────────────────────────────────
  templates: router({
    list: protectedProcedure.input(z.object({ category: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.getTemplatesByUser(ctx.user.id, input?.category);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getTemplateById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.string().optional(),
      contentType: z.string().optional(),
      platform: z.string().optional(),
      body: z.string().optional(),
      variables: z.any().optional(),
      metadata: z.any().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createTemplate({ userId: ctx.user.id, ...input });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      body: z.string().optional(),
      variables: z.any().optional(),
      metadata: z.any().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateTemplate(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteTemplate(input.id);
      return { success: true };
    }),
    saveFromContent: protectedProcedure.input(z.object({
      contentId: z.number(),
      name: z.string(),
      category: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const content = await db.getContentById(input.contentId);
      if (!content) throw new Error("Content not found");
      return db.createTemplate({
        userId: ctx.user.id,
        name: input.name,
        description: `Template from content: ${content.title || content.type}`,
        category: input.category || "saved",
        contentType: content.type,
        platform: content.platform || undefined,
        body: content.body || undefined,
        metadata: content.metadata,
      });
    }),
    generateFromTemplate: protectedProcedure.input(z.object({
      templateId: z.number(),
      variables: z.record(z.string(), z.string()).optional(),
      platform: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const template = await db.getTemplateById(input.templateId);
      if (!template) throw new Error("Template not found");
      await db.incrementTemplateUsage(input.templateId);

      let body = template.body || "";
      if (input.variables) {
        for (const [key, val] of Object.entries(input.variables)) {
          body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(val));
        }
      }

      // Use AI to adapt the template
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a marketing content expert. Adapt the following template into fresh, engaging content. Maintain the structure and style but make it unique. If variables are provided, incorporate them naturally." },
          { role: "user", content: `Template:\n${body}\n\nVariables: ${JSON.stringify(input.variables || {})}\nTarget platform: ${input.platform || template.platform || "general"}` },
        ],
      });

      const generatedBody = response.choices[0].message.content as string;
      const result = await db.createContent({
        userId: ctx.user.id,
        type: (template.contentType as any) || "ad_copy_short",
        platform: input.platform || template.platform || undefined,
        title: `From template: ${template.name}`,
        body: generatedBody,
        metadata: { templateId: template.id, variables: input.variables },
      });

      return { contentId: result.id, body: generatedBody };
    }),
  }),

  // ─── Performance Metrics ───────────────────────────────────────
  performance: router({
    list: protectedProcedure.input(z.object({ platform: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.getPerformanceByUser(ctx.user.id, input?.platform);
    }),
    byContent: protectedProcedure.input(z.object({ contentId: z.number() })).query(async ({ input }) => {
      return db.getPerformanceByContent(input.contentId);
    }),
    record: protectedProcedure.input(z.object({
      contentId: z.number().optional(),
      platform: z.string(),
      postUrl: z.string().optional(),
      likes: z.number().optional(),
      shares: z.number().optional(),
      comments: z.number().optional(),
      reach: z.number().optional(),
      impressions: z.number().optional(),
      clicks: z.number().optional(),
      engagementRate: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createPerformanceMetric({ userId: ctx.user.id, ...input });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      likes: z.number().optional(),
      shares: z.number().optional(),
      comments: z.number().optional(),
      reach: z.number().optional(),
      impressions: z.number().optional(),
      clicks: z.number().optional(),
      engagementRate: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updatePerformanceMetric(id, data);
      return { success: true };
    }),
    summary: protectedProcedure.query(async ({ ctx }) => {
      const all = await db.getPerformanceByUser(ctx.user.id);
      const totalLikes = all.reduce((s, m) => s + (m.likes || 0), 0);
      const totalShares = all.reduce((s, m) => s + (m.shares || 0), 0);
      const totalComments = all.reduce((s, m) => s + (m.comments || 0), 0);
      const totalReach = all.reduce((s, m) => s + (m.reach || 0), 0);
      const totalImpressions = all.reduce((s, m) => s + (m.impressions || 0), 0);
      const totalClicks = all.reduce((s, m) => s + (m.clicks || 0), 0);

      // Group by platform
      const byPlatform: Record<string, { likes: number; shares: number; comments: number; reach: number; impressions: number; clicks: number; count: number }> = {};
      for (const m of all) {
        const p = m.platform || "unknown";
        if (!byPlatform[p]) byPlatform[p] = { likes: 0, shares: 0, comments: 0, reach: 0, impressions: 0, clicks: 0, count: 0 };
        byPlatform[p].likes += m.likes || 0;
        byPlatform[p].shares += m.shares || 0;
        byPlatform[p].comments += m.comments || 0;
        byPlatform[p].reach += m.reach || 0;
        byPlatform[p].impressions += m.impressions || 0;
        byPlatform[p].clicks += m.clicks || 0;
        byPlatform[p].count++;
      }

      return {
        totalPosts: all.length,
        totalLikes, totalShares, totalComments, totalReach, totalImpressions, totalClicks,
        byPlatform,
      };
    }),
  }),
});
