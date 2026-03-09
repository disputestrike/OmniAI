/**
 * AI Router (Spec v4). Claude only — no OpenAI/Forge.
 */
import { invokeLLM } from "../_core/llm";
import { callClaudeHaiku, isClaudeHaikuConfigured } from "./claudeHaiku.service";

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

/** Claude Haiku via invokeLLM (no OpenAI/Forge). */
async function callClaude(params: RouteAITaskParams): Promise<RouteAITaskResult> {
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
  return { result, modelUsed: "claude-haiku", cost: "paid" };
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
  if (task === "image_generation") {
    throw new Error("Image generation is not configured. Use Creative Engine with a supported provider.");
  }

  if (["content_generation", "video_script"].includes(task)) {
    return callClaude(params);
  }

  if (CLAUDE_TASKS.includes(task)) {
    if (isClaudeHaikuConfigured()) {
      const out = await callClaudeHaiku({
        prompt: params.prompt,
        systemPrompt: params.systemPrompt,
        maxTokens: params.maxTokens,
        requiresJSON: params.requiresJSON,
      });
      return { result: out.result, modelUsed: out.modelUsed, cost: "paid" };
    }
    return callClaude(params);
  }

  if (task === "marketing_agent_chat") {
    if (params.userTier === "free") return callClaude(params);
    if (isClaudeHaikuConfigured()) {
      const out = await callClaudeHaiku({
        prompt: params.prompt,
        systemPrompt: params.systemPrompt,
        maxTokens: params.maxTokens,
      });
      return { result: out.result, modelUsed: out.modelUsed, cost: "paid" };
    }
    return callClaude(params);
  }

  if (task === "content_repurpose") {
    const claudeResult = await callClaude(params);
    if (
      claudeResult.result.length >= 100 &&
      !isLowQuality(claudeResult.result)
    ) {
      return claudeResult;
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
        return claudeResult;
      }
    }
    return claudeResult;
  }

  throw new Error(`Unknown task type: ${task}`);
}
