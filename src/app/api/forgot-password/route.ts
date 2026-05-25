import { NextResponse } from "next/server";

import { padToMinDuration } from "@/lib/auth-timing";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateToken, hashToken } from "@/lib/tokens";
import { forgotPasswordSchema } from "@/lib/validations";

import type { NextRequest } from "next/server";

const RESET_TTL_MS = 60 * 60 * 1000;
const GENERIC_OK_MESSAGE =
  "If an account exists, a reset link has been sent.";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  try {
    const body = await request.json();

    const parsed = forgotPasswordSchema.safeParse(body);
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
    const rateLimit = await checkRateLimit(ip, "forgot-password");
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

    if (user) {
      await db.passwordResetToken.deleteMany({ where: { email } });

      const rawToken = generateToken();
      await db.passwordResetToken.create({
        data: {
          email,
          token: hashToken(rawToken),
          expires: new Date(Date.now() + RESET_TTL_MS),
        },
      });

      await sendPasswordResetEmail(email, user.name, rawToken);
    }

    await padToMinDuration(startedAt);
    return NextResponse.json(
      { success: true, message: GENERIC_OK_MESSAGE },
      { status: 200 }
    );
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    await padToMinDuration(startedAt);
    return NextResponse.json(
      { success: true, message: GENERIC_OK_MESSAGE },
      { status: 200 }
    );
  }
}
