import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import { resetPasswordSchema } from "@/lib/validations";

import type { NextRequest } from "next/server";

const BCRYPT_ROUNDS = 12;
const GENERIC_SERVER_ERROR = "Something went wrong. Please try again.";
const INVALID_TOKEN_MESSAGE = "Invalid or expired reset link.";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed.", fieldErrors },
        { status: 400 }
      );
    }
    const { token, password } = parsed.data;

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
