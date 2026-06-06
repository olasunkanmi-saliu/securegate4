import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimiterIdentifier = "signin" | "signup" | "forgot-password" | "verify-resend" | "reset-password";

interface RateLimitResult {
  success: boolean;
  retryAfter: number;
}

const limiterConfigs: Record<
  LimiterIdentifier,
  { limit: number; window: `${number} ${"s" | "m"}` }
> = {
  signin: { limit: 5, window: "10 m" },
  signup: { limit: 5, window: "10 m" },
  "forgot-password": { limit: 3, window: "15 m" },
  "verify-resend": { limit: 3, window: "15 m" },
  "reset-password": { limit: 5, window: "10 m" },
};

const upstashConfigured =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const limiters: Partial<Record<LimiterIdentifier, Ratelimit>> = (() => {
  if (!upstashConfigured) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[RATE-LIMIT] Upstash Redis not configured — rate limiting disabled.");
    }
    return {};
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL as string,
    token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
  });

  const out: Partial<Record<LimiterIdentifier, Ratelimit>> = {};
  for (const id of Object.keys(limiterConfigs) as LimiterIdentifier[]) {
    const { limit, window } = limiterConfigs[id];
    out[id] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      analytics: true,
      prefix: `ratelimit:${id}`,
    });
  }
  return out;
})();

const DEFAULT_RETRY_AFTER = 60;

export async function checkRateLimit(
  ip: string,
  identifier: LimiterIdentifier
): Promise<RateLimitResult> {
  const limiter = limiters[identifier];
  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, retryAfter: DEFAULT_RETRY_AFTER };
    }
    return { success: true, retryAfter: 0 };
  }

  let result: { success: boolean; reset?: number };
  try {
    result = await limiter.limit(ip);
  } catch {
    console.error("[RATE-LIMIT] Upstash Redis error — blocking request.");
    return { success: false, retryAfter: DEFAULT_RETRY_AFTER };
  }
  const resetTime = result.reset ?? Date.now() + 60_000;
  return {
    success: result.success,
    retryAfter: result.success
      ? 0
      : Math.ceil((resetTime - Date.now()) / 1000),
  };
}
