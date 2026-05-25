# Workflow: New API Route

## Trigger

Use this workflow whenever you need to create a new API route under `src/app/api/`.

## Prerequisites

Before starting, confirm:

- [ ] The route is listed in the Route Inventory (`.agents/skills/api-route-scaffolder/SKILL.md`)
- [ ] You know the HTTP method (POST, GET)
- [ ] You know the request body shape (if POST)
- [ ] You know if it requires authentication
- [ ] You know if it requires rate limiting (and the specific identifier from the inventory)
- [ ] You know if it requires user enumeration defense (flagged in the inventory)

## Steps

### Step 1 — Check the Route Inventory and determine route type

Open `.agents/skills/api-route-scaffolder/SKILL.md` and find the Route Inventory table. Locate your route and note:

- File path
- Zod schema name
- Rate limit identifier
- Enumeration defense flag

**Determine the route type:**

**A) NextAuth-handled route** — `POST /api/auth/signin` and `POST /api/auth/signout` are handled by the `[...nextauth]/route.ts` catch-all. They are not custom route files.

If your route is NextAuth-handled:
- Do not create a new `route.ts` file.
- The implementation lives in `src/lib/auth.ts` (authorize function) and `src/app/api/auth/[...nextauth]/route.ts` (handler export).
- See the NextAuth Route section in `.agents/skills/api-route-scaffolder/SKILL.md` for the full implementation.
- Skip to Step 7 (Security audit).

**B) Custom route** — all other routes. Continue to Step 2.

### Step 2 — Verify lib dependencies exist

Before writing any route code, confirm these files exist and contain the functions your route needs:

| If your route needs...       | Verify this file exists            |
|------------------------------|------------------------------------|
| Input validation             | `src/lib/validations.ts` — with the schema named in the Route Inventory |
| Rate limiting                | `src/lib/rate-limit.ts` — with the identifier named in the Route Inventory |
| Database access              | `src/lib/db.ts` — Prisma client singleton |
| Token generation/hashing     | `src/lib/tokens.ts` — `generateToken()` and `hashToken()` |
| Email sending                | `src/lib/mail.ts` — `sendVerificationEmail()` or `sendPasswordResetEmail()` |
| Password hashing             | `bcryptjs` installed in `package.json` |

If any dependency is missing, create it first using the implementations in `.agents/skills/api-route-scaffolder/SKILL.md` (Shared Lib Implementations section).

### Step 3 — Create or verify the Zod schema

File: `src/lib/validations.ts`

Every field the API accepts must be validated. Check the Route Inventory for the schema name, then verify it exists. If not, add it:

```typescript
// Signup — validates name, email, password
export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters"),
  email: z
    .string()
    .email("Enter a valid email address")
    .max(255, "Email must be under 255 characters")
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be under 128 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a digit")
    .regex(/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?\/]/, "Must contain a special character"),
});

// Forgot password — validates email only
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Enter a valid email address")
    .max(255, "Email must be under 255 characters")
    .transform((v) => v.toLowerCase()),
});

// Reset password — validates token and new password
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be under 128 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a digit")
    .regex(/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?\/]/, "Must contain a special character"),
});

// Resend verification — validates email only
export const resendVerifySchema = z.object({
  email: z
    .string()
    .email("Enter a valid email address")
    .max(255, "Email must be under 255 characters")
    .transform((v) => v.toLowerCase()),
});
```

Cross-reference field constraints with the Field Constraint Reference in `.agents/skills/db-migration-runner/SKILL.md` to ensure Zod rules match Prisma constraints.

### Step 4 — Create the route file

File path: use the exact path from the Route Inventory.

Follow the mandatory structure. All steps in order, none skipped.

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

Replace `schemaName`, `"route-identifier"`, `[ROUTE_NAME]`, and the destructured fields with the real values from the Route Inventory.

### Step 5 — Implement business logic

Call functions from `src/lib/` for all operations:

- Password hashing → `import { hash } from "bcryptjs"` — always 12 salt rounds
- Token generation → `import { generateToken, hashToken } from "@/lib/tokens"`
- Email sending → `import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/mail"`
- Database queries → `import { db } from "@/lib/db"` — use patterns from `.agents/skills/db-migration-runner/SKILL.md`

**Token cleanup:** If the route creates a new token (signup, forgot-password, verify-email/resend), always delete existing tokens for the same email first. This prevents token accumulation.

```typescript
// Always delete existing tokens before creating new ones
await db.verificationToken.deleteMany({
  where: { identifier: email },
});

const rawToken = generateToken();
const hashed = hashToken(rawToken);

await db.verificationToken.create({
  data: {
    identifier: email,
    token: hashed,
    expires: new Date(Date.now() + 15 * 60 * 1000),
  },
});

// rawToken goes in the email link, hashed goes in the DB
```

### Step 6 — Apply user enumeration defense

Check the Route Inventory. If the route is flagged for enumeration defense, both paths (email exists / doesn't exist) must:

1. Return the same HTTP status code
2. Return the same response body shape
3. Take approximately the same time to respond

**Routes that require this:**

| Route                         | Generic success message                                                    |
|-------------------------------|----------------------------------------------------------------------------|
| POST /api/auth/signup         | `"Unable to create account. Please try again."` (if email exists)         |
| POST /api/forgot-password     | `"If an account exists, a reset link has been sent."`                      |
| POST /api/verify-email/resend | `"If your account requires verification, a new link has been sent."`       |

For forgot-password and verify-email/resend, the success message is identical whether or not the user exists:

```typescript
const user = await db.user.findUnique({ where: { email } });

if (user) {
  // Generate token, send email, etc.
}

// Same response regardless — outside the if block
return NextResponse.json(
  { success: true, message: "If an account exists, a reset link has been sent." },
  { status: 200 }
);
```

### Step 7 — Security audit

Run through this checklist line by line:

- [ ] Body parsed inside try/catch (malformed JSON won't crash the server)
- [ ] Zod validation runs before any database operation
- [ ] Rate limiting applied with the correct identifier from the Route Inventory
- [ ] Retry-After header uses dynamic value from `rateLimitResult.retryAfter` — not hardcoded
- [ ] No password hash in response
- [ ] No internal ID in response
- [ ] No `error.message` or `error.stack` in response
- [ ] User enumeration defense applied (if flagged in Route Inventory)
- [ ] Tokens hashed with SHA-256 before database storage or lookup
- [ ] Existing tokens for same email deleted before creating new ones
- [ ] Consumed tokens deleted immediately after use
- [ ] `console.error` includes route identifier prefix (e.g., `[SIGNUP]`, `[FORGOT_PASSWORD]`)
- [ ] Response shapes match the standard formats in the scaffolder skill

### Step 8 — Verify error responses against Error Handling table

Open AGENTS.md, Error Handling section. Cross-reference your route's error responses against the required behaviors:

| Scenario                        | Your route returns exactly this?                                 |
|---------------------------------|------------------------------------------------------------------|
| Expired/missing verify token    | Clear error + prompt to resend (not in API — handled by page)    |
| Expired/missing reset token     | `{ error: "Invalid or expired reset link." }` with status 400   |
| Rate limit exceeded             | `{ error: "Too many requests." }` with 429 + Retry-After header |
| Invalid credentials             | `{ error: "Invalid email or password." }` with status 401       |
| Validation failure              | `{ error: "Validation failed.", fieldErrors: {...} }` with 400  |
| Server/database failure         | `{ error: "Something went wrong. Please try again." }` with 500 |

If your route can trigger any of these scenarios, verify the response matches exactly. No variations, no extra fields.

### Step 9 — Test manually

Test each scenario using curl. Replace `localhost:3000` with your dev server URL.

**Valid request:**

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Str0ng!Pass"}'
```

Expected: `200` with `{ success: true, message: "..." }`

**Missing required fields:**

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Expected: `400` with `{ error: "Validation failed.", fieldErrors: { name: "...", password: "..." } }`

**Invalid field values:**

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"T","email":"not-an-email","password":"short"}'
```

Expected: `400` with field-specific errors for all three fields.

**Rate limit exceeded (send 6 rapid requests):**

```bash
for i in {1..6}; do
  curl -s -o /dev/null -w "Request $i: %{http_code}\n" \
    -X POST http://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"rate@test.com","password":"Str0ng!Pass"}'
done
```

Expected: first 5 return `200` or `400`, request 6 returns `429` with `Retry-After` header.

**Enumeration defense (non-existent email):**

```bash
curl -X POST http://localhost:3000/api/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"doesnotexist@example.com"}'
```

Expected: same `200` response as an existing email.

**Malformed JSON body:**

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{broken json'
```

Expected: `500` with `{ error: "Something went wrong. Please try again." }`.

**Expired token (for reset-password):**

```bash
curl -X POST http://localhost:3000/api/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"expired-or-fake-token-value","password":"N3w!Passw0rd"}'
```

Expected: `400` with `{ error: "Invalid or expired reset link." }`.

### Step 10 — TypeScript & lint check

```bash
npx tsc --noEmit
npx next lint
```
Fix any type errors or lint warnings before committing.

## Checklist

Before committing, verify:

- [ ] Route is listed in the Route Inventory and file path matches
- [ ] Route type confirmed (custom vs NextAuth-handled)
- [ ] All lib dependencies exist and are importable
- [ ] Zod schema validates all input fields and matches Prisma field constraints
- [ ] Rate limiting configured with the correct identifier and window
- [ ] Retry-After uses dynamic value from rate limiter
- [ ] User enumeration defense applied where flagged
- [ ] Existing tokens deleted before creating new ones (token-creating routes)
- [ ] Consumed tokens deleted after use (token-consuming routes)
- [ ] All responses match standard shapes
- [ ] Error responses match the Error Handling table in AGENTS.md
- [ ] No sensitive data in any response (passwords, IDs, stack traces, email existence)
- [ ] Error logging includes route identifier prefix
- [ ] All curl test scenarios pass