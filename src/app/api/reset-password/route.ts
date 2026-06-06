import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { BCRYPT_ROUNDS, GENERIC_SERVER_ERROR } from "@/lib/constants";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashToken } from "@/lib/tokens";
import { extractClientIp, validateOrigin } from "@/lib/utils";
import { resetPasswordApiSchema } from "@/lib/validations";

import type { NextRequest } from "next/server";

const INVALID_TOKEN_MESSAGE = "Invalid or expired reset link.";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const parsed = resetPasswordApiSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed.", fieldErrors },
        { status: 400 }
      );
    }
    const { token, password } = parsed.data;

    const ip = extractClientIp(request);
    const rateLimit = await checkRateLimit(ip, "reset-password");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        }
      );
    }

    const hashedToken = hashToken(token);
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token: hashedToken },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json(
        { error: INVALID_TOKEN_MESSAGE },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, BCRYPT_ROUNDS);

    await db.$transaction([
      db.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      }),
      db.passwordResetToken.delete({ where: { id: resetToken.id } }),
    ]);

    return NextResponse.json(
      { success: true, message: "Password updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return NextResponse.json(
      { error: GENERIC_SERVER_ERROR },
      { status: 500 }
    );
  }
}
