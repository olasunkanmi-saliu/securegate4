import type { NextRequest } from "next/server";

export function cx(
  ...classes: (string | false | undefined | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}

export function extractClientIp(request: NextRequest | Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

export function validateOrigin(request: NextRequest | Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowedOrigin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  let allowedBase: string;
  try {
    allowedBase = new URL(allowedOrigin).origin;
  } catch {
    return false;
  }

  if (origin) {
    try {
      return new URL(origin).origin === allowedBase;
    } catch {
      return false;
    }
  }
  if (referer) {
    try {
      return new URL(referer).origin === allowedBase;
    } catch {
      return false;
    }
  }
  return false;
}
