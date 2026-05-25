# SKILL: API Route Scaffolder

## Purpose

Scaffold a new Next.js 14 App Router API route for SecureGate following the project's security constraints, validation patterns, and error handling standards.

## When to Use

Use this skill when you need to create any new `route.ts` file under `src/app/api/`.

## Route Inventory

These are all the API routes SecureGate requires. Do not create routes outside this table.

| Route                         | File Path                                        | Zod Schema             | Rate Limited      | Enumeration Defense |
|-------------------------------|--------------------------------------------------|------------------------|--------------------|---------------------|
| POST /api/auth/signup         | `src/app/api/auth/signup/route.ts`               | `signupSchema`         | signup (5/10min)   | Yes — email exists  |
| POST /api/auth/signin         | `src/app/api/auth/[...nextauth]/route.ts`        | Handled by NextAuth    | signin (5/10min)   | Yes — credentials   |
| POST /api/auth/signout        | `src/app/api/auth/[...nextauth]/route.ts`        | None — session only    | No                 | No                  |
| POST /api/forgot-password     | `src/app/api/forgot-password/route.ts`            | `forgotPasswordSchema` | forgot (3/15min)   | Yes — email exists  |
| POST /api/reset-password      | `src/app/api/reset-password/route.ts`             | `resetPasswordSchema`  | No                 | No                  |
| POST /api/verify-email/resend | `src/app/api/verify-email/resend/route.ts`        | `resendVerifySchema`   | resend (3/15min)   | Yes — email exists  |

## Inputs Required

1. **Route path** (e.g., `/api/auth/signup`)
2. **HTTP method** (`POST`, `GET`)
3. **Request body shape** (for POST)
4. **Auth required?** (yes/no)
5. **Rate limited?** (yes/no — if yes, specify limit and window)
6. **Zod schema name** from `lib/validations.ts`

## Output File

```
src/app/api/{path}/route.ts
```

## Mandatory Structure

Every custom API route (not NextAuth) follows this exact order. No steps may be skipped or reordered.

```typescript
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { schemaName } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

import type { NextRequest } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // ── Step 1: Parse request body ──
    const body = await request.json();

    // ── Step 2: Validate with Zod ──
    const result = schemaName.safeParse(body);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed.", fieldErrors },
        { status: 400 }
      );
    }
    const { field1, field2 } = result.data;

    // ── Step 3: Rate limit check ──
    const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0]?.trim() ?? "unknown";
    const rateLimitResult = await checkRateLimit(ip, "route-identifier"); // ⚠ REPLACE "route-identifier"
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimitResult.retryAfter) },
        }
      );
    }

    // ── Step 4: Business logic ──
    // Call lib/ functions here.

    // ── Step 5: Return sanitized response ──
    return NextResponse.json(
      { success: true, message: "Operation completed." },
      { status: 200 }
    );

  } catch (error) {
    // ── Step 6: Catch-all error handler ──
    console.error("[ROUTE_NAME]", error); // ⚠ REPLACE [ROUTE_NAME] with a route identifier like "SIGNUP"
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
```

## Shared Lib Implementations

These files must exist before any route is built. Create them during Phase 1–2.

### lib/rate-limit.ts

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const limiters: Record<string, Ratelimit> = {
  signin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    analytics: true,
    prefix: "ratelimit:signin",
  }),
  signup: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    analytics: true,
    prefix: "ratelimit:signup",
  }),
  "forgot-password": new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "15 m"),
    analytics: true,
    prefix: "ratelimit:forgot-password",
  }),
  "verify-resend": new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "15 m"),
    analytics: true,
    prefix: "ratelimit:verify-resend",
  }),
};

interface RateLimitResult {
  success: boolean;
  retryAfter: number;
}

export async function checkRateLimit(
  ip: string,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = limiters[identifier];
  if (!limiter) {
    throw new Error(`Unknown rate limit identifier: ${identifier}`);
  }

  const result = await limiter.limit(ip);

  return {
    success: result.success,
    retryAfter: result.success ? 0 : Math.ceil((result.reset - Date.now()) / 1000),
  };
}
```

### lib/tokens.ts

```typescript
import crypto from "crypto";

/**
 * Generate a cryptographically secure 32-byte hex token.
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a token with SHA-256 for secure storage.
 * Raw tokens are never persisted — only hashes.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
```

### lib/mail.ts

```typescript
import { Resend } from "resend";

import { VerificationEmail } from "@/components/emails/VerificationEmail";
import { PasswordResetEmail } from "@/components/emails/PasswordResetEmail";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromAddress = process.env.EMAIL_FROM!;
const baseUrl = process.env.NEXTAUTH_URL!;

interface SendEmailResult {
  success: boolean;
  error?: string;
}

export async function sendVerificationEmail(
  email: string,
  userName: string,
  token: string
): Promise<SendEmailResult> {
  try {
    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "Verify your email — SecureGate",
      react: VerificationEmail({
        userName,
        verificationUrl: `${baseUrl}/verify-email/${token}`,
        expiresIn: "15 minutes",
      }),
    });
    return { success: true };
  } catch (error) {
    console.error("[MAIL:VERIFICATION]", error);
    return { success: false, error: "Failed to send verification email." };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  token: string
): Promise<SendEmailResult> {
  try {
    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "Reset your password — SecureGate",
      react: PasswordResetEmail({
        userName,
        resetUrl: `${baseUrl}/reset-password/${token}`,
        expiresIn: "1 hour",
      }),
    });
    return { success: true };
  } catch (error) {
    console.error("[MAIL:RESET]", error);
    return { success: false, error: "Failed to send reset email." };
  }
}
```

## NextAuth Route (`[...nextauth]/route.ts`)

This route is not scaffolded like the others — it uses NextAuth's handler pattern. The full implementation:

### File: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### File: `src/lib/auth.ts`

```typescript
import { compare } from "bcryptjs";

import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  /**
   * Session strategy: JWT
   *
   * JWT is chosen over database sessions for three reasons:
   * 1. Stateless — no session table needed, reducing DB load per request.
   * 2. Vercel-friendly — serverless functions don't maintain persistent
   *    connections, making DB session lookups expensive.
   * 3. Simpler revocation model — for this auth layer, session expiry
   *    via JWT max-age is sufficient. Full revocation would require a
   *    token blacklist, which is out of scope.
   */
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Rate limit check — split/trim for proxy chains
        const rawIp = req?.headers?.["x-forwarded-for"] ?? "unknown";
        const ip = (typeof rawIp === "string" ? rawIp.split(",")[0]?.trim() : rawIp?.[0]?.trim()) ?? "unknown";
        const rateLimitResult = await checkRateLimit(ip, "signin");
        if (!rateLimitResult.success) {
          throw new Error("RATE_LIMITED");
        }

        const email = credentials.email.toLowerCase();

        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
          // User enumeration defense — same delay as successful lookup
          return null;
        }

        const passwordValid = await compare(credentials.password, user.password);
        if (!passwordValid) {
          return null;
        }

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    },
  ],

  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
        };
      }
      return session;
    },
  },
};
```

### Signout Handling

Signout is handled by NextAuth's built-in `POST /api/auth/signout` endpoint — no custom route file needed. The `[...nextauth]/route.ts` catch-all handles it. Do not create a separate `src/app/api/auth/signout/route.ts` (the AGENTS.md project structure lists one for reference but it would conflict with the catch-all).

On the client, trigger signout with:

```typescript
import { signOut } from "next-auth/react";

await signOut({ callbackUrl: "/login" });
```

This destroys the JWT session cookie and redirects to `/login`.

## Route-Specific Patterns

### Signup (`POST /api/auth/signup`)

```
Parse body → Validate with signupSchema → Rate limit (signup) →
Check if email exists → If exists: return generic error →
Hash password (bcrypt, 12 rounds) → Create user →
Generate verify token → Hash token (SHA-256) → Store hash in VerificationToken (15 min TTL) →
Send verification email (raw token in URL) → Return success
```

Enumeration defense: if email exists, return the same status and message as a generic server error — never distinguish between "email already registered" and "something went wrong."

```typescript
// Enumeration-safe: identical to server error response
const existingUser = await db.user.findUnique({ where: { email } });
if (existingUser) {
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
```

### Forgot Password (`POST /api/forgot-password`)

```
Parse body → Validate with forgotPasswordSchema → Rate limit (forgot-password) →
Look up user → If exists: generate token, hash, store in PasswordResetToken (1 hr TTL), send email →
Return same success message regardless of whether user exists
```

```typescript
const user = await db.user.findUnique({ where: { email } });

if (user) {
  const rawToken = generateToken();
  const hashed = hashToken(rawToken);

  // Delete any existing reset tokens for this email
  await db.passwordResetToken.deleteMany({ where: { email } });

  await db.passwordResetToken.create({
    data: {
      email,
      token: hashed,
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  await sendPasswordResetEmail(email, user.name, rawToken);
}

// Same response regardless
return NextResponse.json(
  { success: true, message: "If an account exists, a reset link has been sent." },
  { status: 200 }
);
```

### Reset Password (`POST /api/reset-password`)

```
Parse body → Validate with resetPasswordSchema (token + new password) →
Hash incoming token (SHA-256) → Look up hash in PasswordResetToken →
If missing or expired: return error →
Hash new password (bcrypt, 12 rounds) → Update user password → Delete token → Return success
```

```typescript
const hashedToken = hashToken(token);

const resetToken = await db.passwordResetToken.findUnique({
  where: { token: hashedToken },
});

if (!resetToken || resetToken.expires < new Date()) {
  return NextResponse.json(
    { error: "Invalid or expired reset link." },
    { status: 400 }
  );
}

const hashedPassword = await hash(password, 12);

await db.user.update({
  where: { email: resetToken.email },
  data: { password: hashedPassword },
});

await db.passwordResetToken.delete({ where: { id: resetToken.id } });

return NextResponse.json(
  { success: true, message: "Password updated successfully." },
  { status: 200 }
);
```

### Verify Email Resend (`POST /api/verify-email/resend`)

```
Parse body → Validate with resendVerifySchema → Rate limit (verify-resend) →
Look up user → If exists and unverified: generate token, hash, store in VerificationToken (15 min TTL), send email →
Return same success message regardless
```

```typescript
const user = await db.user.findUnique({ where: { email } });

if (user && !user.emailVerified) {
  const rawToken = generateToken();
  const hashed = hashToken(rawToken);

  // Delete any existing verification tokens for this user
  await db.verificationToken.deleteMany({ where: { identifier: email } });

  await db.verificationToken.create({
    data: {
      identifier: email,
      token: hashed,
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  });

  await sendVerificationEmail(email, user.name, rawToken);
}

// Same response regardless
return NextResponse.json(
  { success: true, message: "If your account requires verification, a new link has been sent." },
  { status: 200 }
);
```

## Security Checklist

Before marking any API route as complete, verify:

- [ ] Request body parsed inside try/catch (malformed JSON won't crash the server)
- [ ] Zod validation runs before any database operation
- [ ] Rate limiting applied (if this is a public POST endpoint)
- [ ] Retry-After header uses real value from rate limiter, not hardcoded
- [ ] No password hashes, internal IDs, or DB structure in the response
- [ ] No `error.message` or `error.stack` returned to the client
- [ ] User enumeration defense: if the route checks email existence, both paths return identical response shapes and similar timing
- [ ] Tokens hashed with SHA-256 before database lookup or storage
- [ ] Consumed tokens deleted immediately after use
- [ ] Existing tokens for the same user/email deleted before creating new ones (prevents token accumulation)
- [ ] Console.error includes a route identifier prefix for debugging

## Response Shapes

All routes must use consistent shapes:

```typescript
// Success (200)
{ success: true, message: "Descriptive success message." }

// Validation error (400)
{ error: "Validation failed.", fieldErrors: { email: "Invalid email format." } }

// Auth error (401)
{ error: "Invalid email or password." }

// Rate limited (429) — include Retry-After header with real seconds remaining
{ error: "Too many requests." }

// Server error (500)
{ error: "Something went wrong. Please try again." }
```

## Rate Limit Configuration Reference

| Route                         | Identifier           | Limit | Window     | Retry-After  |
|-------------------------------|----------------------|-------|------------|--------------|
| POST /api/auth/signin         | `"signin"`           | 5     | 10 minutes | Dynamic      |
| POST /api/auth/signup         | `"signup"`           | 5     | 10 minutes | Dynamic      |
| POST /api/forgot-password     | `"forgot-password"`  | 3     | 15 minutes | Dynamic      |
| POST /api/verify-email/resend | `"verify-resend"`    | 3     | 15 minutes | Dynamic      |

"Dynamic" means the `Retry-After` value comes from `rateLimitResult.retryAfter` — the seconds remaining until the rate limit window resets. Never hardcode this value.