import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { padToMinDuration } from "@/lib/auth-timing";
import { BCRYPT_ROUNDS, GENERIC_SERVER_ERROR, VERIFICATION_TTL_MS } from "@/lib/constants";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateToken, hashToken } from "@/lib/tokens";
import { extractClientIp } from "@/lib/utils";
import { signupSchema } from "@/lib/validations";

import type { NextRequest } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
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

    const ip = extractClientIp(request);
    const rateLimit = await checkRateLimit(ip, "signup");
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

    const hashedPassword = await hash(password, BCRYPT_ROUNDS);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    }).catch((err) => {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return null;
      }
      throw err;
    });

    if (!user) {
      await padToMinDuration(startedAt);
      return NextResponse.json(
        { error: GENERIC_SERVER_ERROR },
        { status: 500 }
      );
    }

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

    await padToMinDuration(startedAt);
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
