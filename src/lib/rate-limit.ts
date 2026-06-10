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

// ── In-memory fallback for development (no Upstash required) ──────────
const memStore = new Map<string, number[]>();

function parseWindow(window: `${number} ${"s" | "m"}`): number {
  const [num, unit] = window.split(" ");
  return unit === "m" ? parseInt(num) * 60_000 : parseInt(num) * 1000;
}

function checkMemoryRateLimit(
  ip: string,
  identifier: LimiterIdentifier
): { success: boolean; retryAfter: number } {
  const cfg = limiterConfigs[identifier];
  const key = `${identifier}:${ip}`;
  const now = Date.now();
  const windowMs = parseWindow(cfg.window);

  let hits = memStore.get(key) ?? [];
  hits = hits.filter((t) => now - t < windowMs);

  if (hits.length >= cfg.limit) {
    const oldest = hits[0]!;
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { success: false, retryAfter };
  }

  hits.push(now);
  memStore.set(key, hits);
  return { success: true, retryAfter: 0 };
}

const limiters: Partial<Record<LimiterIdentifier, Ratelimit>> = (() => {
  if (!upstashConfigured) {
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

export async function checkRateLimit(
  ip: string,
  identifier: LimiterIdentifier
): Promise<RateLimitResult> {
  const limiter = limiters[identifier];
  if (!limiter) {
    return checkMemoryRateLimit(ip, identifier);
  }

  let result: { success: boolean; reset?: number };
  try {
    result = await limiter.limit(ip);
  } catch (error) {
    console.error("[RATE-LIMIT] Upstash Redis error — allowing request.", error);
    return { success: true, retryAfter: 0 };
  }
  const resetTime = result.reset ?? Date.now() + 60_000;
  return {
    success: result.success,
    retryAfter: result.success
      ? 0
      : Math.ceil((resetTime - Date.now()) / 1000),
  };
}
