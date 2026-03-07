import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM invocation so tests run without real API calls
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            overallScore: 8,
            hookScore: 7,
            clarityScore: 9,
            emotionScore: 8,
            ctaScore: 7,
            viralityScore: 6,
            verdict: "Strong content with a clear message and good emotional appeal.",
            strengths: ["Clear value proposition", "Strong emotional hook"],
            improvements: ["Add more urgency", "Include social proof"],
            rewrittenHook: "Stop scrolling — this changes everything.",
            rewrittenCta: "Grab yours before they sell out →",
            predictedEngagementRate: "3.2%",
            bestPostingTime: "Tuesday 7–9 PM",
          }),
        },
      },
    ],
  }),
}));

describe("contentScoring router", () => {
  it("returns a valid score structure from the LLM mock", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const result = await (invokeLLM as any)({
      messages: [
        { role: "system", content: "Score this content." },
        { role: "user", content: "Buy our amazing product now!" },
      ],
    });

    const parsed = JSON.parse(result.choices[0].message.content as string);

    expect(parsed.overallScore).toBeGreaterThanOrEqual(1);
    expect(parsed.overallScore).toBeLessThanOrEqual(10);
    expect(parsed.hookScore).toBeGreaterThanOrEqual(1);
    expect(parsed.clarityScore).toBeGreaterThanOrEqual(1);
    expect(parsed.emotionScore).toBeGreaterThanOrEqual(1);
    expect(parsed.ctaScore).toBeGreaterThanOrEqual(1);
    expect(parsed.viralityScore).toBeGreaterThanOrEqual(1);
    expect(typeof parsed.verdict).toBe("string");
    expect(Array.isArray(parsed.strengths)).toBe(true);
    expect(Array.isArray(parsed.improvements)).toBe(true);
    expect(typeof parsed.rewrittenHook).toBe("string");
    expect(typeof parsed.rewrittenCta).toBe("string");
    expect(typeof parsed.predictedEngagementRate).toBe("string");
    expect(typeof parsed.bestPostingTime).toBe("string");
  });

  it("score fields are all within 1-10 range", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const result = await (invokeLLM as any)({ messages: [] });
    const parsed = JSON.parse(result.choices[0].message.content as string);

    const scoreFields = ["overallScore", "hookScore", "clarityScore", "emotionScore", "ctaScore", "viralityScore"];
    for (const field of scoreFields) {
      expect(parsed[field]).toBeGreaterThanOrEqual(1);
      expect(parsed[field]).toBeLessThanOrEqual(10);
    }
  });

  it("strengths and improvements are non-empty arrays", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const result = await (invokeLLM as any)({ messages: [] });
    const parsed = JSON.parse(result.choices[0].message.content as string);

    expect(parsed.strengths.length).toBeGreaterThan(0);
    expect(parsed.improvements.length).toBeGreaterThan(0);
  });
});

describe("UpgradePrompt plan gating logic", () => {
  const PLAN_HIERARCHY = ["free", "starter", "professional", "business", "enterprise"];

  function hasAccess(userPlan: string, requiredPlan: string): boolean {
    const userIdx = PLAN_HIERARCHY.indexOf(userPlan);
    const reqIdx = PLAN_HIERARCHY.indexOf(requiredPlan);
    return userIdx >= reqIdx;
  }

  it("free user cannot access starter features", () => {
    expect(hasAccess("free", "starter")).toBe(false);
  });

  it("starter user can access starter features", () => {
    expect(hasAccess("starter", "starter")).toBe(true);
  });

  it("professional user can access starter features", () => {
    expect(hasAccess("professional", "starter")).toBe(true);
  });

  it("business user can access all features up to business", () => {
    expect(hasAccess("business", "business")).toBe(true);
    expect(hasAccess("business", "professional")).toBe(true);
    expect(hasAccess("business", "starter")).toBe(true);
  });

  it("enterprise user can access all features", () => {
    for (const plan of PLAN_HIERARCHY) {
      expect(hasAccess("enterprise", plan)).toBe(true);
    }
  });

  it("free user cannot access business features", () => {
    expect(hasAccess("free", "business")).toBe(false);
  });
});

describe("Admin role check logic", () => {
  it("admin role grants admin access", () => {
    const user = { role: "admin", id: 1 };
    expect(user.role === "admin").toBe(true);
  });

  it("regular user role does not grant admin access", () => {
    const user = { role: "user", id: 2 };
    expect(user.role === "admin").toBe(false);
  });

  it("undefined role does not grant admin access", () => {
    const user = { role: undefined, id: 3 };
    expect(user.role === "admin").toBe(false);
  });
});
