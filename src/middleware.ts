import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/rate-limit";
import { extractClientIp } from "@/lib/utils";

import type { NextRequest } from "next/server";

export async function middleware(
  req: NextRequest
): Promise<NextResponse | undefined> {
  if (
    req.nextUrl.pathname === "/api/auth/callback/credentials" &&
    req.method === "POST"
  ) {
    const ip = extractClientIp(req);
    const rateLimit = await checkRateLimit(ip, "signin");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        }
      );
    }
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    let token;
    try {
      token = await getToken({ req });
    } catch (error) {
      console.error("[MIDDLEWARE:GET_TOKEN]", error);
    }
    if (!token) {
      const signInUrl = new URL("/auth?mode=login", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/callback/credentials", "/dashboard/:path*"],
};
