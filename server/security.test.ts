import { describe, expect, it } from "vitest";
import {
  sanitizeString,
  sanitizeObject,
  isValidEmail,
  isValidUrl,
  isValidPhone,
  enforceMaxLength,
  hasSQLInjectionPatterns,
  hasXSSPatterns,
} from "./security";

// ─── Sanitization Tests ─────────────────────────────────────────────
describe("sanitizeString", () => {
  it("escapes HTML special characters", () => {
    expect(sanitizeString("<script>alert('xss')</script>")).not.toContain("<script>");
    expect(sanitizeString("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes ampersands", () => {
    expect(sanitizeString("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes quotes", () => {
    expect(sanitizeString('He said "hello"')).toContain("&quot;");
    expect(sanitizeString("It's fine")).toContain("&#x27;");
  });

  it("handles empty string", () => {
    expect(sanitizeString("")).toBe("");
  });

  it("handles normal text without changes (no special chars)", () => {
    expect(sanitizeString("Hello World 123")).toBe("Hello World 123");
  });

  it("handles unicode text", () => {
    const unicode = "日本語テスト 🎉 مرحبا";
    expect(sanitizeString(unicode)).toBe(unicode);
  });

  it("handles nested injection attempts", () => {
    const input = '"><img src=x onerror=alert(1)>';
    const result = sanitizeString(input);
    // sanitizeString HTML-encodes angle brackets, so <img becomes &lt;img
    expect(result).not.toContain("<img");
    expect(result).toContain("&lt;img");
    // The word 'onerror' remains in the encoded string but is harmless
    // because the entire tag is escaped and won't execute
    expect(result).toContain("&gt;");
  });
});

describe("sanitizeObject", () => {
  it("sanitizes nested objects", () => {
    const input = {
      name: "<script>alert('xss')</script>",
      nested: { value: '<img src="x" onerror="alert(1)">' },
    };
    const result = sanitizeObject(input);
    expect(result.name).not.toContain("<script>");
    expect(result.nested.value).not.toContain("<img");
  });

  it("sanitizes arrays", () => {
    const input = ["<b>bold</b>", "normal", "<script>bad</script>"];
    const result = sanitizeObject(input);
    expect(result[0]).not.toContain("<b>");
    expect(result[1]).toBe("normal");
    expect(result[2]).not.toContain("<script>");
  });

  it("handles null and undefined", () => {
    expect(sanitizeObject(null)).toBeNull();
    expect(sanitizeObject(undefined)).toBeUndefined();
  });

  it("handles numbers and booleans", () => {
    expect(sanitizeObject(42)).toBe(42);
    expect(sanitizeObject(true)).toBe(true);
    expect(sanitizeObject(false)).toBe(false);
  });

  it("handles deeply nested structures", () => {
    const input = {
      a: { b: { c: { d: "<script>deep</script>" } } },
    };
    const result = sanitizeObject(input);
    expect(result.a.b.c.d).not.toContain("<script>");
  });
});

// ─── Email Validation Tests ─────────────────────────────────────────
describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user.name+tag@domain.co.uk")).toBe(true);
    expect(isValidEmail("a@b.cc")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("user @domain.com")).toBe(false);
  });

  it("rejects emails exceeding max length", () => {
    const longEmail = "a".repeat(310) + "@example.com";
    expect(isValidEmail(longEmail)).toBe(false);
  });
});

// ─── URL Validation Tests ───────────────────────────────────────────
describe("isValidUrl", () => {
  it("accepts valid URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://localhost:3000")).toBe(true);
    expect(isValidUrl("https://sub.domain.co.uk/path?q=1")).toBe(true);
  });

  it("rejects invalid URLs", () => {
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("ftp://files.example.com")).toBe(false);
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });
});

// ─── Phone Validation Tests ─────────────────────────────────────────
describe("isValidPhone", () => {
  it("accepts valid phone numbers", () => {
    expect(isValidPhone("+1234567890")).toBe(true);
    expect(isValidPhone("(555) 123-4567")).toBe(true);
    expect(isValidPhone("+44 20 7946 0958")).toBe(true);
  });

  it("rejects invalid phone numbers", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("abc")).toBe(false);
    expect(isValidPhone("12")).toBe(false);
  });
});

// ─── Max Length Enforcement ─────────────────────────────────────────
describe("enforceMaxLength", () => {
  it("truncates strings exceeding max length", () => {
    expect(enforceMaxLength("Hello World", 5)).toBe("Hello");
  });

  it("returns full string if within limit", () => {
    expect(enforceMaxLength("Hello", 10)).toBe("Hello");
  });

  it("handles empty string", () => {
    expect(enforceMaxLength("", 10)).toBe("");
  });

  it("handles non-string input", () => {
    expect(enforceMaxLength(null as any, 10)).toBe("");
    expect(enforceMaxLength(undefined as any, 10)).toBe("");
    expect(enforceMaxLength(123 as any, 10)).toBe("");
  });
});

// ─── SQL Injection Detection Tests ──────────────────────────────────
describe("hasSQLInjectionPatterns", () => {
  it("detects common SQL injection patterns", () => {
    expect(hasSQLInjectionPatterns("'; DROP TABLE users; --")).toBe(true);
    expect(hasSQLInjectionPatterns("1 OR 1=1")).toBe(true);
    expect(hasSQLInjectionPatterns("SELECT * FROM users")).toBe(true);
    expect(hasSQLInjectionPatterns("UNION SELECT password FROM users")).toBe(true);
  });

  it("allows normal text", () => {
    expect(hasSQLInjectionPatterns("Hello World")).toBe(false);
    expect(hasSQLInjectionPatterns("My product is great")).toBe(false);
    expect(hasSQLInjectionPatterns("Buy 2 get 1 free")).toBe(false);
  });

  it("handles empty and non-string input", () => {
    expect(hasSQLInjectionPatterns("")).toBe(false);
    expect(hasSQLInjectionPatterns(123 as any)).toBe(false);
  });
});

// ─── XSS Detection Tests ───────────────────────────────────────────
describe("hasXSSPatterns", () => {
  it("detects script tags", () => {
    expect(hasXSSPatterns("<script>alert('xss')</script>")).toBe(true);
  });

  it("detects javascript: protocol", () => {
    expect(hasXSSPatterns("javascript:alert(1)")).toBe(true);
  });

  it("detects event handlers", () => {
    expect(hasXSSPatterns('<img onerror="alert(1)">')).toBe(true);
    expect(hasXSSPatterns('<div onmouseover="steal()">')).toBe(true);
  });

  it("detects iframe injection", () => {
    expect(hasXSSPatterns('<iframe src="evil.com">')).toBe(true);
  });

  it("detects object/embed tags", () => {
    expect(hasXSSPatterns("<object data='evil.swf'>")).toBe(true);
    expect(hasXSSPatterns("<embed src='evil.swf'>")).toBe(true);
  });

  it("allows normal text", () => {
    expect(hasXSSPatterns("Hello World")).toBe(false);
    expect(hasXSSPatterns("This is a great product!")).toBe(false);
    expect(hasXSSPatterns("Use <b> tags for bold")).toBe(false);
  });

  it("handles empty and non-string input", () => {
    expect(hasXSSPatterns("")).toBe(false);
    expect(hasXSSPatterns(null as any)).toBe(false);
  });
});
