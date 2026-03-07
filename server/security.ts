import { Request, Response, NextFunction } from "express";

// ─── Input Sanitization ─────────────────────────────────────────────
// Strip potential XSS vectors from string inputs
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return input;
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Deep sanitize an object's string values
export function sanitizeObject(obj: any): any {
  if (typeof obj === "string") return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

// ─── Rate Limiter ───────────────────────────────────────────────────
// In-memory rate limiter (per IP, per endpoint pattern)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt < now) rateLimitStore.delete(key);
  });
}, 5 * 60 * 1000);

export function rateLimit(opts: { windowMs: number; max: number; keyPrefix?: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${opts.keyPrefix || "rl"}:${ip}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    if (entry.count > opts.max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000).toString());
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    res.setHeader("X-RateLimit-Limit", opts.max.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, opts.max - entry.count).toString());
    res.setHeader("X-RateLimit-Reset", entry.resetAt.toString());

    next();
  };
}

/** Call from inside a procedure to enforce rate limit by IP (e.g. form submit, report by token). Throws if over limit. */
export function checkRateLimit(ip: string, keyPrefix: string, windowMs: number, max: number): void {
  const key = `${keyPrefix}:${ip || "unknown"}`;
  const now = Date.now();
  let entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimitStore.set(key, entry);
  }
  entry.count++;
  if (entry.count > max) {
    const e = new Error("Too many requests. Please try again later.") as Error & { code?: string };
    (e as any).code = "TOO_MANY_REQUESTS";
    throw e;
  }
}

// ─── Security Headers ───────────────────────────────────────────────
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Enable XSS filter
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Content Security Policy (relaxed for development)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https:; frame-ancestors 'self'"
    );
  }
  next();
}

// ─── Input Validation Helpers ───────────────────────────────────────
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 320;
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
  return phoneRegex.test(phone);
}

// Max length enforcement
export function enforceMaxLength(str: string, max: number): string {
  if (typeof str !== "string") return "";
  return str.slice(0, max);
}

// SQL injection pattern detection (additional layer beyond parameterized queries)
export function hasSQLInjectionPatterns(input: string): boolean {
  if (typeof input !== "string") return false;
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|DECLARE)\b.*\b(FROM|INTO|TABLE|SET|WHERE|ALL|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/|xp_|sp_)/i,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /(CHAR\s*\(|NCHAR\s*\(|VARCHAR\s*\(|CAST\s*\(|CONVERT\s*\()/i,
  ];
  return patterns.some(p => p.test(input));
}

// XSS pattern detection
export function hasXSSPatterns(input: string): boolean {
  if (typeof input !== "string") return false;
  const patterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript\s*:/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /<iframe\b/gi,
    /<object\b/gi,
    /<embed\b/gi,
    /<link\b[^>]*\bhref\s*=/gi,
  ];
  return patterns.some(p => p.test(input));
}
