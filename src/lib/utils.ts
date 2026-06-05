import type { NextRequest } from "next/server";

export function cx(
  ...classes: (string | false | undefined | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}

export function extractClientIp(request: NextRequest | Request): string {
  const raw = request.headers.get("x-forwarded-for") ?? "unknown";
  return raw.split(",")[0]?.trim() ?? "unknown";
}
