import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { contents, scheduledPosts } from "../drizzle/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";

// ─── AI Content Scoring ───────────────────────────────────────────────────────

const scoreContentSchema = z.object({
  body: z.string().min(1).max(10000),
  type: z.string().optional(),
  platform: z.string().optional(),
  targetAudience: z.string().optional(),
  productName: z.string().optional(),
});

export const advancedFeaturesRouter = router({
  // Score content 1-10 with specific improvement suggestions
  scoreContent: protectedProcedure
    .input(scoreContentSchema)
    .mutation(async ({ input }) => {
      const systemPrompt = `You are an expert marketing analyst and engagement specialist. Your job is to score marketing content and provide actionable improvement suggestions.

Score the content on a scale of 1-10 based on these criteria:
- Hook strength (does it grab attention in the first line?)
- Clarity (is the message clear and easy to understand?)
- Emotional resonance (does it connect emotionally?)
- Call-to-action strength (is the CTA compelling and clear?)
- Platform fit (is it optimized for the target platform?)
- Engagement potential (will people like, share, comment, or buy?)
- Authenticity (does it feel genuine, not salesy?)

Return a JSON response with this exact structure:
{
  "overallScore": <number 1-10>,
  "breakdown": {
    "hook": <number 1-10>,
    "clarity": <number 1-10>,
    "emotion": <number 1-10>,
    "cta": <number 1-10>,
    "platformFit": <number 1-10>,
    "engagement": <number 1-10>,
    "authenticity": <number 1-10>
  },
  "verdict": "<one sentence summary of the content's strength>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": [
    {
      "issue": "<specific problem>",
      "suggestion": "<specific fix>",
      "example": "<rewritten example of the problematic part>",
      "impact": "high|medium|low"
    }
  ],
  "improvedVersion": "<full rewritten version of the content with all improvements applied>",
  "viralPotential": "high|medium|low",
  "estimatedEngagementRate": "<percentage range e.g. 3-5%>"
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Score this ${input.type || "marketing"} content${input.platform ? ` for ${input.platform}` : ""}${input.targetAudience ? ` targeting ${input.targetAudience}` : ""}${input.productName ? ` for "${input.productName}"` : ""}:

${input.body}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "content_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallScore: { type: "number" },
                breakdown: {
                  type: "object",
                  properties: {
                    hook: { type: "number" },
                    clarity: { type: "number" },
                    emotion: { type: "number" },
                    cta: { type: "number" },
                    platformFit: { type: "number" },
                    engagement: { type: "number" },
                    authenticity: { type: "number" },
                  },
                  required: ["hook", "clarity", "emotion", "cta", "platformFit", "engagement", "authenticity"],
                  additionalProperties: false,
                },
                verdict: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                improvements: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      issue: { type: "string" },
                      suggestion: { type: "string" },
                      example: { type: "string" },
                      impact: { type: "string" },
                    },
                    required: ["issue", "suggestion", "example", "impact"],
                    additionalProperties: false,
                  },
                },
                improvedVersion: { type: "string" },
                viralPotential: { type: "string" },
                estimatedEngagementRate: { type: "string" },
              },
              required: ["overallScore", "breakdown", "verdict", "strengths", "improvements", "improvedVersion", "viralPotential", "estimatedEngagementRate"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = response.choices[0].message.content as string;
      const result = JSON.parse(raw);
      return result;
    }),

  // Score content from library by ID
  scoreContentById: protectedProcedure
    .input(z.object({ contentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [content] = await db
        .select()
        .from(contents)
        .where(and(eq(contents.id, input.contentId), eq(contents.userId, ctx.user.id)))
        .limit(1);

      if (!content) throw new TRPCError({ code: "NOT_FOUND", message: "Content not found" });

      const systemPrompt = `You are an expert marketing analyst. Score this marketing content 1-10 and provide specific improvements. Return JSON with: overallScore (number), verdict (string), strengths (string[]), improvements (array of {issue, suggestion, example, impact}), improvedVersion (string), viralPotential (high|medium|low), estimatedEngagementRate (string).`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Score this ${content.type} content for ${content.platform || "general"}:\n\n${content.body}` },
        ],
      });

      const raw = response.choices[0].message.content as string;
      let result;
      try {
        result = JSON.parse(raw);
      } catch {
        result = { overallScore: 7, verdict: raw.substring(0, 200), strengths: [], improvements: [], improvedVersion: content.body, viralPotential: "medium", estimatedEngagementRate: "2-4%" };
      }
      return { content, score: result };
    }),

  // ─── Competitor Content Monitoring ─────────────────────────────────────────

  // Analyze a competitor URL and extract their content strategy
  analyzeCompetitorContent: protectedProcedure
    .input(z.object({
      competitorUrl: z.string().url(),
      competitorName: z.string().optional(),
      yourNiche: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `You are a competitive intelligence expert. Analyze the competitor's content strategy based on their URL and provide actionable insights.

Return JSON with:
{
  "competitorName": "<extracted or provided name>",
  "contentThemes": ["<theme 1>", "<theme 2>", "<theme 3>"],
  "postingFrequency": "<estimated frequency>",
  "topPerformingFormats": ["<format 1>", "<format 2>"],
  "audienceEngagementStyle": "<description>",
  "keyMessages": ["<message 1>", "<message 2>", "<message 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "opportunities": ["<opportunity 1>", "<opportunity 2>", "<opportunity 3>"],
  "remixIdeas": [
    {
      "title": "<idea title>",
      "description": "<how to remix their content for your brand>",
      "format": "<content format>",
      "platform": "<target platform>",
      "angle": "<your unique angle>"
    }
  ],
  "alertKeywords": ["<keyword to monitor 1>", "<keyword to monitor 2>"],
  "competitiveScore": <1-10 how strong their content is>
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze competitor at: ${input.competitorUrl}
Competitor name: ${input.competitorName || "Unknown"}
My niche: ${input.yourNiche || "General marketing"}

Based on the URL and domain, infer their industry, content strategy, and provide remix ideas I can use.`,
          },
        ],
      });

      const raw = response.choices[0].message.content as string;
      let result;
      try {
        result = JSON.parse(raw);
      } catch {
        result = {
          competitorName: input.competitorName || new URL(input.competitorUrl).hostname,
          contentThemes: ["Brand awareness", "Product promotion", "Customer stories"],
          postingFrequency: "3-5x per week",
          topPerformingFormats: ["Short-form video", "Carousel posts"],
          audienceEngagementStyle: "Community-focused with calls to action",
          keyMessages: ["Quality products", "Customer satisfaction", "Innovation"],
          weaknesses: ["Generic messaging", "Low personalization"],
          opportunities: ["More authentic storytelling", "Better CTAs", "Video content"],
          remixIdeas: [
            { title: "Counter-narrative", description: "Address their weaknesses directly", format: "short_ad", platform: "instagram", angle: "Your unique advantage" },
          ],
          alertKeywords: [new URL(input.competitorUrl).hostname],
          competitiveScore: 6,
        };
      }
      return { url: input.competitorUrl, analysis: result };
    }),

  // Generate counter-content for a competitor's post
  generateCounterContent: protectedProcedure
    .input(z.object({
      competitorContent: z.string().min(1),
      competitorName: z.string().optional(),
      yourBrand: z.string().optional(),
      yourProduct: z.string().optional(),
      platform: z.string().default("instagram"),
      angle: z.enum(["better_value", "more_authentic", "funnier", "more_educational", "direct_comparison", "emotional"]).default("better_value"),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `You are a competitive marketing strategist. Create counter-content that positions the user's brand favorably against a competitor without being negative or attacking.

Return JSON with:
{
  "counterContent": "<your counter-content>",
  "strategy": "<explanation of the counter strategy>",
  "hook": "<attention-grabbing first line>",
  "hashtags": ["<hashtag 1>", "<hashtag 2>"],
  "callToAction": "<strong CTA>",
  "whyItWorks": "<why this counter-content will outperform>"
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Competitor (${input.competitorName || "Unknown"}) posted:
"${input.competitorContent}"

Create counter-content for ${input.yourBrand || "my brand"}${input.yourProduct ? ` promoting ${input.yourProduct}` : ""} on ${input.platform}.
Angle: ${input.angle.replace(/_/g, " ")}`,
          },
        ],
      });

      const raw = response.choices[0].message.content as string;
      let result;
      try {
        result = JSON.parse(raw);
      } catch {
        result = { counterContent: raw, strategy: "Direct response", hook: raw.split("\n")[0], hashtags: [], callToAction: "Learn more", whyItWorks: "Addresses competitor messaging" };
      }
      return result;
    }),

  // ─── Bulk CSV Import ────────────────────────────────────────────────────────

  // Parse and validate CSV content
  parseBulkCSV: protectedProcedure
    .input(z.object({
      csvContent: z.string().min(1),
      contentType: z.string().default("short_ad"),
      platform: z.string().default("instagram"),
      tone: z.string().default("professional"),
    }))
    .mutation(async ({ input }) => {
      // Parse CSV manually
      const lines = input.csvContent.trim().split("\n");
      if (lines.length < 2) throw new TRPCError({ code: "BAD_REQUEST", message: "CSV must have a header row and at least one data row" });

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
      const rows = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ""; });
        return row;
      }).filter(row => Object.values(row).some(v => v.length > 0));

      if (rows.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No data rows found in CSV" });
      if (rows.length > 100) throw new TRPCError({ code: "BAD_REQUEST", message: "Maximum 100 rows per import" });

      return {
        headers,
        rows,
        count: rows.length,
        preview: rows.slice(0, 3),
      };
    }),

  // Generate content for all CSV rows in batch
  generateBulkContent: protectedProcedure
    .input(z.object({
      rows: z.array(z.record(z.string(), z.string())),
      contentType: z.string().default("short_ad"),
      platform: z.string().default("instagram"),
      tone: z.string().default("professional"),
      additionalInstructions: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const results: Array<{
        row: Record<string, string>;
        content: string;
        hashtags: string[];
        cta: string;
        savedId?: number;
      }> = [];

      // Process in batches of 5 to avoid overwhelming the LLM
      const batchSize = 5;
      for (let i = 0; i < input.rows.length; i += batchSize) {
        const batch = input.rows.slice(i, i + batchSize);

        const batchPromises = batch.map(async (row: Record<string, unknown>) => {
          const rowDescription = Object.entries(row)
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a marketing copywriter. Create ${input.contentType} content for ${input.platform} in a ${input.tone} tone. Return JSON with: content (string), hashtags (string[]), cta (string).`,
              },
              {
                role: "user",
                content: `Create content for: ${rowDescription}${input.additionalInstructions ? `\nExtra instructions: ${input.additionalInstructions}` : ""}`,
              },
            ],
          });

          const raw = response.choices[0].message.content as string;
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = { content: raw, hashtags: [], cta: "Learn more" };
          }

           // Save to contents table
          const insertResult = await db!.insert(contents).values({
            userId: ctx.user.id,
            type: input.contentType as "ad_copy_short",
            platform: input.platform,
            body: String(parsed.content || ""),
            metadata: { source: "bulk_csv", hashtags: parsed.hashtags, cta: parsed.cta },
          });
          const savedId = insertResult[0]?.insertId as number | undefined;
          return { row: row as Record<string, string>, content: String(parsed.content || ""), hashtags: (parsed.hashtags || []) as string[], cta: String(parsed.cta || "Learn more"), savedId };
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      return {
        generated: results.length,
        results,
        savedToLibrary: results.filter(r => r.savedId).length,
      };
    }),

  // Auto-schedule bulk generated content
  scheduleBulkContent: protectedProcedure
    .input(z.object({
      contentIds: z.array(z.number()),
      platforms: z.array(z.string()),
      startDate: z.number(), // UTC timestamp
      intervalHours: z.number().default(24),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const scheduled: number[] = [];
      let currentTime = input.startDate;

      for (const contentId of input.contentIds) {
        const [content] = await db!
          .select()
          .from(contents)
          .where(and(eq(contents.id, contentId), eq(contents.userId, ctx.user.id)))
          .limit(1);

        if (!content) continue;

        for (const platform of input.platforms) {
          const postResult = await db!.insert(scheduledPosts).values({
            userId: ctx.user.id,
            contentId,
            platform,
            scheduledAt: new Date(currentTime),
            status: "scheduled",
          });
          const postId = postResult[0]?.insertId as number | undefined;
          if (postId) scheduled.push(postId);;
        }

        currentTime += input.intervalHours * 60 * 60 * 1000;
      }

      return { scheduled: scheduled.length, scheduledIds: scheduled };
    }),

  // Upload CSV file from base64
  uploadCSVFile: protectedProcedure
    .input(z.object({
      fileBase64: z.string(),
      fileName: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `${ctx.user.id}-csv/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, "text/csv");
      const csvContent = buffer.toString("utf-8");
      return { url, csvContent, fileKey };
    }),
});
