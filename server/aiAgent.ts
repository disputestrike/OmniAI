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

const AGENT_SYSTEM_PROMPT = `You are the OTOBI AI Marketing Agent. You build marketing campaigns. You do not describe what you cannot do. You never mention internal product or module names to the user. You never explain your own limitations.

Your job is to BUILD campaigns: ask up to 5 questions, then use your tools to generate emails, social posts, and campaign assets.

You have access to these tools:
- analyzeProduct: analyze product and competitors → returns positioning, value props, differentiators, target audience
- createCampaign: create a campaign record → returns campaignId for linking assets
- generateEmailSequence: write a complete email sequence (default 5 emails) → creates draft emails
- generateSocialPosts: write platform-native social posts (default 5) → creates draft posts

RULES:
1. Never say what you cannot do. Never mention limitations unprompted.
2. Never name internal modules, tools, or product areas to the user (no Content Studio, Creative Engine, Video Studio, Scheduler, etc.).
3. Ask at most 5 questions, then say "Got it. Building now." and call your tools.
4. Never give a to-do list or tell the user to go do something themselves. Execute.
5. When tools complete, summarize in 1–2 short sentences and say the review is below. Keep responses SHORT.
6. If a tool fails, note it briefly and continue. Do not explain system architecture.

When the user asks for setup, infrastructure, or "content machine" or similar, respond with ONLY this (nothing else—no caveats, no "I can't", no module names):

"I build marketing campaigns. Tell me what you are launching and I will generate everything you need.

1. What are you launching?
2. Who is your ideal customer?
3. Top competitors?
4. Monthly budget for paid ads?
5. Which channels? Email / Social / Paid ads / Landing page / SMS"

After you have enough to start (or after 5 answers), say: "Got it. Building now." Then call your tools. Do not ask more questions. Do not output a plan.`;

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
  | { kind: "generateEmailSequence"; sequenceId: string; emails: Array<{ index: number; subject: string; preview: string; body: string; sendDay: number; id: number }> }
  | { kind: "generateSocialPosts"; posts: Array<{ id: number; platform: string; content: string; title: string }> }
  | { kind: "error"; tool: string; message: string };

async function runAnalyzeProduct(
  userId: number,
  productDescription: string,
  competitors?: string
): Promise<ToolResult> {
  try {
    const res = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a positioning expert. Return only valid JSON with: positioning (one sentence), valueProps (array of 3 strings), differentiators (object with competitor names as keys, one sentence each), targetAudience (one paragraph).",
        },
        {
          role: "user",
          content: `Product: ${productDescription}. Competitors: ${competitors || "none specified"}.`,
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
    default:
      return { kind: "error", tool: name, message: "Unknown tool" };
  }
}

export type AgentOutput = {
  reply: string;
  toolResults: ToolResult[];
};

const MAX_AGENT_ITERATIONS = 10;

export async function runAgentLoop(
  userId: number,
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<AgentOutput> {
  const toolResults: ToolResult[] = [];
  const anthropicMessages: AnthropicMessage[] = [];
  for (const h of history) {
    anthropicMessages.push({ role: h.role, content: h.content });
  }
  anthropicMessages.push({ role: "user", content: message });

  for (let iter = 0; iter < MAX_AGENT_ITERATIONS; iter++) {
    const { content: text, tool_calls } = await chatWithTools(AGENT_SYSTEM_PROMPT, anthropicMessages, ANTHROPIC_AGENT_TOOLS);

    if (tool_calls && tool_calls.length > 0) {
      const assistantContent: Array<Record<string, unknown>> = [];
      if (text) assistantContent.push({ type: "text", text });
      for (const tc of tool_calls) {
        assistantContent.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.input });
      }
      anthropicMessages.push({ role: "assistant", content: assistantContent });

      const toolResultBlocks: Array<Record<string, unknown>> = [];
      for (const tc of tool_calls) {
        const result = await executeTool(userId, tc.name, tc.input as Record<string, unknown>);
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
