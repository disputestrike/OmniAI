import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./env";

const CLAUDE_HAIKU_MODEL = "claude-haiku-4-5-20251001";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const assertApiKey = () => {
  if (ENV.anthropicApiKey?.trim()) return;
  throw new Error(
    "ANTHROPIC_API_KEY is required (Claude). Set it in Railway or .env. We do not use OpenAI/Forge."
  );
};

/** Claude Haiku only. Supports response_format (json_schema) for structured output. */
async function tryClaudeHaiku(params: InvokeParams): Promise<InvokeResult | null> {
  if (!ENV.anthropicApiKey?.trim()) return null;
  const { messages, maxTokens, max_tokens } = params;
  const max = maxTokens ?? max_tokens ?? 32768;
  let system = "";
  const anthropicMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const m of messages) {
    if (m.role === "system") {
      const text = Array.isArray(m.content)
        ? (m.content as TextContent[]).map((c) => (c.type === "text" ? c.text : "")).join("\n")
        : typeof m.content === "string"
          ? m.content
          : "";
      system = system ? `${system}\n\n${text}` : text;
      continue;
    }
    if (m.role !== "user" && m.role !== "assistant") continue;
    const text = Array.isArray(m.content)
      ? (m.content as TextContent[]).map((c) => (c.type === "text" ? c.text : "")).join("\n")
      : typeof m.content === "string"
        ? m.content
        : "";
    if (!text.trim()) continue;
    anthropicMessages.push({ role: m.role as "user" | "assistant", content: text });
  }
  if (anthropicMessages.length === 0) return null;
  const responseFormat = normalizeResponseFormat({
    responseFormat: params.responseFormat,
    response_format: params.response_format,
    outputSchema: params.outputSchema,
    output_schema: params.output_schema,
  });
  const client = new Anthropic({ apiKey: ENV.anthropicApiKey });
  const createParams: Parameters<typeof client.messages.create>[0] = {
    model: CLAUDE_HAIKU_MODEL,
    max_tokens: Math.min(max, 8192),
    system: system || undefined,
    messages: anthropicMessages,
  };
  if (responseFormat?.type === "json_schema" && responseFormat.json_schema?.schema) {
    const schemaStr = JSON.stringify(responseFormat.json_schema.schema, null, 2);
    const jsonInstruction = `Respond with valid JSON only — no markdown, no code fences, no explanation. Your response must match this schema:\n${schemaStr}`;
    createParams.system = createParams.system
      ? `${createParams.system}\n\n${jsonInstruction}`
      : jsonInstruction;
  }
  const response = await client.messages.create(createParams);
  const block = response.content[0];
  const text = block?.type === "text" ? (block as { type: "text"; text: string }).text : "";
  return {
    id: response.id ?? "",
    created: Math.floor(Date.now() / 1000),
    model: CLAUDE_HAIKU_MODEL,
    choices: [
      {
        index: 0,
        message: { role: "assistant" as const, content: text },
        finish_reason: response.stop_reason ?? null,
      },
    ],
    usage: response.usage
      ? {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        }
      : undefined,
  };
}

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const { tools, toolChoice, tool_choice } = params;
  const useTools = (tools && tools.length > 0) || toolChoice || tool_choice;
  if (useTools) {
    throw new Error(
      "Tool calling is handled by the AI agent (Anthropic SDK). Use the agent for tool flows."
    );
  }

  const out = await tryClaudeHaiku(params);
  if (out) return out;
  throw new Error(
    "ANTHROPIC_API_KEY is required. Set it in Railway or .env. We do not use OpenAI/Forge."
  );
}
