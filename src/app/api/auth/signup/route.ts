import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validations";

import type { NextRequest } from "next/server";

const BCRYPT_ROUNDS = 12;
const GENERIC_SERVER_ERROR = "Something went wrong. Please try again.";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed.", fieldErrors },
        { status: 400 }
      );
    }
    const { name, email, password } = parsed.data;

    const ip =
      (request.headers.get("x-forwarded-for") ?? "unknown")
        .split(",")[0]
        ?.trim() ?? "unknown";
    const rateLimit = await checkRateLimit(ip, "signup");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        }
      );
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: GENERIC_SERVER_ERROR },
        { status: 500 }
      );
    }

    const hashedPassword = await hash(password, BCRYPT_ROUNDS);

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created. Check your email to verify your address.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SIGNUP]", error);
    return NextResponse.json(
      { error: GENERIC_SERVER_ERROR },
      { status: 500 }
    );
  }
}
