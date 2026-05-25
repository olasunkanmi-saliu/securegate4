import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateToken, hashToken } from "@/lib/tokens";
import { resendVerifySchema } from "@/lib/validations";

import type { NextRequest } from "next/server";

const VERIFICATION_TTL_MS = 15 * 60 * 1000;
const GENERIC_OK_MESSAGE =
  "If your account requires verification, a new link has been sent.";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const parsed = resendVerifySchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed.", fieldErrors },
        { status: 400 }
      );
    }
    const { email } = parsed.data;

    const ip =
      (request.headers.get("x-forwarded-for") ?? "unknown")
        .split(",")[0]
        ?.trim() ?? "unknown";
    const rateLimit = await checkRateLimit(ip, "verify-resend");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        }
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    if (user && !user.emailVerified) {
      await db.verificationToken.deleteMany({ where: { identifier: email } });

      const rawToken = generateToken();
      await db.verificationToken.create({
        data: {
          identifier: email,
          token: hashToken(rawToken),
          expires: new Date(Date.now() + VERIFICATION_TTL_MS),
        },
      });

      await sendVerificationEmail(email, user.name, rawToken);
    }

    return NextResponse.json(
      { success: true, message: GENERIC_OK_MESSAGE },
      { status: 200 }
    );
  } catch (error) {
    console.error("[VERIFY_RESEND]", error);
    return NextResponse.json(
      { success: true, message: GENERIC_OK_MESSAGE },
      { status: 200 }
    );
  }
}
