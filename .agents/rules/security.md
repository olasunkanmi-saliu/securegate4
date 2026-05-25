# Security Rules — SecureGate

## Core Principles

Every line of code assumes:

- Every input is malicious.
- Every endpoint will be attacked.
- Every secret can leak.
- Every edge case will eventually occur.

Security is structural, not optional. These rules override convenience, performance, and developer preference.

## Password Handling

- Hash with `bcryptjs` using exactly 12 salt rounds. Never fewer.
- Always use the async API: `await bcrypt.hash()` and `await bcrypt.compare()`. Never use `hashSync` or `compareSync`.
- Never store, log, return, or transmit plain-text passwords.
- Never include password hashes in API responses, even in "success" payloads.
- Password comparison must be done with `bcrypt.compare()` only — never with string equality (`===`).

## Token Handling

- Generate tokens with `crypto.randomBytes(32).toString('hex')` — 32 bytes minimum.
- Hash tokens with SHA-256 before storing in the database.
- Store only the hash. The raw token exists only in memory and in the email link.
- On verification, hash the incoming token and look up the hash.
- Delete the token record immediately after successful consumption. No exceptions.
- Tokens are single-use. If a token is consumed, it must not exist in the database.

### Token Implementation

```typescript
import crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
```

### Token Expiry

| Token Type         | TTL        |
|--------------------|------------|
| VerificationToken  | 15 minutes |
| PasswordResetToken | 1 hour     |

Always check `expires > new Date()` before consuming. Expired tokens are treated as missing.

## Input Validation

- Every client payload validated with Zod on the server.
- Validation happens before any database operation, any business logic, any side effect.
- Email is always normalized to lowercase before storage and lookup.
- Name is always trimmed of leading/trailing whitespace.
- Validation errors return field-specific messages but never reveal internal schema structure.

## API Error Responses

### What to return

| Status | When                        | Body                                                    |
|--------|-----------------------------|---------------------------------------------------------|
| 200    | Success                     | `{ success: true, message: "..." }`                    |
| 400    | Validation failure          | `{ error: "Validation failed.", fieldErrors: {...} }`   |
| 401    | Invalid credentials         | `{ error: "Invalid email or password." }`               |
| 429    | Rate limited                | `{ error: "Too many requests." }` + `Retry-After` header |
| 500    | Server error                | `{ error: "Something went wrong. Please try again." }` |

### What to never return

- Stack traces
- Database error messages or codes
- SQL queries
- File paths or line numbers
- Whether a specific email exists in the system
- Internal IDs (user IDs, token IDs)
- Environment variable names or values

## User Enumeration Defense

These endpoints must return identical response shapes regardless of whether the email exists:

- `POST /api/auth/signin` — "Invalid email or password." for both wrong email and wrong password.
- `POST /api/auth/signup` — same generic error message whether the email is already registered or the server encounters an issue.
- `POST /api/forgot-password` — "If an account exists, a reset link has been sent." whether or not the email is registered.
- `POST /api/verify-email/resend` — "If your account requires verification, a new link has been sent." whether or not the email is registered.

Response timing should also be consistent — do not return faster for non-existent emails.

## Rate Limiting

- Implemented with `@upstash/ratelimit` and Upstash Redis.
- Algorithm: sliding window.
- Rate limit checks happen after validation but before business logic.
- IP address extracted from `x-forwarded-for` header: split on `,` and take the first address with `.split(",")[0]?.trim()` to handle proxy chains.

| Endpoint                      | Limit | Window     |
|-------------------------------|-------|------------|
| POST /api/auth/signin         | 5/IP  | 10 minutes |
| POST /api/auth/signup         | 5/IP  | 10 minutes |
| POST /api/forgot-password     | 3/IP  | 15 minutes |
| POST /api/verify-email/resend | 3/IP  | 15 minutes |

When exceeded: return `429` with `Retry-After` header (seconds until reset). Body: `{ error: "Too many requests." }`. No additional details.

## Session Security

- JWT-based sessions signed with `NEXTAUTH_SECRET`.
- Session contains only: `user.id`, `user.email`, `user.name`. No sensitive data.
- Logout fully destroys the session. Client is force-redirected to `/login`.
- Session tokens are httpOnly cookies — never accessible via JavaScript.

## Route Protection

- `middleware.ts` enforces authentication before page rendering.
- Protected routes: `/dashboard` (and any future authenticated pages).
- Unverified users who pass authentication are redirected to a verification interstitial — they must not reach `/dashboard`.

## HTTP Security Headers

Applied globally in `next.config.js`. Not optional.

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Secrets Management

- All secrets in `.env.local` (dev) or Vercel env vars (prod).
- `.env.local` is in `.gitignore`. Verify this before every commit.
- `.env.example` contains placeholder values only — never real credentials.
- Never log environment variables.
- Never include environment variables in client-side bundles (no `NEXT_PUBLIC_` prefix for secrets).
- Required variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

## Dependency Rules

- Use only the libraries specified in the tech stack. No additional auth, crypto, or validation libraries.
- Keep dependencies updated. Known vulnerabilities in dependencies are treated as project vulnerabilities.
- No dev dependencies in production bundles.