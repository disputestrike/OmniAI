/**
 * AI Campaign Wizard: generate campaign + assets from goal and context, then launch.
 */
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { checkLimit, consumeLimit } from "./creditsAndUsage";
import { TRPCError } from "@trpc/server";

const LIMIT_MSG = "Monthly limit reached. Upgrade your plan or add credits in Pricing.";

export type WizardBusinessContext = {
  businessName?: string;
  whatYouSell?: string;
  targetAudience?: string;
  brandTone?: string;
};

export type WizardCampaignDetails = {
  campaignName: string;
  offer: string;
  targetAudience?: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
  channels: ("landing_page" | "paid_ads" | "email" | "social" | "sms")[];
};

export type GeneratedAsset = {
  assetType: string;
  assetId: number;
  status: string;
  preview?: string;
  title?: string;
};

export async function generateCampaignFromWizard(
  userId: number,
  goal: string,
  businessContext: WizardBusinessContext,
  details: WizardCampaignDetails
): Promise<{ campaignId: number; assets: GeneratedAsset[] }> {
  const limit = await checkLimit(userId, "ai_generation");
  if (!limit.allowed) throw new TRPCError({ code: "FORBIDDEN", message: LIMIT_MSG });

  const campaign = await db.createCampaign({
    userId,
    name: details.campaignName,
    description: details.offer,
    goal,
    platforms: details.channels as unknown as string[],
    status: "draft",
    budget: details.budget ?? null,
    targetAudience: details.targetAudience ? { description: details.targetAudience } : null,
    startDate: details.startDate ? new Date(details.startDate) : null,
    endDate: details.endDate ? new Date(details.endDate) : null,
    totalBudget: details.budget ? String(parseFloat(details.budget.replace(/[^0-9.]/g, "")) || 0) : null,
  });
  const campaignId = campaign.id;
  const assets: GeneratedAsset[] = [];

  const ctx = `Business: ${businessContext.businessName || "N/A"}. Sell: ${businessContext.whatYouSell || "N/A"}. Audience: ${businessContext.targetAudience || "N/A"}. Tone: ${businessContext.brandTone || "professional"}. Offer: ${details.offer}.`;

  if (details.channels.includes("landing_page")) {
    const res = await invokeLLM({
      messages: [
        { role: "system", content: "You are a landing page designer. Generate a JSON array of landing page components. Each component has: type (hero|features|testimonials|form|cta|footer), props (object with headline, subheadline, ctaText, etc.), order (number). Return ONLY valid JSON: { \"components\": [ ... ] }." },
        { role: "user", content: `Goal: ${goal}. ${ctx}. Create a high-converting landing page.` },
      ],
      response_format: { type: "json_schema", json_schema: { name: "lp", strict: true, schema: { type: "object", properties: { components: { type: "array", items: { type: "object", properties: { type: { type: "string" }, props: { type: "object" }, order: { type: "integer" } }, required: ["type", "props", "order"] } } }, required: ["components"] } } },
    });
    let components: { type: string; props: Record<string, unknown>; order: number }[] = [];
    try {
      const raw = String((res as any).choices?.[0]?.message?.content || "{}");
      const parsed = JSON.parse(raw);
      components = Array.isArray(parsed.components) ? parsed.components : [];
    } catch {
      components = [
        { type: "hero", props: { headline: details.offer, subheadline: "Get started today", ctaText: "Sign Up", order: 0 }, order: 0 },
        { type: "form", props: { title: "Contact", fields: [], order: 1 }, order: 1 },
      ];
    }
    const slug = details.campaignName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50) || "campaign";
    const page = await db.createLandingPage({
      userId,
      title: details.campaignName,
      slug: slug + "-" + Date.now().toString(36),
      templateId: "default",
      components,
      campaignId,
    });
    await db.createCampaignAsset({ campaignId, assetType: "landing_page", assetId: page.id, status: "draft" });
    assets.push({ assetType: "landing_page", assetId: page.id, status: "draft", title: details.campaignName });
    await consumeLimit(userId, "ai_generation", limit);
  }

  if (details.channels.includes("paid_ads")) {
    for (let i = 0; i < 3; i++) {
      const limitAd = await checkLimit(userId, "ai_generation");
      if (!limitAd.allowed) break;
      const limitAdResult = limitAd;
      const adRes = await invokeLLM({
        messages: [
          { role: "system", content: "You write short ad copy. Return JSON: { \"headline\": \"...\", \"body\": \"...\", \"cta\": \"...\" }." },
          { role: "user", content: `${ctx} Write ad variation ${i + 1}/3.` },
        ],
        response_format: { type: "json_schema", json_schema: { name: "ad", strict: true, schema: { type: "object", properties: { headline: { type: "string" }, body: { type: "string" }, cta: { type: "string" } }, required: ["headline", "body", "cta"] } } },
      });
      let headline = "Get Started", body = details.offer, cta = "Learn More";
      try {
        const raw = String((adRes as any).choices?.[0]?.message?.content || "{}");
        const o = JSON.parse(raw);
        headline = o.headline || headline; body = o.body || body; cta = o.cta || cta;
      } catch {}
      const content = await db.createContent({
        userId,
        campaignId,
        type: "ad_copy_short",
        platform: "meta",
        title: `Ad ${i + 1}: ${headline.slice(0, 40)}`,
        body: JSON.stringify({ headline, body, cta }),
      });
      await db.createCampaignAsset({ campaignId, assetType: "ad_creative", assetId: content.id, status: "draft" });
      assets.push({ assetType: "ad_creative", assetId: content.id, status: "draft", preview: headline });
      await consumeLimit(userId, "ai_generation", limitAdResult);
    }
  }

  if (details.channels.includes("email")) {
    const limitEm = await checkLimit(userId, "ai_generation");
    if (limitEm.allowed) {
      const emailRes = await invokeLLM({
        messages: [
          { role: "system", content: "You write a short marketing email. Return JSON: { \"subject\": \"...\", \"body\": \"...\" } (body can be HTML or plain)." },
          { role: "user", content: `${ctx} Write a welcome/follow-up email for this campaign.` },
        ],
        response_format: { type: "json_schema", json_schema: { name: "email", strict: true, schema: { type: "object", properties: { subject: { type: "string" }, body: { type: "string" } }, required: ["subject", "body"] } } },
      });
      let subject = `Re: ${details.offer}`, body = `<p>Thanks for your interest. ${details.offer}</p>`;
      try {
        const raw = String((emailRes as any).choices?.[0]?.message?.content || "{}");
        const o = JSON.parse(raw);
        subject = o.subject || subject; body = o.body || body;
      } catch {}
      const list = (await db.getEmailListsByUser(userId))[0];
      const emailCampaign = await db.createEmailCampaign({
        userId,
        campaignId,
        name: `${details.campaignName} - Email`,
        subject,
        htmlBody: body,
        textBody: body.replace(/<[^>]*>/g, ""),
        recipientListId: list?.id ?? null,
      });
      await db.createCampaignAsset({ campaignId, assetType: "email", assetId: emailCampaign.id, status: "draft" });
      assets.push({ assetType: "email", assetId: emailCampaign.id, status: "draft", preview: subject });
      await consumeLimit(userId, "ai_generation", limitEm);
    }
  }

  if (details.channels.includes("social")) {
    for (let i = 0; i < Math.min(5, 3); i++) {
      const limitS = await checkLimit(userId, "ai_generation");
      if (!limitS.allowed) break;
      const limitSResult = limitS;
      const socialRes = await invokeLLM({
        messages: [
          { role: "system", content: "You write a short social post (1-2 sentences). Return JSON: { \"caption\": \"...\" }." },
          { role: "user", content: `${ctx} Social post ${i + 1}.` },
        ],
        response_format: { type: "json_schema", json_schema: { name: "social", strict: true, schema: { type: "object", properties: { caption: { type: "string" } }, required: ["caption"] } } },
      });
      let caption = details.offer;
      try {
        const raw = String((socialRes as any).choices?.[0]?.message?.content || "{}");
        caption = JSON.parse(raw).caption || caption;
      } catch {}
      const content = await db.createContent({
        userId,
        campaignId,
        type: "social_caption",
        platform: "instagram",
        title: `Post ${i + 1}`,
        body: caption,
      });
      await db.createCampaignAsset({ campaignId, assetType: "social_post", assetId: content.id, status: "draft" });
      assets.push({ assetType: "social_post", assetId: content.id, status: "draft", preview: caption.slice(0, 80) });
      await consumeLimit(userId, "ai_generation", limitSResult);
    }
  }

  return { campaignId, assets };
}

export async function launchWizardCampaign(userId: number, campaignId: number): Promise<{ launched: string[] }> {
  const campaign = await db.getCampaignById(campaignId);
  if (!campaign || campaign.userId !== userId) throw new TRPCError({ code: "NOT_FOUND" });

  const assetRows = await db.getCampaignAssetsByCampaignId(campaignId);
  const launched: string[] = [];

  for (const row of assetRows) {
    if (row.assetType === "landing_page") {
      const page = await db.getLandingPageById(row.assetId);
      if (page) {
        await db.updateLandingPage(row.assetId, { status: "published", publishedUrl: page.publishedUrl || `/lp/${page.slug}` });
        await db.updateCampaignAsset(row.id, { status: "live" });
        launched.push("landing_page");
      }
    }
    if (row.assetType === "email") {
      await db.updateCampaignAsset(row.id, { status: "approved" });
      launched.push("email");
    }
    if (row.assetType === "ad_creative" || row.assetType === "social_post") {
      await db.updateCampaignAsset(row.id, { status: "approved" });
      launched.push(row.assetType);
    }
  }

  await db.updateCampaign(campaignId, { status: "active" });
  return { launched };
}
