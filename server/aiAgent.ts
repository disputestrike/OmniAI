/**
 * OTOBI AI Marketing Agent — executor with tools.
 * Asks max 5 questions, then builds via tools. Never gives to-do lists or "go to".
 * Uses Anthropic SDK + Claude Haiku for tool calling (no Forge).
 */
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

const CLAUDE_HAIKU_MODEL = "claude-haiku-4-5-20251001";

type AnthropicMessage = { role: "user" | "assistant"; content: string | Array<Record<string, unknown>> };

/** Call Anthropic Messages API with tools; returns text content and optional tool_use blocks. */
async function chatWithTools(
  system: string,
  messages: AnthropicMessage[],
  tools: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>
): Promise<{ content: string; tool_calls?: Array<{ id: string; name: string; input: Record<string, unknown> }> }> {
  if (!ENV.anthropicApiKey?.trim()) throw new Error("ANTHROPIC_API_KEY required for agent tools.");
  const client = new Anthropic({ apiKey: ENV.anthropicApiKey });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await client.messages.create({
    model: CLAUDE_HAIKU_MODEL,
    max_tokens: 4096,
    system,
    messages: messages as any,
    tools: tools as any,
  });
  const blocks = (response.content ?? []) as Array<{ type: string; text?: string; id?: string; name?: string; input?: unknown }>;
  const text = blocks
    .filter((b) => b.type === "text" && "text" in b)
    .map((b) => (b as { text: string }).text)
    .join("\n")
    .trim();
  const tool_calls = blocks
    .filter((b) => b.type === "tool_use" && "id" in b && "name" in b)
    .map((b) => ({
      id: (b as { id: string }).id,
      name: (b as { name: string }).name,
      input: (typeof (b as { input?: unknown }).input === "object" && (b as { input?: unknown }).input !== null
        ? (b as { input: Record<string, unknown> }).input
        : {}) as Record<string, unknown>,
    }));
  return { content: text, tool_calls: tool_calls.length > 0 ? tool_calls : undefined };
}

const AGENT_SYSTEM_PROMPT = `You are the OTOBI AI Marketing Agent. You build marketing campaigns immediately.

CORE RULE: Never ask more than ONE clarifying question. If you have enough to start, start.

When the user gives you a product, a goal, or any description:
1. Say "Got it. Building now."
2. Call analyzeProduct FIRST to get product context.
3. Call createCampaign SECOND — this returns a campaignId.
4. IMMEDIATELY pass that campaignId into ALL subsequent tool calls: generateLandingPage, generateEmailSequence, generateSocialPosts, generateVideoScript, generateAdCreative. Every asset MUST have campaignId set.
5. After tools complete, write 2 sentences summarizing what was built. Nothing more.

CRITICAL: campaignId links everything together. Never call asset tools without passing the campaignId from createCampaign. If createCampaign fails, use 0 as fallback but always pass something.

If you are TRULY missing something critical (no product described at all), ask ONE question only:
"What are you launching and who is your customer?"

Never ask about budget, channels, competitors, or timeline before building. Build first.
Never name internal tools, modules, or pages to the user.
Never give a to-do list. Never say "you should go to X."
Never explain what you cannot do.
If a tool fails, skip it silently and continue.
When the user attaches files or provides a URL, use that context; do not say you cannot access them.`;

// Tool definitions: OpenAI-style (for reference) and Anthropic-style for the agent loop
const AGENT_TOOL_DEFS = [
  {
    name: "analyzeProduct",
    description: "Analyze the user's product and competitors. Returns positioning statement, value props, differentiators, and target audience summary.",
    parameters: {
      type: "object" as const,
      properties: {
        productDescription: { type: "string" as const, description: "What the product is and what problem it solves" },
        competitors: { type: "string" as const, description: "Comma-separated competitor names" },
      },
      required: ["productDescription"] as const,
    },
  },
  {
    name: "createCampaign",
    description: "Create a campaign record. Call this first so other tools can link assets to it. Returns campaignId.",
    parameters: {
      type: "object" as const,
      properties: {
        name: { type: "string" as const, description: "Campaign name" },
        goal: { type: "string" as const, description: "e.g. product_launch, lead_gen, webinar" },
      },
      required: ["name", "goal"] as const,
    },
  },
  {
    name: "generateEmailSequence",
    description: "Generate a full email sequence and create draft emails in Email Marketing. Link to campaign if campaignId is set.",
    parameters: {
      type: "object" as const,
      properties: {
        productInfo: { type: "string" as const, description: "Product description and value props" },
        goal: { type: "string" as const, description: "Campaign goal" },
        audience: { type: "string" as const, description: "Target audience" },
        sequenceLength: { type: "number" as const, description: "Number of emails (default 5)" },
        campaignId: { type: "number" as const, description: "Optional campaign ID to link to" },
      },
      required: ["productInfo", "goal", "audience"] as const,
    },
  },
  {
    name: "generateSocialPosts",
    description: "Generate platform-native social posts and create draft content. Link to campaign if campaignId is set.",
    parameters: {
      type: "object" as const,
      properties: {
        productInfo: { type: "string" as const, description: "Product description and value props" },
        audience: { type: "string" as const, description: "Target audience" },
        platforms: { type: "array" as const, items: { type: "string" as const }, description: "e.g. instagram, linkedin, twitter" },
        count: { type: "number" as const, description: "Number of posts (default 5)" },
        campaignId: { type: "number" as const, description: "Optional campaign ID to link to" },
      },
      required: ["productInfo", "audience", "platforms"] as const,
    },
  },
  {
    name: "generateLandingPage",
    description: "Generate a complete landing page for the product and save it as a draft. Returns landingPageId, headline, slug, and preview URL.",
    parameters: {
      type: "object" as const,
      properties: {
        productInfo: { type: "string" as const, description: "Product description and value props" },
        audience: { type: "string" as const, description: "Target audience" },
        goal: { type: "string" as const, description: "Page goal: sales, lead_gen, waitlist" },
        campaignId: { type: "number" as const, description: "Optional campaign ID to link to" },
      },
      required: ["productInfo", "audience", "goal"] as const,
    },
  },
  {
    name: "generateVideoScript",
    description: "Generate a short-form video ad script (TikTok/Reels/YouTube Shorts style) with hook, body, and CTA. Saves to Video Ads.",
    parameters: {
      type: "object" as const,
      properties: {
        productInfo: { type: "string" as const, description: "Product description and value props" },
        platform: { type: "string" as const, description: "tiktok, instagram_reels, youtube_shorts" },
        style: { type: "string" as const, description: "ugc_testimonial, product_demo, problem_solution" },
        campaignId: { type: "number" as const, description: "Optional campaign ID" },
      },
      required: ["productInfo", "platform"] as const,
    },
  },
  {
    name: "generateAdCreative",
    description: "Generate ad copy (headline + body + CTA) for a platform. Saves as content draft.",
    parameters: {
      type: "object" as const,
      properties: {
        productInfo: { type: "string" as const, description: "Product description" },
        platform: { type: "string" as const, description: "facebook, instagram, google, linkedin" },
        adType: { type: "string" as const, description: "awareness, conversion, retargeting" },
        campaignId: { type: "number" as const, description: "Optional campaign ID" },
      },
      required: ["productInfo", "platform"] as const,
    },
  },
];

/** Anthropic SDK tool format (name, description, input_schema) */
const ANTHROPIC_AGENT_TOOLS = AGENT_TOOL_DEFS.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: { ...t.parameters, required: [...t.parameters.required] } as Record<string, unknown>,
}));

export type ToolResult =
  | { kind: "analyzeProduct"; positioning: string; valueProps: string[]; differentiators: Record<string, string>; targetAudience: string }
  | { kind: "createCampaign"; campaignId: number; name: string; goal: string }
  | { kind: "generateLandingPage"; landingPageId: number; headline: string; slug: string; previewUrl: string }
  | { kind: "generateEmailSequence"; sequenceId: string; emails: Array<{ index: number; subject: string; preview: string; body: string; sendDay: number; id: number }> }
  | { kind: "generateSocialPosts"; posts: Array<{ id: number; platform: string; content: string; title: string }> }
  | { kind: "generateVideoScript"; videoId: number; platform: string; script: string; hook: string; cta: string }
  | { kind: "generateAdCreative"; contentId: number; headline: string; body: string; platform: string }
  | { kind: "error"; tool: string; message: string };

/** Fetch page content from a URL for product/link analysis. */
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const target = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OtobiAIBot/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyText = bodyMatch ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000) : "";
    return `\nPage at ${target}:\nTitle: ${titleMatch?.[1] || "N/A"}\nDescription: ${metaDesc?.[1] || ogDesc?.[1] || "N/A"}\nContent: ${bodyText}`;
  } catch {
    return "";
  }
}

async function runAnalyzeProduct(
  userId: number,
  productDescription: string,
  competitors?: string
): Promise<ToolResult> {
  try {
    let context = `Product: ${productDescription}. Competitors: ${competitors || "none specified"}.`;
    const urlMatch = productDescription.match(/(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][-a-zA-Z0-9]*\.(com|io|co|org|net)[^\s]*)/i);
    const url = urlMatch ? (urlMatch[1] || urlMatch[2] || urlMatch[3] || "").trim() : "";
    if (url) {
      const pageContent = await fetchUrlContent(url);
      if (pageContent) context += pageContent;
    }
    const res = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a positioning expert. Return only valid JSON with: positioning (one sentence), valueProps (array of 3 strings), differentiators (object with competitor names as keys, one sentence each), targetAudience (one paragraph). When page content from a URL is provided, use it to inform your analysis.",
        },
        {
          role: "user",
          content: context,
        },
      ],
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "product_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              positioning: { type: "string" },
              valueProps: { type: "array", items: { type: "string" } },
              differentiators: { type: "object", additionalProperties: { type: "string" } },
              targetAudience: { type: "string" },
            },
            required: ["positioning", "valueProps", "targetAudience"],
            additionalProperties: false,
          },
        },
      },
    });
    const raw = (res as any).choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw : Array.isArray(raw) ? (raw.find((r: any) => r?.type === "text")?.text ?? "{}") : "{}";
    const parsed = JSON.parse(text || "{}");
    return {
      kind: "analyzeProduct",
      positioning: parsed.positioning || "",
      valueProps: Array.isArray(parsed.valueProps) ? parsed.valueProps : [],
      differentiators: typeof parsed.differentiators === "object" ? parsed.differentiators : {},
      targetAudience: parsed.targetAudience || "",
    };
  } catch (e) {
    return { kind: "error", tool: "analyzeProduct", message: (e as Error).message };
  }
}

async function runGenerateLandingPage(
  userId: number,
  productInfo: string,
  audience: string,
  goal: string,
  campaignId?: number
): Promise<ToolResult> {
  try {
    const res = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You write high-converting landing page copy. Return only valid JSON with: headline (string), subheadline (string), heroSection (string), benefitsSections (array of 3 strings), ctaText (string), slug (url-friendly, lowercase, hyphens only, no spaces).`,
        },
        {
          role: "user",
          content: `Product: ${productInfo}. Audience: ${audience}. Goal: ${goal}. Write a complete landing page.`,
        },
      ],
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "landing_page",
          strict: true,
          schema: {
            type: "object",
            properties: {
              headline: { type: "string" },
              subheadline: { type: "string" },
              heroSection: { type: "string" },
              benefitsSections: { type: "array", items: { type: "string" } },
              ctaText: { type: "string" },
              slug: { type: "string" },
            },
            required: ["headline", "subheadline", "ctaText", "slug"],
            additionalProperties: false,
          },
        },
      },
    });
    const raw = (res as any).choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw : Array.isArray(raw) ? (raw.find((r: any) => r?.type === "text")?.text ?? "{}") : "{}";
    const parsed = JSON.parse(text || "{}");
    const headline = parsed.headline || "Welcome";
    const subheadline = parsed.subheadline || "";
    const heroSection = parsed.heroSection || "";
    const benefits = Array.isArray(parsed.benefitsSections) ? parsed.benefitsSections.slice(0, 5) : [];
    const ctaText = parsed.ctaText || "Get Started";
    const slug = (parsed.slug || `page-${Date.now()}`).replace(/[^a-z0-9-]/gi, "-").toLowerCase().replace(/-+/g, "-").slice(0, 100) || "landing-page";

    const components: Array<{ type: string; props: Record<string, unknown>; order: number }> = [
      { type: "hero", props: { headline, subheadline, ctaText, ctaLink: "#" }, order: 0 },
      { type: "features", props: { title: "Why choose us", features: benefits.map((b: string) => ({ title: b.slice(0, 60), description: b })) }, order: 1 },
      { type: "cta", props: { headline: "Ready to get started?", ctaText, ctaLink: "#" }, order: 2 },
      { type: "footer", props: { text: "© All rights reserved." }, order: 3 },
    ];

    const { id } = await db.createLandingPage({
      userId,
      campaignId: campaignId ?? null,
      title: headline,
      slug,
      components,
      status: "draft",
    });

    return {
      kind: "generateLandingPage",
      landingPageId: id,
      headline,
      slug,
      previewUrl: `/lp/${slug}`,
    };
  } catch (e) {
    return { kind: "error", tool: "generateLandingPage", message: (e as Error).message };
  }
}

async function runCreateCampaign(userId: number, name: string, goal: string): Promise<ToolResult> {
  try {
    const campaign = await db.createCampaign({
      userId,
      name,
      goal,
      platforms: [],
      objective: "awareness",
      status: "draft",
    });
    return { kind: "createCampaign", campaignId: campaign.id, name, goal };
  } catch (e) {
    return { kind: "error", tool: "createCampaign", message: (e as Error).message };
  }
}

async function runGenerateEmailSequence(
  userId: number,
  productInfo: string,
  goal: string,
  audience: string,
  sequenceLength: number = 5,
  campaignId?: number
): Promise<ToolResult> {
  try {
    const res = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You write marketing email sequences. Return only valid JSON: { "emails": [ { "subject": "...", "preview": "...", "body": "HTML or plain text", "sendDay": 0 } ] }. sendDay: 0 = immediate, 3 = day 3, etc. Generate exactly ${sequenceLength} emails.`,
        },
        {
          role: "user",
          content: `Product: ${productInfo}. Goal: ${goal}. Audience: ${audience}. Write ${sequenceLength} emails for a launch sequence.`,
        },
      ],
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "email_sequence",
          strict: true,
          schema: {
            type: "object",
            properties: {
              emails: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    subject: { type: "string" },
                    preview: { type: "string" },
                    body: { type: "string" },
                    sendDay: { type: "number" },
                  },
                  required: ["subject", "body", "sendDay"],
                  additionalProperties: false,
                },
              },
            },
            required: ["emails"],
            additionalProperties: false,
          },
        },
      },
    });
    const raw = (res as any).choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw : Array.isArray(raw) ? (raw.find((r: any) => r?.type === "text")?.text ?? "{}") : "{}";
    const parsed = JSON.parse(text || "{}");
    const emails = Array.isArray(parsed.emails) ? parsed.emails.slice(0, sequenceLength) : [];
    const created: Array<{ index: number; subject: string; preview: string; body: string; sendDay: number; id: number }> = [];
    for (let i = 0; i < emails.length; i++) {
      const e = emails[i];
      const name = `Launch sequence – Email ${i + 1}`;
      const htmlBody = (e.body || "").startsWith("<") ? e.body : `<p>${String(e.body).replace(/\n/g, "</p><p>")}</p>`;
      const { id } = await db.createEmailCampaign({
        userId,
        campaignId: campaignId ?? null,
        name,
        subject: e.subject || name,
        htmlBody,
        textBody: (e.body || "").replace(/<[^>]*>/g, ""),
        recipientListId: null,
        status: "draft",
      });
      created.push({
        index: i + 1,
        subject: e.subject || "",
        preview: e.preview || "",
        body: e.body || "",
        sendDay: typeof e.sendDay === "number" ? e.sendDay : i,
        id,
      });
      if (campaignId) await db.createCampaignAsset({ campaignId, assetType: "email", assetId: id, status: "draft" });
    }
    return {
      kind: "generateEmailSequence",
      sequenceId: `seq-${Date.now()}`,
      emails: created,
    };
  } catch (e) {
    return { kind: "error", tool: "generateEmailSequence", message: (e as Error).message };
  }
}

async function runGenerateSocialPosts(
  userId: number,
  productInfo: string,
  audience: string,
  platforms: string[],
  count: number = 5,
  campaignId?: number
): Promise<ToolResult> {
  try {
    const platformList = platforms.length ? platforms.join(", ") : "instagram, linkedin, twitter";
    const res = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You write platform-native social posts. Return only valid JSON: { "posts": [ { "platform": "instagram", "content": "...", "title": "short title" } ] }. Generate up to ${count} posts across ${platformList}. Each post should match the platform's tone.`,
        },
        {
          role: "user",
          content: `Product: ${productInfo}. Audience: ${audience}. Platforms: ${platformList}. Write ${count} social posts.`,
        },
      ],
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "social_posts",
          strict: true,
          schema: {
            type: "object",
            properties: {
              posts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    platform: { type: "string" },
                    content: { type: "string" },
                    title: { type: "string" },
                  },
                  required: ["platform", "content"],
                  additionalProperties: false,
                },
              },
            },
            required: ["posts"],
            additionalProperties: false,
          },
        },
      },
    });
    const raw = (res as any).choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw : Array.isArray(raw) ? (raw.find((r: any) => r?.type === "text")?.text ?? "{}") : "{}";
    const parsed = JSON.parse(text || "{}");
    const posts = Array.isArray(parsed.posts) ? parsed.posts.slice(0, count) : [];
    const created: Array<{ id: number; platform: string; content: string; title: string }> = [];
    for (const p of posts) {
      const { id } = await db.createContent({
        userId,
        campaignId: campaignId ?? null,
        type: "social_caption",
        platform: (p.platform || "instagram").toLowerCase().slice(0, 64),
        title: p.title || `Post ${created.length + 1}`,
        body: p.content || "",
        status: "draft",
      });
      created.push({
        id,
        platform: p.platform || "instagram",
        content: p.content || "",
        title: p.title || "",
      });
      if (campaignId) await db.createCampaignAsset({ campaignId, assetType: "social_post", assetId: id, status: "draft" });
    }
    return { kind: "generateSocialPosts", posts: created };
  } catch (e) {
    return { kind: "error", tool: "generateSocialPosts", message: (e as Error).message };
  }
}

export async function executeTool(
  userId: number,
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  switch (name) {
    case "analyzeProduct":
      return runAnalyzeProduct(
        userId,
        String(args.productDescription ?? ""),
        args.competitors != null ? String(args.competitors) : undefined
      );
    case "createCampaign":
      return runCreateCampaign(
        userId,
        String(args.name ?? ""),
        String(args.goal ?? "campaign")
      );
    case "generateEmailSequence":
      return runGenerateEmailSequence(
        userId,
        String(args.productInfo ?? ""),
        String(args.goal ?? ""),
        String(args.audience ?? ""),
        typeof args.sequenceLength === "number" ? args.sequenceLength : 5,
        typeof args.campaignId === "number" ? args.campaignId : undefined
      );
    case "generateSocialPosts":
      return runGenerateSocialPosts(
        userId,
        String(args.productInfo ?? ""),
        String(args.audience ?? ""),
        Array.isArray(args.platforms) ? args.platforms.map(String) : ["instagram", "linkedin", "twitter"],
        typeof args.count === "number" ? args.count : 5,
        typeof args.campaignId === "number" ? args.campaignId : undefined
      );
    case "generateLandingPage":
      return runGenerateLandingPage(
        userId,
        String(args.productInfo ?? ""),
        String(args.audience ?? ""),
        String(args.goal ?? "sales"),
        typeof args.campaignId === "number" ? args.campaignId : undefined
      );
    case "generateVideoScript":
      return runGenerateVideoScript(
        userId,
        String(args.productInfo ?? ""),
        String(args.platform ?? "tiktok"),
        String(args.style ?? "ugc_testimonial"),
        typeof args.campaignId === "number" ? args.campaignId : undefined
      );
    case "generateAdCreative":
      return runGenerateAdCreative(
        userId,
        String(args.productInfo ?? ""),
        String(args.platform ?? "facebook"),
        String(args.adType ?? "conversion"),
        typeof args.campaignId === "number" ? args.campaignId : undefined
      );
    default:
      return { kind: "error", tool: name, message: "Unknown tool" };
  }
}

async function runGenerateVideoScript(
  userId: number,
  productInfo: string,
  platform: string,
  style: string,
  campaignId?: number
): Promise<ToolResult> {
  try {
    const platformLabels: Record<string, string> = {
      tiktok: "TikTok", instagram_reels: "Instagram Reels",
      youtube_shorts: "YouTube Shorts", youtube: "YouTube",
    };
    const styleLabels: Record<string, string> = {
      ugc_testimonial: "UGC testimonial style", product_demo: "product demonstration",
      problem_solution: "problem → solution narrative", before_after: "before and after story",
    };
    const res = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a viral video scriptwriter. Return only valid JSON with: hook (opening 3 seconds, max 15 words), script (full spoken script, 150-200 words), cta (call-to-action, max 10 words), platform (string). Write in ${styleLabels[style] ?? style} style optimized for ${platformLabels[platform] ?? platform}.`,
        },
        { role: "user", content: `Product: ${productInfo}` },
      ],
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "video_script",
          schema: {
            type: "object" as const,
            properties: {
              hook: { type: "string" as const },
              script: { type: "string" as const },
              cta: { type: "string" as const },
              platform: { type: "string" as const },
            },
            required: ["hook", "script", "cta"],
          },
        },
      },
    });
    const raw = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    const data = JSON.parse(raw.replace(/```json|```/g, "").trim());
    const saved = await db.createVideoAd({
      userId,
      platform,
      script: `HOOK: ${data.hook}\n\n${data.script}\n\nCTA: ${data.cta}`,
      voiceoverText: data.script,
      storyboard: [],
      status: "draft",
      campaignId: campaignId ?? null,
      metadata: { hook: data.hook, cta: data.cta, style },
    });
    return {
      kind: "generateVideoScript",
      videoId: saved.id,
      platform,
      script: data.script,
      hook: data.hook,
      cta: data.cta,
    };
  } catch (e) {
    return { kind: "error", tool: "generateVideoScript", message: (e as Error).message };
  }
}

async function runGenerateAdCreative(
  userId: number,
  productInfo: string,
  platform: string,
  adType: string,
  campaignId?: number
): Promise<ToolResult> {
  try {
    const platformSpecs: Record<string, string> = {
      facebook: "Facebook Feed ad (max 125 chars primary text, 40 chars headline)",
      instagram: "Instagram Feed ad (max 125 chars caption, punchy headline)",
      google: "Google Search ad (3 headlines max 30 chars each, 2 descriptions max 90 chars)",
      linkedin: "LinkedIn Sponsored Content (max 150 chars intro, 70 chars headline)",
    };
    const res = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a high-converting ad copywriter. Write a ${adType} ad for ${platformSpecs[platform] ?? platform}. Return only valid JSON with: headline (string), body (string), cta (string).`,
        },
        { role: "user", content: `Product: ${productInfo}` },
      ],
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "ad_creative",
          schema: {
            type: "object" as const,
            properties: {
              headline: { type: "string" as const },
              body: { type: "string" as const },
              cta: { type: "string" as const },
            },
            required: ["headline", "body", "cta"],
          },
        },
      },
    });
    const raw = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    const data = JSON.parse(raw.replace(/```json|```/g, "").trim());
    const saved = await db.createContent({
      userId,
      type: "ad_copy_short",
      platform,
      title: data.headline,
      body: `${data.headline}\n\n${data.body}\n\n${data.cta}`,
      status: "draft",
      ...(campaignId ? { campaignId } : {}),
    });
    return {
      kind: "generateAdCreative",
      contentId: saved.id,
      headline: data.headline,
      body: data.body,
      platform,
    };
  } catch (e) {
    return { kind: "error", tool: "generateAdCreative", message: (e as Error).message };
  }
}

export type AgentOutput = {
  reply: string;
  toolResults: ToolResult[];
};

const MAX_AGENT_ITERATIONS = 10;

/** Full mock agent — runs when ANTHROPIC_API_KEY not set. Creates real DB records. */
async function runMockAgentLoop(userId: number, message: string): Promise<AgentOutput> {
  const toolResults: ToolResult[] = [];

  const words = message.split(" ").filter(w => w.length > 3);
  const productName = words.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Product Launch";
  const platforms = ["TikTok","Instagram","Facebook","LinkedIn","Twitter"].filter(p => message.toLowerCase().includes(p.toLowerCase()));
  const usePlatforms = platforms.length > 0 ? platforms : ["Instagram","TikTok","LinkedIn"];
  const goal = message.toLowerCase().includes("lead") ? "lead_gen" : message.toLowerCase().includes("launch") ? "product_launch" : "awareness";
  const audience = message.toLowerCase().includes("gym") ? "fitness enthusiasts aged 18-35" : message.toLowerCase().includes("business") ? "B2B decision makers" : "consumers aged 25-44";

  try {
    const campaign = await db.createCampaign({ userId, name: `${productName} Campaign`, goal, platforms: usePlatforms, objective: "awareness", status: "active", description: `Campaign for: ${message}` });
    const campaignId = campaign.id;
    toolResults.push({ kind: "createCampaign", campaignId, name: `${productName} Campaign`, goal });
    toolResults.push({ kind: "analyzeProduct", positioning: `${productName} is the premium solution for ${audience}.`, valueProps: ["Superior quality","Proven results","Community-trusted"], differentiators: { competitors: "Better formulation, cleaner ingredients" }, targetAudience: audience });

    // Social posts
    const postMap: Record<string,string> = {
      TikTok: `🔥 Game changer alert. ${productName} is HERE. Real results for ${audience}. #fyp #gains`,
      Instagram: `Transform your routine with ${productName}. Built for ${audience} who demand results. 💪 Link in bio.`,
      LinkedIn: `Introducing ${productName} — designed for ${audience} who treat performance as a priority.`,
      Facebook: `New: ${productName}! Join thousands who've switched. Special launch offer available now.`,
      Twitter: `Just launched: ${productName} 🚀 The performance upgrade ${audience} has been waiting for.`,
    };
    const posts: Array<{id:number;platform:string;content:string;title:string}> = [];
    for (const p of usePlatforms) {
      const body = postMap[p] ?? `Check out ${productName}!`;
      const saved = await db.createContent({ userId, type: "social_caption", platform: p.toLowerCase(), title: `${p} Post`, body, status: "draft", campaignId });
      posts.push({ id: saved.id, platform: p, content: body, title: `${p} Post` });
    }
    const adBody = `${productName}: Built for ${audience}. Launch offer — 20% off with code LAUNCH20.`;
    const adSaved = await db.createContent({ userId, type: "ad_copy_short", platform: "facebook", title: `${productName} Ad`, body: adBody, status: "draft", campaignId });
    posts.push({ id: adSaved.id, platform: "facebook", content: adBody, title: "Launch Ad" });
    toolResults.push({ kind: "generateSocialPosts", posts });

    // Email sequence
    const emailData = [
      { subject: `Welcome — ${productName} is here`, preview: "Your journey starts now", sendDay: 0, body: `Hi,\n\nThank you for your interest in ${productName}. We built this for ${audience} who are serious about results.\n\nExpect: premium quality, proven results, community support.\n\nTo your success,\nThe Team` },
      { subject: `Why ${productName} actually works`, preview: "The science, simply explained", sendDay: 2, body: `Hi,\n\nEvery ingredient in ${productName} has one purpose: results for ${audience}.\n\nNo fillers. No compromises. See the full breakdown on our site.\n\nBest,\nThe Team` },
      { subject: `Real people, real results`, preview: "What our community says", sendDay: 4, body: `Hi,\n\n"${productName} is the only thing that actually worked for me." — verified customer\n\nJoin thousands who've made the switch. Use code LAUNCH20 for 20% off.\n\nThe Team` },
      { subject: `Your launch offer expires in 48h`, preview: "Don't miss this", sendDay: 6, body: `Hi,\n\nYour 20% launch discount expires soon. Code: LAUNCH20.\n\nBest pricing we'll offer this year — grab it now.\n\nThe Team` },
      { subject: `Last call — offer ends tonight`, preview: "Final hours", sendDay: 7, body: `Hi,\n\nMidnight tonight: launch offer ends. Code LAUNCH20 — 20% off ${productName}.\n\nShop now →\n\nThe Team` },
    ];
    const emails: Array<{index:number;subject:string;preview:string;body:string;sendDay:number;id:number}> = [];
    for (let i = 0; i < emailData.length; i++) {
      const t = emailData[i];
      const saved = await db.createEmailCampaign({ userId, campaignId, name: `Email ${i+1}: ${t.subject}`, subject: t.subject, htmlBody: t.body, textBody: t.body, fromName: `${productName} Team`, status: "draft" });
      emails.push({ index: i, ...t, id: saved.id });
    }
    toolResults.push({ kind: "generateEmailSequence", sequenceId: `seq_${campaignId}`, emails });

    // Landing page
    const slug = `${productName.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}-${campaignId}`;
    const headline = `${productName}: Built for ${audience}`;
    const lp = await db.createLandingPage({ userId, campaignId, title: headline, slug, status: "draft", components: [{ type: "hero", props: { headline, subheadline: `The #1 choice for ${audience}. Launch pricing available now.`, cta: "Shop Now — 20% Off", ctaUrl: "#" }, order: 0 }, { type: "features", props: { title: "Why choose us", items: ["Premium quality","Proven results","Free shipping","30-day guarantee"] }, order: 1 }, { type: "cta", props: { headline: "Ready to start?", cta: "Get 20% Off", code: "LAUNCH20" }, order: 2 }], metadata: { generatedFor: message } });
    toolResults.push({ kind: "generateLandingPage", landingPageId: lp.id, headline, slug, previewUrl: `/lp/${slug}` });

    // Video script
    const hook = `If you're ${audience} tired of products that don't deliver — this changes everything.`;
    const script = `HOOK (0-3s): ${hook}\n\nBODY (3-25s): ${productName}. Built for ${audience}. Every ingredient chosen for results. No fillers.\n\nSOCIAL PROOF (25-40s): Thousands have already switched. The reviews speak for themselves.\n\nCTA (40-45s): Code LAUNCH20 — 20% off. Link in bio.`;
    const videoSaved = await db.createVideoAd({ userId, campaignId, platform: (usePlatforms[0] ?? "tiktok").toLowerCase(), script, voiceoverText: script, storyboard: [], status: "draft", metadata: { hook, cta: "LAUNCH20 — link in bio", style: "ugc_testimonial" } });
    toolResults.push({ kind: "generateVideoScript", videoId: videoSaved.id, platform: usePlatforms[0] ?? "TikTok", script, hook, cta: "LAUNCH20 — link in bio" });

    // Ad creative
    const adCreativeSaved = await db.createContent({ userId, type: "ad_copy_short", platform: "instagram", title: `${productName} — Instagram Ad`, body: `${headline}\n\n${adBody}\n\nShop now → link in bio`, status: "draft", campaignId });
    toolResults.push({ kind: "generateAdCreative", contentId: adCreativeSaved.id, headline, body: adBody, platform: "instagram" });

    return { reply: `Built complete launch package for "${productName}": campaign, ${posts.length} social posts (${usePlatforms.join(", ")}), ${emails.length} emails, landing page, video script, and ad creatives. Opening your campaign workspace now.`, toolResults };
  } catch (e) {
    return { reply: `Error building campaign: ${(e as Error).message}. Check your database connection.`, toolResults };
  }
}

export async function runAgentLoop(
  userId: number,
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<AgentOutput> {
  // ── Mock mode when no API key ─────────────────────────────────────
  // Runs the full pipeline with realistic generated data so the
  // workspace fills up and everything can be tested end-to-end.
  if (!ENV.anthropicApiKey?.trim()) {
    return runMockAgentLoop(userId, message);
  }

  const toolResults: ToolResult[] = [];
  const anthropicMessages: AnthropicMessage[] = [];
  for (const h of history) {
    anthropicMessages.push({ role: h.role, content: h.content });
  }
  anthropicMessages.push({ role: "user", content: message });

  const isSubstantive = history.length >= 2 && message.length > 20;
  const systemPrompt = isSubstantive
    ? AGENT_SYSTEM_PROMPT + "\n\nIMPORTANT: The user has provided enough context. Call your tools NOW. Do not ask any questions."
    : AGENT_SYSTEM_PROMPT;

  // Track campaignId across tool calls — inject it into every asset tool
  // even if Claude forgets to pass it
  let activeCampaignId: number | undefined;
  const ASSET_TOOLS = new Set(["generateEmailSequence","generateSocialPosts","generateLandingPage","generateVideoScript","generateAdCreative"]);

  for (let iter = 0; iter < MAX_AGENT_ITERATIONS; iter++) {
    const { content: text, tool_calls } = await chatWithTools(systemPrompt, anthropicMessages, ANTHROPIC_AGENT_TOOLS);

    if (tool_calls && tool_calls.length > 0) {
      const assistantContent: Array<Record<string, unknown>> = [];
      if (text) assistantContent.push({ type: "text", text });
      for (const tc of tool_calls) {
        assistantContent.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.input });
      }
      anthropicMessages.push({ role: "assistant", content: assistantContent });

      const toolResultBlocks: Array<Record<string, unknown>> = [];
      for (const tc of tool_calls) {
        // Force-inject campaignId into every asset tool call
        const args = tc.input as Record<string, unknown>;
        if (ASSET_TOOLS.has(tc.name) && activeCampaignId && !args.campaignId) {
          args.campaignId = activeCampaignId;
        }
        const result = await executeTool(userId, tc.name, args);
        // Capture campaignId as soon as createCampaign succeeds
        if (result.kind === "createCampaign" && result.campaignId) {
          activeCampaignId = result.campaignId;
        }
        toolResults.push(result);
        toolResultBlocks.push({ type: "tool_result", tool_use_id: tc.id, content: JSON.stringify(result) });
      }
      anthropicMessages.push({ role: "user", content: toolResultBlocks });
      continue;
    }

    return { reply: text || "Done.", toolResults };
  }

  return {
    reply: "I've finished building what I could. Review the results below.",
    toolResults,
  };
}
