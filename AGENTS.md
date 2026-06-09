# AGENTS.md — SecureGate

## Project Identity

SecureGate is a standalone, production-grade authentication and identity security app. It is NOT a full product — it is an isolated authentication layer built for independent security audit. Every decision assumes adversarial conditions.

## Engineering Principles

- **Murphy's Law**: assume every input, token, and session will be abused.
- **Kerckhoffs's Principle**: security comes from structure and cryptography, never from obscurity.
- Never use placeholder security logic.
- Never generate incomplete files or partial implementations.
- Never skip validation on any endpoint.
- Never expose internal errors, stack traces, or email existence to the client.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **ORM**: Prisma → PostgreSQL
- **Auth**: NextAuth.js (Credentials provider only)
- **Hashing**: bcryptjs with 12 salt rounds
- **Validation**: Zod — server-side, on every input, before any DB operation
- **Rate Limiting**: @upstash/ratelimit with Upstash Redis (sliding window)
- **Email**: Resend / Nodemailer SMTP / Console stub (verification + reset emails, inline HTML)
- **Styling**: CSS Modules + CSS custom properties (design tokens in `design-tokens.css`)
- **Token Generation**: Node.js `crypto.randomBytes(32).toString('hex')`
- **Deployment**: Vercel
- **Repo**: GitHub

## Project Structure

```
securegate/
├── prisma/
│   └── schema.prisma            # User, VerificationToken, PasswordResetToken
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Landing page with two CTAs (sign in / sign up)
│   │   ├── auth/
│   │   │   ├── page.tsx         # Unified auth page (login / signup / forgot-password)
│   │   │   ├── AuthContent.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── ForgotPasswordForm.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Protected — requires auth + verified email
│   │   ├── reset-password/
│   │   │   └── [token]/
│   │   │       └── page.tsx
│   │   ├── verify-email/
│   │   │   ├── [token]/
│   │   │   │   └── page.tsx
│   │   │   └── please-verify/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── signup/
│   │       │   │   └── route.ts
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── forgot-password/
│   │       │   └── route.ts
│   │       ├── reset-password/
│   │       │   └── route.ts
│   │       └── verify-email/
│   │           └── resend/
│   │               └── route.ts
│   ├── lib/
│   │   ├── auth.ts              # NextAuth config + authorize()
│   │   ├── auth-timing.ts       # Response time padding for enumeration defense
│   │   ├── constants.ts         # Shared constants (bcrypt rounds, TTLs)
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── tokens.ts            # Token generation + SHA-256 hashing
│   │   ├── mail.ts              # Resend/SMTP/Console mail services + inline HTML templates
│   │   ├── rate-limit.ts        # Upstash ratelimit config
│   │   ├── utils.ts             # cx() classname helper + extractClientIp() + validateOrigin()
│   │   └── validations.ts       # Zod schemas (email, password, name, signup, signin, etc.)
│   ├── components/
│   │   └── ui/                  # Shared UI components (Alert, AuthCard, FormInput, etc.)
│   ├── types/
│   │   └── next-auth.d.ts       # NextAuth type augmentation
│   └── styles/
│       └── design-tokens.css    # CSS custom properties (design tokens)
├── src/middleware.ts             # NextAuth route protection + signin rate limiting
├── .env.local                   # Local secrets (gitignored)
├── .env.example                 # Placeholder env vars
├── next.config.js               # Security headers + CSP
├── DEPLOY.md                    # Deployment checklist
├── AGENTS.md                    # AI coding assistant rules
└── package.json
```

## Database Models

Three models in `prisma/schema.prisma`, all targeting PostgreSQL:

**User**: `id` (UUID, PK), `name` (2–50 chars), `email` (unique, lowercase), `password` (bcrypt hash), `emailVerified` (DateTime | null), `createdAt` (auto).

**VerificationToken**: `id` (UUID, PK), `identifier` (email), `token` (SHA-256 hash, unique), `expires` (15 min TTL), `createdAt` (auto). Composite unique on `[identifier, token]`.

**PasswordResetToken**: `id` (UUID, PK), `email`, `token` (SHA-256 hash, unique), `expires` (1 hour TTL), `createdAt` (auto). Composite unique on `[email, token]`.

**Token rule**: never store raw tokens. Hash with SHA-256 before storage. On verification, hash the incoming token and look up the hash.

## Route Map

| Method | Path                        | Auth | Purpose                        |
|--------|-----------------------------|------|--------------------------------|
| GET    | /auth?mode=login            | No   | Login page                     |
| GET    | /auth?mode=signup            | No   | Registration page              |
| GET    | /auth?mode=forgot-password   | No   | Forgot password form           |
| GET    | /reset-password/[token]     | No   | Password reset form            |
| GET    | /verify-email/[token]       | No   | Email verification handler     |
| GET    | /dashboard                  | Yes  | Protected dashboard            |
| POST   | /api/auth/signup            | No   | Create user account            |
| POST   | /api/auth/signin            | No   | Authenticate user              |
| POST   | /api/auth/signout           | Yes  | Destroy session                |
| POST   | /api/forgot-password        | No   | Request password reset email   |
| POST   | /api/reset-password         | No   | Submit new password with token |
| POST   | /api/verify-email/resend    | No   | Resend verification email      |

No route should exist outside this table.

No route should exist outside this table.

## Validation Rules

All validation is server-side with Zod. These are the single source of truth.

**Email**: valid format, lowercase-normalized, max 255 chars.

**Password**: 8–128 chars, at least one uppercase, one lowercase, one digit, one special character (`!@#$%^&*()_+-=[]{}|;:',.<>?/`).

**Name**: 2–50 chars, trimmed of leading/trailing whitespace.

## Security Constraints

These apply to every file, every endpoint, every phase — no exceptions.

1. **No hardcoded secrets.** All credentials in `.env.local` (dev) or Vercel env vars (prod). `.env.local` is in `.gitignore`.
2. **No input trust.** Every client payload validated with Zod on the server before any database operation.
3. **No information leaks.** API errors never expose stack traces, database structure, or whether an email exists.
4. **Token security.** All tokens hashed with SHA-256 before storage. Raw tokens never persisted. Every token deleted immediately after successful consumption.
5. **Clean session destruction.** Logout destroys the server-side session and force-redirects to `/login`.
6. **User enumeration defense.** Forgot-password, login, and resend-verification return identical response shapes regardless of whether the email exists.

## Rate Limiting

Implemented via `@upstash/ratelimit` with Upstash Redis, sliding window algorithm.

| Endpoint                     | Limit             | Window     |
|------------------------------|--------------------|------------|
| POST /api/auth/signin        | 5 attempts per IP  | 10 minutes |
| POST /api/auth/signup        | 5 attempts per IP  | 10 minutes |
| POST /api/forgot-password    | 3 attempts per IP  | 15 minutes |
| POST /api/verify-email/resend| 3 attempts per IP  | 15 minutes |

When exceeded: return `429 Too Many Requests` with a `Retry-After` header. No details.

## HTTP Security Headers

Applied globally in `next.config.js`:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'` (`'unsafe-eval'` added in dev for HMR)
- `X-Powered-By` removed via `poweredByHeader: false`

## Error Handling

| Scenario                        | Behavior                                                         |
|---------------------------------|------------------------------------------------------------------|
| Expired/missing verify token    | Show error + "Resend verification link" button                   |
| Expired/missing reset token     | Show error + redirect to /forgot-password                        |
| Rate limit exceeded             | 429 with Retry-After header, no details                          |
| Invalid credentials             | Generic "Invalid email or password." — never specify which       |
| Unverified user login           | Block access, redirect to verification interstitial              |
| Server/database failure         | 500 with generic message, log full error server-side only        |
| Validation failure              | 400 with field-specific messages, no internal details            |

## Environment Variables

All required in `.env.example` with placeholder values:

```
DATABASE_URL=postgresql://user:password@localhost:5432/securegate
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
```

## UI Requirements

- All pages styled with CSS Modules referencing design tokens from `design-tokens.css`.
- No inline styles. No utility-class frameworks (no Tailwind).
- Every form: real-time inline validation (on blur + on submit), loading spinner on submit buttons (disabled during request), context-specific error messages.
- Signup form: dynamic password strength indicator — Weak (≤2 criteria, red), Fair (3–4, amber), Strong (all 5, green).

## Design System

The project uses a 3-layer color system (Palette 2: Modern Futuristic):

- **Primitives**: tonal scales for primary (#0D1B2A deep space), secondary (#0EA5E9 cyber cyan), tertiary (#06D6A0 neon mint), error, warning, neutral, neutralVariant — each with 20+ numbered stops.
- **Semantic tokens**: surface, text, border, brand, success/warning/error/info — reference primitives, define meaning.
- **Roles**: button, input, card, nav, alert, badge, passwordStrength, link, divider, tooltip, skeleton, overlay — reference primitives, define which token goes on which component.

All tokens defined as CSS custom properties in `design-tokens.css`. Components reference `var(--token-name)` only.

## Implementation Phases

Execute sequentially. Do not skip ahead.

1. **Scaffold & Database Schema** — init Next.js, install all deps, Prisma schema, migrate, .env.example, push to GitHub.
2. **Authentication Core** — NextAuth config, authorize(), signup API, route protection, sign-out.
3. **Email Verification Flow** — token generation, Resend email, verify route, resend endpoint, unverified user blocking.
4. **Forgot Password Flow** — forgot-password page, reset token, reset-password page, enumeration defense.
5. **Rate Limiting & Security Hardening** — @upstash/ratelimit on all 4 endpoints, security headers in next.config.js.
6. **UI & Deployment** — all 6 pages, CSS Modules + tokens, form validation, password strength indicator, deploy to Vercel.

## Code Quality Rules

- TypeScript strict mode. No `any` types.
- All functions explicitly typed (params and return).
- Prisma client as a singleton (`lib/db.ts`).
- Zod schemas centralized in `lib/validations.ts`.
- Token logic centralized in `lib/tokens.ts`.
- Email sending centralized in `lib/mail.ts`.
- Rate limiting centralized in `lib/rate-limit.ts`.
- One concern per file. No god files.