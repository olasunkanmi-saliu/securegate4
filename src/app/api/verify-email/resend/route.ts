import { NextResponse } from "next/server";

import { padToMinDuration } from "@/lib/auth-timing";
import { VERIFICATION_TTL_MS } from "@/lib/constants";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateToken, hashToken } from "@/lib/tokens";
import { extractClientIp, validateOrigin } from "@/lib/utils";
import { resendVerifySchema } from "@/lib/validations";

import type { NextRequest } from "next/server";

const GENERIC_OK_MESSAGE =
  "If your account requires verification, a new link has been sent.";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startedAt = Date.now();
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

    const ip = extractClientIp(request);
    const rateLimit = await checkRateLimit(ip, "verify-resend");
    if (!rateLimit.success) {
      await padToMinDuration(startedAt);
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
      const rawToken = generateToken();

      await db.$transaction([
        db.verificationToken.deleteMany({ where: { identifier: email } }),
        db.verificationToken.create({
          data: {
            identifier: email,
            token: hashToken(rawToken),
            expires: new Date(Date.now() + VERIFICATION_TTL_MS),
          },
        }),
      ]);

      await sendVerificationEmail(email, user.name, rawToken);
    }

    await padToMinDuration(startedAt);
    return NextResponse.json(
      { success: true, message: GENERIC_OK_MESSAGE },
      { status: 200 }
    );
  } catch (error) {
    console.error("[VERIFY_RESEND]", error);
    await padToMinDuration(startedAt);
    return NextResponse.json(
      { success: true, message: GENERIC_OK_MESSAGE },
      { status: 200 }
    );
  }
}
