/**
 * In-memory sliding-window rate limiter.
 * Suitable for single-server / Vercel serverless deployments.
 * For multi-instance production, swap for Redis-based (e.g. @upstash/ratelimit).
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 60_000);
}

interface RateLimitOptions {
  /** Maximum number of requests in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSec: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number; // seconds until window resets
}

export function rateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowSec * 1000;
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return {
      success: true,
      remaining: options.maxRequests - 1,
      resetIn: options.windowSec,
    };
  }

  if (entry.count >= options.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: options.maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Extract a rate-limit key from a request.
 * Uses x-forwarded-for (Vercel) or falls back to a generic key.
 */
export function getRateLimitKey(request: Request, prefix: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `${prefix}:${ip}`;
}
