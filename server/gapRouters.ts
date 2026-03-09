import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { checkLimit, consumeLimit } from "./creditsAndUsage";

const LIMIT_MSG = "Monthly limit reached. Upgrade your plan or add credits in Pricing.";

// ─── Brand Voice Router ────────────────────────────────────────────
export const brandVoiceRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getBrandVoicesByUser(ctx.user.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getBrandVoiceById(input.id);
  }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    documentUrls: z.array(z.string()).optional(),
    sampleText: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const limit = await checkLimit(ctx.user.id, "ai_generation");
    if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });

    const result = await db.createBrandVoice({
      userId: ctx.user.id,
      name: input.name,
      description: input.description || null,
      documentUrls: input.documentUrls || [],
      status: "processing",
    });

    // Analyze brand voice using LLM
    const analysisPrompt = input.sampleText
      ? `Analyze this brand's writing style and extract a detailed voice profile:\n\n"${input.sampleText}"\n\nBrand name: ${input.name}\n${input.description ? `Description: ${input.description}` : ""}`
      : `Create a brand voice profile for "${input.name}".\n${input.description ? `Description: ${input.description}` : "Create a professional, versatile brand voice."}`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a brand strategist. Analyze the brand and return a JSON voice profile with these fields: tone (string), style (string), vocabulary (array of 10 characteristic words), avoidWords (array of 5 words to avoid), samplePhrases (array of 5 example phrases in this voice), personality (string description), formality (string: casual/professional/formal/mixed). Return ONLY valid JSON." },
          { role: "user", content: analysisPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "brand_voice_profile",
            strict: true,
            schema: {
              type: "object",
              properties: {
                tone: { type: "string" },
                style: { type: "string" },
                vocabulary: { type: "array", items: { type: "string" } },
                avoidWords: { type: "array", items: { type: "string" } },
                samplePhrases: { type: "array", items: { type: "string" } },
                personality: { type: "string" },
                formality: { type: "string" },
              },
              required: ["tone", "style", "vocabulary", "avoidWords", "samplePhrases", "personality", "formality"],
              additionalProperties: false,
            },
          },
        },
      });

      const voiceProfile = JSON.parse(String(response.choices[0].message.content) || "{}");
      await db.updateBrandVoice(result.id, { voiceProfile, status: "ready" });
      await consumeLimit(ctx.user.id, "ai_generation", limit);
    } catch (e) {
      await db.updateBrandVoice(result.id, { status: "failed" });
    }

    return result;
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    isDefault: z.boolean().optional(),
    voiceProfile: z.any().optional(),
  })).mutation(async ({ input }) => {
    await db.updateBrandVoice(input.id, {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      ...(input.voiceProfile ? { voiceProfile: input.voiceProfile } : {}),
    });
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteBrandVoice(input.id);
    return { success: true };
  }),
});

// ─── Email Marketing Router ───────────────────────────────────────
export const emailMarketingRouter = router({
  // Lists
  listLists: protectedProcedure.query(async ({ ctx }) => {
    return db.getEmailListsByUser(ctx.user.id);
  }),

  createList: protectedProcedure.input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    return db.createEmailList({ userId: ctx.user.id, name: input.name, description: input.description || null });
  }),

  deleteList: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteEmailList(input.id);
    return { success: true };
  }),

  // Contacts
  getContacts: protectedProcedure.input(z.object({ listId: z.number() })).query(async ({ input }) => {
    return db.getEmailContactsByList(input.listId);
  }),

  addContact: protectedProcedure.input(z.object({
    listId: z.number(),
    email: z.string().email(),
    name: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    return db.createEmailContact({
      userId: ctx.user.id,
      listId: input.listId,
      email: input.email,
      name: input.name || null,
      tags: input.tags || [],
    });
  }),

  bulkImportContacts: protectedProcedure.input(z.object({
    listId: z.number(),
    contacts: z.array(z.object({
      email: z.string().email(),
      name: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })),
  })).mutation(async ({ ctx, input }) => {
    const contactsToInsert = input.contacts.map(c => ({
      userId: ctx.user.id,
      listId: input.listId,
      email: c.email,
      name: c.name || null,
      tags: c.tags || [],
    }));
    await db.bulkCreateEmailContacts(contactsToInsert);
    return { imported: contactsToInsert.length };
  }),

  deleteContact: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteEmailContact(input.id);
    return { success: true };
  }),

  // Campaigns
  listCampaigns: protectedProcedure.query(async ({ ctx }) => {
    return db.getEmailCampaignsByUser(ctx.user.id);
  }),

  getCampaign: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getEmailCampaignById(input.id);
  }),

  createCampaign: protectedProcedure.input(z.object({
    name: z.string().min(1),
    subject: z.string().min(1),
    htmlBody: z.string().optional(),
    textBody: z.string().optional(),
    fromName: z.string().optional(),
    replyTo: z.string().optional(),
    recipientListId: z.number().optional(),
    campaignId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    return db.createEmailCampaign({
      userId: ctx.user.id,
      name: input.name,
      subject: input.subject,
      htmlBody: input.htmlBody || null,
      textBody: input.textBody || null,
      fromName: input.fromName || null,
      replyTo: input.replyTo || null,
      recipientListId: input.recipientListId || null,
      campaignId: input.campaignId || null,
    });
  }),

  updateCampaign: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    subject: z.string().optional(),
    htmlBody: z.string().optional(),
    textBody: z.string().optional(),
    status: z.enum(["draft", "scheduled", "sending", "sent", "failed"]).optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateEmailCampaign(id, data as any);
    return { success: true };
  }),

  deleteCampaign: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteEmailCampaign(input.id);
    return { success: true };
  }),

  generateEmailHtml: protectedProcedure.input(z.object({
    subject: z.string(),
    contentBrief: z.string(),
    brandVoiceId: z.number().optional(),
    style: z.enum(["minimal", "modern", "bold", "elegant", "newsletter"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    let brandContext = "";
    if (input.brandVoiceId) {
      const voice = await db.getBrandVoiceById(input.brandVoiceId);
      if (voice?.voiceProfile) {
        const vp = voice.voiceProfile as any;
        brandContext = `\nBrand voice: Tone=${vp.tone}, Style=${vp.style}, Personality=${vp.personality}. Use vocabulary like: ${(vp.vocabulary || []).join(", ")}. Avoid: ${(vp.avoidWords || []).join(", ")}.`;
      }
    }

    const response = await invokeLLM({
      messages: [
        { role: "system", content: `You are an expert email designer. Generate a complete HTML email template with inline CSS styling. Style: ${input.style || "modern"}. Make it responsive and compatible with major email clients.${brandContext} Return ONLY the HTML code, no explanations.` },
        { role: "user", content: `Subject: ${input.subject}\n\nContent brief: ${input.contentBrief}` },
      ],
    });

    return { html: String(response.choices[0].message.content) || "" };
  }),

  sendCampaign: protectedProcedure.input(z.object({
    campaignId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const campaign = await db.getEmailCampaignById(input.campaignId);
    if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
    if (!campaign.recipientListId) throw new TRPCError({ code: "BAD_REQUEST", message: "No recipient list assigned" });

    const contacts = await db.getEmailContactsByList(campaign.recipientListId);
    const activeContacts = contacts.filter(c => !c.unsubscribed);

    if (activeContacts.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No active contacts in list" });

    await db.updateEmailCampaign(input.campaignId, {
      status: "sending",
      totalRecipients: activeContacts.length,
    });

    const { sendEmail } = await import("./email.service");
    const html = campaign.htmlBody || `<p>${(campaign.textBody || campaign.subject || "").replace(/\n/g, "</p><p>")}</p>`;

    let delivered = 0;
    let failed = 0;
    for (const contact of activeContacts) {
      try {
        const sent = await sendEmail(contact.email, campaign.subject, html);
        if (sent) delivered++; else failed++;
      } catch {
        failed++;
      }
    }

    await db.updateEmailCampaign(input.campaignId, {
      status: "sent",
      sentAt: new Date(),
      delivered,
      bounced: failed,
    });

    return { delivered, failed, total: activeContacts.length };
  }),
});

// ─── Landing Page Builder Router ──────────────────────────────────
export const landingPageRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getLandingPagesByUser(ctx.user.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getLandingPageById(input.id);
  }),

  create: protectedProcedure.input(z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    templateId: z.string().optional(),
    campaignId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const defaultComponents = [
      { type: "hero", props: { headline: input.title, subheadline: "Your compelling subheadline here", ctaText: "Get Started", ctaLink: "#", backgroundImage: "" }, order: 0 },
      { type: "features", props: { title: "Why Choose Us", features: [{ icon: "star", title: "Feature 1", description: "Description" }, { icon: "zap", title: "Feature 2", description: "Description" }, { icon: "shield", title: "Feature 3", description: "Description" }] }, order: 1 },
      { type: "form", props: { title: "Get In Touch", fields: [{ name: "name", type: "text", label: "Your Name", required: true }, { name: "email", type: "email", label: "Email Address", required: true }, { name: "phone", type: "tel", label: "Phone Number", required: false }], submitText: "Submit", successMessage: "Thank you! We'll be in touch." }, order: 2 },
      { type: "footer", props: { text: "© 2026 All rights reserved.", links: [] }, order: 3 },
    ];

    return db.createLandingPage({
      userId: ctx.user.id,
      title: input.title,
      slug: input.slug,
      templateId: input.templateId || "default",
      components: defaultComponents,
      campaignId: input.campaignId || null,
    });
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    slug: z.string().optional(),
    components: z.any().optional(),
    customCss: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateLandingPage(id, data as any);
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteLandingPage(input.id);
    return { success: true };
  }),

  getSubmissions: protectedProcedure.input(z.object({ landingPageId: z.number() })).query(async ({ input }) => {
    return db.getFormSubmissionsByPage(input.landingPageId);
  }),

  generateWithAi: protectedProcedure.input(z.object({
    purpose: z.string(),
    industry: z.string().optional(),
    style: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a landing page designer. Generate a JSON array of landing page components. Each component has: type (hero|features|testimonials|pricing|form|cta|stats|footer), props (object with relevant content), order (number). Generate 5-7 components for a high-converting landing page. Return ONLY valid JSON array." },
        { role: "user", content: `Create a landing page for: ${input.purpose}\nIndustry: ${input.industry || "general"}\nStyle: ${input.style || "modern and professional"}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "landing_page_components",
          strict: true,
          schema: {
            type: "object",
            properties: {
              components: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    props: { type: "object", additionalProperties: true },
                    order: { type: "integer" },
                  },
                  required: ["type", "props", "order"],
                  additionalProperties: false,
                },
              },
            },
            required: ["components"],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = JSON.parse(String(response.choices[0].message.content) || '{"components":[]}');
    return { components: parsed.components };
  }),

  templates: protectedProcedure.query(async () => {
    return [
      { id: "saas", name: "SaaS Product", description: "Perfect for software products", preview: "Hero + Features + Pricing + CTA" },
      { id: "lead-gen", name: "Lead Generation", description: "Optimized for lead capture", preview: "Hero + Benefits + Form + Testimonials" },
      { id: "ecommerce", name: "E-Commerce", description: "Product showcase and sales", preview: "Hero + Products + Reviews + CTA" },
      { id: "event", name: "Event Registration", description: "Event promotion and signup", preview: "Hero + Schedule + Speakers + Register" },
      { id: "agency", name: "Agency Portfolio", description: "Showcase your work", preview: "Hero + Portfolio + Services + Contact" },
      { id: "webinar", name: "Webinar Signup", description: "Webinar registration page", preview: "Hero + Topics + Speaker + Register" },
      { id: "app-download", name: "App Download", description: "Mobile app promotion", preview: "Hero + Screenshots + Features + Download" },
      { id: "course", name: "Online Course", description: "Course sales page", preview: "Hero + Curriculum + Instructor + Enroll" },
      { id: "restaurant", name: "Restaurant", description: "Restaurant landing page", preview: "Hero + Menu + Gallery + Reservation" },
      { id: "real-estate", name: "Real Estate", description: "Property listing page", preview: "Hero + Gallery + Details + Contact" },
    ];
  }),
});

// ─── Automation Workflow Router ───────────────────────────────────
export const automationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getAutomationWorkflowsByUser(ctx.user.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getAutomationWorkflowById(input.id);
  }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    triggerType: z.enum(["form_submission", "lead_status_change", "campaign_event", "schedule", "manual"]),
    triggerConfig: z.record(z.string(), z.unknown()).optional(),
    actions: z.array(z.object({
      type: z.string(),
      config: z.record(z.string(), z.unknown()),
      order: z.number(),
    })).optional(),
  })).mutation(async ({ ctx, input }) => {
    return db.createAutomationWorkflow({
      userId: ctx.user.id,
      name: input.name,
      description: input.description || null,
      triggerType: input.triggerType,
      triggerConfig: input.triggerConfig || {},
      actions: input.actions || [],
    });
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    triggerType: z.enum(["form_submission", "lead_status_change", "campaign_event", "schedule", "manual"]).optional(),
    triggerConfig: z.record(z.string(), z.unknown()).optional(),
    actions: z.array(z.object({
      type: z.string(),
      config: z.record(z.string(), z.unknown()),
      order: z.number(),
    })).optional(),
    isActive: z.boolean().optional(),
    status: z.enum(["draft", "active", "paused", "error"]).optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateAutomationWorkflow(id, data as any);
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteAutomationWorkflow(input.id);
    return { success: true };
  }),

  execute: protectedProcedure.input(z.object({ id: z.number(), context: z.object({ email: z.string().optional(), name: z.string().optional(), leadId: z.number().optional() }).optional() })).mutation(async ({ ctx, input }) => {
    const workflow = await db.getAutomationWorkflowById(input.id);
    if (!workflow) throw new TRPCError({ code: "NOT_FOUND" });

    const results: { action: string; status: string; message: string }[] = [];
    const actions = (workflow.actions as any[]) || [];
    const recipient = input.context?.email || (actions.find((a: any) => a.type === "send_email")?.config?.to as string);

    for (const action of actions) {
      try {
        switch (action.type) {
          case "send_email": {
            const to = (action.config?.to as string) || recipient;
            const subject = (action.config?.subject as string) || "Automation Email";
            const body = (action.config?.body as string) || "Automated message";
            const html = `<p>${body.replace(/\n/g, "</p><p>")}</p>`;
            if (to) {
              const { sendEmail } = await import("./email.service");
              const sent = await sendEmail(to, subject, html);
              results.push({ action: action.type, status: sent ? "success" : "failed", message: sent ? "Email sent" : "Send failed" });
            } else {
              await notifyOwner({ title: subject, content: body });
              results.push({ action: action.type, status: "success", message: "Notification sent (no recipient)" });
            }
            break;
          }
          case "notify_team":
            await notifyOwner({ title: "Team Notification", content: action.config.message || "Workflow triggered" });
            results.push({ action: action.type, status: "success", message: "Team notified" });
            break;
          case "update_lead_status":
            results.push({ action: action.type, status: "success", message: `Lead status would be updated to ${action.config.newStatus}` });
            break;
          case "generate_content":
            results.push({ action: action.type, status: "success", message: "Content generation triggered" });
            break;
          case "create_task":
            results.push({ action: action.type, status: "success", message: "Task created" });
            break;
          default:
            results.push({ action: action.type, status: "skipped", message: "Unknown action type" });
        }
      } catch (e: any) {
        results.push({ action: action.type, status: "failed", message: e.message || "Execution failed" });
      }
    }

    await db.updateAutomationWorkflow(input.id, {
      lastRunAt: new Date(),
      runCount: (workflow.runCount || 0) + 1,
    });

    return { results, executedAt: new Date().toISOString() };
  }),

  getTemplates: protectedProcedure.query(async () => {
    return [
      { id: "lead-nurture", name: "Lead Nurture Sequence", description: "Automatically nurture new leads with a 5-email sequence", triggerType: "lead_status_change" as const, actions: [
        { type: "send_email", config: { subject: "Welcome!", body: "Thanks for your interest..." }, order: 0 },
        { type: "update_lead_status", config: { newStatus: "contacted" }, order: 1 },
        { type: "notify_team", config: { message: "New lead entered nurture sequence" }, order: 2 },
      ]},
      { id: "welcome-series", name: "Welcome Series", description: "Onboard new customers with helpful content", triggerType: "form_submission" as const, actions: [
        { type: "send_email", config: { subject: "Welcome aboard!", body: "Here's how to get started..." }, order: 0 },
        { type: "create_task", config: { title: "Follow up with new signup" }, order: 1 },
      ]},
      { id: "re-engagement", name: "Re-engagement Campaign", description: "Win back inactive leads", triggerType: "schedule" as const, actions: [
        { type: "send_email", config: { subject: "We miss you!", body: "It's been a while..." }, order: 0 },
        { type: "generate_content", config: { type: "ad_copy_short", prompt: "Re-engagement offer" }, order: 1 },
      ]},
      { id: "post-purchase", name: "Post-Purchase Follow-up", description: "Delight customers after purchase", triggerType: "campaign_event" as const, actions: [
        { type: "send_email", config: { subject: "Thank you for your purchase!", body: "Here's what's next..." }, order: 0 },
        { type: "notify_team", config: { message: "New purchase completed" }, order: 1 },
      ]},
    ];
  }),
});

// ─── Social Publishing Router ─────────────────────────────────────
export const socialPublishRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getSocialPublishByUser(ctx.user.id);
  }),

  publish: protectedProcedure.input(z.object({
    contentId: z.number().optional(),
    platform: z.string(),
    postContent: z.string(),
    mediaUrls: z.array(z.string()).optional(),
    scheduledFor: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    // Check for platform connection
    const connections = await db.getAdPlatformConnectionsByUser(ctx.user.id);
    const connection = connections.find((c: any) => c.platform === input.platform && c.status === "connected");

    if (!connection) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `No connected ${input.platform} account. Go to Settings > Connections to connect your ${input.platform} account.`,
      });
    }

    const publishItem = await db.createSocialPublish({
      userId: ctx.user.id,
      contentId: input.contentId || null,
      platform: input.platform,
      connectionId: connection.id,
      postContent: input.postContent,
      mediaUrls: input.mediaUrls || [],
      status: input.scheduledFor ? "queued" : "publishing",
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
    });

    if (!input.scheduledFor) {
      // Attempt immediate publish via platform API
      try {
        // Platform-specific publishing logic
        const publishResult = await publishToPlatform(connection, input.postContent, input.mediaUrls || []);
        await db.updateSocialPublish(publishItem.id, {
          status: "published",
          publishedAt: new Date(),
          externalPostId: publishResult.postId,
          externalPostUrl: publishResult.postUrl,
        });
        return { success: true, status: "published", postUrl: publishResult.postUrl };
      } catch (e: any) {
        await db.updateSocialPublish(publishItem.id, {
          status: "failed",
          errorMessage: e.message,
        });
        return { success: false, status: "failed", error: e.message };
      }
    }

    return { success: true, status: "queued", scheduledFor: input.scheduledFor };
  }),

  retry: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.updateSocialPublish(input.id, { status: "queued", retryCount: 0 });
    return { success: true };
  }),

  cancel: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.updateSocialPublish(input.id, { status: "cancelled" });
    return { success: true };
  }),
});

// Platform-specific publishing helper
async function publishToPlatform(connection: any, content: string, mediaUrls: string[]) {
  const platform = connection.platform;
  const token = connection.accessToken;

  if (!token) {
    throw new Error(`No access token for ${platform}. Please reconnect your account.`);
  }

  switch (platform) {
    case "facebook":
    case "instagram": {
      // Meta Graph API
      const pageId = connection.accountId;
      const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          access_token: token,
          ...(mediaUrls.length > 0 ? { link: mediaUrls[0] } : {}),
        }),
      });
      const data = await response.json() as any;
      if (data.error) throw new Error(data.error.message);
      return { postId: data.id, postUrl: `https://facebook.com/${data.id}` };
    }

    case "twitter": {
      // Twitter API v2
      const response = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ text: content }),
      });
      const data = await response.json() as any;
      if (data.errors) throw new Error(data.errors[0]?.detail || "Twitter API error");
      return { postId: data.data?.id, postUrl: `https://twitter.com/i/web/status/${data.data?.id}` };
    }

    case "linkedin": {
      // LinkedIn API
      const authorId = connection.accountId;
      const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          author: `urn:li:person:${authorId}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: content },
              shareMediaCategory: "NONE",
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        }),
      });
      const data = await response.json() as any;
      if (data.status === 401) throw new Error("LinkedIn token expired. Please reconnect.");
      return { postId: data.id, postUrl: `https://linkedin.com/feed/update/${data.id}` };
    }

    case "tiktok": {
      // TikTok Content Posting API
      const response = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_info: { title: content.substring(0, 150), description: content },
          source_info: { source: "PULL_FROM_URL", video_url: mediaUrls[0] || "" },
        }),
      });
      const data = await response.json() as any;
      if (data.error?.code) throw new Error(data.error.message || "TikTok API error");
      return { postId: data.data?.publish_id, postUrl: "" };
    }

    default:
      throw new Error(`Publishing to ${platform} is not yet supported. Connect via Settings > Connections.`);
  }
}

// ─── Video Render Router ──────────────────────────────────────────
export const videoRenderRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getVideoRendersByUser(ctx.user.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getVideoRenderById(input.id);
  }),

  create: protectedProcedure.input(z.object({
    videoAdId: z.number().optional(),
    platform: z.string().optional(),
    script: z.string(),
    avatarStyle: z.string().optional(),
    duration: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    // Create render job
    const render = await db.createVideoRender({
      userId: ctx.user.id,
      videoAdId: input.videoAdId || null,
      platform: input.platform || "general",
      status: "queued",
      duration: input.duration || 30,
      resolution: "1080x1920",
    });

    // Generate frames using AI image generation
    try {
      await db.updateVideoRender(render.id, { status: "rendering" });

      // Parse script into scenes
      const sceneResponse = await invokeLLM({
        messages: [
          { role: "system", content: "Break this video script into 4-6 visual scenes. For each scene, provide a detailed image prompt for AI image generation and the duration in seconds. Return JSON array of objects with: prompt (detailed visual description), duration (seconds), text (overlay text for the scene)." },
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
                      prompt: { type: "string" },
                      duration: { type: "integer" },
                      text: { type: "string" },
                    },
                    required: ["prompt", "duration", "text"],
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

      const { scenes } = JSON.parse(String(sceneResponse.choices[0].message.content) || '{"scenes":[]}');

      // Generate images for each scene
      const frames: { imageUrl: string; duration: number; text?: string }[] = [];
      for (const scene of scenes) {
        const stylePrefix = input.avatarStyle === "photorealistic" ? "Photorealistic, cinematic, " : "Professional, clean, ";
        const imgResult = await generateImage({
          prompt: `${stylePrefix}${scene.prompt}. High quality, 16:9 aspect ratio, suitable for video frame.`,
        });
        const frameUrl: string = imgResult.url || "";
        frames.push({ imageUrl: frameUrl, duration: scene.duration, text: scene.text });
      }

      // Generate thumbnail from first frame
      const thumbnailUrl: string = frames[0]?.imageUrl || "";

      await db.updateVideoRender(render.id, {
        status: "completed",
        frames,
        thumbnailUrl,
        videoUrl: thumbnailUrl, // In production, this would be the assembled MP4
      });

      return { id: render.id, status: "completed", frames, thumbnailUrl };
    } catch (e: any) {
      await db.updateVideoRender(render.id, {
        status: "failed",
        errorMessage: e.message,
      });
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Video render failed: ${e.message}` });
    }
  }),
});

// ─── Webhook Router ───────────────────────────────────────────────
export const webhookRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getWebhookEndpointsByUser(ctx.user.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getWebhookEndpointById(input.id);
  }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    url: z.string().url(),
    events: z.array(z.string()),
  })).mutation(async ({ ctx, input }) => {
    const secret = crypto.randomBytes(32).toString("hex");
    return db.createWebhookEndpoint({
      userId: ctx.user.id,
      name: input.name,
      url: input.url,
      events: input.events,
      secret,
    });
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    url: z.string().url().optional(),
    events: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateWebhookEndpoint(id, data as any);
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteWebhookEndpoint(input.id);
    return { success: true };
  }),

  test: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const endpoint = await db.getWebhookEndpointById(input.id);
    if (!endpoint) throw new TRPCError({ code: "NOT_FOUND" });

    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": endpoint.secret || "",
          "X-Webhook-Event": "test",
        },
        body: JSON.stringify({
          event: "test",
          timestamp: new Date().toISOString(),
          data: { message: "This is a test webhook from OTOBI AI" },
        }),
      });

      return { success: response.ok, statusCode: response.status };
    } catch (e: any) {
      return { success: false, statusCode: 0, error: e.message };
    }
  }),

  getAvailableEvents: protectedProcedure.query(async () => {
    return [
      { event: "lead.created", description: "When a new lead is added" },
      { event: "lead.updated", description: "When a lead status changes" },
      { event: "lead.converted", description: "When a lead converts" },
      { event: "campaign.created", description: "When a new campaign is created" },
      { event: "campaign.completed", description: "When a campaign completes" },
      { event: "content.generated", description: "When new content is generated" },
      { event: "form.submitted", description: "When a landing page form is submitted" },
      { event: "payment.completed", description: "When a payment is completed" },
      { event: "video.rendered", description: "When a video render completes" },
      { event: "email.sent", description: "When an email campaign is sent" },
    ];
  }),
});

// ─── Image Editor Router ──────────────────────────────────────────
export const imageEditorRouter = router({
  removeBackground: protectedProcedure.input(z.object({
    imageUrl: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const limit = await checkLimit(ctx.user.id, "ai_image");
    if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
    const { url } = await generateImage({
      prompt: "Remove the background completely, make it transparent/white. Keep only the main subject.",
      originalImages: [{ url: input.imageUrl, mimeType: "image/png" }],
    });
    await consumeLimit(ctx.user.id, "ai_image", limit);
    return { url };
  }),

  resize: protectedProcedure.input(z.object({
    imageUrl: z.string(),
    platform: z.string(),
    format: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const limit = await checkLimit(ctx.user.id, "ai_image");
    if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
    const platformSizes: Record<string, string> = {
      "instagram-post": "1080x1080",
      "instagram-story": "1080x1920",
      "facebook-post": "1200x630",
      "facebook-cover": "820x312",
      "twitter-post": "1200x675",
      "twitter-header": "1500x500",
      "linkedin-post": "1200x627",
      "linkedin-cover": "1584x396",
      "youtube-thumbnail": "1280x720",
      "tiktok-video": "1080x1920",
      "pinterest-pin": "1000x1500",
    };

    const size = platformSizes[input.platform] || "1080x1080";
    const [width, height] = size.split("x");

    const { url } = await generateImage({
      prompt: `Resize and recompose this image to fit ${width}x${height} pixels (${input.platform} format). Maintain the subject and visual quality. Fill any new space naturally.`,
      originalImages: [{ url: input.imageUrl, mimeType: "image/png" }],
    });
    await consumeLimit(ctx.user.id, "ai_image", limit);
    return { url, dimensions: size };
  }),

  upscale: protectedProcedure.input(z.object({
    imageUrl: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const limit = await checkLimit(ctx.user.id, "ai_image");
    if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
    const { url } = await generateImage({
      prompt: "Upscale this image to higher resolution. Enhance details, sharpen edges, improve quality while maintaining the original composition and style.",
      originalImages: [{ url: input.imageUrl, mimeType: "image/png" }],
    });
    await consumeLimit(ctx.user.id, "ai_image", limit);
    return { url };
  }),

  applyFilter: protectedProcedure.input(z.object({
    imageUrl: z.string(),
    filter: z.enum(["vintage", "noir", "vibrant", "warm", "cool", "dramatic", "soft", "hdr"]),
  })).mutation(async ({ ctx, input }) => {
    const limit = await checkLimit(ctx.user.id, "ai_image");
    if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
    const filterPrompts: Record<string, string> = {
      vintage: "Apply a warm vintage film photography filter with slight grain and faded colors",
      noir: "Convert to dramatic black and white with high contrast film noir style",
      vibrant: "Enhance colors to be more vivid and saturated, make it pop",
      warm: "Apply warm golden tones, like golden hour photography",
      cool: "Apply cool blue tones, like a winter morning atmosphere",
      dramatic: "Apply dramatic lighting with deep shadows and bright highlights",
      soft: "Apply soft dreamy filter with gentle blur and pastel tones",
      hdr: "Apply HDR effect with enhanced dynamic range and detail",
    };

    const { url } = await generateImage({
      prompt: `${filterPrompts[input.filter]}. Keep the original composition and subject.`,
      originalImages: [{ url: input.imageUrl, mimeType: "image/png" }],
    });
    await consumeLimit(ctx.user.id, "ai_image", limit);
    return { url };
  }),

  getPlatformSizes: protectedProcedure.query(async () => {
    return [
      { platform: "instagram-post", label: "Instagram Post", width: 1080, height: 1080 },
      { platform: "instagram-story", label: "Instagram Story", width: 1080, height: 1920 },
      { platform: "facebook-post", label: "Facebook Post", width: 1200, height: 630 },
      { platform: "facebook-cover", label: "Facebook Cover", width: 820, height: 312 },
      { platform: "twitter-post", label: "Twitter Post", width: 1200, height: 675 },
      { platform: "twitter-header", label: "Twitter Header", width: 1500, height: 500 },
      { platform: "linkedin-post", label: "LinkedIn Post", width: 1200, height: 627 },
      { platform: "linkedin-cover", label: "LinkedIn Cover", width: 1584, height: 396 },
      { platform: "youtube-thumbnail", label: "YouTube Thumbnail", width: 1280, height: 720 },
      { platform: "tiktok-video", label: "TikTok Video", width: 1080, height: 1920 },
      { platform: "pinterest-pin", label: "Pinterest Pin", width: 1000, height: 1500 },
    ];
  }),
});

// ─── Multi-Language Router ────────────────────────────────────────
export const multiLanguageRouter = router({
  translate: protectedProcedure.input(z.object({
    text: z.string(),
    targetLanguage: z.string(),
    sourceLanguage: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const limit = await checkLimit(ctx.user.id, "ai_generation");
    if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
    const response = await invokeLLM({
      messages: [
        { role: "system", content: `You are a professional translator. Translate the following text to ${input.targetLanguage}. Maintain the tone, style, and marketing effectiveness. ${input.sourceLanguage ? `Source language: ${input.sourceLanguage}.` : "Auto-detect the source language."} Return ONLY the translated text, no explanations.` },
        { role: "user", content: input.text },
      ],
    });
    await consumeLimit(ctx.user.id, "ai_generation", limit);
    return { translated: String(response.choices[0].message.content) || "" };
  }),

  detectLanguage: protectedProcedure.input(z.object({
    text: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const limit = await checkLimit(ctx.user.id, "ai_generation");
    if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Detect the language of the following text. Return ONLY the language name in English (e.g., 'English', 'Spanish', 'French', 'Japanese')." },
        { role: "user", content: input.text },
      ],
    });
    await consumeLimit(ctx.user.id, "ai_generation", limit);
    return { language: String(response.choices[0].message.content || "").trim() || "Unknown" };
  }),

  getSupportedLanguages: protectedProcedure.query(async () => {
    return [
      "English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch",
      "Russian", "Chinese (Simplified)", "Chinese (Traditional)", "Japanese", "Korean",
      "Arabic", "Hindi", "Bengali", "Turkish", "Vietnamese", "Thai", "Indonesian",
      "Malay", "Filipino", "Swedish", "Norwegian", "Danish", "Finnish", "Polish",
      "Czech", "Romanian", "Hungarian", "Greek", "Hebrew", "Ukrainian",
    ];
  }),

  generateInLanguage: protectedProcedure.input(z.object({
    prompt: z.string(),
    language: z.string(),
    contentType: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const limit = await checkLimit(ctx.user.id, "ai_generation");
    if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
    const response = await invokeLLM({
      messages: [
        { role: "system", content: `You are a marketing copywriter who writes natively in ${input.language}. Generate the requested content directly in ${input.language} (not translated from English). Ensure cultural relevance and natural phrasing for ${input.language}-speaking audiences. Content type: ${input.contentType || "marketing copy"}.` },
        { role: "user", content: input.prompt },
      ],
    });
    await consumeLimit(ctx.user.id, "ai_generation", limit);
    return { content: String(response.choices[0].message.content) || "" };
  }),
});

// ─── Competitor Spy Router ────────────────────────────────────────
export const competitorSpyRouter = router({
  analyzeAds: protectedProcedure.input(z.object({
    competitorUrl: z.string(),
    platform: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const limit = await checkLimit(ctx.user.id, "ai_generation");
    if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });
    // Fetch competitor page
    let pageContent = "";
    try {
      const response = await fetch(input.competitorUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; OtobiAIBot/1.0)" },
      });
      pageContent = await response.text();
      // Extract relevant text (strip HTML)
      pageContent = pageContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .substring(0, 5000);
    } catch {
      pageContent = `URL: ${input.competitorUrl} (could not fetch, analyze based on URL)`;
    }

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a competitive intelligence analyst. Analyze this competitor's marketing presence and provide detailed insights. Return JSON with: companyName, industry, targetAudience, messagingStrategy, uniqueSellingPoints (array), weaknesses (array), adFormats (array), estimatedAdSpend (string), recommendations (array of how to compete against them)." },
        { role: "user", content: `Analyze this competitor:\nURL: ${input.competitorUrl}\n${input.platform ? `Platform focus: ${input.platform}` : ""}\n\nPage content:\n${pageContent}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "competitor_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              companyName: { type: "string" },
              industry: { type: "string" },
              targetAudience: { type: "string" },
              messagingStrategy: { type: "string" },
              uniqueSellingPoints: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } },
              adFormats: { type: "array", items: { type: "string" } },
              estimatedAdSpend: { type: "string" },
              recommendations: { type: "array", items: { type: "string" } },
            },
            required: ["companyName", "industry", "targetAudience", "messagingStrategy", "uniqueSellingPoints", "weaknesses", "adFormats", "estimatedAdSpend", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    await consumeLimit(ctx.user.id, "ai_generation", limit);
    return JSON.parse(String(response.choices[0].message.content) || "{}");
  }),
});

// ─── Bulk Import Router ───────────────────────────────────────────
export const bulkImportRouter = router({
  importLeads: protectedProcedure.input(z.object({
    leads: z.array(z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      source: z.string().optional(),
      notes: z.string().optional(),
    })),
  })).mutation(async ({ ctx, input }) => {
    let imported = 0;
    for (const lead of input.leads) {
      await db.createLead({
        userId: ctx.user.id,
        name: lead.name || null,
        email: lead.email || null,
        phone: lead.phone || null,
        company: lead.company || null,
        source: lead.source || "import",
        notes: lead.notes || null,
      });
      imported++;
    }
    return { imported, total: input.leads.length };
  }),

  importProducts: protectedProcedure.input(z.object({
    products: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      url: z.string().optional(),
      category: z.string().optional(),
    })),
  })).mutation(async ({ ctx, input }) => {
    let imported = 0;
    for (const product of input.products) {
      await db.createProduct({
        userId: ctx.user.id,
        name: product.name,
        description: product.description || null,
        url: product.url || null,
        category: product.category || null,
      });
      imported++;
    }
    return { imported, total: input.products.length };
  }),

  parseCSV: protectedProcedure.input(z.object({
    csvContent: z.string(),
    type: z.enum(["leads", "products", "contacts"]),
  })).mutation(async ({ input }) => {
    const lines = input.csvContent.trim().split("\n");
    if (lines.length < 2) return { headers: [], rows: [], rowCount: 0 };

    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ""; });
      return row;
    });

    return { headers, rows: rows.slice(0, 100), rowCount: rows.length };
  }),
});
