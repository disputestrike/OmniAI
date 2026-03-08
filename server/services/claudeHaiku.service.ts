/**
 * Claude Haiku service (Spec v4).
 * Model: claude-haiku-4-5-20251001 — strategy, analysis, scoring, structured JSON.
 */
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../_core/env";

const MODEL = "claude-haiku-4-5-20251001";

export type CallClaudeHaikuParams = {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  requiresJSON?: boolean;
};

export type CallClaudeHaikuResult = {
  result: string;
  modelUsed: string;
  cost: "paid";
};

export async function callClaudeHaiku(
  params: CallClaudeHaikuParams
): Promise<CallClaudeHaikuResult> {
  if (!ENV.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  const client = new Anthropic({ apiKey: ENV.anthropicApiKey });
  const system = params.requiresJSON
    ? (params.systemPrompt || "") + " Return JSON only. No markdown. No explanation."
    : params.systemPrompt ?? "You are a helpful assistant.";

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: params.maxTokens ?? 1024,
    system,
    messages: [{ role: "user", content: params.prompt }],
  });

  const block = response.content[0];
  const text =
    block?.type === "text" ? (block as { type: "text"; text: string }).text : "";
  return {
    result: text,
    modelUsed: "claude-haiku-4-5",
    cost: "paid",
  };
}

export function isClaudeHaikuConfigured(): boolean {
  return !!ENV.anthropicApiKey;
}
