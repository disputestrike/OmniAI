/**
 * AI Router (Spec v4).
 * Single entry for all AI tasks: Forge (free), Claude Haiku (strategy/analysis), OpenAI fallback.
 */
import { invokeLLM } from "../_core/llm";
import { callClaudeHaiku, isClaudeHaikuConfigured } from "./claudeHaiku.service";
import { ENV } from "../_core/env";

export type AITask =
  | "content_generation"
  | "image_generation"
  | "video_script"
  | "product_analysis"
  | "creative_scoring"
  | "audience_recommend"
  | "competitor_analysis"
  | "campaign_momentum"
  | "marketing_agent_chat"
  | "content_repurpose";

export type RouteAITaskParams = {
  prompt: string;
  systemPrompt?: string;
  userTier: string;
  requiresJSON?: boolean;
  maxTokens?: number;
};

export type RouteAITaskResult = {
  result: string;
  modelUsed: string;
  cost: "free" | "paid";
};

const CLAUDE_TASKS: AITask[] = [
  "product_analysis",
  "creative_scoring",
  "audience_recommend",
  "competitor_analysis",
  "campaign_momentum",
];

function normalizeContent(raw: string | Array<{ type: string; text?: string }> | undefined): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    const text = raw.find((b) => b.type === "text");
    return (text && "text" in text ? text.text : "") || "";
  }
  return "";
}

async function callForge(params: RouteAITaskParams): Promise<RouteAITaskResult> {
  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (params.systemPrompt) messages.push({ role: "system", content: params.systemPrompt });
  messages.push({ role: "user", content: params.prompt });
  const response = await invokeLLM({
    messages,
    max_tokens: params.maxTokens ?? 2048,
  });
  const content = response.choices[0]?.message?.content;
  const result = normalizeContent(
    typeof content === "string" ? content : Array.isArray(content) ? content : ""
  );
  return { result, modelUsed: "forge", cost: "free" };
}

async function callOpenAI(params: RouteAITaskParams): Promise<RouteAITaskResult> {
  if (!ENV.openaiApiKey) throw new Error("OpenAI API key not configured (fallback)");
  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (params.systemPrompt) messages.push({ role: "system", content: params.systemPrompt });
  messages.push({ role: "user", content: params.prompt });
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: params.maxTokens ?? 1024,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${res.status}: ${t}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const result = data.choices?.[0]?.message?.content ?? "";
  return { result, modelUsed: "gpt-4o-mini", cost: "paid" };
}

function isLowQuality(text: string): boolean {
  if (text.length < 100) return true;
  const lower = text.toLowerCase();
  if (lower.includes("i cannot") || lower.includes("i'm unable")) return true;
  if (lower.includes("as an ai") && text.length < 300) return true;
  return false;
}

export async function routeAITask(
  task: AITask,
  params: RouteAITaskParams
): Promise<RouteAITaskResult> {
  if (["content_generation", "image_generation", "video_script"].includes(task)) {
    return callForge(params);
  }

  if (CLAUDE_TASKS.includes(task)) {
    if (isClaudeHaikuConfigured()) {
      try {
        const out = await callClaudeHaiku({
          prompt: params.prompt,
          systemPrompt: params.systemPrompt,
          maxTokens: params.maxTokens,
          requiresJSON: params.requiresJSON,
        });
        return { result: out.result, modelUsed: out.modelUsed, cost: "paid" };
      } catch (err) {
        console.warn("Claude Haiku failed, falling back to OpenAI:", err);
        return callOpenAI(params);
      }
    }
    return callOpenAI(params);
  }

  if (task === "marketing_agent_chat") {
    if (params.userTier === "free") return callForge(params);
    if (isClaudeHaikuConfigured()) {
      try {
        const out = await callClaudeHaiku({
          prompt: params.prompt,
          systemPrompt: params.systemPrompt,
          maxTokens: params.maxTokens,
        });
        return { result: out.result, modelUsed: out.modelUsed, cost: "paid" };
      } catch {
        return callOpenAI(params);
      }
    }
    return callOpenAI(params);
  }

  if (task === "content_repurpose") {
    const forgeResult = await callForge(params);
    if (
      forgeResult.result.length >= 100 &&
      !isLowQuality(forgeResult.result)
    ) {
      return forgeResult;
    }
    if (isClaudeHaikuConfigured()) {
      try {
        const out = await callClaudeHaiku({
          prompt: params.prompt,
          systemPrompt: params.systemPrompt,
          maxTokens: params.maxTokens,
          requiresJSON: params.requiresJSON,
        });
        return { result: out.result, modelUsed: out.modelUsed, cost: "paid" };
      } catch {
        return forgeResult;
      }
    }
    return forgeResult;
  }

  throw new Error(`Unknown task type: ${task}`);
}
